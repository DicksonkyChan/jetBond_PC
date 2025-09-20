import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../models/job.dart';
import 'job_detail_screen.dart';

class SearchScreen extends StatefulWidget {
  @override
  _SearchScreenState createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final _searchController = TextEditingController();
  String _selectedDistrict = 'All';
  RangeValues _salaryRange = RangeValues(50, 300);
  List<Job> _filteredJobs = [];

  final List<String> _districts = [
    'All', 'Central', 'Wan Chai', 'Causeway Bay', 'Tsim Sha Tsui', 
    'Mong Kok', 'Quarry Bay', 'Tai Koo', 'Admiralty'
  ];

  @override
  void initState() {
    super.initState();
    _searchController.addListener(_filterJobs);
  }

  void _filterJobs() {
    final apiService = context.read<ApiService>();
    final jobs = apiService.jobs.map((json) => Job.fromJson(json)).toList();
    
    setState(() {
      _filteredJobs = jobs.where((job) {
        final matchesSearch = job.title.toLowerCase().contains(_searchController.text.toLowerCase()) ||
                            job.description.toLowerCase().contains(_searchController.text.toLowerCase());
        final matchesDistrict = _selectedDistrict == 'All' || job.district == _selectedDistrict;
        final matchesSalary = job.hourlyRate >= _salaryRange.start && job.hourlyRate <= _salaryRange.end;
        
        return matchesSearch && matchesDistrict && matchesSalary;
      }).toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Search Jobs'),
      ),
      body: Column(
        children: [
          Container(
            padding: EdgeInsets.all(16),
            child: Column(
              children: [
                TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    hintText: 'Search jobs...',
                    prefixIcon: Icon(Icons.search),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
                SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        value: _selectedDistrict,
                        decoration: InputDecoration(
                          labelText: 'District',
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        items: _districts.map((district) => 
                          DropdownMenuItem(value: district, child: Text(district))
                        ).toList(),
                        onChanged: (value) {
                          setState(() => _selectedDistrict = value!);
                          _filterJobs();
                        },
                      ),
                    ),
                  ],
                ),
                SizedBox(height: 16),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Hourly Rate: \$${_salaryRange.start.round()} - \$${_salaryRange.end.round()}'),
                    RangeSlider(
                      values: _salaryRange,
                      min: 50,
                      max: 500,
                      divisions: 45,
                      onChanged: (values) {
                        setState(() => _salaryRange = values);
                        _filterJobs();
                      },
                    ),
                  ],
                ),
              ],
            ),
          ),
          Expanded(
            child: Consumer<ApiService>(
              builder: (context, apiService, child) {
                if (apiService.loading) {
                  return Center(child: CircularProgressIndicator());
                }

                if (_filteredJobs.isEmpty && _searchController.text.isEmpty) {
                  _filterJobs();
                }

                if (_filteredJobs.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.search_off, size: 64, color: Colors.grey),
                        SizedBox(height: 16),
                        Text('No jobs found', style: TextStyle(fontSize: 18)),
                        Text('Try adjusting your search criteria'),
                      ],
                    ),
                  );
                }

                return ListView.builder(
                  itemCount: _filteredJobs.length,
                  itemBuilder: (context, index) {
                    final job = _filteredJobs[index];
                    return Card(
                      margin: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      child: ListTile(
                        title: Text(job.title),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(job.description, maxLines: 2, overflow: TextOverflow.ellipsis),
                            SizedBox(height: 4),
                            Text('${job.district} • \$${job.hourlyRate}/hr • ${job.duration}h'),
                          ],
                        ),
                        trailing: Icon(Icons.arrow_forward_ios),
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => JobDetailScreen(job: job),
                            ),
                          );
                        },
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }
}