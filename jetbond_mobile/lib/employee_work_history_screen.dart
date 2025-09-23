import 'package:flutter/material.dart';
import 'services/api_service.dart';
import 'widgets/job_card.dart';
import 'utils/date_utils.dart' as AppDateUtils;
import 'widgets/app_navigation_bar.dart';

class EmployeeWorkHistoryScreen extends StatefulWidget {
  final String employeeId;
  
  const EmployeeWorkHistoryScreen({super.key, required this.employeeId});

  @override
  _EmployeeWorkHistoryScreenState createState() => _EmployeeWorkHistoryScreenState();
}

class _EmployeeWorkHistoryScreenState extends State<EmployeeWorkHistoryScreen> {
  List<dynamic> workHistory = [];
  bool isLoading = false;
  Set<String> expandedJobs = {};
  bool allExpanded = false;

  @override
  void initState() {
    super.initState();
    _loadWorkHistory();
  }

  Future<void> _loadWorkHistory() async {
    setState(() => isLoading = true);
    try {
      final data = await ApiService.get('/employee/${widget.employeeId}/work-history');
      setState(() {
        workHistory = data['jobs'] ?? [];
        isLoading = false;
      });
    } catch (e) {
      setState(() => isLoading = false);
      _showSnackBar('Error loading work history: $e');
    }
  }

  bool _isOldJob(String? dateStr) {
    if (dateStr == null) return false;
    try {
      final jobDate = DateTime.parse(dateStr);
      final now = DateTime.now();
      final difference = now.difference(jobDate);
      return difference.inMinutes > 5;
    } catch (e) {
      return false;
    }
  }

  Widget _buildMinimizedJob(Map<String, dynamic> job) {
    final rating = job['rating'];
    return Card(
      margin: EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      elevation: 2,
      child: InkWell(
        onTap: () {
          setState(() {
            final jobId = job['jobId']?.toString() ?? '';
            if (jobId.isNotEmpty) {
              expandedJobs.add(jobId);
            }
          });
        },
        child: Padding(
          padding: EdgeInsets.all(12),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      job['title'] ?? 'No Title',
                      style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    SizedBox(height: 4),
                    Row(
                      children: [
                        Text('HK\$${job['hourlyRate']}/hr • ${job['district']}',
                            style: TextStyle(fontSize: 11, color: Colors.grey[600])),
                        if (rating != null) ...[
                          Text(' • ', style: TextStyle(fontSize: 11, color: Colors.grey[600])),
                          _buildRatingWidget(rating, small: true),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
              Text(
                AppDateUtils.DateUtils.formatDate(job['completedAt'] ?? job['selectedAt']),
                style: TextStyle(fontSize: 10, color: Colors.grey[600]),
              ),
              SizedBox(width: 8),
              Icon(Icons.expand_more, size: 16, color: Colors.grey),
            ],
          ),
        ),
      ),
    );
  }

  void _toggleAll() {
    setState(() {
      allExpanded = !allExpanded;
      if (allExpanded) {
        expandedJobs.addAll(workHistory
            .map((job) => job['jobId']?.toString() ?? '')
            .where((id) => id.isNotEmpty));
      } else {
        expandedJobs.clear();
      }
    });
  }

  Widget _buildRatingWidget(String rating, {bool small = false}) {
    IconData icon;
    Color color;
    String text;
    
    switch (rating) {
      case 'good':
        icon = Icons.thumb_up;
        color = Colors.green;
        text = 'Good';
        break;
      case 'bad':
        icon = Icons.thumb_down;
        color = Colors.red;
        text = 'Poor';
        break;
      default:
        icon = Icons.horizontal_rule;
        color = Colors.orange;
        text = 'Neutral';
    }
    
    if (small) {
      return Icon(icon, color: color, size: 14);
    }
    
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: color, size: 16),
          SizedBox(width: 4),
          Text(text, style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }

  void _showSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }



  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('📋 Work History'),
        automaticallyImplyLeading: false,
      ),
      body: RefreshIndicator(
        onRefresh: _loadWorkHistory,
        child: Column(
          children: [
            Container(
              width: double.infinity,
              padding: EdgeInsets.all(16),
              color: Colors.green.shade50,
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Jobs Successfully Completed',
                            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                          ),
                          Text(
                            '${workHistory.length} jobs completed',
                            style: TextStyle(color: Colors.grey[600]),
                          ),
                        ],
                      ),
                      if (workHistory.isNotEmpty)
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
                  : workHistory.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.work_off, size: 64, color: Colors.grey),
                              SizedBox(height: 16),
                              Text('No completed jobs yet'),
                              SizedBox(height: 8),
                              Text('Apply to jobs to build your work history!'),
                            ],
                          ),
                        )
                      : ListView.builder(
                          itemCount: workHistory.length,
                          itemBuilder: (context, index) {
                            final job = workHistory[index];
                            final isOld = _isOldJob(job['completedAt'] ?? job['selectedAt']);
                            final jobId = job['jobId']?.toString() ?? '';
                            final isExpanded = expandedJobs.contains(jobId);
                            
                            if (isOld && !isExpanded) {
                              return _buildMinimizedJob(job);
                            }
                            
                            return Column(
                              children: [
                                JobCard(
                                  job: job,
                                  showStatus: true,
                                  trailing: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      if (isOld)
                                        IconButton(
                                          icon: Icon(Icons.expand_less),
                                          onPressed: () {
                                            setState(() {
                                              final jobId = job['jobId']?.toString() ?? '';
                                              if (jobId.isNotEmpty) {
                                                expandedJobs.remove(jobId);
                                              }
                                            });
                                          },
                                        ),
                                    ],
                                  ),
                                ),
                                Container(
                                  margin: EdgeInsets.symmetric(horizontal: 16),
                                  padding: EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: Colors.blue.shade50,
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Container(
                                        padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                        decoration: BoxDecoration(
                                          color: Colors.blue.shade100,
                                          borderRadius: BorderRadius.circular(15),
                                        ),
                                        child: Text(
                                          '✅ COMPLETED ${AppDateUtils.DateUtils.formatFullDate(job['completedAt'] ?? job['selectedAt'])}',
                                          style: TextStyle(
                                            color: Colors.green.shade800,
                                            fontWeight: FontWeight.bold,
                                            fontSize: 12,
                                          ),
                                        ),
                                      ),
                                      if (job['rating'] != null)
                                        _buildRatingWidget(job['rating']),
                                    ],
                                  ),
                                ),
                                SizedBox(height: 8),
                              ],
                            );
                          },
                        ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: AppNavigationBar(currentIndex: 1),
    );
  }
}