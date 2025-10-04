require('dotenv').config();
const AIMatchingService = require('./ai-matching-service-fixed');

async function testAIMatching() {
  console.log('🧪 Testing AI Matching with Diverse Profiles...');
  
  const aiMatcher = new AIMatchingService();
  
  // Test job - Cleaning service in Central
  const testJob = {
    jobId: 'test-job-001',
    title: 'Office Cleaning Service',
    description: 'Need experienced cleaner for office building in Central. Must be reliable and detail-oriented. Cantonese speaking preferred.',
    district: 'Central',
    hourlyRate: 80,
    duration: '4 hours'
  };
  
  // Diverse test applicants
  const testApplicants = [
    {
      userId: 'applicant-001',
      profiles: {
        employee: {
          name: '李美華 (Li Mei Hua)',
          skills: ['清潔', '辦公室清潔', '地板清潔', 'cleaning', 'office cleaning'],
          experience: '5年清潔經驗，專門負責辦公大樓清潔工作',
          preferredDistricts: ['Central', 'Admiralty', 'Wan Chai'],
          hourlyRateRange: { min: 70, max: 90 },
          languages: ['廣東話', 'Cantonese', '普通話', 'Mandarin'],
          availability: 'Full-time'
        }
      },
      employeeRatings: { good: 15, neutral: 2, bad: 0 }
    },
    {
      userId: 'applicant-002', 
      profiles: {
        employee: {
          name: 'Sarah Johnson',
          skills: ['cleaning', 'housekeeping', 'customer service', 'time management'],
          experience: '3 years professional cleaning experience in hotels and offices',
          preferredDistricts: ['Central', 'Sheung Wan', 'Mid-Levels'],
          hourlyRateRange: { min: 75, max: 100 },
          languages: ['English', 'Basic Cantonese'],
          availability: 'Part-time'
        }
      },
      employeeRatings: { good: 8, neutral: 1, bad: 0 }
    },
    {
      userId: 'applicant-003',
      profiles: {
        employee: {
          name: '陳志強 (Chan Chi Keung)',
          skills: ['保安', '清潔', '維修', 'security', 'maintenance', 'cleaning'],
          experience: '10年物業管理經驗，包括清潔和保安工作',
          preferredDistricts: ['Central', 'Tsim Sha Tsui', 'Mong Kok'],
          hourlyRateRange: { min: 60, max: 85 },
          languages: ['廣東話', 'Cantonese', 'English'],
          availability: 'Full-time'
        }
      },
      employeeRatings: { good: 25, neutral: 3, bad: 1 }
    },
    {
      userId: 'applicant-004',
      profiles: {
        employee: {
          name: 'Maria Santos',
          skills: ['domestic helper', 'cleaning', 'cooking', 'childcare'],
          experience: '7 years as domestic helper, experienced in deep cleaning and household management',
          preferredDistricts: ['Mid-Levels', 'Peak', 'Repulse Bay'],
          hourlyRateRange: { min: 50, max: 70 },
          languages: ['English', 'Filipino', 'Basic Cantonese'],
          availability: 'Full-time'
        }
      },
      employeeRatings: { good: 12, neutral: 0, bad: 0 }
    },
    {
      userId: 'applicant-005',
      profiles: {
        employee: {
          name: '王小明 (Wong Siu Ming)',
          skills: ['送貨', '駕駛', '倉務', 'delivery', 'driving', 'warehouse'],
          experience: '2年送貨司機經驗，熟悉香港各區道路',
          preferredDistricts: ['Kwun Tong', 'Kowloon Bay', 'Tsuen Wan'],
          hourlyRateRange: { min: 90, max: 120 },
          languages: ['廣東話', 'Cantonese', '普通話'],
          availability: 'Full-time'
        }
      },
      employeeRatings: { good: 5, neutral: 1, bad: 0 }
    },
    {
      userId: 'applicant-006',
      profiles: {
        employee: {
          name: 'Jennifer Lee',
          skills: ['office cleaning', 'window cleaning', 'carpet cleaning', 'sanitization'],
          experience: 'Professional cleaner with 4 years experience in commercial buildings. Certified in COVID-19 sanitization protocols.',
          preferredDistricts: ['Central', 'Admiralty', 'Causeway Bay'],
          hourlyRateRange: { min: 85, max: 110 },
          languages: ['English', 'Cantonese', 'Korean'],
          availability: 'Full-time'
        }
      },
      employeeRatings: { good: 18, neutral: 1, bad: 0 }
    }
  ];
  
  console.log('\n📋 Test Job:');
  console.log(`Title: ${testJob.title}`);
  console.log(`Description: ${testJob.description}`);
  console.log(`Location: ${testJob.district}`);
  console.log(`Rate: HK$${testJob.hourlyRate}/hour`);
  
  console.log('\n👥 Test Applicants:');
  testApplicants.forEach((applicant, index) => {
    const profile = applicant.profiles.employee;
    console.log(`${index + 1}. ${profile.name}`);
    console.log(`   Skills: ${profile.skills.join(', ')}`);
    console.log(`   Districts: ${profile.preferredDistricts.join(', ')}`);
    console.log(`   Rate: HK$${profile.hourlyRateRange.min}-${profile.hourlyRateRange.max}`);
    console.log(`   Languages: ${profile.languages.join(', ')}`);
  });
  
  try {
    console.log('\n🤖 Running AI Matching...');
    // Test with Chinese language preference
    const matches = await aiMatcher.findMatches(testJob, testApplicants, '中文');
    
    console.log('\n📊 AI Matching Results:');
    console.log('='.repeat(80));
    
    matches.forEach((match, index) => {
      const applicant = testApplicants.find(a => a.userId === match.employeeId);
      const profile = applicant?.profiles.employee;
      
      console.log(`\n${index + 1}. ${profile?.name || 'Unknown'}`);
      console.log(`   🎯 Match Score: ${match.matchScore}%`);
      console.log(`   💭 Reasoning: ${match.reasoning || 'No reasoning provided'}`);
      
      if (match.strengths && match.strengths.length > 0) {
        console.log(`   ✅ Strengths: ${match.strengths.join(', ')}`);
      }
      
      if (match.concerns && match.concerns.length > 0) {
        console.log(`   ⚠️  Concerns: ${match.concerns.join(', ')}`);
      }
      
      if (match.languageMatch) {
        console.log(`   🗣️  Language Match: ${match.languageMatch}`);
      }
      
      console.log(`   📅 Source: ${match.source}`);
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ AI Matching Test Complete!');
    
  } catch (error) {
    console.log('\n❌ AI Matching Test Failed:');
    console.log('Error:', error.message);
    console.log('\nThis might be due to:');
    console.log('- Bedrock Agent not properly configured');
    console.log('- AI model not responding correctly');
    console.log('- Network connectivity issues');
  }
}

// Run the test
testAIMatching();