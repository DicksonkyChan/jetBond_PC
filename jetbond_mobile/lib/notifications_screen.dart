import 'package:flutter/material.dart';
import 'services/notification_service.dart';
import 'utils/date_utils.dart';
import 'main.dart';
import 'widgets/app_navigation_bar.dart';

class NotificationsScreen extends StatefulWidget {
  @override
  _NotificationsScreenState createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List<Map<String, dynamic>> notifications = [];

  @override
  void initState() {
    super.initState();
    _loadNotifications();
    NotificationService.addListener(_onNewNotification);
  }

  @override
  void dispose() {
    NotificationService.removeListener(_onNewNotification);
    super.dispose();
  }

  void _loadNotifications() {
    setState(() {
      notifications = NotificationService.getNotifications();
    });
  }

  void _onNewNotification(Map<String, dynamic> notification) {
    setState(() {
      notifications = NotificationService.getNotifications();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('🔔 Notifications'),
        automaticallyImplyLeading: false,
        actions: [
          IconButton(
            icon: Icon(Icons.refresh),
            onPressed: _loadNotifications,
          ),
        ],
      ),
      body: notifications.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.notifications_off, size: 64, color: Colors.grey),
                  SizedBox(height: 16),
                  Text('No notifications yet'),
                  SizedBox(height: 8),
                  Text('You\'ll receive notifications for job matches and updates'),
                ],
              ),
            )
          : ListView.builder(
              itemCount: notifications.length,
              itemBuilder: (context, index) {
                final notification = notifications[index];
                return Card(
                  margin: EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                  child: ListTile(
                    leading: CircleAvatar(
                      backgroundColor: _getNotificationColor(notification['type']),
                      child: Icon(
                        _getNotificationIcon(notification['type']),
                        color: Colors.white,
                      ),
                    ),
                    title: Text(_getNotificationTitle(notification)),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(_getNotificationSubtitle(notification)),
                        SizedBox(height: 4),
                        Text(
                          _formatTimestamp(notification['timestamp']),
                          style: TextStyle(fontSize: 12, color: Colors.grey),
                        ),
                      ],
                    ),
                    isThreeLine: true,
                  ),
                );
              },
            ),
      bottomNavigationBar: AppNavigationBar(currentIndex: 0),
    );
  }

  Color _getNotificationColor(String? type) {
    switch (type) {
      case 'job_match':
        return Colors.green;
      case 'job_response':
        return Colors.blue;
      case 'selection_result':
        return Colors.orange;
      case 'job_cancelled':
        return Colors.red;
      case 'status_reset':
        return Colors.grey;
      default:
        return Colors.blue;
    }
  }

  IconData _getNotificationIcon(String? type) {
    switch (type) {
      case 'job_match':
        return Icons.work;
      case 'job_response':
        return Icons.person_add;
      case 'selection_result':
        return Icons.check_circle;
      case 'job_cancelled':
        return Icons.cancel;
      case 'status_reset':
        return Icons.refresh;
      default:
        return Icons.notifications;
    }
  }

  String _getNotificationTitle(Map<String, dynamic> notification) {
    switch (notification['type']) {
      case 'job_match':
        return 'New Job Match';
      case 'job_response':
        return 'New Job Application';
      case 'selection_result':
        return notification['selected'] ? 'Job Offer!' : 'Application Update';
      case 'job_cancelled':
        return 'Job Cancelled';
      case 'status_reset':
        return 'Status Updated';
      default:
        return 'Notification';
    }
  }

  String _getNotificationSubtitle(Map<String, dynamic> notification) {
    switch (notification['type']) {
      case 'job_match':
        return '${notification['jobTitle']} in ${notification['district']} - ${notification['matchScore']}% match';
      case 'job_response':
        return 'Someone applied to your job (${notification['responseCount']} total applicants)';
      case 'selection_result':
        return notification['selected'] 
          ? 'Congratulations! You were selected for the job'
          : 'You were not selected for this job';
      case 'job_cancelled':
        return 'Job "${notification['jobTitle']}" has been cancelled';
      case 'status_reset':
        return notification['message'] ?? 'Your status has been updated';
      default:
        return 'New notification received';
    }
  }

  String _formatTimestamp(String? timestamp) {
    if (timestamp == null) return 'Unknown time';
    try {
      final dateTime = DateTime.parse(timestamp).toLocal();
      final now = DateTime.now();
      final difference = now.difference(dateTime);
      
      if (difference.inMinutes < 1) {
        return 'Just now';
      } else if (difference.inMinutes < 60) {
        return '${difference.inMinutes}m ago';
      } else if (difference.inHours < 24) {
        return '${difference.inHours}h ago';
      } else {
        return '${dateTime.day}/${dateTime.month} ${dateTime.hour}:${dateTime.minute.toString().padLeft(2, '0')}';
      }
    } catch (e) {
      return 'Unknown time';
    }
  }
}