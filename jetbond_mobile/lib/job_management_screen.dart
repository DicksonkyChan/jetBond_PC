import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'services/notification_service.dart';
import 'main.dart';
import 'widgets/app_navigation_bar.dart';

class JobManagementScreen extends StatefulWidget {
  @override
  _JobManagementScreenState createState() => _JobManagementScreenState();
}

class _JobManagementScreenState extends State<JobManagementScreen> {
  List<dynamic> assignedJobs = [];
  bool isLoading = false;
  Map<String, String> jobRatings = {}; // Track ratings for jobs

  @override
  void initState() {
    super.initState();
    _loadAssignedJobs();
  }

  Future<void> _loadAssignedJobs() async {
    setState(() => isLoading = true);
    try {
      final response = await http.get(
        Uri.parse('http://localhost:8080/jobs?employerId=${UserService.currentUserId}'),
      );
      
      if (response.statusCode == 200) {
        final allJobs = json.decode(response.body) as List;
        setState(() {
          // Show jobs that have been assigned to employees (hired)
          assignedJobs = allJobs.where((job) => 
            job['status'] == 'assigned' && job['selectedEmployeeId'] != null
          ).toList();
          isLoading = false;
        });
      }
    } catch (e) {
      setState(() => isLoading = false);
      _showSnackBar('Error loading jobs: $e');
    }
  }

  Future<void> _completeJob(String jobId) async {
    // Check if job has been rated
    if (!jobRatings.containsKey(jobId)) {
      _showSnackBar('⚠️ Please rate the employee before completing the job');
      return;
    }

    try {
      final response = await http.put(
        Uri.parse('http://localhost:8080/jobs/$jobId/complete'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'rating': jobRatings[jobId],
        }),
      );

      if (response.statusCode == 200) {
        _showSnackBar('✅ Job marked as completed');
        jobRatings.remove(jobId); // Clean up
        _loadAssignedJobs();
      } else {
        _showSnackBar('Failed to complete job');
      }
    } catch (e) {
      _showSnackBar('Error completing job: $e');
    }
  }

  Future<void> _rateEmployee(String jobId, String employeeId, String employeeName) async {
    String? selectedRating;
    
    await showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Rate $employeeName'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('How was this employee\'s performance?'),
            SizedBox(height: 16),
            ...['good', 'neutral', 'bad'].map((rating) => 
              RadioListTile<String>(
                title: Text(_getRatingText(rating)),
                value: rating,
                groupValue: selectedRating,
                onChanged: (value) {
                  selectedRating = value;
                  Navigator.pop(context);
                  _submitRating(jobId, employeeId, rating);
                },
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Cancel'),
          ),
        ],
      ),
    );
  }

  Future<void> _submitRating(String jobId, String employeeId, String rating) async {
    setState(() {
      jobRatings[jobId] = rating; // Store rating for completion
    });
    _showSnackBar('✅ Rating selected. You can now complete the job.');
  }

  String _getRatingText(String rating) {
    switch (rating) {
      case 'good': return '👍 Good Performance';
      case 'neutral': return '👌 Average Performance';
      case 'bad': return '👎 Poor Performance';
      default: return rating;
    }
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
        title: Text('👥 Job Management'),
        automaticallyImplyLeading: false,
        actions: [
          IconButton(
            icon: Icon(Icons.refresh),
            onPressed: _loadAssignedJobs,
          ),
        ],
      ),
      body: isLoading
          ? Center(child: CircularProgressIndicator())
          : assignedJobs.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.work_off, size: 64, color: Colors.grey),
                      SizedBox(height: 16),
                      Text('No hired employees to manage'),
                      SizedBox(height: 8),
                      ElevatedButton(
                        onPressed: _loadAssignedJobs,
                        child: Text('Refresh'),
                      ),
                    ],
                  ),
                )
              : ListView.builder(
                  itemCount: assignedJobs.length,
                  itemBuilder: (context, index) {
                    final job = assignedJobs[index];
                    return Card(
                      margin: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      elevation: 4,
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
                                    style: TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                                Container(
                                  padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                  decoration: BoxDecoration(
                                    color: Colors.orange,
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: Text(
                                    'IN PROGRESS',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 12,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            SizedBox(height: 8),
                            Text(
                              'Employee: ${job['selectedEmployeeId'] ?? 'Unknown'}',
                              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
                            ),
                            SizedBox(height: 8),
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
                            SizedBox(height: 8),
                            Text(
                              'Selected: ${_formatDate(job['selectedAt'])}',
                              style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                            ),
                            SizedBox(height: 16),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                              children: [
                                Expanded(
                                  child: ElevatedButton.icon(
                                    onPressed: jobRatings.containsKey(job['jobId']) ? null : () => _rateEmployee(
                                      job['jobId'],
                                      job['selectedEmployeeId'],
                                      job['selectedEmployeeId'],
                                    ),
                                    icon: Icon(Icons.star),
                                    label: Text(jobRatings.containsKey(job['jobId']) ? 'Rated ✓' : 'Rate Employee'),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: jobRatings.containsKey(job['jobId']) ? Colors.grey : Colors.blue,
                                      foregroundColor: Colors.white,
                                    ),
                                  ),
                                ),
                                SizedBox(width: 8),
                                Expanded(
                                  child: ElevatedButton.icon(
                                    onPressed: () => _completeJob(job['jobId']),
                                    icon: Icon(Icons.check_circle),
                                    label: Text('Complete Job'),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: jobRatings.containsKey(job['jobId']) ? Colors.green : Colors.grey,
                                      foregroundColor: Colors.white,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
      bottomNavigationBar: EmployerNavigationBar(currentIndex: 1),
    );
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null) return 'Unknown';
    try {
      final utcDate = DateTime.parse(dateStr);
      final localDate = utcDate.toLocal();
      return '${localDate.day}/${localDate.month} ${localDate.hour}:${localDate.minute.toString().padLeft(2, '0')}';
    } catch (e) {
      return 'Unknown';
    }
  }
}

