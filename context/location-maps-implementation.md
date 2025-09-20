# JetBond Location & Maps Implementation

## Location Strategy Overview

JetBond uses a **hybrid location approach** combining district-based matching with GPS coordination for optimal user experience and cost efficiency.

## Phase 1: MVP Location Features

### District-Based Job Matching
```javascript
const HK_DISTRICTS = [
  'Central', 'Admiralty', 'Wan Chai', 'Causeway Bay',
  'TST', 'Mong Kok', 'Yau Ma Tei', 'Jordan',
  'Sheung Wan', 'Sai Ying Pun', 'Kennedy Town',
  'Quarry Bay', 'Tai Koo', 'North Point',
  'Fortress Hill', 'Tin Hau', 'Tai Po',
  'Sha Tin', 'Tsuen Wan', 'Tuen Mun'
];
```

### Basic Location Sharing
- **Static location pins** in chat messages
- **Job site addresses** provided by employers
- **Manual location sharing** via "Share Location" button
- **Basic map display** for job locations

## Tech Stack

### Frontend Dependencies
```json
{
  "react-native-maps": "^1.8.0",
  "react-native-geolocation-service": "^5.3.1",
  "geolib": "^3.3.3"
}
```

### Platform Setup

#### iOS Configuration (Info.plist)
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>JetBond needs location access to share your position with employers</string>

<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>JetBond needs location access to provide coordination while heading to work</string>

<key>NSCameraUsageDescription</key>
<string>JetBond needs camera access to share photos in chat</string>
```

#### Android Configuration (AndroidManifest.xml)
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.INTERNET" />

<!-- Google Maps API Key -->
<meta-data
  android:name="com.google.android.geo.API_KEY"
  android:value="YOUR_GOOGLE_MAPS_API_KEY"/>
```

## Data Models

### Updated Job Schema with Location
```json
{
  "jobId": "uuid",
  "employerId": "uuid",
  "title": "Restaurant Server",
  "description": "Busy restaurant needs experienced server",
  "district": "Central",
  "address": "123 Des Voeux Road Central, Hong Kong",
  "coordinates": {
    "lat": 22.2819,
    "lng": 114.1577
  },
  "hourlyRate": 120,
  "duration": {
    "hours": 4,
    "startTime": "18:00",
    "endTime": "22:00"
  },
  "embedding": [0.3, 0.1, ...],
  "status": "matching|closed|completed",
  "createdAt": "timestamp"
}
```

### Location Message Schema
```json
{
  "messageId": "uuid",
  "chatRoomId": "uuid",
  "senderId": "uuid",
  "messageType": "location",
  "content": {
    "coordinates": {
      "lat": 22.2819,
      "lng": 114.1577
    },
    "address": "123 Des Voeux Road Central, Hong Kong",
    "accuracy": 10,
    "timestamp": "2024-01-04T18:30:00Z"
  },
  "createdAt": "timestamp"
}
```

## Implementation

### Basic Location Sharing
```javascript
// Get current location
const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        resolve({ lat: latitude, lng: longitude });
      },
      (error) => reject(error),
      { 
        enableHighAccuracy: true, 
        timeout: 15000, 
        maximumAge: 10000 
      }
    );
  });
};

// Share location in chat
const shareLocationInChat = async (chatRoomId) => {
  try {
    const location = await getCurrentLocation();
    const address = await reverseGeocode(location);
    
    const locationMessage = {
      messageType: 'location',
      content: {
        coordinates: location,
        address: address,
        accuracy: 10,
        timestamp: Date.now()
      }
    };
    
    sendChatMessage(chatRoomId, locationMessage);
  } catch (error) {
    showError('Unable to get location. Please check permissions.');
  }
};
```

### Map Display Component
```javascript
import MapView, { Marker } from 'react-native-maps';

const JobLocationMap = ({ job, userLocation }) => (
  <MapView
    style={styles.map}
    initialRegion={{
      latitude: job.coordinates.lat,
      longitude: job.coordinates.lng,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }}
  >
    {/* Job location marker */}
    <Marker
      coordinate={job.coordinates}
      title={job.title}
      description={job.address}
      pinColor="red"
    />
    
    {/* User location marker (if available) */}
    {userLocation && (
      <Marker
        coordinate={userLocation}
        title="Your Location"
        pinColor="blue"
      />
    )}
  </MapView>
);
```

