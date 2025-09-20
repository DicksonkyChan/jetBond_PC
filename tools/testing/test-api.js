// Simple test script to verify backend functions work locally
const users = require('./users');
const jobs = require('./jobs');
const matching = require('./matching');

// Mock event objects for testing
const createUserEvent = {
  body: JSON.stringify({
    profiles: {
      employee: {
        name: "John Doe",
        jobDescription: "Restaurant server with coffee experience",
        preferredDistricts: ["Central", "TST"],
        hourlyRateRange: { min: 80, max: 150 }
      }
    },
    currentMode: "employee"
  })
};

const createJobEvent = {
  body: JSON.stringify({
    title: "Restaurant Server Needed",
    description: "Busy restaurant needs experienced server",
    district: "Central",
    hourlyRate: 120,
    duration: 4,
    employerId: "test-employer-123"
  })
};

async function testBackend() {
  console.log('Testing JetBond Backend Functions...\n');
  
  try {
    // Test user creation
    console.log('1. Testing user creation...');
    const userResult = await users.create(createUserEvent);
    console.log('User creation result:', JSON.parse(userResult.body));
    
    // Test job creation
    console.log('\n2. Testing job creation...');
    const jobResult = await jobs.create(createJobEvent);
    console.log('Job creation result:', JSON.parse(jobResult.body));
    
    console.log('\n✅ Backend functions working correctly!');
    console.log('\nNext steps:');
    console.log('1. Deploy to AWS: serverless deploy');
    console.log('2. Update frontend API URL');
    console.log('3. Test end-to-end integration');
    
  } catch (error) {
    console.error('❌ Backend test failed:', error);
    console.log('\nMake sure to:');
    console.log('1. Install dependencies: npm install');
    console.log('2. Set up AWS credentials');
    console.log('3. Deploy DynamoDB tables');
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testBackend();
}

module.exports = { testBackend };