import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

class ApiService extends ChangeNotifier {
  static const String baseUrl = 'https://xaifmm3kga.ap-southeast-1.awsapprunner.com';
  
  List<dynamic> _jobs = [];
  bool _loading = false;
  String? _error;
  bool _isConnected = false;
  
  List<dynamic> get jobs => _jobs;
  bool get loading => _loading;
  String? get error => _error;
  bool get isConnected => _isConnected;
  
  Future<bool> testConnection() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/test'));
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }
  
  Future<void> fetchJobs() async {
    _loading = true;
    _error = null;
    notifyListeners();
    
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/jobs'),
        headers: {'Content-Type': 'application/json'},
      ).timeout(Duration(seconds: 10));
      
      if (response.statusCode == 200) {
        _jobs = json.decode(response.body);
        _isConnected = true;
        _error = null;
      } else {
        _error = 'Failed to load jobs (${response.statusCode})';
        _isConnected = false;
      }
    } catch (e) {
      _error = 'Connection error: ${e.toString()}';
      _isConnected = false;
      print('Error fetching jobs: $e');
    }
    
    _loading = false;
    notifyListeners();
  }
  
  Future<Map<String, dynamic>?> createJob(Map<String, dynamic> jobData) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/jobs'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode(jobData),
      ).timeout(Duration(seconds: 10));
      
      if (response.statusCode == 201 || response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        print('Failed to create job: ${response.statusCode}');
      }
    } catch (e) {
      print('Error creating job: $e');
    }
    return null;
  }
  
  void clearError() {
    _error = null;
    notifyListeners();
  }
}