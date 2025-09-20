# JetBond Flutter Frontend

Minimal Flutter app connecting to JetBond AWS backend.

## Features

- **Job List**: View all available jobs from AWS backend
- **Post Job**: Create new job postings
- **Real-time Data**: Connects to live AWS API
- **Hong Kong Districts**: Dropdown with HK locations

## Setup

1. **Install Flutter**: https://flutter.dev/docs/get-started/install
2. **Get Dependencies**:
   ```bash
   cd flutter_app
   flutter pub get
   ```
3. **Run App**:
   ```bash
   flutter run
   ```

## Backend Connection

- **AWS URL**: `https://xaifmm3kga.ap-southeast-1.awsapprunner.com`
- **API Service**: `lib/services/api_service.dart`
- **Auto-refresh**: Jobs update from live backend

## Screens

- **JobListScreen**: Main screen showing all jobs
- **PostJobScreen**: Form to create new jobs

## Test Data

The app connects to your live AWS backend with real job data:
- Chinese restaurant delivery ($70/hr)
- Urgent Server ($120/hr) 
- Whiskey Bar Waiter ($230/hr)
- Bar tender ($130/hr)

## Next Steps

- Add authentication
- Add user profiles
- Add real-time WebSocket updates
- Add push notifications