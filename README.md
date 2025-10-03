# JetBond - Real-time Gig Marketplace

A Flutter mobile app with Node.js backend for connecting employers and employees in real-time gig work.

## 🚀 Quick Start

### Server
```bash
# Start server
server-control.bat start

# Or run directly
node server-local.js
```

### Flutter App
```bash
cd jetbond_mobile
flutter pub get
flutter run
```

## 👥 Test Users
- **Employee**: `rikke@jetbond.com` / `1234`
- **Employer**: `dee@jetbond.com` / `1234`

## 📊 Features
- ✅ Real-time job matching
- ✅ WebSocket notifications with unread count badges
- ✅ Dual-mode profiles (employee/employer)
- ✅ Auto-refresh job listings
- ✅ Comprehensive logging system
- ✅ DynamoDB persistence
- ✅ Rating system (good/neutral/poor)
- ✅ Work history with minimize/expand
- ✅ Job completion workflow
- ✅ Job State Machine with role-based permissions
- ✅ Smart notification handling for canceled jobs

## 🔧 Tech Stack
- **Backend**: Node.js, Express, WebSocket
- **Frontend**: Flutter (Dart)
- **Storage**: In-memory (DynamoDB ready)
- **Logging**: File-based with timestamps

## 📝 Logging
- **Server**: `jetbond.log` (all API requests, user actions)
- **Frontend**: `jetbond_app.log` (user interactions, navigation)

## 🏗️ Architecture
```
jetBond_PC/
├── server-local.js          # Main API server
├── jetbond.log             # Server logs
├── jetbond_mobile/         # Flutter app
│   └── lib/utils/logger.dart # Frontend logging
└── context/                # Documentation
```

## 🔄 Development Status
**Last Updated**: January 17, 2025
- ✅ Logging system implemented
- ✅ User ID system fixed (email-based)
- ✅ Real-time features active
- ✅ Rating system integrated
- ✅ Work history with smart minimize logic
- ✅ Job completion with employer ratings
- ✅ Consistent UI/UX across job and work history
- ✅ Job State Machine & Rule Engine implemented
- ✅ Notification system with unread count badges
- ✅ Smart notification handling for canceled jobs
- ✅ Job-specific navigation from notifications
- ✅ Duplicate notification fixes
- ✅ DynamoDB integration for persistence

## 📋 Next Steps
1. ✅ ~~Test complete job application flow~~
2. ✅ ~~Add rating system~~
3. ✅ ~~Implement work history~~
4. ✅ ~~Job State Machine & Rule Engine~~
5. ✅ ~~Enhanced WebSocket notifications~~
6. ✅ ~~Add database persistence~~
7. Improve matching algorithm
8. Add employee profile ratings display
9. Performance optimizations
10. Advanced job filtering
11. Push notifications for mobile