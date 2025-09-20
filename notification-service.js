class NotificationService {
  constructor() {
    this.notifications = new Map(); // userId -> notifications[]
  }

  // Store notification for offline users
  storeNotification(userId, notification) {
    if (!this.notifications.has(userId)) {
      this.notifications.set(userId, []);
    }
    
    const userNotifications = this.notifications.get(userId);
    userNotifications.push({
      ...notification,
      id: Date.now().toString(),
      read: false,
      createdAt: new Date().toISOString()
    });
    
    // Keep only last 50 notifications per user
    if (userNotifications.length > 50) {
      userNotifications.splice(0, userNotifications.length - 50);
    }
  }

  // Get pending notifications for user
  getPendingNotifications(userId) {
    return this.notifications.get(userId) || [];
  }

  // Mark notifications as read
  markAsRead(userId, notificationIds) {
    const userNotifications = this.notifications.get(userId);
    if (!userNotifications) return;

    userNotifications.forEach(notification => {
      if (notificationIds.includes(notification.id)) {
        notification.read = true;
      }
    });
  }

  // Send push notification (placeholder for actual push service)
  async sendPushNotification(userId, notification) {
    // In production, integrate with Firebase Cloud Messaging or similar
    console.log(`Push notification to ${userId}:`, notification);
    
    // Store for offline retrieval
    this.storeNotification(userId, notification);
    
    return { success: true };
  }
}

module.exports = NotificationService;