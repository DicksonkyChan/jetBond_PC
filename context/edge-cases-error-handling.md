# JetBond Edge Cases & Error Handling

## Critical Edge Cases for MVP

### 1. Employee Goes Offline Mid-Job

#### Detection System
```javascript
// Track employee activity during active jobs
const monitorEmployeeActivity = (jobId, employeeId) => {
  const checkInterval = setInterval(() => {
    const lastSeen = getLastActivity(employeeId);
    const minutesOffline = (Date.now() - lastSeen) / 60000;
    
    if (minutesOffline > 15) { // 15 minutes offline
      handleEmployeeOffline(jobId, employeeId, minutesOffline);
    }
  }, 300000); // Check every 5 minutes
};
```

#### Progressive Response
```javascript
const handleEmployeeOffline = (jobId, employeeId, minutesOffline) => {
  if (minutesOffline > 15) {
    // Step 1: Try to reconnect employee
    sendUrgentNotification(employeeId, 'Employer waiting for you');
  }
  
  if (minutesOffline > 30) {
    // Step 2: Notify employer
    notifyEmployer(jobId, 'Employee may be unavailable. We\'re trying to reach them.');
  }
  
  if (minutesOffline > 60) {
    // Step 3: Automatic no-show penalty
    handleEmployeeNoShow(jobId, employeeId, 'offline_60min');
  }
};
```

### 2. Employer Cancels Last Minute

#### Cancellation Detection & Penalties
```javascript
const handleJobCancellation = (jobId, reason, cancelledBy) => {
  const job = getJob(jobId);
  const employee = getSelectedEmployee(jobId);
  const timeTillStart = job.startTime - Date.now();
  
  // Determine cancellation impact
  if (timeTillStart < 30 * 60 * 1000) { // Less than 30 minutes
    handleLastMinuteCancellation(job, employee, reason);
  } else {
    handleNormalCancellation(job, employee, reason);
  }
};

const handleLastMinuteCancellation = (job, employee, reason) => {
  // 1. Automatic bad rating for employer
  addSystemRating(job.employerId, {
    type: 'bad',
    reason: 'Cancelled job within 30 minutes',
    jobId: job.jobId,
    timestamp: Date.now(),
    isSystemGenerated: true
  });
  
  // 2. Track cancellation for suspension
  trackEmployerCancellation(job.employerId);
  
  // 3. Notify employee
  sendUrgentNotification(employee.id, 
    `Job cancelled: ${reason}. We're sorry for the short notice.`);
};
```

#### Employer Suspension System
```javascript
const trackEmployerCancellation = (employerId) => {
  const currentMonth = new Date().getMonth();
  const cancellations = getCancellationsThisMonth(employerId, currentMonth);
  
  cancellations.push({
    timestamp: Date.now(),
    type: 'last_minute'
  });
  
  // Check for 2nd cancellation this month
  if (cancellations.length >= 2) {
    suspendEmployer(employerId);
  }
  
  saveCancellationRecord(employerId, cancellations);
};

const suspendEmployer = (employerId) => {
  const suspensionEnd = Date.now() + (7 * 24 * 60 * 60 * 1000); // 1 week
  
  updateUserProfile(employerId, {
    employerSuspended: true,
    suspensionEnd: suspensionEnd,
    suspensionReason: 'Multiple last-minute cancellations'
  });
  
  notifyUser(employerId, 
    'Employer features suspended for 1 week due to repeated last-minute cancellations. You can still use employee features.');
};
```

### 3. Employee No-Show System

#### No-Show Detection
```javascript
const monitorEmployeeCommitment = (jobId, employeeId) => {
  const job = getJob(jobId);
  const employee = getEmployee(employeeId);
  
  // Check offline duration after job acceptance
  if (employee.status === 'busy' && employee.currentJobId === jobId) {
    const offlineMinutes = getOfflineMinutes(employeeId);
    
    if (offlineMinutes > 60) {
      handleEmployeeNoShow(jobId, employeeId, 'offline_60min');
    }
  }
  
  // Check no-show at job start time
  const jobStarted = Date.now() > job.startTime;
  const employeeArrived = employee.jobStatus === 'arrived';
  
  if (jobStarted && !employeeArrived) {
    setTimeout(() => {
      if (!employee.jobStatus === 'arrived') {
        handleEmployeeNoShow(jobId, employeeId, 'no_show_at_start');
      }
    }, 15 * 60 * 1000); // 15 minutes grace period
  }
};
```

#### Automatic Penalties
```javascript
const handleEmployeeNoShow = (jobId, employeeId, reason) => {
  const reasonMessages = {
    'offline_60min': 'Went offline for over 60 minutes after accepting job',
    'no_show_at_start': 'Did not show up for scheduled job'
  };
  
  // Automatic bad rating
  addSystemRating(employeeId, {
    type: 'bad',
    reason: reasonMessages[reason],
    jobId: jobId,
    timestamp: Date.now(),
    isSystemGenerated: true
  });
  
  // Track no-show for suspension
  trackEmployeeNoShow(employeeId, reason);
  
  // Release employee from job and notify employer
  releaseEmployeeFromJob(employeeId, jobId);
  notifyEmployerOfNoShow(jobId, reason);
};
```

#### Employee Job Access Suspension
```javascript
const trackEmployeeNoShow = (employeeId, reason) => {
  const currentMonth = new Date().getMonth();
  const noShows = getNoShowsThisMonth(employeeId, currentMonth);
  
  noShows.push({
    timestamp: Date.now(),
    reason: reason
  });
  
  // Check for 2nd no-show this month
  if (noShows.length >= 2) {
    suspendEmployeeJobAccess(employeeId);
  }
  
  saveNoShowRecord(employeeId, noShows);
};

