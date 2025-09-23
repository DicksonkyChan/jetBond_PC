import 'package:flutter/material.dart';
import '../main.dart';

class AppNavigationBar extends StatelessWidget {
  final int currentIndex;
  
  const AppNavigationBar({super.key, required this.currentIndex});

  @override
  Widget build(BuildContext context) {
    return BottomNavigationBar(
      type: BottomNavigationBarType.fixed,
      currentIndex: currentIndex,
      items: [
        BottomNavigationBarItem(icon: Icon(Icons.notifications), label: 'Notifications'),
        BottomNavigationBarItem(icon: Icon(Icons.history), label: 'History'),
        BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Home'),
        BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Profile'),
        BottomNavigationBarItem(icon: Icon(Icons.logout), label: 'Logout'),
      ],
      onTap: (index) {
        switch (index) {
          case 0: Navigator.pushReplacementNamed(context, '/notifications'); break;
          case 1: 
            Navigator.pushReplacementNamed(context, 
              UserService.currentUserType == 'employee' ? '/employee-work-history' : '/job-history');
            break;
          case 2: 
            Navigator.pushReplacementNamed(context, 
              UserService.currentUserType == 'employee' ? '/employee-dashboard' : '/employer-dashboard');
            break;
          case 3: Navigator.pushReplacementNamed(context, '/profile'); break;
          case 4:
            UserService.logout();
            Navigator.pushReplacementNamed(context, '/');
            break;
        }
      },
    );
  }
}

class EmployerNavigationBar extends StatelessWidget {
  final int currentIndex;
  
  const EmployerNavigationBar({super.key, required this.currentIndex});

  @override
  Widget build(BuildContext context) {
    return BottomNavigationBar(
      type: BottomNavigationBarType.fixed,
      currentIndex: currentIndex,
      items: [
        BottomNavigationBarItem(icon: Icon(Icons.notifications), label: 'Notifications'),
        BottomNavigationBarItem(icon: Icon(Icons.manage_accounts), label: 'Manage'),
        BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Home'),
        BottomNavigationBarItem(icon: Icon(Icons.history), label: 'History'),
        BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Profile'),
      ],
      onTap: (index) {
        switch (index) {
          case 0: Navigator.pushReplacementNamed(context, '/notifications'); break;
          case 1: Navigator.pushReplacementNamed(context, '/job-management'); break;
          case 2: Navigator.pushReplacementNamed(context, '/employer-dashboard'); break;
          case 3: Navigator.pushReplacementNamed(context, '/job-history'); break;
          case 4: Navigator.pushReplacementNamed(context, '/profile'); break;
        }
      },
    );
  }
}