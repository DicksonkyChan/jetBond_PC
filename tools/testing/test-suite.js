// JetBond API Regression Test Suite
const http = require('http');

class APITester {
  constructor(baseUrl = 'http://localhost:8080') {
    this.baseUrl = baseUrl;
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  async request(method, path, data = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseUrl);
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: method,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const req = http.request(options, (res) => {
        let responseData = '';
        res.on('data', chunk => responseData += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(responseData);
            resolve({ status: res.statusCode, data: parsed });
          } catch (e) {
            resolve({ status: res.statusCode, data: responseData });
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

  test(name, testFn) {
    this.tests.push({ name, testFn });
  }

  assert(condition, message) {
    if (condition) {
      console.log(`  ✅ ${message}`);
      this.passed++;
    } else {
      console.log(`  ❌ ${message}`);
      this.failed++;
    }
  }

  async run() {
    console.log('🚀 Running JetBond API Regression Tests\n');
    
    for (const test of this.tests) {
      console.log(`📋 ${test.name}`);
      try {
        await test.testFn();
      } catch (error) {
        console.log(`  ❌ Test failed: ${error.message}`);
        this.failed++;
      }
      console.log('');
    }

    console.log(`📊 Results: ${this.passed} passed, ${this.failed} failed`);
    return this.failed === 0;
  }
}

// Test Suite
const tester = new APITester();

// Test 1: Profile CRUD Operations
tester.test('Profile CRUD Operations', async () => {
  const testProfile = {
    profiles: {
      employee: {
        name: 'Test Employee',
        jobDescription: 'Experienced waiter and bartender',
        preferredDistricts: ['Central', 'Wan Chai', 'Causeway Bay'],
        hourlyRateRange: { min: 85, max: 165 }
      },
      employer: {
        name: 'Test Employer',
        companyName: 'Test Restaurant Group',
        contactPerson: 'Manager Smith'
      }
    },
    currentMode: 'employee'
  };

  // PUT - Save profile
  const putResult = await tester.request('PUT', '/users/user-test', testProfile);
  tester.assert(putResult.status === 200, 'PUT profile returns 200');
  tester.assert(putResult.data.success === true, 'PUT profile success flag');

  // GET - Retrieve profile
  const getResult = await tester.request('GET', '/users/user-test');
  tester.assert(getResult.status === 200, 'GET profile returns 200');
  
  const userData = getResult.data;
  tester.assert(userData.profiles.employee.jobDescription === 'Experienced waiter and bartender', 'Employee job description saved');
  tester.assert(Array.isArray(userData.profiles.employee.preferredDistricts), 'Preferred districts is array');
  tester.assert(userData.profiles.employee.preferredDistricts.length === 3, 'All 3 districts saved');
  tester.assert(userData.profiles.employer.companyName === 'Test Restaurant Group', 'Employer company name saved');
  tester.assert(userData.profiles.employer.contactPerson === 'Manager Smith', 'Employer contact person saved');
});

// Test 2: Job Application Flow
tester.test('Job Application Flow', async () => {
  // GET jobs
  const jobsResult = await tester.request('GET', '/jobs');
  tester.assert(jobsResult.status === 200, 'GET jobs returns 200');
  tester.assert(Array.isArray(jobsResult.data), 'Jobs response is array');
  
  if (jobsResult.data.length > 0) {
    const jobId = jobsResult.data[0].jobId;
    
    // Find matches
    const matchResult = await tester.request('POST', `/jobs/${jobId}/matches`);
    tester.assert(matchResult.status === 200, 'POST matches returns 200');
    
    // Apply to job
    const applyResult = await tester.request('POST', `/jobs/${jobId}/respond`, {
      employeeId: 'user-test'
    });
    tester.assert(applyResult.status === 200, 'POST job response returns 200');
  }
});

// Test 3: User Management
tester.test('User Management', async () => {
  // GET existing user
  const userResult = await tester.request('GET', '/users/user-rikke');
  tester.assert(userResult.status === 200, 'GET existing user returns 200');
  tester.assert(userResult.data.userId === 'user-rikke', 'User ID matches');
  
  // GET non-existent user
  const noUserResult = await tester.request('GET', '/users/non-existent');
  tester.assert(noUserResult.status === 404, 'GET non-existent user returns 404');
});

// Run tests
tester.run().then(success => {
  process.exit(success ? 0 : 1);
});