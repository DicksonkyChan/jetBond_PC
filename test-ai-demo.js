// Demo of what AI matching results would look like
console.log('🧪 AI Matching Demo - Simulated Results');
console.log('=====================================\n');

const testJob = {
  title: 'Office Cleaning Service',
  description: 'Need experienced cleaner for office building in Central. Must be reliable and detail-oriented. Cantonese speaking preferred.',
  district: 'Central',
  hourlyRate: 80,
  duration: '4 hours'
};

const applicants = [
  {
    name: '李美華 (Li Mei Hua)',
    skills: ['清潔', '辦公室清潔', '地板清潔', 'cleaning', 'office cleaning'],
    districts: ['Central', 'Admiralty', 'Wan Chai'],
    rate: 'HK$70-90',
    languages: ['廣東話', 'Cantonese', '普通話', 'Mandarin'],
    experience: '5年清潔經驗，專門負責辦公大樓清潔工作',
    ratings: { good: 15, neutral: 2, bad: 0 }
  },
  {
    name: 'Sarah Johnson',
    skills: ['cleaning', 'housekeeping', 'customer service', 'time management'],
    districts: ['Central', 'Sheung Wan', 'Mid-Levels'],
    rate: 'HK$75-100',
    languages: ['English', 'Basic Cantonese'],
    experience: '3 years professional cleaning experience in hotels and offices',
    ratings: { good: 8, neutral: 1, bad: 0 }
  },
  {
    name: '陳志強 (Chan Chi Keung)',
    skills: ['保安', '清潔', '維修', 'security', 'maintenance', 'cleaning'],
    districts: ['Central', 'Tsim Sha Tsui', 'Mong Kok'],
    rate: 'HK$60-85',
    languages: ['廣東話', 'Cantonese', 'English'],
    experience: '10年物業管理經驗，包括清潔和保安工作',
    ratings: { good: 25, neutral: 3, bad: 1 }
  },
  {
    name: 'Jennifer Lee',
    skills: ['office cleaning', 'window cleaning', 'carpet cleaning', 'sanitization'],
    districts: ['Central', 'Admiralty', 'Causeway Bay'],
    rate: 'HK$85-110',
    languages: ['English', 'Cantonese', 'Korean'],
    experience: 'Professional cleaner with 4 years experience in commercial buildings',
    ratings: { good: 18, neutral: 1, bad: 0 }
  },
  {
    name: 'Maria Santos',
    skills: ['domestic helper', 'cleaning', 'cooking', 'childcare'],
    districts: ['Mid-Levels', 'Peak', 'Repulse Bay'],
    rate: 'HK$50-70',
    languages: ['English', 'Filipino', 'Basic Cantonese'],
    experience: '7 years as domestic helper, experienced in deep cleaning',
    ratings: { good: 12, neutral: 0, bad: 0 }
  },
  {
    name: '王小明 (Wong Siu Ming)',
    skills: ['送貨', '駕駛', '倉務', 'delivery', 'driving', 'warehouse'],
    districts: ['Kwun Tong', 'Kowloon Bay', 'Tsuen Wan'],
    rate: 'HK$90-120',
    languages: ['廣東話', 'Cantonese', '普通話'],
    experience: '2年送貨司機經驗，熟悉香港各區道路',
    ratings: { good: 5, neutral: 1, bad: 0 }
  },
  {
    name: 'John Smith',
    skills: ['teaching', 'tutoring', 'english', 'education'],
    districts: ['Discovery Bay', 'Tung Chung', 'Airport'],
    rate: 'HK$200-300',
    languages: ['English only'],
    experience: 'English teacher with no cleaning experience whatsoever',
    ratings: { good: 3, neutral: 0, bad: 2 }
  },
  {
    name: '張三 (Zhang San)',
    skills: ['會計', '文書', 'accounting', 'paperwork'],
    districts: ['Sha Tin', 'Tai Po', 'Fanling'],
    rate: 'HK$150-200',
    languages: ['普通話', 'Mandarin only'],
    experience: '辦公室文員，從未做過清潔工作，不願意做體力勞動',
    ratings: { good: 1, neutral: 2, bad: 4 }
  },
  {
    name: 'Lazy Larry',
    skills: ['gaming', 'sleeping', 'complaining'],
    districts: ['Anywhere with air conditioning'],
    rate: 'HK$500+',
    languages: ['Broken English', 'Sarcasm'],
    experience: 'Unemployed for 3 years, allergic to work',
    ratings: { good: 0, neutral: 1, bad: 8 }
  },
  {
    name: '問題員工 (Problem Employee)',
    skills: ['遲到', '早退', '請假', 'lateness', 'excuses'],
    districts: ['太遠了', 'Too far everywhere'],
    rate: 'HK$200+ (但經常不來 but often no-show)',
    languages: ['廣東話', '投訴話', 'Cantonese', 'Complaint language'],
    experience: '有清潔經驗但態度極差，經常與僱主爭執',
    ratings: { good: 2, neutral: 1, bad: 12 }
  }
];