### Location Message Display
```javascript
const LocationMessage = ({ message, onOpenMaps }) => (
  <View style={styles.locationMessage}>
    <MapView
      style={styles.miniMap}
      region={{
        latitude: message.content.coordinates.lat,
        longitude: message.content.coordinates.lng,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }}
      scrollEnabled={false}
      zoomEnabled={false}
    >
      <Marker coordinate={message.content.coordinates} />
    </MapView>
    
    <View style={styles.locationInfo}>
      <Text style={styles.address}>{message.content.address}</Text>
      <Text style={styles.timestamp}>
        {formatTime(message.content.timestamp)}
      </Text>
      
      <TouchableOpacity 
        style={styles.openMapsButton}
        onPress={() => openInMaps(message.content.coordinates)}
      >
        <Text>Open in Maps</Text>
      </TouchableOpacity>
    </View>
  </View>
);
```

### Open in External Maps
```javascript
const openInMaps = (coordinates) => {
  const { lat, lng } = coordinates;
  const url = Platform.select({
    ios: `maps:0,0?q=${lat},${lng}`,
    android: `geo:0,0?q=${lat},${lng}`
  });
  
  Linking.canOpenURL(url).then(supported => {
    if (supported) {
      Linking.openURL(url);
    } else {
      // Fallback to Google Maps web
      const webUrl = `https://www.google.com/maps?q=${lat},${lng}`;
      Linking.openURL(webUrl);
    }
  });
};
```

## Phase 2: Live Tracking (Future)

### Live Location Tracking
```javascript
// Start live tracking when employee says "I'm on my way"
const startLiveTracking = (jobId) => {
  const watchId = Geolocation.watchPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      
      // Send location via WebSocket every 30 seconds
      websocket.send(JSON.stringify({
        type: 'location_update',
        jobId: jobId,
        coordinates: { lat: latitude, lng: longitude },
        timestamp: Date.now()
      }));
    },
    (error) => console.log('Location error:', error),
    { 
      enableHighAccuracy: true, 
      distanceFilter: 50, // Update every 50 meters
      interval: 30000 // Update every 30 seconds
    }
  );
  
  return watchId;
};

// Stop live tracking
const stopLiveTracking = (watchId) => {
  Geolocation.clearWatch(watchId);
};
```

### Live Tracking UI
```javascript
const LiveTrackingControls = ({ jobId, isTracking, onToggle }) => (
  <View style={styles.trackingControls}>
    {!isTracking ? (
      <TouchableOpacity 
        style={styles.startTrackingButton}
        onPress={() => onToggle(true)}
      >
        <Text>🚗 I'm on my way</Text>
      </TouchableOpacity>
    ) : (
      <View style={styles.trackingActive}>
        <Text>📍 Sharing location with employer</Text>
        <TouchableOpacity 
          style={styles.stopTrackingButton}
          onPress={() => onToggle(false)}
        >
          <Text>Stop sharing</Text>
        </TouchableOpacity>
      </View>
    )}
  </View>
);
```

## Cost Considerations

### Google Maps API Pricing
- **Map loads**: $7 per 1,000 loads
- **Geocoding**: $5 per 1,000 requests
- **Static maps**: $2 per 1,000 requests

### Monthly Cost Estimates
```
100 active users/day:
- Map loads: ~3,000/month = $21
- Geocoding: ~500/month = $2.50
- Total: ~$25/month

1,000 active users/day:
- Map loads: ~30,000/month = $210
- Geocoding: ~5,000/month = $25
- Total: ~$235/month
```

### Cost Optimization
- **Cache geocoding results** to reduce API calls
- **Use static maps** for message previews
- **Limit map interactions** in embedded views
- **Batch geocoding requests** when possible

## Privacy & Safety

### Location Sharing Rules
- **Opt-in only**: Employee chooses when to share location
- **Time-limited**: Location sharing expires after job completion
- **Job-specific**: Only selected employee's location visible to employer
- **Auto-stop**: Location sharing stops when job marked complete

### Privacy Implementation
```javascript
const LocationSharingConsent = ({ onConsent }) => (
  <View style={styles.consentModal}>
    <Text style={styles.title}>Share Your Location?</Text>
    <Text style={styles.description}>
      This will help the employer know when you're arriving.
      Location sharing will stop automatically when the job is complete.
    </Text>
    
    <View style={styles.buttons}>
      <Button title="Share Location" onPress={() => onConsent(true)} />
      <Button title="Not Now" onPress={() => onConsent(false)} />
    </View>
  </View>
);
```

## Error Handling

### GPS Permission Denied
```javascript
const handleLocationPermission = async () => {
  try {
    const permission = await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
    
    if (permission === RESULTS.GRANTED) {
      return true;
    } else {
      showLocationPermissionDialog();
      return false;
    }
  } catch (error) {
    showError('Location permission required for this feature');
    return false;
  }
};

