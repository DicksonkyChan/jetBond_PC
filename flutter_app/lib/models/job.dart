class Job {
  final String id;
  final String title;
  final String description;
  final String district;
  final int hourlyRate;
  final int duration;
  final String employerId;
  final DateTime createdAt;
  final String status;

  Job({
    required this.id,
    required this.title,
    required this.description,
    required this.district,
    required this.hourlyRate,
    required this.duration,
    required this.employerId,
    required this.createdAt,
    this.status = 'active',
  });

  factory Job.fromJson(Map<String, dynamic> json) {
    return Job(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      district: json['district'] ?? '',
      hourlyRate: json['hourlyRate'] ?? 0,
      duration: json['duration'] ?? 0,
      employerId: json['employerId'] ?? '',
      createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
      status: json['status'] ?? 'active',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'district': district,
      'hourlyRate': hourlyRate,
      'duration': duration,
      'employerId': employerId,
      'createdAt': createdAt.toIso8601String(),
      'status': status,
    };
  }
}