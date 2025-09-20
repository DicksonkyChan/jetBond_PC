class DateUtils {
  static String formatDate(String? dateStr) {
    if (dateStr == null) return 'Unknown';
    try {
      final utcDate = DateTime.parse(dateStr);
      final localDate = utcDate.toLocal();
      return '${localDate.day}/${localDate.month}';
    } catch (e) {
      return 'Unknown';
    }
  }

  static String formatDateTime(String? dateStr) {
    if (dateStr == null) return 'Unknown';
    try {
      final utcDate = DateTime.parse(dateStr);
      final localDate = utcDate.toLocal();
      return '${localDate.day}/${localDate.month} ${localDate.hour}:${localDate.minute.toString().padLeft(2, '0')}';
    } catch (e) {
      return 'Unknown';
    }
  }

  static String formatFullDate(String? dateStr) {
    if (dateStr == null) return 'Unknown';
    try {
      final utcDate = DateTime.parse(dateStr);
      final localDate = utcDate.toLocal();
      return '${localDate.day}/${localDate.month}/${localDate.year}';
    } catch (e) {
      return 'Unknown';
    }
  }
}