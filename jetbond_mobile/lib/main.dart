import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:async';
import 'utils/logger.dart';
import 'job_history_screen.dart';
import 'employee_work_history_screen.dart';
import 'services/api_service.dart';
import 'widgets/job_card.dart';
import 'utils/date_utils.dart';
import 'services/notification_service.dart';
import 'notifications_screen.dart';
import 'job_management_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await AppLogger.init();
  AppLogger.log('🚀 JetBond app starting');
  runApp(JetBondApp());
}

class JetBondApp extends StatelessWidget {
  const JetBondApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'JetBond - Gig Marketplace',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        visualDensity: VisualDensity.adaptivePlatformDensity,
      ),
      home: LoginScreen(),
      routes: {
        '/employee-dashboard': (context) => EmployeeDashboard(),
        '/employer-dashboard': (context) => EmployerDashboard(),
        '/profile': (context) => ProfileScreen(),
        '/post-job': (context) => PostJobScreen(),
        '/job-detail': (context) => JobDetailScreen(),
        '/job-history': (context) => JobHistoryScreen(),
        '/employee-work-history': (context) => EmployeeWorkHistoryScreen(employeeId: UserService.currentUserId ?? ''),
        '/notifications': (context) => NotificationsScreen(),
        '/job-management': (context) => JobManagementScreen(),
      },
    );
  }
}

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  _LoginScreenState createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;

  final Map<String, Map<String, String>> _accounts = {
    'rikke@jetbond.com': {
      'password': '1234',
      'name': 'Rikke Hansen',
      'userId': 'rikke@jetbond.com',
      'type': 'employee'
    },
    'dee@jetbond.com': {
      'password': '1234', 
      'name': 'Dee Wong',
      'userId': 'dee@jetbond.com',
      'type': 'employer'
    }
  };

  Future<void> _login() async {
    AppLogger.logUserAction('Login attempt', data: {'email': _emailController.text});
    
    if (_emailController.text.isEmpty || _passwordController.text.isEmpty) {
      AppLogger.logError('Login failed - empty fields');
      _showSnackBar('Please fill in all fields');
      return;
    }

    setState(() => _isLoading = true);

    final email = _emailController.text.toLowerCase();
    final password = _passwordController.text;
    
    final account = _accounts[email];
    if (account != null && account['password'] == password) {
      AppLogger.logLogin(account['userId']!);
      UserService.setCurrentUser(account['userId']!, account['type']!);
      
      // Connect to notifications
      NotificationService.connect(account['userId']!);
      
      // Load existing profile from server
      try {
        AppLogger.logApiCall('GET', '/users/${account['userId']!}');
        final response = await http.get(
          Uri.parse('http://localhost:8080/users/${account['userId']!}'),
        );
        
        if (response.statusCode == 200) {
          final userData = json.decode(response.body);
          final employeeProfile = userData['profiles']?['employee'];
          final employerProfile = userData['profiles']?['employer'];
          
          if (employeeProfile != null || employerProfile != null) {
            // Use saved profile data
            UserService.updateProfile(
              employeeProfile?['name'] ?? employerProfile?['name'] ?? account['name']!,
              employerProfile?['companyName'] ?? '',
              employeeProfile?['jobDescription'] ?? ''
            );
            
            // Store additional profile data
            UserService.setProfileData(userData['profiles']);
          } else {
            // Use hardcoded defaults only if no saved data
            UserService.updateProfile(account['name']!, '', 'Experienced user');
          }
        } else {
          // Use hardcoded defaults if user not found
          UserService.updateProfile(account['name']!, '', 'Experienced user');
        }
      } catch (e) {
        // Use hardcoded defaults if server error
        UserService.updateProfile(account['name']!, '', 'Experienced user');
      }
      
      final route = account['type'] == 'employee' ? '/employee-dashboard' : '/employer-dashboard';
      AppLogger.logNavigation('LoginScreen', route);
      Navigator.pushReplacementNamed(context, route);
    } else {
      AppLogger.logError('Login failed - invalid credentials', context: 'LoginScreen');
      _showSnackBar('Invalid email or password');
    }
    
    setState(() => _isLoading = false);
  }

  void _showSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Colors.blue.shade400, Colors.blue.shade800],
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  '🚀 JetBond',
                  style: TextStyle(
                    fontSize: 48,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                SizedBox(height: 16),
                Text(
                  'Real-time Gig Marketplace',
                  style: TextStyle(
                    fontSize: 18,
                    color: Colors.white70,
                  ),
                ),
                SizedBox(height: 48),
                
                Card(
                  elevation: 8,
                  child: Padding(
                    padding: EdgeInsets.all(24.0),
                    child: Column(
                      children: [
                        Text(
                          'Login to JetBond',
                          style: TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        SizedBox(height: 24),
                        
                        SizedBox(height: 16),
                        TextField(
                          controller: _emailController,
                          decoration: InputDecoration(
                            labelText: 'Email',
                            hintText: 'rikke@jetbond.com or dee@jetbond.com',
                            border: OutlineInputBorder(),
                            prefixIcon: Icon(Icons.email),
                          ),
                          keyboardType: TextInputType.emailAddress,
                        ),
                        SizedBox(height: 16),
                        TextField(
                          controller: _passwordController,
                          decoration: InputDecoration(
                            labelText: 'Password',
                            hintText: '1234',
                            border: OutlineInputBorder(),
                            prefixIcon: Icon(Icons.lock),
                          ),
                          obscureText: true,
                        ),
                        SizedBox(height: 24),
                        
                        SizedBox(
                          width: double.infinity,
                          height: 50,
                          child: ElevatedButton(
                            onPressed: _isLoading ? null : _login,
                            child: _isLoading
                                ? CircularProgressIndicator(color: Colors.white)
                                : Text(
                                    'Login',
                                    style: TextStyle(fontSize: 16),
                                  ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class EmployeeDashboard extends StatefulWidget {
  const EmployeeDashboard({super.key});

  @override
  _EmployeeDashboardState createState() => _EmployeeDashboardState();
}

class _EmployeeDashboardState extends State<EmployeeDashboard> {
  List<dynamic> jobs = [];
  List<dynamic> myApplications = [];
  Set<String> appliedJobs = {};
  String? activeApplicationJobId;
  Map<String, dynamic>? currentJob;
  bool isLoading = false;
  Timer? _refreshTimer;

  @override
  void initState() {
    super.initState();
    _loadJobs();
    _startAutoRefresh();
    NotificationService.addListener(_onNotification);
  }

  void _onNotification(Map<String, dynamic> notification) {
    if (mounted) {
      NotificationService.showNotificationSnackBar(context, notification);
      if (notification['type'] == 'job_match') {
        _loadJobs(); // Refresh jobs when new matches arrive
      } else if (notification['type'] == 'selection_result' || notification['type'] == 'job_completed') {
        _loadJobs(); // Refresh to update current job status
      }
    }
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    NotificationService.removeListener(_onNotification);
    super.dispose();
  }

  void _startAutoRefresh() {
    _refreshTimer = Timer.periodic(Duration(seconds: 30), (timer) {
      _loadJobs();
    });
  }

  Future<void> _loadJobs() async {
    setState(() => isLoading = true);
    try {
      final data = await ApiService.get('/jobs');
      await _loadCurrentJob();
      setState(() {
        jobs = data is List ? List<dynamic>.from(data) : [];
        isLoading = false;
      });
    } catch (e) {
      setState(() => isLoading = false);
      _showSnackBar('Error loading jobs: $e');
    }
  }

  Future<void> _loadCurrentJob() async {
    try {
      final response = await http.get(
        Uri.parse('http://localhost:8080/employee/${UserService.currentUserId}/current-job'),
      );
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        setState(() {
          currentJob = data['job'];
        });
      } else {
        setState(() {
          currentJob = null;
        });
      }
    } catch (e) {
      setState(() {
        currentJob = null;
      });
    }
  }

  Future<void> _applyToJob(String jobId) async {
    if (UserService.currentUserId == null) {
      _showSnackBar('Please complete your profile first');
      return;
    }

    if (activeApplicationJobId != null) {
      _showSnackBar('You can only apply to one job at a time');
      return;
    }

    try {
      // First, find matches for this job to ensure the employee is eligible
      final matchResponse = await http.post(
        Uri.parse('http://localhost:8080/jobs/$jobId/matches'),
        headers: {'Content-Type': 'application/json'},
      );

      if (matchResponse.statusCode == 200) {
        // Now apply to the job
        final response = await http.post(
          Uri.parse('http://localhost:8080/jobs/$jobId/respond'),
          headers: {'Content-Type': 'application/json'},
          body: json.encode({'employeeId': UserService.currentUserId}),
        );

        if (response.statusCode == 200) {
          final result = json.decode(response.body);
          if (result['success']) {
            setState(() {
              appliedJobs.add(jobId);
              activeApplicationJobId = jobId;
              UserService.setEmployeeStatus('busy');
            });
            _showSnackBar('✅ Application submitted successfully!');
          } else {
            _showSnackBar(result['message'] ?? 'Application failed');
          }
        } else {
          _showSnackBar('Failed to submit application');
        }
      } else {
        _showSnackBar('No matches found for this job');
      }
    } catch (e) {
      _showSnackBar('Error applying to job: $e');
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
        title: Text('👷 Employee Dashboard'),
        actions: [
          IconButton(
            icon: Icon(Icons.notifications),
            onPressed: () => Navigator.pushNamed(context, '/notifications'),
          ),
          IconButton(
            icon: Icon(Icons.history),
            onPressed: () => Navigator.pushNamed(context, '/employee-work-history'),
          ),
          PopupMenuButton<String>(
            icon: Icon(_getStatusIcon()),
            onSelected: activeApplicationJobId != null ? null : (status) => _updateEmployeeStatus(status),
            itemBuilder: (context) => [
              PopupMenuItem(
                value: 'open_to_work', 
                enabled: activeApplicationJobId == null,
                child: Text(
                  '🟢 Open to Work',
                  style: TextStyle(color: activeApplicationJobId != null ? Colors.grey : null),
                ),
              ),
              PopupMenuItem(
                value: 'not_available', 
                enabled: activeApplicationJobId == null,
                child: Text(
                  '🔴 Not Available',
                  style: TextStyle(color: activeApplicationJobId != null ? Colors.grey : null),
                ),
              ),
              PopupMenuItem(
                value: 'busy', 
                enabled: activeApplicationJobId == null,
                child: Text(
                  '🟡 Busy',
                  style: TextStyle(color: activeApplicationJobId != null ? Colors.grey : null),
                ),
              ),
            ],
          ),
          IconButton(
            icon: Icon(Icons.swap_horiz),
            onPressed: () {
              UserService.currentUserType = 'employer';
              Navigator.pushReplacementNamed(context, '/employer-dashboard');
            },
          ),
          IconButton(
            icon: Icon(Icons.person),
            onPressed: () async {
              final result = await Navigator.pushNamed(context, '/profile');
              if (result == true) {
                setState(() {}); // Force rebuild when profile is updated
                print('Employee Dashboard refreshed - Profile completed: ${UserService.profileCompleted}');
              }
            },
          ),
          IconButton(
            icon: Icon(Icons.refresh),
            onPressed: _loadJobs,
          ),
          IconButton(
            icon: Icon(Icons.logout),
            onPressed: () {
              UserService.logout();
              Navigator.pushReplacementNamed(context, '/');
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadJobs,
        child: Column(
          children: [
            // Current Job Section
            if (currentJob != null)
              Container(
                width: double.infinity,
                padding: EdgeInsets.all(16),
                color: Colors.orange.shade50,
                child: Column(
                  children: [
                    Text(
                      '🚧 Current Job',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.orange.shade800),
                    ),
                    SizedBox(height: 8),
                    Card(
                      elevation: 2,
                      child: Padding(
                        padding: EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              currentJob!['title'] ?? 'No Title',
                              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                            ),
                            SizedBox(height: 4),
                            Row(
                              children: [
                                Icon(Icons.location_on, size: 14, color: Colors.grey[600]),
                                Text(' ${currentJob!['district']} • '),
                                Icon(Icons.attach_money, size: 14, color: Colors.grey[600]),
                                Text(' HK\$${currentJob!['hourlyRate']}/hr • '),
                                Icon(Icons.access_time, size: 14, color: Colors.grey[600]),
                                Text(' ${currentJob!['duration']}'),
                              ],
                            ),
                            SizedBox(height: 4),
                            Text(
                              'Status: IN PROGRESS',
                              style: TextStyle(color: Colors.orange, fontWeight: FontWeight.bold, fontSize: 12),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            
            Container(
              width: double.infinity,
              padding: EdgeInsets.all(16),
              color: Colors.blue.shade50,
              child: Column(
                children: [
                  Text(
                    'Available Jobs',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  Text(
                    '${jobs.length} jobs found • Auto-refresh every 30s',
                    style: TextStyle(color: Colors.grey[600]),
                  ),
                  Text(
                    'Profile: ${UserService.profileCompleted ? "✅ Complete" : "❌ Incomplete"}',
                    style: TextStyle(color: UserService.profileCompleted ? Colors.green : Colors.red),
                  ),
                ],
              ),
            ),
            
            Expanded(
              child: isLoading
                  ? Center(child: CircularProgressIndicator())
                  : jobs.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.work_off, size: 64, color: Colors.grey),
                              SizedBox(height: 16),
                              Text('No jobs available'),
                              SizedBox(height: 8),
                              ElevatedButton(
                                onPressed: _loadJobs,
                                child: Text('Refresh'),
                              ),
                            ],
                          ),
                        )
                      : ListView.builder(
                          itemCount: jobs.length,
                          itemBuilder: (context, index) {
                            final job = jobs[index];
                            return Card(
                              margin: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                              elevation: 4,
                              child: InkWell(
                                onTap: () {
                                  Navigator.pushNamed(
                                    context,
                                    '/job-detail',
                                    arguments: job,
                                  );
                                },
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
                                              color: Colors.green,
                                              borderRadius: BorderRadius.circular(20),
                                            ),
                                            child: Text(
                                              'HK\$${job['hourlyRate']}/hr',
                                              style: TextStyle(
                                                color: Colors.white,
                                                fontWeight: FontWeight.bold,
                                              ),
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
                                      SizedBox(height: 12),
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Text(
                                            'Status: ${job['status']?.toUpperCase() ?? 'UNKNOWN'}',
                                            style: TextStyle(
                                              color: _getStatusColor(job['status']),
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                          ElevatedButton(
                                            onPressed: _canApplyToJob(job),
                                            style: ElevatedButton.styleFrom(
                                              backgroundColor: appliedJobs.contains(job['jobId']) ? Colors.grey : 
                                                              (activeApplicationJobId != null && activeApplicationJobId != job['jobId']) ? Colors.orange : null,
                                            ),
                                            child: Text(_getButtonText(job)),
                                          ),
                                        ],
                                      ),
                                    ],
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

  String _formatDate(String? dateStr) {
    if (dateStr == null) return 'Unknown';
    try {
      final utcDate = DateTime.parse(dateStr);
      final localDate = utcDate.toLocal(); // Convert UTC to local time
      return '${localDate.day}/${localDate.month}';
    } catch (e) {
      return 'Unknown';
    }
  }

  Color _getStatusColor(String? status) {
    switch (status) {
      case 'matching':
        return Colors.green;
      case 'assigned':
        return Colors.orange;
      case 'completed':
        return Colors.blue;
      default:
        return Colors.grey;
    }
  }

  VoidCallback? _canApplyToJob(Map<String, dynamic> job) {
    if (UserService.currentUserId == null) return null;
    if (job['status'] != 'matching') return null;
    if (UserService.employeeStatus != 'open_to_work') return null;
    if (appliedJobs.contains(job['jobId'])) return null;
    return () => _applyToJob(job['jobId']);
  }

  String _getButtonText(Map<String, dynamic> job) {
    if (UserService.currentUserId == null) return 'Login First';
    if (job['status'] != 'matching') return 'Not Available';
    if (UserService.employeeStatus == 'not_available') return 'Not Available';
    if (appliedJobs.contains(job['jobId'])) return 'Applied';
    if (UserService.employeeStatus == 'busy') return 'Busy';
    return 'Apply Now';
  }

  Future<void> _updateEmployeeStatus(String status) async {
    // Check if employee has active applications
    if (activeApplicationJobId != null && status != UserService.employeeStatus) {
      _showSnackBar('Cannot change status while you have an active job application');
      return;
    }
    
    setState(() {
      UserService.setEmployeeStatus(status);
    });
    
    if (status == 'open_to_work') {
      _loadJobs(); // Refresh jobs when becoming available
    }
    
    _showSnackBar('Status updated to ${_getStatusText()}');
  }

  IconData _getStatusIcon() {
    switch (UserService.employeeStatus) {
      case 'open_to_work': return Icons.work;
      case 'not_available': return Icons.do_not_disturb;
      case 'busy': return Icons.hourglass_empty;
      default: return Icons.work;
    }
  }

  String _getStatusText() {
    switch (UserService.employeeStatus) {
      case 'open_to_work': return '🟢 Open to Work';
      case 'not_available': return '🔴 Not Available';
      case 'busy': return '🟡 Busy';
      default: return '🟢 Open to Work';
    }
  }

  Color _getEmployeeStatusColor(String status) {
    switch (status) {
      case 'open_to_work': return Colors.green;
      case 'not_available': return Colors.red;
      case 'busy': return Colors.orange;
      default: return Colors.green;
    }
  }

}

class EmployerDashboard extends StatefulWidget {
  const EmployerDashboard({super.key});

  @override
  _EmployerDashboardState createState() => _EmployerDashboardState();
}

class _EmployerDashboardState extends State<EmployerDashboard> {
  List<dynamic> myJobs = [];
  bool isLoading = false;
  Set<String> expandedJobs = {};

  @override
  void initState() {
    super.initState();
    _loadMyJobs();
    NotificationService.addListener(_onNotification);
  }

  void _onNotification(Map<String, dynamic> notification) {
    if (mounted) {
      NotificationService.showNotificationSnackBar(context, notification);
      if (notification['type'] == 'job_response') {
        _loadMyJobs(); // Refresh jobs when new applications arrive
      }
    }
  }

  @override
  void dispose() {
    NotificationService.removeListener(_onNotification);
    super.dispose();
  }

  String _getStatusText(String? status) {
    if (status == null) return 'NO STATUS';
    switch (status.toLowerCase()) {
      case 'matching': return 'MATCHING';
      case 'assigned': return 'ASSIGNED';
      case 'completed': return 'COMPLETED';
      case 'cancelled': return 'CANCELLED';
      case 'expired': return 'EXPIRED';
      default: return 'UNKNOWN ($status)';
    }
  }

  Future<void> _loadMyJobs() async {
    setState(() => isLoading = true);
    try {
      final data = await ApiService.get('/jobs?employerId=${UserService.currentUserId}');
      final allJobs = data is List ? List<dynamic>.from(data) : [];
      setState(() {
        myJobs = allJobs.where((job) => job['status'] == 'matching').toList();
        isLoading = false;
      });
    } catch (e) {
      setState(() => isLoading = false);
      _showSnackBar('Error loading jobs: $e');
    }
  }

  Future<void> _cancelJob(String jobId) async {
    try {
      final response = await http.put(
        Uri.parse('http://localhost:8080/jobs/$jobId/cancel'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        _showSnackBar('✅ Job cancelled successfully');
        _loadMyJobs();
      } else {
        _showSnackBar('Failed to cancel job');
      }
    } catch (e) {
      _showSnackBar('Error cancelling job: $e');
    }
  }

  Future<void> _viewApplicants(String jobId) async {
    try {
      final response = await http.get(Uri.parse('http://localhost:8080/jobs/$jobId/applicants'));
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final applicants = data['applicants'] as List;
        
        showDialog(
          context: context,
          builder: (context) => AlertDialog(
            title: Text('Job Applicants (${applicants.length})'),
            content: Container(
              width: double.maxFinite,
              height: 300,
              child: applicants.isEmpty
                  ? Center(child: Text('No applicants yet'))
                  : ListView.builder(
                      itemCount: applicants.length,
                      itemBuilder: (context, index) {
                        final applicant = applicants[index];
                        return Card(
                          child: ListTile(
                            leading: CircleAvatar(
                              child: Text(applicant['name'][0].toUpperCase()),
                            ),
                            title: Text(applicant['name']),
                            subtitle: Text('Applied: ${_formatApplicantDate(applicant['respondedAt'])}'),
                            onTap: () => _showApplicantProfile(applicant),
                            trailing: ElevatedButton(
                              onPressed: () => _selectApplicant(jobId, applicant['employeeId']),
                              child: Text('Select'),
                            ),
                          ),
                        );
                      },
                    ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: Text('Close'),
              ),
            ],
          ),
        );
      }
    } catch (e) {
      _showSnackBar('Error loading applicants: $e');
    }
  }

  Future<void> _selectApplicant(String jobId, String employeeId) async {
    try {
      final response = await http.post(
        Uri.parse('http://localhost:8080/jobs/$jobId/select'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'selectedEmployeeId': employeeId}),
      );

      if (response.statusCode == 200) {
        Navigator.pop(context);
        _showSnackBar('✅ Employee selected successfully!');
        _loadMyJobs();
      } else {
        _showSnackBar('Failed to select employee');
      }
    } catch (e) {
      _showSnackBar('Error selecting employee: $e');
    }
  }

  void _showApplicantProfile(Map<String, dynamic> applicant) {
    final profile = applicant['profile'] as Map<String, dynamic>? ?? {};
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('${applicant['name']} Profile'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Experience:', style: TextStyle(fontWeight: FontWeight.bold)),
            Text(profile['jobDescription'] ?? 'No description provided'),
            SizedBox(height: 12),
            Text('Rate Range:', style: TextStyle(fontWeight: FontWeight.bold)),
            Text('HK\$${profile['hourlyRateRange']?['min'] ?? 'N/A'} - HK\$${profile['hourlyRateRange']?['max'] ?? 'N/A'}/hr'),
            SizedBox(height: 12),
            Text('Preferred Districts:', style: TextStyle(fontWeight: FontWeight.bold)),
            Text((profile['preferredDistricts'] as List?)?.join(', ') ?? 'None specified'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Close'),
          ),
        ],
      ),
    );
  }

  String _formatApplicantDate(String? dateStr) {
    if (dateStr == null) return 'Unknown';
    try {
      final utcDate = DateTime.parse(dateStr);
      final localDate = utcDate.toLocal();
      return '${localDate.day}/${localDate.month} ${localDate.hour}:${localDate.minute.toString().padLeft(2, '0')}';
    } catch (e) {
      return 'Unknown';
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
        title: Text('👔 Employer Dashboard'),
        actions: [
          IconButton(
            icon: Icon(Icons.notifications),
            onPressed: () => Navigator.pushNamed(context, '/notifications'),
          ),
          IconButton(
            icon: Icon(Icons.manage_accounts),
            onPressed: () => Navigator.pushNamed(context, '/job-management'),
          ),
          IconButton(
            icon: Icon(Icons.history),
            onPressed: () => Navigator.pushNamed(context, '/job-history'),
          ),
          IconButton(
            icon: Icon(Icons.swap_horiz),
            onPressed: () {
              UserService.currentUserType = 'employee';
              Navigator.pushReplacementNamed(context, '/employee-dashboard');
            },
          ),
          IconButton(
            icon: Icon(Icons.person),
            onPressed: () async {
              final result = await Navigator.pushNamed(context, '/profile');
              if (result == true) {
                setState(() {}); // Force rebuild when profile is updated
                print('Employer Dashboard refreshed - Profile completed: ${UserService.profileCompleted}');
              }
            },
          ),
          IconButton(
            icon: Icon(Icons.refresh),
            onPressed: _loadMyJobs,
          ),
          IconButton(
            icon: Icon(Icons.logout),
            onPressed: () {
              UserService.logout();
              Navigator.pushReplacementNamed(context, '/');
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadMyJobs,
        child: Column(
          children: [
            Container(
              width: double.infinity,
              padding: EdgeInsets.all(16),
              color: Colors.blue.shade50,
              child: Column(
                children: [
                  Text(
                    'My Posted Jobs',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  Text(
                    '${myJobs.length} jobs posted',
                    style: TextStyle(color: Colors.grey[600]),
                  ),
                  Text(
                    'Profile: ${UserService.profileCompleted ? "✅ Complete" : "❌ Incomplete"}',
                    style: TextStyle(color: UserService.profileCompleted ? Colors.green : Colors.red),
                  ),
                ],
              ),
            ),
            
            Expanded(
              child: isLoading
                  ? Center(child: CircularProgressIndicator())
                  : myJobs.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.work_outline, size: 64, color: Colors.grey),
                              SizedBox(height: 16),
                              Text('No jobs posted yet'),
                              SizedBox(height: 8),
                              ElevatedButton(
                                onPressed: () => Navigator.pushNamed(context, '/post-job'),
                                child: Text('Post Your First Job'),
                              ),
                            ],
                          ),
                        )
                      : ListView.builder(
                          itemCount: myJobs.length,
                          itemBuilder: (context, index) {
                            final job = myJobs[index];
                            final responseCount = job['matchingWindow']?['responses']?.length ?? 0;
                            
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
                                            color: Colors.green,
                                            borderRadius: BorderRadius.circular(20),
                                          ),
                                          child: Text(
                                            'HK\$${job['hourlyRate']}/hr',
                                            style: TextStyle(
                                              color: Colors.white,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
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
                                        Icon(Icons.access_time, size: 16, color: Colors.grey[600]),
                                        Text(' ${job['duration']}'),
                                      ],
                                    ),
                                    SizedBox(height: 12),
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text(
                                          'Status: ${_getStatusText(job['status'])}',
                                          style: TextStyle(
                                            color: _getStatusColor(job['status']),
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                        Row(
                                          children: [
                                            if (responseCount > 0)
                                              GestureDetector(
                                                onTap: () => _viewApplicants(job['jobId']),
                                                child: Container(
                                                  padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                                  decoration: BoxDecoration(
                                                    color: Colors.orange,
                                                    borderRadius: BorderRadius.circular(20),
                                                  ),
                                                  child: Text(
                                                    '$responseCount Applicants',
                                                    style: TextStyle(
                                                      color: Colors.white,
                                                      fontWeight: FontWeight.bold,
                                                    ),
                                                  ),
                                                ),
                                              ),
                                            if (job['status'] == 'matching')
                                              Padding(
                                                padding: EdgeInsets.only(left: 8),
                                                child: ElevatedButton(
                                                  onPressed: () => _cancelJob(job['jobId']),
                                                  style: ElevatedButton.styleFrom(
                                                    backgroundColor: Colors.red,
                                                  ),
                                                  child: Text(
                                                    'Cancel',
                                                    style: TextStyle(color: Colors.white),
                                                  ),
                                                ),
                                              ),
                                          ],
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
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => Navigator.pushNamed(context, '/post-job'),
        label: Text('Post Job'),
        icon: Icon(Icons.add),
      ),
    );
  }



  Color _getStatusColor(String? status) {
    switch (status) {
      case 'matching':
        return Colors.green;
      case 'assigned':
        return Colors.orange;
      case 'completed':
        return Colors.blue;
      default:
        return Colors.grey;
    }
  }
}

class PostJobScreen extends StatefulWidget {
  const PostJobScreen({super.key});

  @override
  _PostJobScreenState createState() => _PostJobScreenState();
}

class _PostJobScreenState extends State<PostJobScreen> {
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _rateController = TextEditingController();
  final _durationController = TextEditingController();
  final _expirationController = TextEditingController(text: '30');
  String _selectedDistrict = 'Central';
  bool _isLoading = false;

  final List<String> _districts = [
    'Central', 'Wan Chai', 'Causeway Bay', 'Tsim Sha Tsui', 'Mong Kok',
    'Admiralty', 'Sheung Wan', 'North Point', 'Quarry Bay', 'Tai Koo'
  ];

  Future<void> _postJob() async {
    if (_titleController.text.isEmpty || 
        _descriptionController.text.isEmpty ||
        _rateController.text.isEmpty ||
        _durationController.text.isEmpty ||
        _expirationController.text.isEmpty) {
      _showSnackBar('Please fill in all fields');
      return;
    }

    setState(() => _isLoading = true);

    try {
      final jobData = {
        'title': _titleController.text,
        'description': _descriptionController.text,
        'district': _selectedDistrict,
        'hourlyRate': int.parse(_rateController.text),
        'duration': '${_durationController.text} hours',
        'employerId': UserService.currentUserId,
        'expirationMinutes': int.parse(_expirationController.text),
      };

      // Post job
      final jobResponse = await http.post(
        Uri.parse('http://localhost:8080/jobs'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode(jobData),
      );

      if (jobResponse.statusCode == 201) {
        final job = json.decode(jobResponse.body);
        
        // Find matches
        final matchResponse = await http.post(
          Uri.parse('http://localhost:8080/jobs/${job['jobId']}/matches'),
          headers: {'Content-Type': 'application/json'},
        );

        if (matchResponse.statusCode == 200) {
          final matches = json.decode(matchResponse.body);
          _showSnackBar('Job posted! Found ${matches['count']} potential matches');
          Navigator.pop(context);
        }
      } else {
        _showSnackBar('Failed to post job');
      }
    } catch (e) {
      _showSnackBar('Error posting job: $e');
    } finally {
      setState(() => _isLoading = false);
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
        title: Text('Post New Job'),
      ),
      body: Padding(
        padding: EdgeInsets.all(16.0),
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Job Details',
                      style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                    ),
                    SizedBox(height: 24),
                    
                    TextField(
                      controller: _titleController,
                      decoration: InputDecoration(
                        labelText: 'Job Title *',
                        hintText: 'e.g., Urgent Server Needed',
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(Icons.work),
                      ),
                    ),
                    SizedBox(height: 16),
                    
                    TextField(
                      controller: _descriptionController,
                      decoration: InputDecoration(
                        labelText: 'Job Description *',
                        hintText: 'Describe the job requirements and responsibilities',
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(Icons.description),
                      ),
                      maxLines: 3,
                    ),
                    SizedBox(height: 16),
                    
                    DropdownButtonFormField<String>(
                      initialValue: _selectedDistrict,
                      decoration: InputDecoration(
                        labelText: 'District *',
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(Icons.location_on),
                      ),
                      items: _districts.map((district) {
                        return DropdownMenuItem(
                          value: district,
                          child: Text(district),
                        );
                      }).toList(),
                      onChanged: (value) {
                        setState(() => _selectedDistrict = value!);
                      },
                    ),
                    SizedBox(height: 16),
                    
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _rateController,
                            decoration: InputDecoration(
                              labelText: 'Hourly Rate (HKD) *',
                              hintText: '100',
                              border: OutlineInputBorder(),
                              prefixIcon: Icon(Icons.attach_money),
                            ),
                            keyboardType: TextInputType.number,
                          ),
                        ),
                        SizedBox(width: 16),
                        Expanded(
                          child: TextField(
                            controller: _durationController,
                            decoration: InputDecoration(
                              labelText: 'Duration (hours) *',
                              hintText: '4',
                              border: OutlineInputBorder(),
                              prefixIcon: Icon(Icons.access_time),
                            ),
                            keyboardType: TextInputType.number,
                          ),
                        ),
                      ],
                    ),
                    SizedBox(height: 16),
                    
                    TextField(
                      controller: _expirationController,
                      decoration: InputDecoration(
                        labelText: 'Expires in (minutes) *',
                        hintText: '30 (max 180 minutes)',
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(Icons.timer),
                        helperText: 'Job will automatically expire after this time',
                      ),
                      keyboardType: TextInputType.number,
                    ),
                    SizedBox(height: 24),
                    
                    Container(
                      padding: EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.blue.shade50,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '🤖 AI Matching',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                          ),
                          SizedBox(height: 8),
                          Text(
                            'Our AI will automatically find the best matching employees based on:',
                            style: TextStyle(fontSize: 14),
                          ),
                          SizedBox(height: 8),
                          Text('• Job description similarity (50%)', style: TextStyle(fontSize: 12)),
                          Text('• District preference (30%)', style: TextStyle(fontSize: 12)),
                          Text('• Rate compatibility (20%)', style: TextStyle(fontSize: 12)),
                          SizedBox(height: 8),
                          Text('⏰ Auto-Expiration', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.orange)),
                          Text('Jobs expire automatically to keep listings fresh', style: TextStyle(fontSize: 12)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            
            SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _postJob,
                child: _isLoading
                    ? CircularProgressIndicator(color: Colors.white)
                    : Text(
                        'Post Job & Find Matches',
                        style: TextStyle(fontSize: 16),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  _ProfileScreenState createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> with SingleTickerProviderStateMixin {
  final _nameController = TextEditingController();
  final _experienceController = TextEditingController();
  final _companyController = TextEditingController();
  final _contactController = TextEditingController();
  final _minRateController = TextEditingController();
  final _maxRateController = TextEditingController();
  List<String> _selectedDistricts = [];
  String _defaultMode = 'employee';
  bool _isLoading = false;
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadProfileData();
  }
  
  void _loadProfileData() {
    final profileData = UserService.getProfileData();
    print('=== LOADING PROFILE ===');
    print('Profile data: $profileData');
    
    final employeeProfile = profileData?['employee'];
    final employerProfile = profileData?['employer'];
    
    print('Employee profile: $employeeProfile');
    print('Employer profile: $employerProfile');
    
    // Load shared data
    _nameController.text = employeeProfile?['name'] ?? employerProfile?['name'] ?? UserService.userName;
    _defaultMode = UserService.currentUserType ?? 'employee';
    
    // Load employee data
    _experienceController.text = employeeProfile?['jobDescription'] ?? '';
    _selectedDistricts = List<String>.from(employeeProfile?['preferredDistricts'] ?? ['Central', 'Wan Chai']);
    _minRateController.text = (employeeProfile?['hourlyRateRange']?['min'] ?? 80).toString();
    _maxRateController.text = (employeeProfile?['hourlyRateRange']?['max'] ?? 150).toString();
    
    // Load employer data
    _companyController.text = employerProfile?['companyName'] ?? '';
    _contactController.text = employerProfile?['contactPerson'] ?? '';
    
    print('Loaded values:');
    print('- Experience: ${_experienceController.text}');
    print('- Districts: $_selectedDistricts');
    print('- Company: ${_companyController.text}');
    print('- Contact: ${_contactController.text}');
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  final List<String> _districts = [
    'Central', 'Wan Chai', 'Causeway Bay', 'Tsim Sha Tsui', 'Mong Kok',
    'Admiralty', 'Sheung Wan', 'North Point', 'Quarry Bay', 'Tai Koo'
  ];

  Future<void> _saveProfile() async {
    print('Save button clicked!');
    print('Name: ${_nameController.text}');
    print('Default mode: $_defaultMode');
    
    if (_nameController.text.isEmpty) {
      _showSnackBar('Please enter your name');
      return;
    }

    setState(() => _isLoading = true);

    try {
      // Update server with both employee and employer profiles
      final profileData = {
        'profiles': {
          'employee': {
            'name': _nameController.text,
            'jobDescription': _experienceController.text,
            'preferredDistricts': _selectedDistricts,
            'hourlyRateRange': {'min': int.tryParse(_minRateController.text) ?? 80, 'max': int.tryParse(_maxRateController.text) ?? 150}
          },
          'employer': {
            'name': _nameController.text,
            'companyName': _companyController.text,
            'contactPerson': _contactController.text
          }
        },
        'currentMode': _defaultMode
      };

      print('=== SAVING PROFILE ===');
      print('User ID: ${UserService.currentUserId}');
      print('Profile data: ${json.encode(profileData)}');
      
      final response = await http.put(
        Uri.parse('http://localhost:8080/users/${UserService.currentUserId}'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode(profileData),
      );

      print('Save response: ${response.statusCode}');
      print('Save body: ${response.body}');

      if (response.statusCode == 200) {
        UserService.setProfileCompleted(true);
        UserService.currentUserType = _defaultMode;
        UserService.updateProfile(_nameController.text, _companyController.text, _experienceController.text);
        UserService.setProfileData(profileData['profiles'] as Map<String, dynamic>?);
        _showSnackBar('✅ Profile updated successfully!');
        
        if (Navigator.canPop(context)) {
          Navigator.pop(context, true);
        } else {
          Navigator.pushReplacementNamed(
            context,
            _defaultMode == 'employee' ? '/employee-dashboard' : '/employer-dashboard',
          );
        }
      } else {
        _showSnackBar('Failed to update profile');
      }
    } catch (e) {
      _showSnackBar('Error saving profile: $e');
    } finally {
      setState(() => _isLoading = false);
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
        title: Text('Edit Profile'),
        bottom: TabBar(
          controller: _tabController,
          tabs: [
            Tab(icon: Icon(Icons.person), text: 'Employee'),
            Tab(icon: Icon(Icons.business), text: 'Employer'),
          ],
        ),
      ),
      body: Column(
        children: [
          // Shared fields
          Container(
            padding: EdgeInsets.all(16),
            color: Colors.grey.shade50,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Shared Information', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                SizedBox(height: 16),
                TextField(
                  controller: _nameController,
                  decoration: InputDecoration(
                    labelText: 'Full Name *',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.person),
                  ),
                ),
                SizedBox(height: 16),
                Text('Default Mode', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                Row(
                  children: [
                    Expanded(
                      child: RadioListTile<String>(
                        title: Text('👷 Employee'),
                        value: 'employee',
                        groupValue: _defaultMode,
                        onChanged: (value) => setState(() => _defaultMode = value!),
                      ),
                    ),
                    Expanded(
                      child: RadioListTile<String>(
                        title: Text('👔 Employer'),
                        value: 'employer',
                        groupValue: _defaultMode,
                        onChanged: (value) => setState(() => _defaultMode = value!),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          
          // Tabbed content
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                // Employee Tab
                _buildEmployeeTab(),
                // Employer Tab
                _buildEmployerTab(),
              ],
            ),
          ),
          
          // Save button
          Padding(
            padding: EdgeInsets.all(16),
            child: SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _saveProfile,
                child: _isLoading
                    ? CircularProgressIndicator(color: Colors.white)
                    : Text('Save All Profile Data', style: TextStyle(fontSize: 16)),
              ),
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildEmployeeTab() {
    return SingleChildScrollView(
      padding: EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TextField(
            controller: _experienceController,
            decoration: InputDecoration(
              labelText: 'Job Description/Experience *',
              hintText: 'Describe your work experience and skills',
              border: OutlineInputBorder(),
              prefixIcon: Icon(Icons.work),
            ),
            maxLines: 3,
          ),
          SizedBox(height: 16),
          Text('Preferred Districts *', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          SizedBox(height: 8),
          Container(
            height: 200,
            decoration: BoxDecoration(
              border: Border.all(color: Colors.grey),
              borderRadius: BorderRadius.circular(8),
            ),
            child: ListView.builder(
              itemCount: _districts.length,
              itemBuilder: (context, index) {
                final district = _districts[index];
                return CheckboxListTile(
                  title: Text(district),
                  value: _selectedDistricts.contains(district),
                  onChanged: (bool? value) {
                    setState(() {
                      if (value == true) {
                        _selectedDistricts.add(district);
                      } else {
                        _selectedDistricts.remove(district);
                      }
                    });
                  },
                );
              },
            ),
          ),
          SizedBox(height: 16),
          Text('Hourly Rate Range (HKD)', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _minRateController,
                  decoration: InputDecoration(
                    labelText: 'Min Rate',
                    hintText: '80',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.attach_money),
                  ),
                  keyboardType: TextInputType.number,
                ),
              ),
              SizedBox(width: 16),
              Expanded(
                child: TextField(
                  controller: _maxRateController,
                  decoration: InputDecoration(
                    labelText: 'Max Rate',
                    hintText: '150',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.attach_money),
                  ),
                  keyboardType: TextInputType.number,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
  
  Widget _buildEmployerTab() {
    return SingleChildScrollView(
      padding: EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TextField(
            controller: _companyController,
            decoration: InputDecoration(
              labelText: 'Company/Business Name *',
              border: OutlineInputBorder(),
              prefixIcon: Icon(Icons.business),
            ),
          ),
          SizedBox(height: 16),
          TextField(
            controller: _contactController,
            decoration: InputDecoration(
              labelText: 'Contact Person/Manager Name',
              border: OutlineInputBorder(),
              prefixIcon: Icon(Icons.person_outline),
            ),
          ),
          SizedBox(height: 24),
          Container(
            padding: EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.blue.shade50,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('💼 Employer Features', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                SizedBox(height: 8),
                Text('• Post unlimited job listings', style: TextStyle(fontSize: 14)),
                Text('• AI-powered employee matching', style: TextStyle(fontSize: 14)),
                Text('• Real-time application notifications', style: TextStyle(fontSize: 14)),
                Text('• Rate and review employees', style: TextStyle(fontSize: 14)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class JobDetailScreen extends StatelessWidget {
  const JobDetailScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final job = ModalRoute.of(context)!.settings.arguments as Map<String, dynamic>;
    
    return Scaffold(
      appBar: AppBar(
        title: Text('Job Details'),
      ),
      body: Padding(
        padding: EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              job['title'] ?? 'No Title',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 16),
            Text(
              job['description'] ?? 'No Description',
              style: TextStyle(fontSize: 16),
            ),
            SizedBox(height: 16),
            Text('District: ${job['district']}'),
            Text('Rate: HK\$${job['hourlyRate']}/hour'),
            Text('Duration: ${job['duration']}'),
            Text('Status: ${job['status']}'),
          ],
        ),
      ),
    );
  }
}

class UserService {
  static String? currentUserId;
  static String? currentUserType;
  static bool profileCompleted = true; // Set to true by default
  static String userName = 'John Doe';
  static String companyName = 'ABC Company';
  static String experience = 'Experienced worker';
  static String employeeStatus = 'open_to_work'; // not_available, open_to_work, busy
  
  static void setCurrentUser(String userId, String userType) {
    currentUserId = userId;
    currentUserType = userType;
  }
  
  static void setProfileCompleted(bool completed) {
    profileCompleted = completed;
  }
  
  static void updateProfile(String name, String company, String exp) {
    userName = name;
    companyName = company;
    experience = exp;
  }
  
  static Map<String, dynamic>? _profileData;
  
  static void setProfileData(Map<String, dynamic>? data) {
    _profileData = data;
  }
  
  static Map<String, dynamic>? getProfileData() {
    return _profileData;
  }
  
  static void setEmployeeStatus(String status) {
    employeeStatus = status;
  }
  
  static void logout() {
    currentUserId = null;
    currentUserType = null;
    profileCompleted = false;
    employeeStatus = 'open_to_work';
    _profileData = null;
  }
}