const suspendEmployeeJobAccess = (employeeId) => {
  const suspensionEnd = Date.now() + (7 * 24 * 60 * 60 * 1000); // 1 week
  
  updateUserProfile(employeeId, {
    employeeJobsSuspended: true,
    jobSuspensionEnd: suspensionEnd,
    jobSuspensionReason: 'Multiple no-shows this month'
  });
  
  // Set status to inactive for job matching
  updateEmployeeStatus(employeeId, 'suspended');
  
  notifyUser(employeeId, 
    'Job applications suspended for 1 week due to repeated no-shows. You can still use employer features.');
};
```

## Network & API Failures

### DeepSeek API Fallback
```javascript
// Fallback matching without AI
async function findMatches(jobPost) {
  try {
    const aiMatches = await deepSeekMatching(jobPost);
    return aiMatches;
  } catch (error) {
    console.log('DeepSeek failed, using basic matching');
    return basicDistrictMatching(jobPost); // District + rate only
  }
}
```

### WebSocket Reconnection
```javascript
// Auto-reconnect with exponential backoff
const reconnectWebSocket = () => {
  setTimeout(() => {
    websocket.connect();
    retryCount++;
  }, Math.min(1000 * Math.pow(2, retryCount), 30000));
};
```

## Response Window Edge Cases

### Simultaneous Responses
```javascript
// Race condition: Multiple employees respond at exact same time
if (responses.length >= 5) {
  return { error: 'Response window full' };
}
// Use DynamoDB conditional writes to prevent over-limit
```

### Timer Conflicts
```javascript
// What if timer expires while employer is selecting?
if (window.isExpired && !selection.isComplete) {
  // Extend window by 2 minutes for selection
  extendWindowForSelection(jobId, 120000);
}
```

## Data Consistency Issues

### Duplicate Job Responses
```javascript
// Prevent double-tapping response button
const respondToJob = async (jobId) => {
  if (isResponding) return; // Prevent duplicate calls
  isResponding = true;
  try {
    await submitResponse(jobId);
  } finally {
    isResponding = false;
  }
};
```

### Profile Mode Switching During Active Job
```javascript
// Employee tries to switch to employer mode while busy
const switchToEmployerMode = () => {
  if (employeeStatus === 'busy') {
    showError('Complete current job before switching modes');
    return false;
  }
  return switchMode('employer');
};
```

## Rating System Edge Cases

### Mutual Rating Deadlock
```javascript
// Both parties refuse to rate each other
const handleRatingTimeout = (jobId) => {
  if (hoursAfterCompletion > 48 && !bothRated) {
    // Auto-assign neutral ratings
    assignDefaultRatings(jobId, 'neutral');
    unlockBothUsers();
  }
};
```

## Location & GPS Issues

### GPS Permission Denied
```javascript
const requestLocation = () => {
  if (permissionDenied) {
    showFallback('Please share your location manually in chat');
    enableManualLocationEntry();
  }
};
```

### Inaccurate GPS
```javascript
// GPS shows employee far from job site
const validateArrival = (employeeLocation, jobLocation) => {
  const distance = calculateDistance(employeeLocation, jobLocation);
  if (distance > 500) { // 500 meters tolerance
    askForManualConfirmation('Are you at the job site?');
  }
};
```

## Error Recovery Strategies

### Graceful Degradation
```javascript
const errorFallbacks = {
  'deepseek_down': 'Basic matching active',
  'websocket_failed': 'Using polling updates',
  'gps_unavailable': 'Manual location sharing',
  'sms_failed': 'Email verification backup'
};
```

### User-Friendly Error Messages
```javascript
const showUserFriendlyError = (error) => {
  const messages = {
    'network_error': 'Connection issue. Retrying...',
    'job_full': 'This job is no longer available',
    'rate_limit': 'Too many requests. Please wait.',
    'server_error': 'Something went wrong. We\'re fixing it!'
  };
  return messages[error] || 'Please try again later';
};
```

## Updated Data Models

### User Profile with Suspension Tracking
```json
{
  "userId": "uuid",
  "profiles": {
    "employee": {
      "name": "John Doe",
      "isComplete": true,
      "jobsSuspended": false,
      "jobSuspensionEnd": null,
      "noShowsThisMonth": [
        {
          "timestamp": "2024-01-04T10:30:00Z",
          "reason": "offline_60min"
        }
      ]
    },
    "employer": {
      "companyName": "ABC Restaurant",
      "isComplete": true,
      "suspended": false,
      "suspensionEnd": null,
      "cancellationsThisMonth": [
        {
          "timestamp": "2024-01-04T10:30:00Z",
          "type": "last_minute"
        }
      ]
    }
  },
  "currentMode": "employee|employer",
  "employeeStatus": "available|busy|suspended",
  "currentJobId": "uuid|null",
  "ratings": {
    "good": 15,
    "neutral": 2, 
    "bad": 3,
    "systemGenerated": 1
  }
}
```

## Access Control Implementation

### Employer Access Check
```javascript
const checkEmployerAccess = (userId) => {
  const user = getUser(userId);
  
  if (user.profiles.employer.suspended) {
    if (Date.now() < user.profiles.employer.suspensionEnd) {
      return {
        blocked: true,
        message: 'Employer features suspended until ' + 
                 new Date(user.profiles.employer.suspensionEnd).toLocaleDateString(),
        canUseEmployee: true
      };
    } else {
      // Suspension expired, reactivate
      reactivateEmployer(userId);
    }
  }
  
  return { blocked: false };
};
```

### Employee Job Access Check
```javascript
const checkEmployeeJobAccess = (userId) => {
  const user = getUser(userId);
  
  if (user.profiles.employee.jobsSuspended) {
    if (Date.now() < user.profiles.employee.jobSuspensionEnd) {
      return {
        blocked: true,
        message: 'Job applications suspended until ' + 
                 new Date(user.profiles.employee.jobSuspensionEnd).toLocaleDateString(),
        canUseEmployer: true
      };
    } else {
      // Suspension expired, reactivate
      reactivateEmployeeJobAccess(userId);
    }
  }
  
  return { blocked: false };
};
```

## Monthly Reset System

### Automatic Counter Reset
```javascript
// Reset cancellation and no-show counters each month
const resetMonthlyCounters = () => {
  // Run as scheduled Lambda function on 1st of each month
  const currentMonth = new Date().getMonth();
  
  // Clear all users' monthly counters
  clearCancellationCounters(currentMonth);
  clearNoShowCounters(currentMonth);
};
```

## UI Implementation

### Suspension Screens
```javascript
// Employer suspended screen
const SuspendedEmployerScreen = () => (
  <View style={styles.suspendedScreen}>
    <Text style={styles.title}>Employer Features Suspended</Text>
    <Text>Due to multiple last-minute job cancellations</Text>
    <Text>Suspension ends: {suspensionEndDate}</Text>
    
    <Text style={styles.note}>
      You can still use employee features to find work
    </Text>
    
    <Button 
      title="Switch to Employee Mode" 
      onPress={() => switchMode('employee')} 
    />
  </View>
);

