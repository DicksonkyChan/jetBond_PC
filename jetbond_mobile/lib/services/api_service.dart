import 'package:http/http.dart' as http;
import 'dart:convert';

class ApiService {
  static const String baseUrl = 'http://localhost:8080';
  
  static Future<dynamic> get(String endpoint) async {
    final response = await http.get(Uri.parse('$baseUrl$endpoint'));
    if (response.statusCode == 200) {
      return json.decode(response.body);
    }
    throw Exception('Failed to load data: ${response.statusCode}');
  }
  
  static Future<Map<String, dynamic>> post(String endpoint, Map<String, dynamic> data) async {
    final response = await http.post(
      Uri.parse('$baseUrl$endpoint'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode(data),
    );
    if (response.statusCode == 200 || response.statusCode == 201) {
      return json.decode(response.body);
    }
    throw Exception('Failed to post data: ${response.statusCode}');
  }
  
  static Future<Map<String, dynamic>> put(String endpoint, [Map<String, dynamic>? data]) async {
    final response = await http.put(
      Uri.parse('$baseUrl$endpoint'),
      headers: {'Content-Type': 'application/json'},
      body: data != null ? json.encode(data) : null,
    );
    if (response.statusCode == 200) {
      return json.decode(response.body);
    }
    throw Exception('Failed to update data: ${response.statusCode}');
  }
}