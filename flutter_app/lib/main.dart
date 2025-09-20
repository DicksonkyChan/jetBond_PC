import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'services/api_service.dart';
import 'services/user_service.dart';
import 'screens/job_list_screen.dart';
import 'screens/search_screen.dart';
import 'screens/post_job_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/user_type_screen.dart';
import 'models/user.dart';

void main() {
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (context) => ApiService()),
        ChangeNotifierProvider(create: (context) => UserService()),
      ],
      child: MaterialApp(
        title: 'JetBond',
        theme: ThemeData(
          primarySwatch: Colors.blue,
          visualDensity: VisualDensity.adaptivePlatformDensity,
        ),
        home: AppWrapper(),
        routes: {
          '/main': (context) => MainScreen(),
          '/user-type': (context) => UserTypeScreen(),
        },
      ),
    );
  }
}

class AppWrapper extends StatefulWidget {
  @override
  _AppWrapperState createState() => _AppWrapperState();
}

class _AppWrapperState extends State<AppWrapper> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<UserService>().loadUser();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<UserService>(
      builder: (context, userService, child) {
        if (userService.currentUser == null) {
          return UserTypeScreen();
        }
        return MainScreen();
      },
    );
  }
}

class MainScreen extends StatefulWidget {
  @override
  _MainScreenState createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _currentIndex = 0;
  
  final List<Widget> _screens = [
    JobListScreen(),
    SearchScreen(),
    PostJobScreen(),
    ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _screens[_currentIndex],
      bottomNavigationBar: BottomNavigationBar(
        type: BottomNavigationBarType.fixed,
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        items: [
          BottomNavigationBarItem(
            icon: Icon(Icons.work),
            label: 'Jobs',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.search),
            label: 'Search',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.add_circle),
            label: 'Post Job',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}