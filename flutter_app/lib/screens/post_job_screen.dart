import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';

class PostJobScreen extends StatefulWidget {
  @override
  _PostJobScreenState createState() => _PostJobScreenState();
}

class _PostJobScreenState extends State<PostJobScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _hourlyRateController = TextEditingController();
  final _durationController = TextEditingController();
  
  String _selectedDistrict = 'Central';
  bool _posting = false;
  
  final List<String> _districts = [
    'Central', 'Wan Chai', 'Causeway Bay', 'Tsim Sha Tsui', 
    'Mong Kok', 'Quarry Bay', 'Tai Koo', 'Admiralty'
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Post New Job'),
        automaticallyImplyLeading: false,
      ),
      body: Padding(
        padding: EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              TextFormField(
                controller: _titleController,
                decoration: InputDecoration(labelText: 'Job Title'),
                validator: (value) => value?.isEmpty == true ? 'Required' : null,
              ),
              SizedBox(height: 16),
              TextFormField(
                controller: _descriptionController,
                decoration: InputDecoration(labelText: 'Description'),
                maxLines: 3,
                validator: (value) => value?.isEmpty == true ? 'Required' : null,
              ),
              SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: _selectedDistrict,
                decoration: InputDecoration(labelText: 'District'),
                items: _districts.map((district) => 
                  DropdownMenuItem(value: district, child: Text(district))
                ).toList(),
                onChanged: (value) => setState(() => _selectedDistrict = value!),
              ),
              SizedBox(height: 16),
              TextFormField(
                controller: _hourlyRateController,
                decoration: InputDecoration(labelText: 'Hourly Rate (HKD)'),
                keyboardType: TextInputType.number,
                validator: (value) => value?.isEmpty == true ? 'Required' : null,
              ),
              SizedBox(height: 16),
              TextFormField(
                controller: _durationController,
                decoration: InputDecoration(labelText: 'Duration (hours)'),
                keyboardType: TextInputType.number,
                validator: (value) => value?.isEmpty == true ? 'Required' : null,
              ),
              SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _posting ? null : _postJob,
                  child: _posting 
                    ? CircularProgressIndicator(color: Colors.white)
                    : Text('Post Job'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
  
  void _postJob() async {
    if (!_formKey.currentState!.validate()) return;
    
    setState(() => _posting = true);
    
    final jobData = {
      'title': _titleController.text,
      'description': _descriptionController.text,
      'district': _selectedDistrict,
      'hourlyRate': int.parse(_hourlyRateController.text),
      'duration': int.parse(_durationController.text),
      'employerId': 'flutter-user-${DateTime.now().millisecondsSinceEpoch}',
    };
    
    final result = await context.read<ApiService>().createJob(jobData);
    
    setState(() => _posting = false);
    
    if (result != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Job posted successfully!')),
      );
      context.read<ApiService>().fetchJobs();
      _clearForm();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to post job')),
      );
    }
  }
  
  void _clearForm() {
    _titleController.clear();
    _descriptionController.clear();
    _hourlyRateController.clear();
    _durationController.clear();
    setState(() {
      _selectedDistrict = 'Central';
    });
  }
}