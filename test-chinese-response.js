require('dotenv').config();
const AIMatchingService = require('./ai-matching-service');

async function testChineseResponse() {
  console.log('🧪 Testing Chinese AI Response from Bedrock');
  console.log('==========================================\n');

  const aiMatcher = new AIMatchingService();

  // Test job in Chinese context
  const testJob = {
    title: 'Office Cleaning Service',
    description: 'Need experienced cleaner for office building in Central. Must be reliable and detail-oriented. Cantonese speaking preferred.',
    district: 'Central',
    hourlyRate: 80,
    duration: '4 hours'
  };

  // Test employees
  const testEmployees = [
    {
      userId: 'li.meihua@example.com',
      profiles: {
        employee: {
          name: '李美華',
          skills: ['清潔', '辦公室清潔', 'cleaning', 'office cleaning'],
          experience: '5年清潔經驗，專門負責辦公大樓清潔工作',
          preferredDistricts: ['Central', 'Admiralty'],
          hourlyRateRange: { min: 70, max: 90 },
          languages: ['廣東話', 'Cantonese', '普通話'],
          availability: 'Full-time'
        }
      },
      employeeRatings: { good: 15, neutral: 2, bad: 0 }
    },
    {
      userId: 'sarah.johnson@example.com',
      profiles: {
        employee: {
          name: 'Sarah Johnson',
          skills: ['cleaning', 'housekeeping', 'customer service'],
          experience: '3 years professional cleaning experience',
          preferredDistricts: ['Central', 'Mid-Levels'],
          hourlyRateRange: { min: 75, max: 100 },
          languages: ['English', 'Basic Cantonese'],
          availability: 'Part-time'
        }
      },
      employeeRatings: { good: 8, neutral: 1, bad: 0 }
    }
  ];

  try {
    console.log('Testing with Chinese employer language preference...\n');
    
    // Test with Chinese language preference
    const chineseMatches = await aiMatcher.findMatches(testJob, testEmployees, '中文');
    
    console.log('✅ Chinese AI Response Results:');
    console.log('==============================');
    chineseMatches.forEach((match, index) => {
      console.log(`\n${index + 1}. Employee: ${match.employeeId}`);
      console.log(`   Match Score: ${match.matchScore}%`);
      console.log(`   Reasoning: ${match.reasoning}`);
      console.log(`   Strengths: ${JSON.stringify(match.strengths, null, 2)}`);
      console.log(`   Concerns: ${JSON.stringify(match.concerns, null, 2)}`);
      console.log(`   Language Match: ${match.languageMatch}`);
    });

    console.log('\n\n==========================================');
    console.log('Testing with English employer language preference...\n');
    
    // Test with English language preference for comparison
    const englishMatches = await aiMatcher.findMatches(testJob, testEmployees, 'English');
    
    console.log('✅ English AI Response Results:');
    console.log('===============================');
    englishMatches.forEach((match, index) => {
      console.log(`\n${index + 1}. Employee: ${match.employeeId}`);
      console.log(`   Match Score: ${match.matchScore}%`);
      console.log(`   Reasoning: ${match.reasoning}`);
      console.log(`   Strengths: ${JSON.stringify(match.strengths, null, 2)}`);
      console.log(`   Concerns: ${JSON.stringify(match.concerns, null, 2)}`);
      console.log(`   Language Match: ${match.languageMatch}`);
    });

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testChineseResponse().then(() => {
  console.log('\n🏁 Test completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test crashed:', error);
  process.exit(1);
});