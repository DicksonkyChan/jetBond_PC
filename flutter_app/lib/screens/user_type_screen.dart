import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/user_service.dart';
import '../models/user.dart';

class UserTypeScreen extends StatelessWidget {
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
            padding: EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.work,
                  size: 80,
                  color: Colors.white,
                ),
                SizedBox(height: 24),
                Text(
                  'Welcome to JetBond',
                  style: TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                SizedBox(height: 16),
                Text(
                  'Choose your role to get started',
                  style: TextStyle(
                    fontSize: 18,
                    color: Colors.white70,
                  ),
                ),
                SizedBox(height: 48),
                _buildUserTypeCard(
                  context,
                  title: 'I\'m looking for work',
                  subtitle: 'Find and apply to job opportunities',
                  icon: Icons.person_search,
                  userType: UserType.employee,
                  color: Colors.green,
                ),
                SizedBox(height: 24),
                _buildUserTypeCard(
                  context,
                  title: 'I\'m hiring',
                  subtitle: 'Post jobs and find workers',
                  icon: Icons.business,
                  userType: UserType.employer,
                  color: Colors.orange,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildUserTypeCard(
    BuildContext context, {
    required String title,
    required String subtitle,
    required IconData icon,
    required UserType userType,
    required Color color,
  }) {
    return Card(
      elevation: 8,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () async {
          await context.read<UserService>().setUserType(userType);
          Navigator.pushReplacementNamed(context, '/main');
        },
        child: Container(
          padding: EdgeInsets.all(24),
          child: Row(
            children: [
              Container(
                padding: EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, size: 32, color: color),
              ),
              SizedBox(width: 20),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    SizedBox(height: 4),
                    Text(
                      subtitle,
                      style: TextStyle(
                        color: Colors.grey[600],
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
              Icon(Icons.arrow_forward_ios, color: Colors.grey),
            ],
          ),
        ),
      ),
    );
  }
}