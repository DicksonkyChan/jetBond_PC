import 'package:flutter/material.dart';
import 'services/api_service.dart';
import 'widgets/job_card.dart';
import 'utils/date_utils.dart' as AppDateUtils;

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
    return Card(
      margin: EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      elevation: 2,
      child: ListTile(
        leading: Icon(Icons.work, color: Colors.blue),
        title: Text(
          job['title'] ?? 'No Title',
          style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
        ),
        subtitle: Text('HK\$${job['hourlyRate']}/hr • ${job['district']}'),
        trailing: Text(
          '✅ ${AppDateUtils.DateUtils.formatDate(job['selectedAt'])}',
          style: TextStyle(fontSize: 12, color: Colors.blue),
        ),
        onTap: () {
          setState(() {
            final jobId = job['jobId']?.toString() ?? '';
            if (jobId.isNotEmpty) {
              expandedJobs.add(jobId);
            }
          });
        },
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
                            final isOld = _isOldJob(job['selectedAt']);
                            final jobId = job['jobId']?.toString() ?? '';
                            final isExpanded = expandedJobs.contains(jobId);
                            
                            if (isOld && !isExpanded) {
                              return _buildMinimizedJob(job);
                            }
                            
                            return JobCard(
                              job: job,
                              showStatus: false,
                              trailing: Container(
                                padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                decoration: BoxDecoration(
                                  color: Colors.blue.shade100,
                                  borderRadius: BorderRadius.circular(15),
                                ),
                                child: Text(
                                  '✅ HIRED ${AppDateUtils.DateUtils.formatFullDate(job['selectedAt'])}',
                                  style: TextStyle(
                                    color: Colors.blue.shade800,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 12,
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