// Simulated AI matching results
const aiResults = [
  {
    name: '李美華 (Li Mei Hua)',
    matchScore: 95,
    reasoning: '完美匹配：具備專業辦公室清潔經驗，熟悉中環地區，廣東話流利，薪酬要求合理。優秀的工作評價 (15好評/2中性/0差評)。Perfect match with specialized office cleaning experience, familiar with Central district, fluent Cantonese speaker, reasonable rate expectations. Excellent work ratings (15 good/2 neutral/0 bad).',
    strengths: ['專業辦公室清潔經驗 (Professional office cleaning)', '地區匹配 (Location match)', '語言優勢 (Language advantage)', '薪酬合理 (Rate compatible)', '優秀評價 (Excellent ratings: 88% positive)'],
    concerns: [],
    languageMatch: 'Excellent - Native Cantonese speaker'
  },
  {
    name: 'Jennifer Lee',
    matchScore: 89,
    reasoning: 'Excellent candidate with specialized commercial cleaning skills including sanitization protocols. Bilingual capabilities and Central location preference make her ideal for this role. Outstanding work history with 95% positive ratings (18 good/1 neutral/0 bad). However, rate expectation (HK$85-110) is above budget. 💰 RECOMMENDATION: Negotiate to HK$80/hour - her skills justify meeting budget maximum.',
    strengths: ['Specialized office cleaning skills', 'COVID-19 sanitization certified', 'Bilingual (English/Cantonese)', 'Central district preference', 'Outstanding ratings (95% positive)'],
    concerns: ['Rate 6-38% above budget (HK$85-110 vs HK$80)', 'May need salary negotiation'],
    languageMatch: 'Excellent - Fluent in both English and Cantonese'
  },
  {
    name: '陳志強 (Chan Chi Keung)',
    matchScore: 92,
    reasoning: '豐富的物業管理和清潔經驗，雙語能力強，熟悉中環地區。非常好的工作記錄 (25好評/3中性/1差評)。薪酬非常合理 (HK$60-85 vs 預算 HK$80)。Extensive property management and cleaning experience, strong bilingual skills, familiar with Central area. Very good work record (25 good/3 neutral/1 bad). Very reasonable rate (HK$60-85 vs budget HK$80). 💰 RECOMMENDATION: Offer HK$75/hour - great value for experienced bilingual worker.',
    strengths: ['10年經驗 (10 years experience)', '物業管理背景 (Property management background)', '雙語能力 (Bilingual)', '地區熟悉 (Area familiarity)', '優秀評價 (Excellent ratings: 86% positive)', 'GOOD VALUE - within budget range'],
    concerns: ['主要專長為保安工作 (Primary expertise in security)'],
    languageMatch: 'Excellent - Native Cantonese, good English'
  },
  {
    name: 'Sarah Johnson',
    matchScore: 82,
    reasoning: 'Solid cleaning experience with good customer service skills. Central location preference is perfect, though limited Cantonese may be a consideration for some clients. Good work ratings (8 good/1 neutral/0 bad = 89% positive).',
    strengths: ['Professional cleaning background', 'Customer service skills', 'Central location preference', 'Good ratings (89% positive)', 'Reliable work history'],
    concerns: ['Limited Cantonese proficiency', 'Part-time availability only'],
    languageMatch: 'Good - English fluent, basic Cantonese'
  },
  {
    name: 'Maria Santos',
    matchScore: 80,
    reasoning: 'Experienced in cleaning with strong work ethic, but location preference doesn\'t align perfectly with Central district. However, her VERY competitive rate (HK$50-70 vs budget HK$80) and perfect work record make her an excellent value proposition. Perfect work record (12 good/0 neutral/0 bad = 100% positive). 💰 RECOMMENDATION: Offer HK$65/hour - significant savings with zero risk.',
    strengths: ['Extensive cleaning experience', 'EXCELLENT VALUE - 19% below budget', 'Full-time availability', 'Perfect work record (100% positive)', 'Strong work ethic', 'Zero bad reviews ever'],
    concerns: ['Location preference mismatch', 'Limited Cantonese'],
    languageMatch: 'Fair - English fluent, basic Cantonese'
  },
  {
    name: '王小明 (Wong Siu Ming)',
    matchScore: 45,
    reasoning: '雖然是廣東話使用者，但專業技能不匹配清潔工作要求，地區偏好也不符合。工作記錄尚可 (5好評/1中性/0差評)。While a Cantonese speaker, professional skills don\'t match cleaning job requirements and location preferences don\'t align. Decent work record (5 good/1 neutral/0 bad = 83% positive).',
    strengths: ['廣東話流利 (Fluent Cantonese)', '全職可用 (Full-time available)', '還可以的評價 (Decent ratings: 83% positive)'],
    concerns: ['技能不匹配 (Skills mismatch)', '地區不符 (Location mismatch)', '薪酬要求過高 (Rate too high)'],
    languageMatch: 'Excellent - Native Cantonese speaker'
  },
  {
    name: 'John Smith',
    matchScore: 15,
    reasoning: 'Completely wrong profession with unrealistic rate expectations (HK$200-300 vs budget HK$80 = 150-275% over budget!). No relevant experience and location preferences don\'t align with Central district needs. Mixed work ratings (3 good/0 neutral/2 bad = 60% positive) suggest reliability issues. 🚫 RECOMMENDATION: AVOID - Completely overpriced with wrong skills.',
    strengths: ['Native English speaker'],
    concerns: ['Zero cleaning experience', 'MASSIVELY overpriced (150-275% over budget)', 'Wrong skill set entirely', 'Remote location preference', 'Poor ratings (60% positive, some bad reviews)'],
    languageMatch: 'Poor - English only, no Cantonese'
  },
  {
    name: '張三 (Zhang San)',
    matchScore: 10,
    reasoning: '完全不適合的候選人：辦公室文員背景，無清潔經驗，不願意做體力勞動，地區不符。工作評價很差 (1好評/2中性/4差評)。薪酬要求過高 (HK$150-200 vs 預算 HK$80 = 88-150% 超出預算)。Completely unsuitable: office clerk background, no cleaning experience, unwilling to do physical labor, wrong location. Poor work ratings (1 good/2 neutral/4 bad = 14% positive). Overpriced (HK$150-200 vs budget HK$80 = 88-150% over budget). 🚫 RECOMMENDATION: REJECT - Wrong skills + bad attitude + overpriced.',
    strengths: ['有辦公室經驗 (Office experience)'],
    concerns: ['無清潔經驗 (No cleaning experience)', '不願意做體力勞動 (Refuses physical work)', '地區不符 (Wrong location)', 'OVERPRICED (88-150% over budget)', '只說普通話 (Mandarin only)', '很差的評價 (Terrible ratings: 14% positive)'],
    languageMatch: 'Poor - Mandarin only, no Cantonese'
  },
  {
    name: 'Lazy Larry',
    matchScore: 2,
    reasoning: 'Worst possible candidate. No relevant skills, terrible work ethic, completely unrealistic expectations (HK$500+ vs budget HK$80 = 525%+ over budget!!!). Would be a liability rather than an asset. Appalling work history (0 good/1 neutral/8 bad = 0% positive ratings). 🚫🚫 RECOMMENDATION: ABSOLUTELY REJECT - Delusional pricing with zero value.',
    strengths: [],
    concerns: ['No work experience', 'Terrible attitude', 'INSANE rate demands (525%+ over budget)', 'No relevant skills', 'Poor communication', 'Unemployed for years', 'Appalling ratings (0% positive, 89% negative)'],
    languageMatch: 'Terrible - Poor English, no local language skills'
  },
  {
    name: '問題員工 (Problem Employee)',
    matchScore: 8,
    reasoning: '有清潔經驗但態度極差，經常遲到早退，與僱主爭執。雖然會說廣東話但工作態度令人擔憂。非常差的評價 (2好評/1中性/12差評)。薪酬要求過高 (HK$200+ vs 預算 HK$80 = 150%+ 超出預算)。Has cleaning experience but terrible attitude, frequently late, leaves early, argues with employers. Cantonese speaker but work ethic is concerning. Terrible ratings (2 good/1 neutral/12 bad = 13% positive). Overpriced (HK$200+ vs budget HK$80 = 150%+ over budget). 🚫 RECOMMENDATION: AVOID - High risk + overpriced + terrible reviews.',
    strengths: ['有清潔經驗 (Has cleaning experience)', '會說廣東話 (Speaks Cantonese)'],
    concerns: ['態度極差 (Terrible attitude)', '經常遲到 (Always late)', '早退 (Leaves early)', '與僱主爭執 (Argues with employers)', '不可靠 (Unreliable)', 'OVERPRICED (150%+ over budget)', '極差的評價 (Terrible ratings: 13% positive)'],
    languageMatch: 'Good - Cantonese speaker but uses it to complain'
  }
];