const showLocationPermissionDialog = () => {
  Alert.alert(
    'Location Permission Required',
    'Please enable location access in settings to share your location with employers.',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Open Settings', onPress: () => Linking.openSettings() }
    ]
  );
};
```

### GPS Accuracy Issues
```javascript
const validateLocationAccuracy = (position) => {
  const accuracy = position.coords.accuracy;
  
  if (accuracy > 100) { // More than 100 meters uncertainty
    showWarning('Location accuracy is low. Consider moving to an open area.');
  }
  
  return accuracy <= 500; // Accept locations within 500m accuracy
};
```

### Network Connectivity
```javascript
const handleLocationSharingOffline = (location) => {
  // Queue location updates when offline
  const queuedUpdate = {
    type: 'location_update',
    coordinates: location,
    timestamp: Date.now(),
    queued: true
  };
  
  // Store in local storage
  AsyncStorage.setItem('queuedLocationUpdates', 
    JSON.stringify([...getQueuedUpdates(), queuedUpdate]));
  
  // Send when back online
  NetInfo.addEventListener(state => {
    if (state.isConnected) {
      sendQueuedLocationUpdates();
    }
  });
};
```

## Integration with Chat System

### Location Quick Actions
```javascript
const LocationQuickActions = ({ chatRoomId, jobLocation }) => (
  <View style={styles.quickActions}>
    <TouchableOpacity 
      style={styles.actionButton}
      onPress={() => shareLocationInChat(chatRoomId)}
    >
      <Text>📍 Share my location</Text>
    </TouchableOpacity>
    
    <TouchableOpacity 
      style={styles.actionButton}
      onPress={() => openDirections(jobLocation)}
    >
      <Text>🗺️ Get directions</Text>
    </TouchableOpacity>
    
    <TouchableOpacity 
      style={styles.actionButton}
      onPress={() => sendQuickMessage(chatRoomId, "I'm on my way! 🚗")}
    >
      <Text>🚗 I'm on my way</Text>
    </TouchableOpacity>
  </View>
);
```

### Arrival Confirmation
```javascript
const confirmArrival = async (jobId, jobLocation) => {
  try {
    const currentLocation = await getCurrentLocation();
    const distance = calculateDistance(currentLocation, jobLocation);
    
    if (distance <= 200) { // Within 200 meters
      updateJobStatus(jobId, 'arrived');
      sendQuickMessage(chatRoomId, "I've arrived! ✅");
    } else {
      // Manual confirmation for distant locations
      Alert.alert(
        'Confirm Arrival',
        `You appear to be ${Math.round(distance)}m from the job site. Are you at the correct location?`,
        [
          { text: 'Not yet', style: 'cancel' },
          { 
            text: 'Yes, I\'m here', 
            onPress: () => {
              updateJobStatus(jobId, 'arrived');
              sendQuickMessage(chatRoomId, "I've arrived! ✅");
            }
          }
        ]
      );
    }
  } catch (error) {
    // Manual confirmation fallback
    manualArrivalConfirmation(jobId);
  }
};
```

## Testing Strategy

### Location Simulation for Development
```javascript
// Mock location data for testing
const MOCK_LOCATIONS = {
  central: { lat: 22.2819, lng: 114.1577 },
  tst: { lat: 22.2976, lng: 114.1722 },
  causeway_bay: { lat: 22.2783, lng: 114.1747 }
};

const getMockLocation = (area = 'central') => {
  if (__DEV__) {
    return Promise.resolve(MOCK_LOCATIONS[area]);
  }
  return getCurrentLocation();
};
```

### Testing Checklist
- [ ] Location permission handling on both platforms
- [ ] GPS accuracy in different environments
- [ ] Location sharing in chat messages
- [ ] Map display with job and user markers
- [ ] External maps integration (Google Maps, Apple Maps)
- [ ] Offline location queueing
- [ ] Battery usage optimization
- [ ] Privacy controls and consent flows

This location implementation provides essential coordination features for JetBond while maintaining user privacy and keeping costs manageable for the MVP.