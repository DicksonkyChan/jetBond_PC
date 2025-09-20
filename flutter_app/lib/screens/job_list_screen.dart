import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../models/job.dart';
import 'job_detail_screen.dart';

class JobListScreen extends StatefulWidget {
  @override
  _JobListScreenState createState() => _JobListScreenState();
}

class _JobListScreenState extends State<JobListScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ApiService>().fetchJobs();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('JetBond Jobs'),
        actions: [
          IconButton(
            icon: Icon(Icons.refresh),
            onPressed: () => context.read<ApiService>().fetchJobs(),
          ),
        ],
      ),
      body: Consumer<ApiService>(
        builder: (context, apiService, child) {
          if (apiService.loading) {
            return Center(child: CircularProgressIndicator());
          }
          
          if (apiService.error != null) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.error_outline, size: 64, color: Colors.red),
                  SizedBox(height: 16),
                  Text('Connection Error', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  SizedBox(height: 8),
                  Text(apiService.error!, textAlign: TextAlign.center),
                  SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () {
                      apiService.clearError();
                      apiService.fetchJobs();
                    },
                    child: Text('Retry'),
                  ),
                ],
              ),
            );
          }
          
          if (apiService.jobs.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.work_off, size: 64, color: Colors.grey),
                  SizedBox(height: 16),
                  Text('No jobs available', style: TextStyle(fontSize: 18)),
                  SizedBox(height: 8),
                  Text('Check back later for new opportunities'),
                  SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () => apiService.fetchJobs(),
                    child: Text('Refresh'),
                  ),
                ],
              ),
            );
          }
          
          return ListView.builder(
            itemCount: apiService.jobs.length,
            itemBuilder: (context, index) {
              final job = apiService.jobs[index];
              final jobObj = Job.fromJson(job);
              return Card(
                margin: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: ListTile(
                  title: Text(jobObj.title),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        jobObj.description,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      SizedBox(height: 8),
                      Row(
                        children: [
                          Icon(Icons.location_on, size: 16, color: Colors.grey),
                          Text('${jobObj.district}'),
                          SizedBox(width: 16),
                          Icon(Icons.attach_money, size: 16, color: Colors.green),
                          Text('\$${jobObj.hourlyRate}/hr'),
                          SizedBox(width: 16),
                          Icon(Icons.access_time, size: 16, color: Colors.grey),
                          Text('${jobObj.duration}h'),
                        ],
                      ),
                    ],
                  ),
                  trailing: Icon(Icons.arrow_forward_ios),
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => JobDetailScreen(job: jobObj),
                      ),
                    );
                  },
                ),
              );
            },
          );
        },
      ),

    );
  }
}