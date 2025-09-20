import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'utils/logger.dart';
import 'main.dart';

class JobHistoryScreen extends StatefulWidget {
  const JobHistoryScreen({super.key});

  @override
  _JobHistoryScreenState createState() => _JobHistoryScreenState();
}

class _JobHistoryScreenState extends State<JobHistoryScreen> {
  List<dynamic> jobHistory = [];
  bool isLoading = false;
  Set<String> expandedJobs = {};
  bool allExpanded = false;

  @override
  void initState() {
    super.initState();
    _loadJobHistory();
  }

  Future<void> _loadJobHistory() async {
    setState(() => isLoading = true);
    try {
      final userId = UserService.currentUserId;
      print('🔍 Job History: Loading for user: $userId');
      AppLogger.logApiCall('GET', '/jobs?employerId=$userId');
      final response = await http.get(
        Uri.parse('http://localhost:8080/jobs?employerId=$userId'),
      );
      
      print('📡 Job History Response: ${response.statusCode}');
      print('📡 Job History Body: ${response.body}');
      
      if (response.statusCode == 200) {
        final jobs = json.decode(response.body) as List;
        print('📊 Job History: Found ${jobs.length} total jobs');
        
        setState(() {
          jobHistory = jobs..sort((a, b) => 
            DateTime.parse(b['createdAt']).compareTo(DateTime.parse(a['createdAt']))
          );
          isLoading = false;
        });
        
        // Debug: Print each job
        for (var job in jobs) {
          print('📋 Job History: ${job['title']} (${job['status']}) - ${job['createdAt']}');
        }
        
        AppLogger.log('Loaded ${jobs.length} jobs in history');
      }
    } catch (e) {
      print('❌ Job History Error: $e');
      setState(() => isLoading = false);
      AppLogger.logError('Error loading job history: $e');
      _showSnackBar('Error loading job history: $e');
    }
  }

