const http = require('http');

function checkUser(userId) {
  const options = {
    hostname: 'localhost',
    port: 8080,
    path: `/users/${userId}`,
    method: 'GET'
  };

  console.log(`=== CHECKING USER: ${userId} ===`);

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    
    let responseData = '';
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200) {
        try {
          const userData = JSON.parse(responseData);
          console.log('✓ User found!');
          console.log('User ID:', userData.userId);
          console.log('Current Mode:', userData.currentMode);
          console.log('Employee Profile:', JSON.stringify(userData.profiles?.employee, null, 2));
          console.log('Employer Profile:', JSON.stringify(userData.profiles?.employer, null, 2));
          console.log('Created At:', userData.createdAt);
          console.log('Updated At:', userData.updatedAt);
        } catch (e) {
          console.log('Response:', responseData);
        }
      } else if (res.statusCode === 404) {
        console.log('✗ User not found');
        console.log('Response:', responseData);
      } else {
        console.log('Response:', responseData);
      }
    });
  });

  req.on('error', (e) => {
    console.error('Error:', e.message);
    console.log('Make sure the server is running on port 8080');
  });

  req.end();
}

// Check common variations for rikke user
const userIds = [
  'rikke@jetbond.com',
  'user-rikke',
  'rikke'
];

console.log('Checking for rikke user in different formats...\n');

userIds.forEach((userId, index) => {
  setTimeout(() => {
    checkUser(userId);
    if (index < userIds.length - 1) console.log('');
  }, index * 1000);
});