import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user.dart';

class UserService extends ChangeNotifier {
  User? _currentUser;
  bool _isLoggedIn = false;

  User? get currentUser => _currentUser;
  bool get isLoggedIn => _isLoggedIn;
  UserType? get userType => _currentUser?.userType;
  bool get isEmployer => _currentUser?.userType == UserType.employer;
  bool get isEmployee => _currentUser?.userType == UserType.employee;

  Future<void> loadUser() async {
    final prefs = await SharedPreferences.getInstance();
    final userTypeString = prefs.getString('user_type');
    final userName = prefs.getString('user_name');
    final userEmail = prefs.getString('user_email');
    final userPhone = prefs.getString('user_phone');

    if (userTypeString != null && userName != null && userEmail != null) {
      _currentUser = User(
        id: userEmail,
        name: userName,
        email: userEmail,
        phone: userPhone ?? '',
        userType: userTypeString == 'employer' ? UserType.employer : UserType.employee,
        createdAt: DateTime.now(),
      );
      _isLoggedIn = true;
    }
    notifyListeners();
  }

  Future<void> setUserType(UserType userType) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('user_type', userType == UserType.employer ? 'employer' : 'employee');
    
    if (_currentUser != null) {
      _currentUser = User(
        id: _currentUser!.id,
        name: _currentUser!.name,
        email: _currentUser!.email,
        phone: _currentUser!.phone,
        userType: userType,
        createdAt: _currentUser!.createdAt,
      );
    }
    notifyListeners();
  }

  Future<void> updateUser(String name, String email, String phone) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('user_name', name);
    await prefs.setString('user_email', email);
    await prefs.setString('user_phone', phone);

    if (_currentUser != null) {
      _currentUser = User(
        id: _currentUser!.id,
        name: name,
        email: email,
        phone: phone,
        userType: _currentUser!.userType,
        createdAt: _currentUser!.createdAt,
      );
      _isLoggedIn = true;
    }
    notifyListeners();
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    // Only clear authentication-related data, preserve profile data
    await prefs.remove('user_type');
    _currentUser = null;
    _isLoggedIn = false;
    notifyListeners();
  }
}