const express = require('express');
const { v4: uuidv4 } = require('uuid');
const WebSocket = require('ws');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const port = process.env.PORT || 8080;

// WebSocket connection management
const clients = new Map(); // userId -> WebSocket

// Mock data storage (replace with DynamoDB later)
let users = [];
let jobs = [];
let matches = [];

app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// WebSocket connection handling
wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection');
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'auth' && data.userId) {
        clients.set(data.userId, ws);
        ws.userId = data.userId;
        ws.send(JSON.stringify({ type: 'auth_success', userId: data.userId }));
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });
  
  ws.on('close', () => {
    if (ws.userId) {
      clients.delete(ws.userId);
    }
  });
});

// Function to send real-time notifications
function sendNotification(userId, notification) {
  const client = clients.get(userId);
  if (client && client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify(notification));
  }
}

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ 
    message: 'JetBond Enhanced API is working!', 
    timestamp: new Date().toISOString(),
    features: ['WebSocket', 'AI Matching', 'Response Windows', 'Ratings'],
    version: '2.0.0'
  });
});

// Users endpoints
app.post('/users', (req, res) => {
  try {
    const { profiles, currentMode } = req.body;
    if (!profiles || !currentMode) {
      return res.status(400).json({ error: 'Missing required fields: profiles, currentMode' });
    }

    const userId = uuidv4();
    const user = {
      userId,
      profiles,
      currentMode,
      employeeStatus: 'available',
      currentJobId: null,
      ratings: { good: 0, neutral: 0, bad: 0 },
      isActive: true,
      createdAt: new Date().toISOString()
    };

    users.push(user);
    res.status(201).json({ userId, message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/users/:id', (req, res) => {
  try {
    const user = users.find(u => u.userId === req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Jobs endpoints
app.post('/jobs', (req, res) => {
  try {
    const { title, description, district, hourlyRate, duration, employerId } = req.body;
    if (!title || !description || !district || !hourlyRate || !duration || !employerId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const jobId = uuidv4();
    const job = {
      jobId,
      title,
      description,
      district,
      hourlyRate,
      duration,
      employerId,
      status: 'matching',
      createdAt: new Date().toISOString(),
      matchingWindow: {
        isOpen: false,
        firstResponseAt: null,
        responses: []
      }
    };

    jobs.push(job);
    res.status(201).json({ jobId, message: 'Job created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/jobs', (req, res) => {
  try {
    const { district } = req.query;
    let filteredJobs = jobs.filter(job => job.status === 'matching');
    
    if (district) {
      filteredJobs = filteredJobs.filter(job => job.district === district);
    }
    
    res.json(filteredJobs);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Simple matching algorithm (enhanced version)
function findMatches(jobId, jobData) {
  const availableEmployees = users.filter(user => 
    user.currentMode === 'employee' && 
    user.employeeStatus === 'available'
  );

  const jobMatches = availableEmployees
    .map(employee => {
      const profile = employee.profiles?.employee;
      if (!profile) return null;

      let score = 0;
      
      // District match (30% weight)
      const employeeDistricts = profile.preferredDistricts || [];
      if (employeeDistricts.includes(jobData.district)) {
        score += 30;
      }
      
      // Rate compatibility (20% weight)
      const employeeMinRate = profile.hourlyRateRange?.min || 0;
      const employeeMaxRate = profile.hourlyRateRange?.max || 999;
      if (jobData.hourlyRate >= employeeMinRate && jobData.hourlyRate <= employeeMaxRate) {
        score += 20;
      }
      
      // Simple text matching (50% weight)
      const jobText = `${jobData.title} ${jobData.description}`.toLowerCase();
      const employeeText = `${profile.jobDescription || ''} ${profile.skills?.join(' ') || ''}`.toLowerCase();
      const commonWords = jobText.split(' ').filter(word => 
        word.length > 2 && employeeText.includes(word)
      );
      score += Math.min(commonWords.length * 10, 50);
      
      // Rating penalty
      const ratings = employee.ratings || { good: 0, neutral: 0, bad: 0 };
      const totalRatings = ratings.good + ratings.neutral + ratings.bad;
      const badRatingPercent = totalRatings > 0 ? ratings.bad / totalRatings : 0;
      if (badRatingPercent > 0.3) {
        score *= 0.5; // 50% reduction
      }

      return {
        employeeId: employee.userId,
        matchScore: score,
        matchedAt: new Date().toISOString()
      };
    })
    .filter(match => match && match.matchScore >= 60) // Minimum 60% similarity
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 10); // Top 10 matches

  // Store matches
  jobMatches.forEach(match => {
    matches.push({
      jobId,
      employeeId: match.employeeId,
      status: 'pending',
      matchScore: match.matchScore,
      createdAt: match.matchedAt
    });
  });

  return jobMatches;
}

// Matching endpoints
app.post('/jobs/:id/matches', (req, res) => {
  try {
    const job = jobs.find(j => j.jobId === req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const jobMatches = findMatches(req.params.id, job);
    
    // Send push notifications to matched employees
    jobMatches.forEach(match => {
      sendNotification(match.employeeId, {
        type: 'job_match',
        jobId: req.params.id,
        jobTitle: job.title,
        district: job.district,
        hourlyRate: job.hourlyRate,
        matchScore: match.matchScore,
        timestamp: new Date().toISOString()
      });
    });
    
    res.json({ matches: jobMatches, count: jobMatches.length });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Response window system
const responseWindows = new Map();

app.post('/jobs/:id/respond', (req, res) => {
  try {
    const { employeeId } = req.body;
    if (!employeeId) {
      return res.status(400).json({ error: 'Missing employeeId' });
    }

    const job = jobs.find(j => j.jobId === req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const now = new Date().toISOString();
    let windowData = responseWindows.get(req.params.id) || {
      isOpen: false,
      firstResponseAt: null,
      responses: [],
      timer: null
    };

    // Start response window on first response
    if (!windowData.isOpen) {
      windowData.isOpen = true;
      windowData.firstResponseAt = now;
      
      // 5-minute timer
      windowData.timer = setTimeout(() => {
        windowData.isOpen = false;
        job.status = 'awaiting_selection';
        console.log(`Response window closed for job ${req.params.id}`);
      }, 5 * 60 * 1000);
      
      responseWindows.set(req.params.id, windowData);
    }

    // Check if window is still open
    if (!windowData.isOpen) {
      return res.json({ success: false, message: 'Response window is closed' });
    }

    // Check max responses
    if (windowData.responses.length >= 5) {
      return res.json({ success: false, message: 'Maximum responses reached' });
    }

    // Add response
    windowData.responses.push({
      employeeId,
      respondedAt: now
    });

    // Update match status
    const match = matches.find(m => m.jobId === req.params.id && m.employeeId === employeeId);
    if (match) {
      match.status = 'responded';
      match.respondedAt = now;
    }

    // Update job
    job.matchingWindow = {
      isOpen: windowData.isOpen,
      firstResponseAt: windowData.firstResponseAt,
      responses: windowData.responses
    };

    // Notify employer
    sendNotification(job.employerId, {
      type: 'job_response',
      jobId: req.params.id,
      employeeId,
      responseCount: windowData.responses.length,
      windowOpen: windowData.isOpen,
      timestamp: now
    });

    // Close window if 5 responses
    if (windowData.responses.length >= 5) {
      windowData.isOpen = false;
      job.status = 'awaiting_selection';
      if (windowData.timer) {
        clearTimeout(windowData.timer);
      }
    }

    res.json({ 
      success: true, 
      responseCount: windowData.responses.length,
      windowOpen: windowData.isOpen
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Employee selection
app.post('/jobs/:id/select', (req, res) => {
  try {
    const { selectedEmployeeId } = req.body;
    if (!selectedEmployeeId) {
      return res.status(400).json({ error: 'Missing selectedEmployeeId' });
    }

    const job = jobs.find(j => j.jobId === req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Update job status
    job.status = 'assigned';
    job.selectedEmployeeId = selectedEmployeeId;
    job.selectedAt = new Date().toISOString();

    // Notify all candidates
    if (job.matchingWindow?.responses) {
      job.matchingWindow.responses.forEach(response => {
        const isSelected = response.employeeId === selectedEmployeeId;
        sendNotification(response.employeeId, {
          type: 'selection_result',
          jobId: req.params.id,
          selected: isSelected,
          timestamp: new Date().toISOString()
        });
      });
    }

    res.json({ success: true, message: 'Employee selected successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Rating system
app.post('/jobs/:id/rate', (req, res) => {
  try {
    const { rating, raterId, ratedUserId } = req.body;
    if (!rating || !raterId || !ratedUserId || !['good', 'neutral', 'bad'].includes(rating)) {
      return res.status(400).json({ error: 'Invalid rating data' });
    }

    const user = users.find(u => u.userId === ratedUserId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update ratings
    user.ratings[rating] += 1;

    res.json({ success: true, message: 'Rating submitted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

server.listen(port, () => {
  console.log(`🚀 JetBond Enhanced API server with WebSocket running on port ${port}`);
  console.log(`📱 Ready for Flutter frontend!`);
  console.log(`🔗 Test: http://localhost:${port}/test`);
  console.log(`🌐 WebSocket: ws://localhost:${port}`);
  console.log(`✨ Features: AI Matching, Response Windows, Real-time Updates, Ratings`);
});