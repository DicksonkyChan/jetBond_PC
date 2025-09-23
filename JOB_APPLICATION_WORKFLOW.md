# JetBond Job Application Workflow

## Overview
Complete workflow for job applications from posting to completion, including cancellation handling.

## 1. Job Posting (Employer)
```
Employer → Post Job → Server creates job with status 'matching'
                   → AI finds potential matches
                   → WebSocket notifications sent to matched employees
```

## 2. Job Application (Employee)
```
Employee sees job → Clicks "Apply Now" → Server adds to job.matchingWindow.responses[]
                                      → Employee status set to 'busy'
                                      → Employee.currentJobId = jobId
                                      → Button changes to "Cancel Application"
                                      → WebSocket notification to employer
```

## 3. Application Cancellation (Employee)
```
Employee → Clicks "Cancel Application" → Server removes from responses[]
                                      → Adds to job.canceledApplications[]
                                      → Employee status reset to 'open_to_work'
                                      → Button changes to "Application Canceled"
                                      → Employee CANNOT reapply to same job
                                      → Employer no longer sees this applicant
```

## 4. Employee Selection (Employer)
```
Employer → Views applicants → Selects employee → Job status = 'assigned'
                                               → Selected employee stays 'busy'
                                               → Other applicants reset to 'open_to_work'
                                               → WebSocket notifications to all applicants
```

## 5. Job Completion by Employee
```
Employee → Completes current job → Rates employer → Employer rating updated
                                                  → Employee status = 'open_to_work'
                                                  → Employee.currentJobId = null
```

## 6. Job Completion by Employer
```
Employer → Completes job → Rates employee → Job status = 'completed'
                                         → Employee rating updated
                                         → WebSocket notification to employee
```

## Job States
- **matching**: Open for applications
- **assigned**: Employee selected, work in progress
- **completed**: Work finished, rated
- **cancelled**: Job cancelled by employer
- **expired**: Job expired automatically

## Employee States
- **open_to_work**: Available for new jobs
- **busy**: Applied to job or working
- **not_available**: Manually set unavailable

## Application States
- **Applied**: In job.matchingWindow.responses[]
- **Canceled**: In job.canceledApplications[] (cannot reapply)
- **Selected**: job.selectedEmployeeId matches employee
- **Rejected**: Not selected when employer picks someone else

## Key Rules
1. Employee can only apply to one job at a time
2. Once application is canceled, employee cannot reapply to same job
3. Canceled applicants are removed from employer's view
4. Employee status automatically resets when jobs expire/complete/cancel
5. Only employers can complete jobs and rate employees
6. Employees can rate employers when completing work
7. Employee status and currentJobId are reset to 'open_to_work'/null on job completion
8. Both employer and employee ratings are tracked separately
9. Employees cannot cancel applications once job is assigned (status = 'assigned')

## Real-time Notification System

### 🎯 Job Matching Notifications
- **Trigger**: When job is posted and AI finds matches
- **Recipients**: Matched employees
- **Message**: "New job match: [Job Title] ([X]% match)"
- **Color**: Green

### 👤 Job Application Notifications
- **Trigger**: When employee applies to job
- **Recipients**: Employer who posted the job
- **Message**: "New applicant for your job ([X] total)"
- **Color**: Blue

### 🎉 Selection Result Notifications
- **Trigger**: When employer selects employee for job
- **Recipients**: All applicants (selected + rejected)
- **Messages**:
  - Selected: "Congratulations! You were selected for the job"
  - Rejected: "You were not selected for this job"
- **Color**: Orange

### ❌ Job Cancellation Notifications
- **Trigger**: When employer cancels job
- **Recipients**: All applicants
- **Message**: "Job cancelled: [Job Title]"
- **Color**: Red

### ✅ Job Completion Notifications
- **Trigger**: When employer marks job as completed
- **Recipients**: Selected employee
- **Message**: "Job completed: [Job Title]"
- **Color**: Green

### 🔄 Status Reset Notifications
- **Trigger**: When employee status is automatically reset
- **Recipients**: Affected employee
- **Message**: "Your status has been reset to 'Open to work'. Reason: [reason]"
- **Color**: Grey
- **Common reasons**: Job expired, job cancelled, not selected

### 🔌 Connection Notifications
- **Trigger**: When WebSocket connection is established
- **Recipients**: Connecting user
- **Message**: "Connected to notifications"
- **Color**: Green

### ❌ No Job Update Notifications
**Important**: Jobs cannot be edited after posting. Employers must cancel and repost instead. Therefore, there are no job update notifications in the system.

## API Endpoints
- `POST /jobs/:id/respond` - Apply to job
- `POST /jobs/:id/cancel-application` - Cancel application
- `POST /jobs/:id/select` - Select employee
- `PUT /jobs/:id/complete` - Complete job with employee rating
- `POST /jobs/:id/rate` - Rate user (employer or employee)
- `GET /jobs/:id/applicants` - View applicants (employer only)
- `GET /employee/:id/current-job` - Get employee's current assigned job