  void _showSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }

  Color _getStatusColor(String? status) {
    switch (status) {
      case 'matching': return Colors.green;
      case 'assigned': return Colors.blue;
      case 'completed': return Colors.purple;
      case 'cancelled': return Colors.red;
      case 'expired': return Colors.orange;
      default: return Colors.grey;
    }
  }

  IconData _getStatusIcon(String? status) {
    switch (status) {
      case 'matching': return Icons.search;
      case 'assigned': return Icons.check_circle;
      case 'completed': return Icons.done_all;
      case 'cancelled': return Icons.cancel;
      case 'expired': return Icons.access_time;
      default: return Icons.help;
    }
  }

  String _getStatusText(String? status) {
    switch (status) {
      case 'matching': return 'Active';
      case 'assigned': return 'Hired Successfully';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      case 'expired': return 'Expired';
      default: return 'Unknown';
    }
  }

  bool _isOldJob(Map<String, dynamic> job) {
    try {
      final createdAt = DateTime.parse(job['createdAt']);
      final now = DateTime.now();
      final ageInMinutes = now.difference(createdAt).inMinutes;
      print('🕐 Job "${job['title']}" age: $ageInMinutes minutes (created: $createdAt)');
      return ageInMinutes > 5; // Changed from 1 hour to 5 minutes for testing
    } catch (e) {
      print('❌ Error parsing date for job: $e');
      return false;
    }
  }

  void _toggleJobExpansion(String jobId) {
    setState(() {
      if (expandedJobs.contains(jobId)) {
        expandedJobs.remove(jobId);
      } else {
        expandedJobs.add(jobId);
      }
    });
  }

  void _toggleAll() {
    setState(() {
      if (allExpanded) {
        expandedJobs.clear();
        allExpanded = false;
      } else {
        for (var job in jobHistory) {
          expandedJobs.add(job['jobId']);
        }
        allExpanded = true;
      }
    });
  }

  Widget _buildMinimizedJob(Map<String, dynamic> job, int responseCount) {
    return Row(
      children: [
        Expanded(
          child: Text(
            job['title'] ?? 'No Title',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
        Container(
          padding: EdgeInsets.symmetric(horizontal: 8, vertical: 2),
          decoration: BoxDecoration(
            color: _getStatusColor(job['status']),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Text(
            _getStatusText(job['status']),
            style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
          ),
        ),
        if (responseCount > 0)
          Container(
            margin: EdgeInsets.only(left: 8),
            padding: EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(
              color: Colors.orange,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text(
              '$responseCount',
              style: TextStyle(color: Colors.white, fontSize: 10),
            ),
          ),
        Icon(Icons.expand_more, size: 16, color: Colors.grey),
      ],
    );
  }

  Widget _buildExpandedJob(Map<String, dynamic> job, int responseCount, bool isExpanded) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Text(
                job['title'] ?? 'No Title',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            Row(
              children: [
                Container(
                  padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: _getStatusColor(job['status']),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        _getStatusIcon(job['status']),
                        color: Colors.white,
                        size: 16,
                      ),
                      SizedBox(width: 4),
                      Text(
                        _getStatusText(job['status']),
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
                if (isExpanded)
                  IconButton(
                    icon: Icon(Icons.expand_less),
                    onPressed: () => _toggleJobExpansion(job['jobId']),
                  ),
              ],
            ),
          ],
        ),
        SizedBox(height: 8),
        Text(
          job['description'] ?? 'No Description',
          style: TextStyle(fontSize: 14),
        ),
        SizedBox(height: 12),
        Row(
          children: [
            Icon(Icons.location_on, size: 16, color: Colors.grey[600]),
            Text(' ${job['district']} • '),
            Icon(Icons.attach_money, size: 16, color: Colors.grey[600]),
            Text(' HK\$${job['hourlyRate']}/hr • '),
            Icon(Icons.access_time, size: 16, color: Colors.grey[600]),
            Text(' ${job['duration']}'),
          ],
        ),
        SizedBox(height: 12),
        
        // Timeline
        Container(
          padding: EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.grey.shade50,
            borderRadius: BorderRadius.circular(8),
          ),
          child: _buildStatusTimeline(job),
        ),
        
        if (responseCount > 0) ...[
          SizedBox(height: 12),
          Container(
            padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.blue.shade100,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              '$responseCount Application${responseCount > 1 ? 's' : ''} Received',
              style: TextStyle(
                color: Colors.blue.shade800,
                fontWeight: FontWeight.bold,
                fontSize: 12,
              ),
            ),
          ),
        ],
        
        if (job['selectedEmployeeId'] != null) ...[
          SizedBox(height: 8),
          Container(
            padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.green.shade100,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              'Hired: ${job['selectedEmployeeId']}',
              style: TextStyle(
                color: Colors.green.shade800,
                fontWeight: FontWeight.bold,
                fontSize: 12,
              ),
            ),
          ),
        ],
      ],
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

  String _formatDateTime(String? dateStr) {
    if (dateStr == null) return 'Unknown';
    try {
      final utcDate = DateTime.parse(dateStr);
      final localDate = utcDate.toLocal(); // Convert UTC to local time
      return '${localDate.day}/${localDate.month}/${localDate.year} ${localDate.hour.toString().padLeft(2, '0')}:${localDate.minute.toString().padLeft(2, '0')}';
    } catch (e) {
      return 'Unknown';
    }
  }

  Widget _buildStatusTimeline(Map<String, dynamic> job) {
    final status = job['status'];
    final createdAt = job['createdAt'];
    final selectedAt = job['selectedAt'];
    final cancelledAt = job['cancelledAt'];
    final expiredAt = job['expiredAt'];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Created
        Row(
          children: [
            Icon(Icons.add_circle, color: Colors.blue, size: 16),
            SizedBox(width: 8),
            Text('Created: ${_formatDateTime(createdAt)}', style: TextStyle(fontSize: 12)),
          ],
        ),
        
        // Status-specific timeline
        if (status == 'assigned' && selectedAt != null) ...[
          SizedBox(height: 4),
          Row(
            children: [
              Icon(Icons.check_circle, color: Colors.green, size: 16),
              SizedBox(width: 8),
              Text('Hired: ${_formatDateTime(selectedAt)}', style: TextStyle(fontSize: 12, color: Colors.green)),
            ],
          ),
        ],
        
        if (status == 'cancelled' && cancelledAt != null) ...[
          SizedBox(height: 4),
          Row(
            children: [
              Icon(Icons.cancel, color: Colors.red, size: 16),
              SizedBox(width: 8),
              Text('Cancelled: ${_formatDateTime(cancelledAt)}', style: TextStyle(fontSize: 12, color: Colors.red)),
            ],
          ),
        ],
        
        if (status == 'expired' && expiredAt != null) ...[
          SizedBox(height: 4),
          Row(
            children: [
              Icon(Icons.access_time, color: Colors.orange, size: 16),
              SizedBox(width: 8),
              Text('Expired: ${_formatDateTime(expiredAt)}', style: TextStyle(fontSize: 12, color: Colors.orange)),
            ],
          ),
        ],
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('📋 Job History'),
        actions: [
          IconButton(
            icon: Icon(Icons.refresh),
            onPressed: _loadJobHistory,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadJobHistory,
        child: Column(
          children: [
            Container(
              width: double.infinity,
              padding: EdgeInsets.all(16),
              color: Colors.blue.shade50,
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Job Posting History',
                            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                          ),
                          Text(
                            '${jobHistory.length} jobs posted',
                            style: TextStyle(color: Colors.grey[600]),
                          ),
                        ],
                      ),
                      if (jobHistory.isNotEmpty)
                        IconButton(
                          onPressed: _toggleAll,
                          icon: Icon(allExpanded ? Icons.expand_less : Icons.expand_more),
                          tooltip: allExpanded ? 'Minimize All' : 'Expand All',
                        ),
                    ],
                  ),
                ],
              ),
            ),
            
            Expanded(
              child: isLoading
                  ? Center(child: CircularProgressIndicator())
                  : jobHistory.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.history, size: 64, color: Colors.grey),
                              SizedBox(height: 16),
                              Text('No job history yet'),
                              SizedBox(height: 8),
                              ElevatedButton(
                                onPressed: () => Navigator.pushNamed(context, '/post-job'),
                                child: Text('Post Your First Job'),
                              ),
                            ],
                          ),
                        )
                      : ListView.builder(
                          itemCount: jobHistory.length,
                          itemBuilder: (context, index) {
                            final job = jobHistory[index];
                            final responseCount = job['matchingWindow']?['responses']?.length ?? 0;
                            final isExpanded = expandedJobs.contains(job['jobId']);
                            final isOld = _isOldJob(job);
                            
                            return Card(
                              margin: EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                              elevation: isOld && !isExpanded ? 2 : 4,
                              child: InkWell(
                                onTap: isOld ? () => _toggleJobExpansion(job['jobId']) : null,
                                child: Tooltip(
                                  message: isOld && !isExpanded ? 'Posted ${_formatDate(job['createdAt'])} • ${job['district']} • HK\$${job['hourlyRate']}/hr' : '',
                                  child: Padding(
                                    padding: EdgeInsets.all(isOld && !isExpanded ? 12 : 16),
                                    child: isOld && !isExpanded
                                        ? _buildMinimizedJob(job, responseCount)
                                        : _buildExpandedJob(job, responseCount, isExpanded),
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
            ),
          ],
        ),
      ),
    );
  }
}

