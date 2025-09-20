# Employee Status System

## 📊 **Status Types**

### **🟢 Open to Work (Default)**
- Can view and apply to jobs
- Receives job notifications
- Default status for new employees

### **🔴 Not Available**
- Cannot apply to jobs
- Does not receive job offers
- Manual status set by employee

### **🟡 Busy**
- Auto-set when employee applies to a job
- Cannot apply to additional jobs
- Indicates active job application

## 🔄 **Status Flow**

```
Login → Open to Work (default)
   ↓
Apply to Job → Busy (automatic)
   ↓
Manual Change → Any status (via UI)
   ↓
Open to Work → Refresh job listings
```

## 🚫 **Application Restrictions**

### **Status-Based Button States:**
- **Open to Work**: "Apply Now" (enabled)
- **Not Available**: "Not Available" (disabled)
- **Busy**: "Busy" (disabled)
- **Already Applied**: "Applied" (disabled)

### **One Job Rule:**
- Employee can only apply to one job at a time
- Status automatically becomes "Busy" after application
- Must manually change status to apply to new jobs

## 📱 **UI Implementation**

### **App Bar Status Selector:**
- Status icon changes based on current status
- Dropdown menu to change status
- Icons: Work (🟢), Do Not Disturb (🔴), Hourglass (🟡)

### **Dashboard Status Display:**
- Shows current status in header
- Color-coded status text
- Real-time status updates

### **Job Listing Integration:**
- Button text reflects employee status
- Disabled buttons for unavailable states
- Status-based job filtering

## 🔧 **Technical Implementation**

### **UserService Updates:**
```dart
static String employeeStatus = 'open_to_work';
static void setEmployeeStatus(String status);
```

### **Status Values:**
- `'open_to_work'` - Available for jobs
- `'not_available'` - Unavailable for jobs  
- `'busy'` - Has active application

### **Status Management:**
- Automatic status change on job application
- Manual status change via UI
- Status persistence during session
- Status reset on logout

## 🎯 **Business Logic**

### **Job Matching:**
- Only "Open to Work" employees receive job notifications
- "Not Available" employees excluded from matching
- "Busy" employees cannot apply to additional jobs

### **Workflow Integration:**
- Status affects job visibility
- Status controls application permissions
- Status updates trigger UI refresh

## ✅ **Benefits**

1. **Employee Control**: Manual availability management
2. **Prevents Overload**: One job application limit
3. **Clear Status**: Visual status indicators
4. **Workflow Management**: Automatic status transitions
5. **User Experience**: Intuitive status system