import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class AdminScreen extends StatefulWidget {
  @override
  _AdminScreenState createState() => _AdminScreenState();
}

class _AdminScreenState extends State<AdminScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  Map<String, dynamic>? adminData;
  bool isLoading = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadAdminData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadAdminData() async {
    setState(() => isLoading = true);
    try {
      final response = await http.get(Uri.parse('http://localhost:8080/admin/data'));
      if (response.statusCode == 200) {
        setState(() {
          adminData = json.decode(response.body);
          isLoading = false;
        });
      }
    } catch (e) {
      setState(() => isLoading = false);
      _showSnackBar('Error loading data: $e');
    }
  }

  void _showSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('🔧 Admin Panel'),
        automaticallyImplyLeading: false,
        actions: [
          IconButton(
            icon: Icon(Icons.refresh),
            onPressed: _loadAdminData,
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          tabs: [
            Tab(icon: Icon(Icons.dashboard), text: 'Stats'),
            Tab(icon: Icon(Icons.people), text: 'Users'),
            Tab(icon: Icon(Icons.work), text: 'Jobs'),
          ],
        ),
      ),
      body: isLoading
          ? Center(child: CircularProgressIndicator())
          : adminData == null
              ? Center(child: Text('No data available'))
              : TabBarView(
                  controller: _tabController,
                  children: [
                    _buildStatsTab(),
                    _buildUsersTab(),
                    _buildJobsTab(),
                  ],
                ),
    );
  }

  Widget _buildStatsTab() {
    final stats = adminData!['stats'];
    return Padding(
      padding: EdgeInsets.all(16),
      child: Column(
        children: [
          Card(
            child: Padding(
              padding: EdgeInsets.all(16),
              child: Column(
                children: [
                  Text('📊 System Statistics', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                  SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _buildStatCard('👥 Users', stats['totalUsers'].toString(), Colors.blue),
                      _buildStatCard('💼 Jobs', stats['totalJobs'].toString(), Colors.green),
                    ],
                  ),
                  SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _buildStatCard('🟢 Active', stats['activeJobs'].toString(), Colors.orange),
                      _buildStatCard('✅ Completed', stats['completedJobs'].toString(), Colors.purple),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(String title, String value, Color color) {
    return Container(
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        children: [
          Text(title, style: TextStyle(fontSize: 14, color: color)),
          SizedBox(height: 4),
          Text(value, style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: color)),
        ],
      ),
    );
  }

  Widget _buildUsersTab() {
    final users = adminData!['users'] as List;
    return ListView.builder(
      itemCount: users.length,
      itemBuilder: (context, index) {
        final user = users[index];
        return Card(
          margin: EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          child: ExpansionTile(
            title: Text(user['userId'] ?? 'Unknown'),
            subtitle: Text('Mode: ${user['currentMode']} • Status: ${user['employeeStatus'] ?? 'N/A'}'),
            children: [
              Padding(
                padding: EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Employee Ratings: 👍${user['employeeRatings']?['good'] ?? 0} 👌${user['employeeRatings']?['neutral'] ?? 0} 👎${user['employeeRatings']?['bad'] ?? 0}'),
                    Text('Employer Ratings: 👍${user['employerRatings']?['good'] ?? 0} 👌${user['employerRatings']?['neutral'] ?? 0} 👎${user['employerRatings']?['bad'] ?? 0}'),
                    SizedBox(height: 8),
                    Text('Raw Data:', style: TextStyle(fontWeight: FontWeight.bold)),
                    Container(
                      width: double.infinity,
                      padding: EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.grey[100],
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        JsonEncoder.withIndent('  ').convert(user),
                        style: TextStyle(fontSize: 10, fontFamily: 'monospace'),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildJobsTab() {
    final jobs = adminData!['jobs'] as List;
    return ListView.builder(
      itemCount: jobs.length,
      itemBuilder: (context, index) {
        final job = jobs[index];
        return Card(
          margin: EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          child: ExpansionTile(
            title: Text(job['title'] ?? 'No Title'),
            subtitle: Text('${job['status']} • ${job['district']} • HK\$${job['hourlyRate']}/hr'),
            children: [
              Padding(
                padding: EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Employer: ${job['employerId']}'),
                    Text('Selected Employee: ${job['selectedEmployeeId'] ?? 'None'}'),
                    Text('Applicants: ${job['matchingWindow']?['responses']?.length ?? 0}'),
                    SizedBox(height: 8),
                    Text('Raw Data:', style: TextStyle(fontWeight: FontWeight.bold)),
                    Container(
                      width: double.infinity,
                      padding: EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.grey[100],
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        JsonEncoder.withIndent('  ').convert(job),
                        style: TextStyle(fontSize: 10, fontFamily: 'monospace'),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}