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
                    onTap: () => _handleNotificationTap(notification),
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
      case 'job_completed':
        return Colors.green;
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
      case 'job_completed':
        return Icons.check_circle_outline;
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
      case 'job_completed':
        return 'Job Completed';
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
      case 'job_completed':
        return 'Job "${notification['jobTitle']}" has been completed';
      case 'status_reset':
        return notification['message'] ?? 'Your status has been updated';
      default:
        return 'New notification received';
    }
  }

  void _handleNotificationTap(Map<String, dynamic> notification) {
    final jobId = notification['jobId'];
    if (jobId != null && _isJobRelatedNotification(notification['type'])) {
      // Check if job is canceled or completed - prevent navigation
      if (_isCanceledJobNotification(notification)) {
        _showJobCanceledDialog(notification);
      } else if (_isOldJobNotification(notification)) {
        _showJobNoLongerAvailableDialog(notification);
      } else {
        // Navigate to dashboard and highlight the specific job
        final route = UserService.currentUserType == 'employee' 
          ? '/employee-dashboard' 
          : '/employer-dashboard';
        Navigator.pushReplacementNamed(context, route, arguments: {'highlightJobId': jobId});
      }
    }
  }

  bool _isOldJobNotification(Map<String, dynamic> notification) {
    final type = notification['type'];
    return ['job_completed', 'selection_result'].contains(type);
  }

  bool _isCanceledJobNotification(Map<String, dynamic> notification) {
    return notification['type'] == 'job_cancelled' || 
           (notification['type'] == 'job_match' && _isJobCanceled(notification['jobId']));
  }

  bool _isJobCanceled(String? jobId) {
    // Check if there's a job_cancelled notification for this job
    return notifications.any((n) => n['jobId'] == jobId && n['type'] == 'job_cancelled');
  }

  void _showJobNoLongerAvailableDialog(Map<String, dynamic> notification) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Job No Longer Available'),
        content: Text(
          'This job "${notification['jobTitle'] ?? 'Unknown Job'}" is no longer active. '
          'It may have been completed or expired.'
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('OK'),
          ),
        ],
      ),
    );
  }

  void _showJobCanceledDialog(Map<String, dynamic> notification) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Job Canceled'),
        content: Text(
          'This job "${notification['jobTitle'] ?? 'Unknown Job'}" has been canceled '
          'and is no longer available.'
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('OK'),
          ),
        ],
      ),
    );
  }

  bool _isJobRelatedNotification(String? type) {
    return ['job_match', 'job_response', 'selection_result', 'job_cancelled', 'job_completed', 'job_pending'].contains(type);
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