console.log('📋 Job Requirements:');
console.log(`Title: ${testJob.title}`);
console.log(`Location: ${testJob.district}`);
console.log(`Rate: HK$${testJob.hourlyRate}/hour`);
console.log(`Description: ${testJob.description}\n`);

console.log('🤖 AI Matching Results (Ranked by Score):');
console.log('=' .repeat(100));

aiResults.forEach((result, index) => {
  console.log(`\n${index + 1}. ${result.name}`);
  console.log(`   🎯 AI Match Score: ${result.matchScore}%`);
  console.log(`   💭 AI Reasoning:`);
  console.log(`      ${result.reasoning}`);
  
  if (result.strengths.length > 0) {
    console.log(`   ✅ Key Strengths:`);
    result.strengths.forEach(strength => console.log(`      • ${strength}`));
  }
  
  if (result.concerns.length > 0) {
    console.log(`   ⚠️  Potential Concerns:`);
    result.concerns.forEach(concern => console.log(`      • ${concern}`));
  }
  
  console.log(`   🗣️  Language Assessment: ${result.languageMatch}`);
});

console.log('\n' + '='.repeat(100));
console.log('\n📊 Summary:');
console.log('• Top candidates show strong skills-job alignment');
console.log('• Multi-lingual analysis considers both Chinese and English profiles');
console.log('• AI provides detailed reasoning for each match score');
console.log('• Cultural and language preferences are factored into scoring');
console.log('• Location and rate compatibility heavily weighted');

console.log('\n✅ This demonstrates how the AI matching system would analyze');
console.log('   diverse applicant profiles and provide intelligent recommendations!');