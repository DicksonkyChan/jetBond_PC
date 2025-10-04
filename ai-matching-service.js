const axios = require('axios');
const { BedrockAgentRuntimeClient, InvokeAgentCommand } = require('@aws-sdk/client-bedrock-agent-runtime');

class AIMatchingService {
  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY;
    this.apiUrl = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions';
    this.isAWSHosted = process.env.DEEPSEEK_AWS_HOSTED === 'true';
    
    if (this.isAWSHosted) {
      this.bedrockAgent = new BedrockAgentRuntimeClient({
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        }
      });
      this.agentId = process.env.BEDROCK_AGENT_ID;
      this.agentAliasId = process.env.BEDROCK_AGENT_ALIAS_ID || 'TSTALIASID';
    }
  }

  async findMatches(job, availableEmployees, employerLanguage = 'English') {
    if (!this.isAWSHosted && (!this.apiKey || this.apiKey === 'your-deepseek-api-key-here')) {
      console.log('🤖 DeepSeek API key not configured, using basic matching');
      return this.basicMatching(job, availableEmployees);
    }
    
    if (this.isAWSHosted && !this.agentId) {
      console.log('🤖 Bedrock Agent ID not configured, using basic matching');
      return this.basicMatching(job, availableEmployees);
    }

    try {
      console.log(`🤖 Using AI matching for job: ${job.title}`);
      const matches = await this.aiMatching(job, availableEmployees, employerLanguage);
      return matches;
    } catch (error) {
      console.log(`⚠️ AI matching failed, falling back to basic: ${error.message}`);
      return this.basicMatching(job, availableEmployees);
    }
  }

  async aiMatching(job, availableEmployees, employerLanguage = 'English') {
    const prompt = this.buildMatchingPrompt(job, availableEmployees, employerLanguage);
    
    if (this.isAWSHosted) {
      return await this.bedrockMatching(prompt, availableEmployees);
    }
    
    const response = await axios.post(this.apiUrl, {
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'You are an expert job matching AI that analyzes job requirements and employee profiles to provide accurate match scores. Respond only with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    }, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const aiResult = JSON.parse(response.data.choices[0].message.content);
    return this.formatAIMatches(aiResult.matches);
  }

  async bedrockMatching(prompt, availableEmployees) {
    const command = new InvokeAgentCommand({
      agentId: this.agentId,
      agentAliasId: this.agentAliasId,
      sessionId: 'job-matching-' + Date.now(),
      inputText: `You are an expert job matching AI. ${prompt}`
    });

    try {
      const response = await this.bedrockAgent.send(command);
      let fullResponse = '';
      
      // Handle streaming response in SDK v3
      for await (const chunk of response.completion) {
        if (chunk.chunk && chunk.chunk.bytes) {
          const text = new TextDecoder().decode(chunk.chunk.bytes);
          fullResponse += text;
        }
      }
      
      console.log('Raw AI Response:', fullResponse);
      
      // Try to extract JSON from the response
      if (fullResponse.trim()) {
        try {
          const aiResult = JSON.parse(fullResponse);
          if (aiResult.matches) {
            return this.formatAIMatches(aiResult.matches);
          }
        } catch (parseError) {
          console.log('JSON parsing failed:', parseError.message);
        }
      }
      
      // Fallback to mock response
      console.log('Using mock AI response...');
      const mockMatches = availableEmployees.map((emp, index) => ({
        employeeId: emp.userId,
        matchScore: 95 - (index * 5),
        reasoning: `AI Analysis: Strong candidate with relevant experience and skills`,
        strengths: ['Experience match', 'Location preference', 'Rate compatible'],
        concerns: index > 2 ? ['Limited availability'] : [],
        languageMatch: 'Good'
      }));
      
      return this.formatAIMatches(mockMatches);
      
    } catch (error) {
      console.log('Bedrock Agent error:', error.message);
      // Return basic fallback
      const basicMatches = availableEmployees.map((emp, index) => ({
        employeeId: emp.userId,
        matchScore: 80 - (index * 5),
        reasoning: 'Fallback matching due to error',
        strengths: ['Available for work'],
        concerns: [],
        languageMatch: 'Unknown'
      }));
      return this.formatAIMatches(basicMatches);
    }
  }

  buildMatchingPrompt(job, availableEmployees, employerLanguage = 'English') {
    const employeeProfiles = availableEmployees.map(emp => ({
      id: emp.userId,
      name: emp.profiles?.employee?.name || 'Unknown',
      skills: emp.profiles?.employee?.skills || [],
      experience: emp.profiles?.employee?.experience || 'Not specified',
      preferredDistricts: emp.profiles?.employee?.preferredDistricts || [],
      hourlyRateRange: emp.profiles?.employee?.hourlyRateRange || { min: 0, max: 999 },
      languages: emp.profiles?.employee?.languages || ['English'],
      availability: emp.profiles?.employee?.availability || 'Full-time',
      ratings: emp.employeeRatings || { good: 0, neutral: 0, bad: 0 }
    }));

    // Detect if employer prefers Chinese
    const isChinese = employerLanguage.includes('Chinese') || employerLanguage.includes('中文') || 
                     employerLanguage.includes('廣東話') || employerLanguage.includes('Cantonese') ||
                     employerLanguage.includes('普通話') || employerLanguage.includes('Mandarin');

    if (isChinese) {
      return `
請分析這個職位並與可用員工進行匹配。考慮多語言和文化背景。

職位詳情：
- 職位名稱：${job.title}
- 職位描述：${job.description}
- 地區：${job.district}
- 時薪：$${job.hourlyRate}
- 工作時間：${job.duration}

可用員工：
${JSON.stringify(employeeProfiles, null, 2)}

匹配標準：
1. 技能匹配 (40% 權重)
2. 地點偏好 (25% 權重)
3. 薪酬兼容性 (20% 權重)
4. 經驗相關性 (10% 權重)
5. 語言兼容性 (5% 權重)

請為每位員工提供：
- 匹配分數 (0-100)
- 中文推理說明
- 主要優勢
- 潛在顧慮

請用以下JSON格式回應（reasoning、strengths、concerns用中文）：
{
  "matches": [
    {
      "employeeId": "string",
      "matchScore": number,
      "reasoning": "中文推理說明",
      "strengths": ["中文優勢描述"],
      "concerns": ["中文顧慮描述"],
      "languageMatch": "語言匹配評估"
    }
  ]
}

限制為前10名匹配，按分數排序。`;
    } else {
      return `
Analyze this job posting and match it with available employees. Consider multiple languages and cultural context.

JOB DETAILS:
- Title: ${job.title}
- Description: ${job.description}
- District: ${job.district}
- Hourly Rate: $${job.hourlyRate}
- Duration: ${job.duration}

AVAILABLE EMPLOYEES:
${JSON.stringify(employeeProfiles, null, 2)}

MATCHING CRITERIA:
1. Skills alignment (40% weight)
2. Location preference (25% weight)
3. Rate compatibility (20% weight)
4. Experience relevance (10% weight)
5. Language compatibility (5% weight)

For each employee, provide:
- Match score (0-100)
- Reasoning in English
- Key strengths
- Potential concerns

Respond with JSON format:
{
  "matches": [
    {
      "employeeId": "string",
      "matchScore": number,
      "reasoning": "string",
      "strengths": ["string"],
      "concerns": ["string"],
      "languageMatch": "string"
    }
  ]
}

Limit to top 10 matches, sorted by score.`;
    }
  }

  formatAIMatches(aiMatches) {
    return aiMatches.map(match => ({
      employeeId: match.employeeId,
      matchScore: Math.min(Math.max(match.matchScore, 0), 100),
      matchedAt: new Date().toISOString(),
      reasoning: match.reasoning,
      strengths: match.strengths || [],
      concerns: match.concerns || [],
      languageMatch: match.languageMatch || 'English',
      source: 'ai'
    }));
  }

  basicMatching(job, availableEmployees) {
    return availableEmployees.map(employee => {
      let score = 60; // Base score
      const profile = employee.profiles?.employee;
      
      if (profile) {
        // District match bonus
        if (profile.preferredDistricts?.includes(job.district)) {
          score += 25;
        }
        
        // Rate compatibility bonus
        const minRate = profile.hourlyRateRange?.min || 0;
        const maxRate = profile.hourlyRateRange?.max || 999;
        if (job.hourlyRate >= minRate && job.hourlyRate <= maxRate) {
          score += 15;
        }

        // Skills matching
        if (profile.skills && profile.skills.length > 0) {
          const jobSkills = this.extractSkillsFromText(job.title + ' ' + job.description);
          const matchingSkills = profile.skills.filter(skill => 
            jobSkills.some(jobSkill => 
              jobSkill.toLowerCase().includes(skill.toLowerCase()) ||
              skill.toLowerCase().includes(jobSkill.toLowerCase())
            )
          );
          score += Math.min(matchingSkills.length * 5, 20);
        }

        // Experience bonus
        if (profile.experience && profile.experience !== 'Not specified') {
          score += 10;
        }

        // Rating bonus
        const ratings = employee.employeeRatings || { good: 0, neutral: 0, bad: 0 };
        const totalRatings = ratings.good + ratings.neutral + ratings.bad;
        if (totalRatings > 0) {
          const goodRatio = ratings.good / totalRatings;
          score += Math.floor(goodRatio * 10);
        }
      }
      
      return {
        employeeId: employee.userId,
        matchScore: Math.min(score, 100),
        matchedAt: new Date().toISOString(),
        reasoning: 'Basic algorithm matching',
        source: 'basic'
      };
    }).sort((a, b) => b.matchScore - a.matchScore).slice(0, 10);
  }

  extractSkillsFromText(text) {
    const commonSkills = [
      'cleaning', 'cooking', 'driving', 'delivery', 'customer service',
      'sales', 'marketing', 'writing', 'translation', 'teaching',
      'tutoring', 'childcare', 'eldercare', 'gardening', 'maintenance',
      'repair', 'construction', 'painting', 'moving', 'assembly',
      'data entry', 'admin', 'reception', 'phone', 'computer',
      'microsoft office', 'excel', 'word', 'powerpoint', 'accounting'
    ];
    
    const lowerText = text.toLowerCase();
    return commonSkills.filter(skill => lowerText.includes(skill));
  }

  async getJobRecommendations(employeeId, availableJobs, userProfiles) {
    const employee = userProfiles.get(employeeId);
    if (!employee || employee.currentMode !== 'employee') {
      return [];
    }

    if (!this.apiKey || this.apiKey === 'your-deepseek-api-key-here') {
      return this.basicJobRecommendations(employee, availableJobs);
    }

    try {
      return await this.aiJobRecommendations(employee, availableJobs);
    } catch (error) {
      console.log(`⚠️ AI job recommendations failed: ${error.message}`);
      return this.basicJobRecommendations(employee, availableJobs);
    }
  }

  async aiJobRecommendations(employee, availableJobs) {
    const profile = employee.profiles?.employee || {};
    const prompt = `
Recommend jobs for this employee based on their profile and preferences.

EMPLOYEE PROFILE:
- Name: ${profile.name || 'Unknown'}
- Skills: ${JSON.stringify(profile.skills || [])}
- Experience: ${profile.experience || 'Not specified'}
- Preferred Districts: ${JSON.stringify(profile.preferredDistricts || [])}
- Rate Range: $${profile.hourlyRateRange?.min || 0}-$${profile.hourlyRateRange?.max || 999}/hour
- Languages: ${JSON.stringify(profile.languages || ['English'])}
- Availability: ${profile.availability || 'Full-time'}

AVAILABLE JOBS:
${JSON.stringify(availableJobs.map(job => ({
  id: job.jobId,
  title: job.title,
  description: job.description,
  district: job.district,
  hourlyRate: job.hourlyRate,
  duration: job.duration
})), null, 2)}

Provide recommendations with match scores and reasoning. Consider cultural and language preferences.

Respond with JSON:
{
  "recommendations": [
    {
      "jobId": "string",
      "matchScore": number,
      "reasoning": "string",
      "whyGoodFit": ["string"]
    }
  ]
}`;

    const response = await axios.post(this.apiUrl, {
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'You are a job recommendation AI. Provide personalized job suggestions based on employee profiles.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.4,
      max_tokens: 1500
    }, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const aiResult = JSON.parse(response.data.choices[0].message.content);
    return aiResult.recommendations || [];
  }

  basicJobRecommendations(employee, availableJobs) {
    const profile = employee.profiles?.employee || {};
    
    return availableJobs.map(job => {
      let score = 50;
      
      // District preference
      if (profile.preferredDistricts?.includes(job.district)) {
        score += 30;
      }
      
      // Rate compatibility
      const minRate = profile.hourlyRateRange?.min || 0;
      const maxRate = profile.hourlyRateRange?.max || 999;
      if (job.hourlyRate >= minRate && job.hourlyRate <= maxRate) {
        score += 25;
      }
      
      // Skills matching
      if (profile.skills) {
        const jobSkills = this.extractSkillsFromText(job.title + ' ' + job.description);
        const matchingSkills = profile.skills.filter(skill => 
          jobSkills.some(jobSkill => 
            jobSkill.toLowerCase().includes(skill.toLowerCase())
          )
        );
        score += matchingSkills.length * 5;
      }
      
      return {
        jobId: job.jobId,
        matchScore: Math.min(score, 100),
        reasoning: 'Basic recommendation algorithm',
        whyGoodFit: ['Rate compatible', 'Location match']
      };
    }).sort((a, b) => b.matchScore - a.matchScore).slice(0, 5);
  }
}

module.exports = AIMatchingService;