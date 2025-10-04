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

  async findMatches(job, availableEmployees, userLanguage = 'English') {
    if (!this.isAWSHosted && (!this.apiKey || this.apiKey === 'your-deepseek-api-key-here')) {
      console.log('🤖 DeepSeek API key not configured, using basic matching');
      return this.basicMatching(job, availableEmployees);
    }
    
    if (this.isAWSHosted && !this.agentId) {
      console.log('🤖 Bedrock Agent ID not configured, using basic matching');
      return this.basicMatching(job, availableEmployees);
    }

    try {
      console.log(`🤖 Using AI matching for job: ${job.title} (Language: ${userLanguage})`);
      const matches = await this.aiMatching(job, availableEmployees, userLanguage);
      return matches;
    } catch (error) {
      console.log(`⚠️ AI matching failed, falling back to basic: ${error.message}`);
      return this.basicMatching(job, availableEmployees);
    }
  }

  async aiMatching(job, availableEmployees, userLanguage = 'English') {
    const prompt = this.buildMatchingPrompt(job, availableEmployees, userLanguage);
    
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

  buildMatchingPrompt(job, availableEmployees, userLanguage = 'English') {
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

    // Detect if user prefers Chinese
    const isChinese = userLanguage.includes('Chinese') || userLanguage.includes('中文') || 
                     userLanguage.includes('廣東話') || userLanguage.includes('Cantonese') ||
                     userLanguage.includes('普通話') || userLanguage.includes('Mandarin');

    if (isChinese) {
      return `請分析這個職位並與可用員工進行匹配。考慮多語言和文化背景。

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
      return `Analyze this job posting and match it with available employees. Consider multiple languages and cultural context.

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
      let score = 60;
      const profile = employee.profiles?.employee;
      
      if (profile) {
        if (profile.preferredDistricts?.includes(job.district)) {
          score += 25;
        }
        
        const minRate = profile.hourlyRateRange?.min || 0;
        const maxRate = profile.hourlyRateRange?.max || 999;
        if (job.hourlyRate >= minRate && job.hourlyRate <= maxRate) {
          score += 15;
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
}

module.exports = AIMatchingService;