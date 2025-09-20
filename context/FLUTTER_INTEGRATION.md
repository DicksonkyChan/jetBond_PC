# Flutter Frontend Integration

This document explains how the Flutter mobile app integrates with the Windows backend.

## API Integration

### Base URL
```dart
const String baseUrl = 'http://localhost:8080'; // Development
// const String baseUrl = 'https://your-production-url.com'; // Production
```

### Flutter HTTP Client
```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

class ApiService {
  static const String baseUrl = 'http://localhost:8080';
  
  // Test connection
  static Future<bool> testConnection() async {
    final response = await http.get(Uri.parse('$baseUrl/test'));
    return response.statusCode == 200;
  }
  
  // Get jobs
  static Future<List<dynamic>> getJobs() async {
    final response = await http.get(Uri.parse('$baseUrl/jobs'));
    return json.decode(response.body);
  }
  
  // Create job
  static Future<Map<String, dynamic>> createJob(Map<String, dynamic> jobData) async {
    final response = await http.post(
      Uri.parse('$baseUrl/jobs'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode(jobData),
    );
    return json.decode(response.body);
  }
}
```

## Required Flutter Dependencies

Add to `pubspec.yaml`:
```yaml
dependencies:
  http: ^1.1.0
  json_annotation: ^4.8.1
  
dev_dependencies:
  json_serializable: ^6.7.1
  build_runner: ^2.4.7
```

## API Endpoints for Flutter

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/test` | Health check |
| POST | `/users` | Create user |
| GET | `/users/:id` | Get user |
| POST | `/jobs` | Create job |
| GET | `/jobs` | List jobs |
| POST | `/jobs/:id/matches` | Find matches |
| POST | `/jobs/:id/respond` | Respond to job |

## Development Setup

1. **Start Windows Backend**:
   ```cmd
   cd C:\Users\dicks\source\repo\jetBond_PC
   start.bat
   ```

2. **Flutter Development**:
   - Backend runs on `http://localhost:8080`
   - Flutter app connects to this URL
   - Test with `web-test.html` first

## CORS Configuration

The backend already includes CORS headers for Flutter:
```javascript
res.header('Access-Control-Allow-Origin', '*');
res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
```

## Testing Integration

1. **Backend Test**: Open `web-test.html`
2. **Flutter Test**: Use the API endpoints in your Flutter app
3. **Network Test**: Ensure both can communicate