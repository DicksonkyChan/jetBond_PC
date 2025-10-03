import 'dart:convert';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:flutter/material.dart';

class NotificationService {
  static WebSocketChannel? _channel;
  static String? _currentUserId;
  static final List<Function(Map<String, dynamic>)> _listeners = [];
  static final List<Map<String, dynamic>> _notifications = [];
  static int _unreadCount = 0;
  static final List<Function(int)> _unreadListeners = [];

  static void connect(String userId) {
    _currentUserId = userId;
    print('🔌 Connecting WebSocket for user: $userId');
    try {
      _channel = WebSocketChannel.connect(Uri.parse('ws://localhost:8080'));
      print('🔌 WebSocket channel created');
      
      // Authenticate
      final authMessage = json.encode({
        'type': 'auth',
        'userId': userId,
      });
      print('🔌 Sending auth message: $authMessage');
      _channel!.sink.add(authMessage);

      // Listen for messages
      _channel!.stream.listen(
        (message) {
          print('📨 Received WebSocket message: $message');
          final data = json.decode(message);
          _handleNotification(data);
        },
        onError: (error) {
          print('❌ WebSocket error: $error');
        },
        onDone: () {
          print('🔌 WebSocket connection closed');
          _reconnect();
        },
      );
    } catch (e) {
      print('❌ WebSocket connection failed: $e');
    }
  }

  static void _reconnect() {
    if (_currentUserId != null) {
      Future.delayed(Duration(seconds: 5), () {
        connect(_currentUserId!);
      });
    }
  }

  static void _handleNotification(Map<String, dynamic> data) {
    print('🔔 Handling notification: $data');
    data['isRead'] = false;
    _notifications.insert(0, data);
    if (_notifications.length > 50) {
      _notifications.removeLast();
    }
    
    // Handle job cancellation - decrement instead of increment
    if (data['type'] == 'job_cancelled') {
      _decrementUnreadForJob(data['jobId']);
    } else {
      _unreadCount++;
    }
    
    _notifyUnreadListeners();
    
    print('🔔 Notifying ${_listeners.length} listeners');
    for (final listener in _listeners) {
      listener(data);
    }
  }

  static void addListener(Function(Map<String, dynamic>) listener) {
    _listeners.add(listener);
  }

  static void removeListener(Function(Map<String, dynamic>) listener) {
    _listeners.remove(listener);
  }

  static List<Map<String, dynamic>> getNotifications() {
    return List.from(_notifications);
  }

  static void disconnect() {
    _channel?.sink.close();
    _channel = null;
    _currentUserId = null;
    _listeners.clear();
    _unreadListeners.clear();
    _unreadCount = 0;
  }

  static void addUnreadListener(Function(int) listener) {
    _unreadListeners.add(listener);
  }

  static void removeUnreadListener(Function(int) listener) {
    _unreadListeners.remove(listener);
  }

  static void _notifyUnreadListeners() {
    for (final listener in _unreadListeners) {
      listener(_unreadCount);
    }
  }

  static int getUnreadCount() {
    return _unreadCount;
  }

  static void markAllAsRead() {
    for (final notification in _notifications) {
      notification['isRead'] = true;
    }
    _unreadCount = 0;
    _notifyUnreadListeners();
  }

  static void _decrementUnreadForJob(String? jobId) {
    if (jobId == null) return;
    
    int decrementCount = 0;
    for (final notification in _notifications) {
      if (notification['jobId'] == jobId && 
          notification['isRead'] == false &&
          notification['type'] == 'job_match') {
        decrementCount++;
      }
    }
    
    _unreadCount = (_unreadCount - decrementCount).clamp(0, _unreadCount);
    print('🔔 Decremented unread count by $decrementCount for canceled job $jobId');
  }

  static void showNotificationSnackBar(BuildContext context, Map<String, dynamic> notification) {
    String message = _getNotificationMessage(notification);
    Color color = _getNotificationColor(notification['type']);
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: color,
        duration: Duration(seconds: 4),
        action: SnackBarAction(
          label: 'OK',
          textColor: Colors.white,
          onPressed: () {},
        ),
      ),
    );
  }

  static String _getNotificationMessage(Map<String, dynamic> notification) {
    switch (notification['type']) {
      case 'job_match':
        return '🎯 New job match: ${notification['jobTitle']} (${notification['matchScore']}% match)';
      case 'job_posted':
        return '📝 New job posted: ${notification['jobTitle']}';
      case 'job_response':
        return '👤 New applicant for your job (${notification['responseCount']} total)';
      case 'selection_result':
        return notification['selected'] 
          ? '🎉 Congratulations! You were selected for the job'
          : '😔 You were not selected for this job';
      case 'job_cancelled':
        return '❌ Job cancelled: ${notification['jobTitle']}';
      case 'job_completed':
        return '✅ Job completed: ${notification['jobTitle']}';
      case 'job_pending':
        return '⏳ Job pending review: ${notification['jobTitle']}';
      case 'job_updated':
        return '📝 Job updated: ${notification['jobTitle']} (${notification['updatedFields']?.join(', ') ?? 'details changed'})';
      case 'status_reset':
        return '🔄 ${notification['message']}';
      case 'auth_success':
        return '✅ Connected to notifications';
      default:
        return '📢 New notification';
    }
  }

  static Color _getNotificationColor(String? type) {
    switch (type) {
      case 'job_match':
        return Colors.green;
      case 'job_posted':
        return Colors.blue;
      case 'job_response':
        return Colors.blue;
      case 'selection_result':
        return Colors.orange;
      case 'job_cancelled':
        return Colors.red;
      case 'job_completed':
        return Colors.green;
      case 'job_pending':
        return Colors.orange;
      case 'job_updated':
        return Colors.purple;
      case 'status_reset':
        return Colors.grey;
      case 'auth_success':
        return Colors.green;
      default:
        return Colors.blue;
    }
  }
}