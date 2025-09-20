# JetBond Utility Tools

Organized utility scripts for JetBond development and maintenance.

## Directory Structure

### `/database/`
Database management and user data utilities:
- `create-dynamodb-tables.js` - Creates DynamoDB tables
- `create-tables.js` - Alternative table creation
- `scan_all_users.js` - Scans all users
- `list_users.js` - Lists users
- `read_rikke.js` - Reads Rikke's profile
- `read_profile.js` - General profile reader
- `update_rikke_profile.js` - Updates profiles
- `delete_user.js` - Deletes users
- `fix_user_id.js` - Fixes user ID issues

### `/testing/`
API and system testing utilities:
- `test-api.js` - API endpoint testing
- `test-backend.js` - Backend testing
- `test-dynamodb.js` - Database testing
- `test-suite.js` - Complete test suite
- `test-enhanced-api.js` - Enhanced API tests
- `test-profile-endpoints.js` - Profile testing

### `/user-management/`
User verification and management:
- `check_user_rikke.js` - Checks Rikke's data
- `check-user.js` - General user checker
- `check-user-simple.js` - Simple user verification

### `/setup/`
Server control and setup scripts:
- `server-control.bat` - Windows server control
- `server-control.ps1` - PowerShell server control
- `start.bat` - Simple server starter
- `setup.bat` - Project setup

### `/services/`
Service utilities and integrations:
- `data-persistence.js` - Data persistence utilities
- `matching-service.js` - Job matching service
- `notification-service.js` - Notification utilities
- `deepseek-service.js` - AI service integration

## Usage

Run scripts from the project root directory:
```bash
node tools/database/read_rikke.js
node tools/testing/test-api.js
tools/setup/server-control.bat start
```