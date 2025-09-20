import 'package:flutter/material.dart';

class JobCard extends StatelessWidget {
  final Map<String, dynamic> job;
  final Widget? trailing;
  final VoidCallback? onTap;
  final bool showStatus;

  const JobCard({
    super.key,
    required this.job,
    this.trailing,
    this.onTap,
    this.showStatus = true,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      elevation: 4,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      job['title'] ?? 'No Title',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                  ),
                  Container(
                    padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.green,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      'HK\$${job['hourlyRate']}/hr',
                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
              SizedBox(height: 8),
              Text(
                job['description'] ?? 'No Description',
                style: TextStyle(fontSize: 14),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              SizedBox(height: 12),
              Row(
                children: [
                  Icon(Icons.location_on, size: 16, color: Colors.grey[600]),
                  Text(' ${job['district']} • '),
                  Icon(Icons.access_time, size: 16, color: Colors.grey[600]),
                  Text(' ${job['duration']} • '),
                  Icon(Icons.calendar_today, size: 16, color: Colors.grey[600]),
                  Text(' ${_formatDate(job['createdAt'])}'),
                ],
              ),
              if (showStatus || trailing != null) ...[
                SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    if (showStatus)
                      Text(
                        'Status: ${job['status']?.toUpperCase() ?? 'UNKNOWN'}',
                        style: TextStyle(
                          color: _getStatusColor(job['status']),
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    if (trailing != null) trailing!,
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null) return 'Unknown';
    try {
      final utcDate = DateTime.parse(dateStr);
      final localDate = utcDate.toLocal();
      return '${localDate.day}/${localDate.month}';
    } catch (e) {
      return 'Unknown';
    }
  }

  Color _getStatusColor(String? status) {
    switch (status) {
      case 'matching': return Colors.green;
      case 'assigned': return Colors.orange;
      case 'completed': return Colors.blue;
      case 'cancelled': return Colors.red;
      case 'expired': return Colors.grey;
      default: return Colors.grey;
    }
  }
}