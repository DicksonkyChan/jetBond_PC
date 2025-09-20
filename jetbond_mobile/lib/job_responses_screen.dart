import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class JobResponsesScreen extends StatefulWidget {
  final Map<String, dynamic> job;

  const JobResponsesScreen({Key? key, required this.job}) : super(key: key);

  @override
  _JobResponsesScreenState createState() => _JobResponsesScreenState();
}

class _JobResponsesScreenState extends State<JobResponsesScreen> {
  List<dynamic> candidates = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadCandidates();
  }

  Future<void> _loadCandidates() async {
    setState(() => isLoading = true);
    
    try {
      final responses = widget.job['matchingWindow']?['responses'] ?? [];
      List<dynamic> candidateList = [];
      
      for (var response in responses) {
        final employeeId = response['employeeId'];
        final userResponse = await http.get(
          Uri.parse('http://localhost:8080/users/$employeeId'),
        );
        
        if (userResponse.statusCode == 200) {
          final userData = json.decode(userResponse.body);
          candidateList.add({
            ...userData,
            'appliedAt': response['respondedAt'],
          });
        }
      }
      
      setState(() {
        candidates = candidateList;
        isLoading = false;
      });
    } catch (e) {
      setState(() => isLoading = false);
      _showSnackBar('Error loading candidates: $e');
    }
  }

  Future<void> _selectCandidate(String employeeId) async {
    try {
      final response = await http.post(
        Uri.parse('http://localhost:8080/jobs/${widget.job['jobId']}/select'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'selectedEmployeeId': employeeId}),
      );

      if (response.statusCode == 200) {
        _showSnackBar('✅ Candidate selected successfully!');
        Navigator.pop(context);
      } else {
        _showSnackBar('Failed to select candidate');
      }
    } catch (e) {
      _showSnackBar('Error selecting candidate: $e');
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
        title: Text('Job Responses'),
      ),
      body: Column(
        children: [
          // Job Info
          Container(
            width: double.infinity,
            padding: EdgeInsets.all(16),
            color: Colors.blue.shade50,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.job['title'] ?? 'Job Title',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
                Text('${candidates.length} candidates applied'),
                Text('Rate: HK\$${widget.job['hourlyRate']}/hr'),
              ],
            ),
          ),
          
          // Candidates List
          Expanded(
            child: isLoading
                ? Center(child: CircularProgressIndicator())
                : candidates.isEmpty
                    ? Center(child: Text('No candidates yet'))
                    : ListView.builder(
                        itemCount: candidates.length,
                        itemBuilder: (context, index) {
                          final candidate = candidates[index];
                          final profile = candidate['profiles']?['employee'];
                          
                          return Card(
                            margin: EdgeInsets.all(16),
                            child: Padding(
                              padding: EdgeInsets.all(16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        profile?['name'] ?? 'Unknown',
                                        style: TextStyle(
                                          fontSize: 18,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                      Container(
                                        padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                        decoration: BoxDecoration(
                                          color: Colors.green,
                                          borderRadius: BorderRadius.circular(20),
                                        ),
                                        child: Text(
                                          'HK\$${profile?['hourlyRateRange']?['min']}-${profile?['hourlyRateRange']?['max']}',
                                          style: TextStyle(color: Colors.white),
                                        ),
                                      ),
                                    ],
                                  ),
                                  SizedBox(height: 8),
                                  Text(
                                    profile?['jobDescription'] ?? 'No description',
                                    style: TextStyle(fontSize: 14),
                                  ),
                                  SizedBox(height: 8),
                                  Text(
                                    'Districts: ${profile?['preferredDistricts']?.join(', ') ?? 'None'}',
                                    style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                                  ),
                                  SizedBox(height: 8),
                                  Text(
                                    'Applied: ${_formatDate(candidate['appliedAt'])}',
                                    style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                                  ),
                                  SizedBox(height: 16),
                                  Row(
                                    children: [
                                      Expanded(
                                        child: ElevatedButton(
                                          onPressed: () => _selectCandidate(candidate['userId']),
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor: Colors.green,
                                          ),
                                          child: Text(
                                            'Select This Candidate',
                                            style: TextStyle(color: Colors.white),
                                          ),
                                        ),
                                      ),
                                      SizedBox(width: 16),
                                      ElevatedButton(
                                        onPressed: () {
                                          // TODO: Open chat
                                          _showSnackBar('Chat feature coming soon!');
                                        },
                                        child: Text('Chat'),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null) return 'Unknown';
    try {
      final date = DateTime.parse(dateStr);
      return '${date.day}/${date.month} ${date.hour}:${date.minute.toString().padLeft(2, '0')}';
    } catch (e) {
      return 'Unknown';
    }
  }
}