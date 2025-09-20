const DeepSeekService = require('./deepseek-service');

class MatchingService {
  constructor(dynamodb) {
    this.dynamodb = dynamodb;
    this.deepseek = new DeepSeekService();
    this.responseWindows = new Map(); // Track active response windows
  }

  async findMatches(jobId, jobData) {
    // Get all available employees (active within 7 days - REQ-065)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const employees = await this.dynamodb.scan({
      TableName: process.env.DYNAMODB_USERS_TABLE,
      FilterExpression: 'currentMode = :mode AND employeeStatus = :status',
      ExpressionAttributeValues: {
        ':mode': 'employee',
        ':status': 'available'
      }
    }).promise();

    // Generate job description embedding for AI matching
    const jobText = `${jobData.title} ${jobData.description}`;
    const jobEmbedding = await this.deepseek.generateEmbedding(jobText);

    // Calculate AI-powered matches with scoring (REQ-017)
    const matches = [];
    for (const employee of employees.Items) {
      const profile = employee.profiles?.employee;
      if (!profile) continue;

      // Generate employee profile embedding
      const employeeText = `${profile.jobDescription || ''} ${profile.skills?.join(' ') || ''}`;
      const employeeEmbedding = await this.deepseek.generateEmbedding(employeeText);

      // Calculate semantic similarity (50% weight)
      const semanticScore = this.deepseek.calculateSimilarity(jobEmbedding, employeeEmbedding) * 50;

      // District match score (30% weight)
      const employeeDistricts = profile.preferredDistricts || [];
      const districtScore = employeeDistricts.includes(jobData.district) ? 30 : 0;

      // Rate compatibility score (20% weight)
      const employeeMinRate = profile.hourlyRateRange?.min || 0;
      const employeeMaxRate = profile.hourlyRateRange?.max || 999;
      const rateScore = (jobData.hourlyRate >= employeeMinRate && jobData.hourlyRate <= employeeMaxRate) ? 20 : 0;

      // Rating penalty (REQ-064)
      const ratings = employee.ratings || { good: 0, neutral: 0, bad: 0 };
      const totalRatings = ratings.good + ratings.neutral + ratings.bad;
      const badRatingPercent = totalRatings > 0 ? ratings.bad / totalRatings : 0;
      const ratingPenalty = badRatingPercent > 0.3 ? 0.5 : 1; // 50% reduction if >30% bad ratings

      const finalScore = (semanticScore + districtScore + rateScore) * ratingPenalty;

      // Only include matches above 60% similarity (REQ-063)
      if (finalScore >= 60) {
        matches.push({
          employeeId: employee.userId,
          matchScore: finalScore,
          semanticScore,
          districtScore,
          rateScore,
          matchedAt: new Date().toISOString()
        });
      }
    }

    // Sort by score and take top 10 (REQ-062)
    const topMatches = matches
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10);

    // Store matches
    for (const match of topMatches) {
      await this.dynamodb.put({
        TableName: process.env.DYNAMODB_MATCHES_TABLE,
        Item: {
          jobId,
          employeeId: match.employeeId,
          status: 'pending',
          matchScore: match.matchScore,
          createdAt: match.matchedAt
        }
      }).promise();
    }

    return topMatches;
  }

  async respondToJob(jobId, employeeId) {
    const now = new Date().toISOString();
    
    // Get current job to check response window
    const jobResult = await this.dynamodb.get({
      TableName: process.env.DYNAMODB_JOBS_TABLE,
      Key: { jobId }
    }).promise();

    if (!jobResult.Item) {
      throw new Error('Job not found');
    }

    const job = jobResult.Item;
    let windowData = this.responseWindows.get(jobId) || {
      isOpen: false,
      firstResponseAt: null,
      responses: [],
      timer: null
    };

    // Check if this is the first response (REQ-025)
    if (!windowData.isOpen) {
      windowData.isOpen = true;
      windowData.firstResponseAt = now;
      
      // Start 5-minute timer (REQ-026)
      windowData.timer = setTimeout(() => {
        this.closeResponseWindow(jobId);
      }, 5 * 60 * 1000); // 5 minutes
      
      this.responseWindows.set(jobId, windowData);
    }

    // Check if window is still open
    if (!windowData.isOpen) {
      return { success: false, message: 'Response window is closed' };
    }

    // Check if already at max responses (REQ-026)
    if (windowData.responses.length >= 5) {
      return { success: false, message: 'Maximum responses reached' };
    }

    // Add response
    windowData.responses.push({
      employeeId,
      respondedAt: now
    });

    // Update match status
    await this.dynamodb.update({
      TableName: process.env.DYNAMODB_MATCHES_TABLE,
      Key: { jobId, employeeId },
      UpdateExpression: 'SET #status = :status, respondedAt = :respondedAt',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':status': 'responded',
        ':respondedAt': now
      }
    }).promise();

    // Update job with response window data
    await this.dynamodb.update({
      TableName: process.env.DYNAMODB_JOBS_TABLE,
      Key: { jobId },
      UpdateExpression: 'SET matchingWindow = :window',
      ExpressionAttributeValues: {
        ':window': {
          isOpen: windowData.isOpen,
          firstResponseAt: windowData.firstResponseAt,
          responses: windowData.responses
        }
      }
    }).promise();

    // Close window if we hit 5 responses (REQ-026)
    if (windowData.responses.length >= 5) {
      this.closeResponseWindow(jobId);
    }

    return { 
      success: true, 
      responseCount: windowData.responses.length,
      windowOpen: windowData.isOpen
    };
  }

  async closeResponseWindow(jobId) {
    const windowData = this.responseWindows.get(jobId);
    if (!windowData) return;

    // Clear timer if exists
    if (windowData.timer) {
      clearTimeout(windowData.timer);
    }

    // Mark window as closed
    windowData.isOpen = false;
    this.responseWindows.set(jobId, windowData);

    // Update job status
    await this.dynamodb.update({
      TableName: process.env.DYNAMODB_JOBS_TABLE,
      Key: { jobId },
      UpdateExpression: 'SET #status = :status, matchingWindow.isOpen = :isOpen',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':status': 'awaiting_selection',
        ':isOpen': false
      }
    }).promise();

    console.log(`Response window closed for job ${jobId}`);
  }
}

module.exports = MatchingService;