// Employee suspended screen
const SuspendedEmployeeScreen = () => (
  <View style={styles.suspendedScreen}>
    <Text style={styles.title}>Job Applications Suspended</Text>
    <Text>Due to multiple no-shows this month</Text>
    <Text>Suspension ends: {jobSuspensionEndDate}</Text>
    
    <Text style={styles.note}>
      You can still use employer features to post jobs
    </Text>
    
    <Button 
      title="Switch to Employer Mode" 
      onPress={() => switchMode('employer')} 
    />
  </View>
);
```

### Rating Display with System Penalties
```javascript
const RatingDisplay = ({ ratings }) => (
  <View>
    <Text>⭐ Good: {ratings.good}</Text>
    <Text>😐 Neutral: {ratings.neutral}</Text>
    <Text>👎 Bad: {ratings.bad}</Text>
    {ratings.systemGenerated > 0 && (
      <Text style={{fontSize: 12, color: 'gray'}}>
        Includes {ratings.systemGenerated} system penalty
      </Text>
    )}
  </View>
);
```

## Key Principles

### Fair Accountability
- **Equal standards** for employees and employers
- **Automatic penalties** to reduce bias
- **Clear consequences** communicated upfront
- **Graduated responses** based on severity

### System Reliability
- **Graceful degradation** when services fail
- **Fallback mechanisms** for critical features
- **User-friendly error messages**
- **Automatic recovery** where possible

### Trust Building
- **Transparent penalties** with clear reasons
- **Consistent enforcement** of rules
- **Protection for both parties**
- **Clear communication** of expectations

This comprehensive error handling system ensures JetBond maintains reliability and trust even when things go wrong.