enum UserType { employee, employer }

class User {
  final String id;
  final String name;
  final String email;
  final String phone;
  final UserType userType;
  final DateTime createdAt;

  User({
    required this.id,
    required this.name,
    required this.email,
    required this.phone,
    required this.userType,
    required this.createdAt,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      phone: json['phone'] ?? '',
      userType: json['userType'] == 'employer' ? UserType.employer : UserType.employee,
      createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'phone': phone,
      'userType': userType == UserType.employer ? 'employer' : 'employee',
      'createdAt': createdAt.toIso8601String(),
    };
  }
}