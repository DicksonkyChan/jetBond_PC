import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:provider/provider.dart';
import '../services/user_service.dart';
import '../services/api_service.dart';

class ProfileScreen extends StatefulWidget {
  @override
  _ProfileScreenState createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  bool _notificationsEnabled = true;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  void _loadProfile() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _nameController.text = prefs.getString('user_name') ?? '';
      _emailController.text = prefs.getString('user_email') ?? '';
      _phoneController.text = prefs.getString('user_phone') ?? '';
      _notificationsEnabled = prefs.getBool('notifications_enabled') ?? true;
    });
  }

  void _saveProfile() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('user_name', _nameController.text);
      await prefs.setString('user_email', _emailController.text);
      await prefs.setString('user_phone', _phoneController.text);
      await prefs.setBool('notifications_enabled', _notificationsEnabled);
      
      // Update UserService
      await context.read<UserService>().updateUser(
        _nameController.text,
        _emailController.text,
        _phoneController.text,
      );
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Profile saved successfully!')),
      );
    } catch (error) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to save profile: $error')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Profile'),
        actions: [
          IconButton(
            icon: Icon(Icons.save),
            onPressed: _saveProfile,
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(16),
        child: Column(
          children: [
            CircleAvatar(
              radius: 50,
              backgroundColor: Colors.blue,
              child: Icon(Icons.person, size: 50, color: Colors.white),
            ),
            SizedBox(height: 24),
            Card(
              child: Padding(
                padding: EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Personal Information', style: Theme.of(context).textTheme.titleMedium),
                    SizedBox(height: 16),
                    TextField(
                      controller: _nameController,
                      decoration: InputDecoration(
                        labelText: 'Full Name',
                        prefixIcon: Icon(Icons.person),
                        border: OutlineInputBorder(),
                      ),
                    ),
                    SizedBox(height: 16),
                    TextField(
                      controller: _emailController,
                      decoration: InputDecoration(
                        labelText: 'Email',
                        prefixIcon: Icon(Icons.email),
                        border: OutlineInputBorder(),
                      ),
                      keyboardType: TextInputType.emailAddress,
                    ),
                    SizedBox(height: 16),
                    TextField(
                      controller: _phoneController,
                      decoration: InputDecoration(
                        labelText: 'Phone Number',
                        prefixIcon: Icon(Icons.phone),
                        border: OutlineInputBorder(),
                      ),
                      keyboardType: TextInputType.phone,
                    ),
                  ],
                ),
              ),
            ),
            SizedBox(height: 16),
            Card(
              child: Padding(
                padding: EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Settings', style: Theme.of(context).textTheme.titleMedium),
                    SizedBox(height: 16),
                    SwitchListTile(
                      title: Text('Push Notifications'),
                      subtitle: Text('Receive job alerts and updates'),
                      value: _notificationsEnabled,
                      onChanged: (value) {
                        setState(() => _notificationsEnabled = value);
                      },
                    ),
                    ListTile(
                      leading: Icon(Icons.history),
                      title: Text('Application History'),
                      trailing: Icon(Icons.arrow_forward_ios),
                      onTap: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('Feature coming soon')),
                        );
                      },
                    ),
                    ListTile(
                      leading: Icon(Icons.favorite),
                      title: Text('Saved Jobs'),
                      trailing: Icon(Icons.arrow_forward_ios),
                      onTap: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('Feature coming soon')),
                        );
                      },
                    ),
                  ],
                ),
              ),
            ),
            SizedBox(height: 16),
            Card(
              child: Padding(
                padding: EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('About', style: Theme.of(context).textTheme.titleMedium),
                    SizedBox(height: 16),
                    ListTile(
                      leading: Icon(Icons.info),
                      title: Text('App Version'),
                      subtitle: Text('1.0.0'),
                    ),
                    ListTile(
                      leading: Icon(Icons.help),
                      title: Text('Help & Support'),
                      trailing: Icon(Icons.arrow_forward_ios),
                      onTap: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('Contact: support@jetbond.com')),
                        );
                      },
                    ),
                    ListTile(
                      leading: Icon(Icons.logout, color: Colors.red),
                      title: Text('Logout', style: TextStyle(color: Colors.red)),
                      onTap: () async {
                        final confirmed = await showDialog<bool>(
                          context: context,
                          builder: (context) => AlertDialog(
                            title: Text('Logout'),
                            content: Text('Are you sure you want to logout? Your profile data will be preserved.'),
                            actions: [
                              TextButton(
                                onPressed: () => Navigator.pop(context, false),
                                child: Text('Cancel'),
                              ),
                              TextButton(
                                onPressed: () => Navigator.pop(context, true),
                                child: Text('Logout'),
                              ),
                            ],
                          ),
                        );
                        
                        if (confirmed == true) {
                          await context.read<UserService>().logout();
                          Navigator.pushNamedAndRemoveUntil(context, '/user-type', (route) => false);
                        }
                      },
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    super.dispose();
  }
}