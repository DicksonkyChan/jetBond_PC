import 'dart:io';
import 'dart:developer' as developer;
import 'package:path_provider/path_provider.dart';

class AppLogger {
  static File? _logFile;
  static bool _initialized = false;

  static Future<void> init() async {
    if (_initialized) return;
    
    try {
      final directory = await getApplicationDocumentsDirectory();
      _logFile = File('${directory.path}/jetbond_app.log');
      _initialized = true;
      log('📱 Frontend logging initialized');
    } catch (e) {
      developer.log('Failed to initialize logger: $e');
    }
  }

  static void log(String message, {String? tag}) async {
    final timestamp = DateTime.now().toIso8601String();
    final logEntry = '[$timestamp] ${tag ?? 'APP'}: $message';
    
    // Log to console
    developer.log(logEntry);
    
    // Log to file
    if (_logFile != null) {
      try {
        await _logFile!.writeAsString('$logEntry\n', mode: FileMode.append);
      } catch (e) {
        developer.log('Failed to write to log file: $e');
      }
    }
  }

  static void logLogin(String userId) {
    log('🔐 USER LOGIN - ID: $userId', tag: 'LOGIN');
  }

  static void logNavigation(String from, String to) {
    log('🧭 NAVIGATION - From: $from To: $to', tag: 'NAV');
  }

  static void logApiCall(String method, String url) {
    log('🌐 API CALL - $method $url', tag: 'API');
  }

  static void logError(String error, {String? context}) {
    log('❌ ERROR - ${context ?? ''}: $error', tag: 'ERROR');
  }

  static void logUserAction(String action, {Map<String, dynamic>? data}) {
    final dataStr = data != null ? ' Data: ${data.toString()}' : '';
    log('👆 USER ACTION - $action$dataStr', tag: 'ACTION');
  }
}