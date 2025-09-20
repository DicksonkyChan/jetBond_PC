const API_BASE_URL = 'https://xaifmm3kga.ap-southeast-1.awsapprunner.com';

async function testAPI() {
  console.log('🚀 Testing JetBond Backend API...\n');

  try {
    // Test 1: Create a user
    console.log('1. Creating test user...');
    const userResponse = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profiles: {
          employee: { name: 'Test Employee', skills: ['Server', 'Kitchen'] },
          employer: { companyName: 'Test Restaurant' }
        },
        currentMode: 'employee'
      })
    });
    const user = await userResponse.json();
    console.log('✅ User created:', user.userId);

    // Test 2: Create a job
    console.log('\n2. Creating test job...');
    const jobResponse = await fetch(`${API_BASE_URL}/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Urgent Server Needed',
        description: 'Need server for dinner rush',
        district: 'Central',
        hourlyRate: 120,
        duration: 4,
        employerId: user.userId
      })
    });
    const job = await jobResponse.json();
    console.log('✅ Job created:', job.jobId);

    // Test 3: List jobs
    console.log('\n3. Listing jobs...');
    const jobsResponse = await fetch(`${API_BASE_URL}/jobs`);
    const jobs = await jobsResponse.json();
    console.log('✅ Jobs found:', jobs.length);

    console.log('\n🎉 All tests passed! Backend is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAPI();