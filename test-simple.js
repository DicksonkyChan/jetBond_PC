const http = require('http');

function makeRequest(method, path, data) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 8080,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve(body);
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🚀 Starting JetBond Simple Tests\n');
  
  try {
    // Test 1: Health check
    console.log('1. Testing health check...');
    const health = await makeRequest('GET', '/test');
    console.log('✅ Health check:', health.message);
    
    // Test 2: Create employer
    console.log('\n2. Creating test employer...');
    const employerData = {
      profiles: {
        employer: {
          companyName: 'Test Restaurant',
          contactInfo: 'test@restaurant.com'
        }
      },
      currentMode: 'employer'
    };
    const employer = await makeRequest('POST', '/users', employerData);
    console.log('✅ Employer created:', employer.userId);
    
    // Test 3: Create employee
    console.log('\n3. Creating test employee...');
    const employeeData = {
      profiles: {
        employee: {
          name: 'Test Worker',
          jobDescription: 'Experienced restaurant server',
          preferredDistricts: ['Central', 'Wan Chai'],
          hourlyRateRange: { min: 80, max: 120 }
        }
      },
      currentMode: 'employee'
    };
    const employee = await makeRequest('POST', '/users', employeeData);
    console.log('✅ Employee created:', employee.userId);
    
    // Test 4: Create job
    console.log('\n4. Creating test job...');
    const jobData = {
      title: 'Urgent Server Needed',
      description: 'Need experienced server for busy restaurant shift',
      district: 'Central',
      hourlyRate: 100,
      duration: '4 hours',
      employerId: employer.userId
    };
    const job = await makeRequest('POST', '/jobs', jobData);
    console.log('✅ Job created:', job.jobId);
    
    // Test 5: Find matches
    console.log('\n5. Testing job matching...');
    const matches = await makeRequest('POST', `/jobs/${job.jobId}/matches`);
    console.log('✅ Found', matches.count, 'matches');
    
    // Test 6: Employee responds
    console.log('\n6. Testing job response...');
    const response = await makeRequest('POST', `/jobs/${job.jobId}/respond`, {
      employeeId: employee.userId
    });
    console.log('✅ Job response:', response.success ? 'SUCCESS' : 'FAILED');
    
    // Test 7: Select employee
    console.log('\n7. Testing employee selection...');
    const selection = await makeRequest('POST', `/jobs/${job.jobId}/select`, {
      selectedEmployeeId: employee.userId
    });
    console.log('✅ Employee selection:', selection.success ? 'SUCCESS' : 'FAILED');
    
    // Test 8: Submit rating
    console.log('\n8. Testing rating system...');
    const rating = await makeRequest('POST', `/jobs/${job.jobId}/rate`, {
      rating: 'good',
      raterId: employer.userId,
      ratedUserId: employee.userId
    });
    console.log('✅ Rating submitted:', rating.success ? 'SUCCESS' : 'FAILED');
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

runTests();