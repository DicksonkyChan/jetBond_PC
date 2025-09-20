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
- ✅ WebSocket notifications
- ✅ Dual-mode profiles (employee/employer)
- ✅ Auto-refresh job listings
- ✅ Comprehensive logging system
- ✅ In-memory storage for development

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
- Logging system implemented
- User ID system fixed (email-based)
- Real-time features active
- Ready for job workflow testing

## 📋 Next Steps
1. Test complete job application flow
2. Enhance WebSocket notifications
3. Improve matching algorithm
4. Add database persistence