# Job Application Workflow

## 🔄 **Complete Application Flow**

### **1. Employee Side**
```
Login → Open to Work → View Jobs → Apply → Busy → Wait for Selection
```

### **2. Employer Side**
```
Post Job → AI Matching → Receive Applications → Review Candidates → Select Employee
```

## 📱 **Employee Application Process**

### **Step 1: Job Discovery**
- View available jobs (status: "matching")
- Filter by district, rate, duration
- Auto-refresh every 30 seconds
- AI-powered job matching notifications

### **Step 2: Application Submission**
- Click "Apply Now" button
- System validates employee eligibility
- Status automatically changes to "Busy"
- Button becomes "Applied" (disabled)
- Other jobs show "Busy" (disabled)

### **Step 3: Application Restrictions**
- **One Job Rule**: Can only apply to one job at a time
- **Status Check**: Must be "Open to Work" to apply
- **Duplicate Prevention**: Cannot apply to same job twice
- **Profile Validation**: Must have complete profile

### **Step 4: Waiting Period**
- Employee status: "Busy"
- Cannot apply to other jobs
- Awaits employer selection
- Receives notifications when selected/rejected

## 👔 **Employer Selection Process**

### **Step 1: Job Posting**
- Create job with title, description, rate, duration
- AI finds matching employees automatically
- Job status: "matching"
- Matching window opens for applications

### **Step 2: Receive Applications**
- Real-time notifications for new applications
- View response count on job card
- Click response count to view candidates

### **Step 3: Candidate Review**
- View candidate profiles and details
- See application timestamps
- Review employee ratings and experience
- Compare multiple candidates

### **Step 4: Employee Selection**
- Click "Select This Candidate" button
- Job status changes to "assigned"
- Selected employee notified
- Other candidates notified of rejection

## 🔔 **Notification System**

### **WebSocket Notifications:**
- **Job Match**: New job notifications to employees
- **Job Response**: Application notifications to employers
- **Selection Result**: Selection outcome to all candidates

### **Real-Time Updates:**
- Live job status changes
- Instant application feedback
- Automatic UI refresh
- Cross-platform notifications

## 🚫 **Application Restrictions**

### **Employee Limitations:**
- One active application at a time
- Must be "Open to Work" status
- Complete profile required
- Cannot apply to expired jobs

### **Job Limitations:**
- Maximum 5 responses per job
- 5-minute response window (configurable)
- Only "matching" status jobs accept applications
- District and rate compatibility required

## 📊 **Status Management**

### **Job Statuses:**
- **matching**: Accepting applications
- **assigned**: Employee selected
- **completed**: Job finished
- **cancelled**: Job cancelled by employer

### **Employee Statuses:**
- **open_to_work**: Available for jobs
- **busy**: Has active application
- **not_available**: Unavailable for jobs

### **Application States:**
- **pending**: Application submitted, awaiting selection
- **selected**: Chosen for the job
- **rejected**: Not selected for the job

## 🎯 **Button States & UI Feedback**

### **Apply Button States:**
| Status | Button Text | Color | Enabled |
|--------|-------------|-------|---------|
| Can Apply | "Apply Now" | Blue | ✅ |
| Applied | "Applied" | Grey | ❌ |
| Busy | "Busy" | Orange | ❌ |
| Not Available | "Not Available" | Red | ❌ |
| Login Required | "Login First" | Grey | ❌ |

### **Visual Indicators:**
- **Green**: Available actions
- **Grey**: Completed/disabled actions
- **Orange**: Blocked by status
- **Red**: Unavailable/error states

## 🔧 **Technical Implementation**

### **Backend Endpoints:**
- `POST /jobs/:id/respond` - Submit application
- `POST /jobs/:id/select` - Select candidate
- `POST /jobs/:id/matches` - Find matching employees
- `PUT /users/:id` - Update employee status

### **Frontend State Management:**
- Applied jobs tracking
- Active application management
- Status synchronization
- Real-time UI updates

## ✅ **Workflow Benefits**

1. **Prevents Spam**: One application per employee
2. **Clear Status**: Visual feedback at all stages
3. **Real-Time**: Instant notifications and updates
4. **User Control**: Manual status management
5. **Efficient Matching**: AI-powered job recommendations
6. **Professional Flow**: Complete hiring workflow