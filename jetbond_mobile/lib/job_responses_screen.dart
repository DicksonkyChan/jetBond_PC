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
  List<dynamic> aiRankedCandidates = [];
  bool isLoading = true;
  bool isAIRanking = false;
  bool showAIRanking = false;

  @override
  void initState() {
    super.initState();
    _loadCandidates();
  }

  Future<void> _loadCandidates() async {
    setState(() => isLoading = true);
    
    try {
      final response = await http.get(
        Uri.parse('http://localhost:8080/jobs/${widget.job['jobId']}/applicants'),
      );
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        setState(() {
          candidates = data['applicants'] ?? [];
          isLoading = false;
        });
      } else {
        throw Exception('Failed to load applicants');
      }
    } catch (e) {
      setState(() => isLoading = false);
      _showSnackBar('Error loading candidates: $e');
    }
  }

  Future<void> _getAIRanking() async {
    if (candidates.isEmpty) {
      _showSnackBar('No applicants to rank');
      return;
    }

    setState(() => isAIRanking = true);
    
    try {
      final response = await http.post(
        Uri.parse('http://localhost:8080/jobs/${widget.job['jobId']}/ai-rank-applicants'),
        headers: {'Content-Type': 'application/json'},
      );
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        setState(() {
          aiRankedCandidates = data['rankedApplicants'] ?? [];
          showAIRanking = true;
          isAIRanking = false;
        });
        _showSnackBar('🤖 AI ranking complete!');
      } else {
        throw Exception('Failed to get AI ranking');
      }
    } catch (e) {
      setState(() => isAIRanking = false);
      _showSnackBar('AI ranking failed: $e');
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
                SizedBox(height: 12),
                Row(
                  children: [
                    ElevatedButton.icon(
                      onPressed: isAIRanking ? null : _getAIRanking,
                      icon: isAIRanking 
                        ? SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                        : Icon(Icons.psychology),
                      label: Text(isAIRanking ? 'AI Ranking...' : 'Get AI Recommendations'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.purple,
                        foregroundColor: Colors.white,
                      ),
                    ),
                    SizedBox(width: 8),
                    if (showAIRanking)
                      TextButton(
                        onPressed: () => setState(() => showAIRanking = !showAIRanking),
                        child: Text(showAIRanking ? 'Show Original Order' : 'Show AI Ranking'),
                      ),
                  ],
                ),
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
                        itemCount: showAIRanking ? aiRankedCandidates.length : candidates.length,
                        itemBuilder: (context, index) {
                          final candidate = showAIRanking ? aiRankedCandidates[index] : candidates[index];
                          final profile = candidate['profile'] ?? candidate['profiles']?['employee'];
                          
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
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              profile?['name'] ?? 'Unknown',
                                              style: TextStyle(
                                                fontSize: 18,
                                                fontWeight: FontWeight.bold,
                                              ),
                                            ),
                                            if (showAIRanking && candidate['matchScore'] != null)
                                              Container(
                                                margin: EdgeInsets.only(top: 4),
                                                padding: EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                                decoration: BoxDecoration(
                                                  color: Colors.purple.shade100,
                                                  borderRadius: BorderRadius.circular(12),
                                                ),
                                                child: Text(
                                                  '🤖 ${candidate['matchScore']}% AI Match',
                                                  style: TextStyle(fontSize: 12, color: Colors.purple.shade700),
                                                ),
                                              ),
                                          ],
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
                                    'Applied: ${_formatDate(candidate['appliedAt'] ?? candidate['respondedAt'])}',
                                    style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                                  ),
                                  if (showAIRanking && candidate['reasoning'] != null) ..[
                                    SizedBox(height: 8),
                                    Container(
                                      padding: EdgeInsets.all(8),
                                      decoration: BoxDecoration(
                                        color: Colors.purple.shade50,
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            '🤖 AI Analysis:',
                                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                                          ),
                                          Text(
                                            candidate['reasoning'] ?? '',
                                            style: TextStyle(fontSize: 12),
                                          ),
                                          if (candidate['strengths'] != null && candidate['strengths'].isNotEmpty)
                                            Text(
                                              '✅ Strengths: ${candidate['strengths'].join(', ')}',
                                              style: TextStyle(fontSize: 11, color: Colors.green.shade700),
                                            ),
                                        ],
                                      ),
                                    ),
                                  ],
                                  SizedBox(height: 16),
                                  Row(
                                    children: [
                                      Expanded(
                                        child: ElevatedButton(
                                          onPressed: () => _selectCandidate(candidate['employeeId'] ?? candidate['userId']),
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