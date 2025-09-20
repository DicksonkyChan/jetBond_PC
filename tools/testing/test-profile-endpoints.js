const http = require('http');

// Test data
const testProfileData = {
  profiles: {
    employee: {
      name: 'Test User',
      jobDescription: 'Experienced server',
      preferredDistricts: ['Central', 'Wan Chai'],
      hourlyRateRange: { min: 90, max: 160 }
    },
    employer: {
      name: 'Test User',
      companyName: 'Test Company Ltd',
      contactPerson: 'John Manager'
    }
  },
  currentMode: 'employee'
};

// Test PUT endpoint
function testPutProfile() {
  const data = JSON.stringify(testProfileData);
  
  const options = {
    hostname: 'localhost',
    port: 8080,
    path: '/users/user-rikke',
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  console.log('=== TESTING PUT /users/user-rikke ===');
  console.log('Sending data:', JSON.stringify(testProfileData, null, 2));

  const req = http.request(options, (res) => {
    console.log(`PUT Status: ${res.statusCode}`);
    
    let responseData = '';
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    
    res.on('end', () => {
      console.log('PUT Response:', responseData);
      
      // Now test GET
      setTimeout(testGetProfile, 1000);
    });
  });

  req.on('error', (e) => {
    console.error('PUT Error:', e.message);
  });

  req.write(data);
  req.end();
}

// Test GET endpoint
function testGetProfile() {
  const options = {
    hostname: 'localhost',
    port: 8080,
    path: '/users/user-rikke',
    method: 'GET'
  };

  console.log('\n=== TESTING GET /users/user-rikke ===');

  const req = http.request(options, (res) => {
    console.log(`GET Status: ${res.statusCode}`);
    
    let responseData = '';
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    
    res.on('end', () => {
      console.log('GET Response:', responseData);
      
      try {
        const userData = JSON.parse(responseData);
        console.log('\n=== VERIFICATION ===');
        console.log('Employee job description:', userData.profiles?.employee?.jobDescription);
        console.log('Employee districts:', userData.profiles?.employee?.preferredDistricts);
        console.log('Employer company:', userData.profiles?.employer?.companyName);
        console.log('Employer contact:', userData.profiles?.employer?.contactPerson);
      } catch (e) {
        console.log('Could not parse response as JSON');
      }
    });
  });

  req.on('error', (e) => {
    console.error('GET Error:', e.message);
  });

  req.end();
}

// Start test
console.log('Testing profile endpoints...');
testPutProfile();