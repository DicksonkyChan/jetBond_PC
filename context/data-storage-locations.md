# Data Storage Locations - JetBond

## In-Memory Storage (Current Implementation)

### Server-Side Storage (`server-local.js`)
**Location**: JavaScript variables in memory

```javascript
// In-memory storage containers
const users = new Map();     // User profiles and data
const jobs = new Map();      // Job postings
const matches = new Map();   // Job-employee matches
```

**Data Types Stored**:
- **Users**: Profiles, preferences, ratings, status
- **Jobs**: Job details, employer info, matching windows
- **Matches**: Employee-job matching results

### Frontend Storage (`jetbond_mobile/lib/main.dart`)
**Location**: Hardcoded constants and runtime variables

```dart
// Hardcoded test accounts
final Map<String, Map<String, String>> _accounts = {
  'rikke@jetbond.com': {
    'password': '1234',
    'name': 'Rikke Hansen',
    'userId': 'rikke@jetbond.com',  // Uses email as userId
    'type': 'employee'
  },
  'dee@jetbond.com': {
    'password': '1234', 
    'name': 'Dee Wong',
    'userId': 'dee@jetbond.com',    // Uses email as userId
    'type': 'employer'
  }
};

// Runtime user state
class UserService {
  static String? currentUserId;
  static String? currentUserType;
  static bool profileCompleted = true;
  static String userName = 'John Doe';
  static String companyName = 'ABC Company';
  static String experience = 'Experienced worker';
  static String employeeStatus = 'open_to_work';
  static Map<String, dynamic>? _profileData;
}
```

## Sample Data Generation

### Server Sample Data (`server-local.js` - `addSampleData()` function)
**Location**: Lines ~400-500 in `server-local.js`

```javascript
function addSampleData() {
  // Sample employee
  const employeeId = 'emp-001';
  users.set(employeeId, { /* employee data */ });

  // Sample employer  
  const employerId = 'emp-002';
  users.set(employerId, { /* employer data */ });

  // Rikke's profile
  const rikkeId = 'rikke@jetbond.com';
  users.set(rikkeId, { /* rikke's data */ });

  // Sample job
  const jobId = 'job-001';
  jobs.set(jobId, { /* job data */ });
}
```

**Sample Data Includes**:
- 2 test users with email-based userIds:
  - `rikke@jetbond.com` (Employee)
  - `dee@jetbond.com` (Employer)
- 1 test job (job-001)
- Pre-configured profiles and preferences

**Current Profile Data for rikke@jetbond.com**:
- Name: "Rikke Szeto"
- Job Description: "" (empty)
- Preferred Districts: ["Central", "Wan Chai", "Tai Koo"]
- Hourly Rate: $80-150
- Company Name: "" (empty)
- Contact Person: "" (empty)

## Data Persistence

### Current State
- ✅ **DynamoDB Database**: Data persists between server restarts
- ✅ **AWS Managed Storage**: Production-ready persistence
- ✅ **Runtime Updates**: Real-time data updates
- ✅ **Email-based UserIds**: Uses email addresses as primary keys

### Current Implementation
- **Active**: DynamoDB tables (`jetbond-users`, `jetbond-jobs`, `jetbond-matches`)
- **Configuration**: AWS credentials configured
- **Code**: Production server (`server.js`) using DynamoDB

## Key Locations to Update

### When Adding New Test Data
1. **Server**: `server-local.js` → `addSampleData()` function
2. **Frontend**: `main.dart` → `_accounts` map in `LoginScreen`

### When Switching to Database
1. **Server**: Remove in-memory Maps, enable DynamoDB calls
2. **Environment**: Update `.env` with real AWS credentials
3. **Sample Data**: Move to database initialization script

## Data Flow
```
Frontend _accounts → Login → Server DynamoDB → API responses → Frontend UserService
```

**Note**: Data persists in DynamoDB between server restarts. User profiles are stored with email addresses as primary keys (userId).