import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

void main() {
  group('Profile Tests', () {
    test('Profile data structure is correct', () {
      final profileData = {
        'profiles': {
          'employee': {
            'name': 'Test User',
            'jobDescription': 'Test Job',
            'preferredDistricts': ['Central'],
            'hourlyRateRange': {'min': 80, 'max': 150}
          },
          'employer': {
            'name': 'Test User',
            'companyName': 'Test Company',
            'contactPerson': 'Test Contact'
          }
        },
        'currentMode': 'employee'
      };
      
      expect(profileData['profiles']['employee']['jobDescription'], 'Test Job');
      expect(profileData['profiles']['employer']['contactPerson'], 'Test Contact');
    });
  });
}