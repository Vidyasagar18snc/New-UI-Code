import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private baseUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  // ✅ Create Job
  createJob(job: any) {
    return this.http.post(`${this.baseUrl}/jobs`, job);
  }

  // ✅ Upload Resume (FIXED URL)
  // uploadResume(file: File) {
  //   const formData = new FormData();
  //   formData.append('file', file);

  //   return this.http.post(`${this.baseUrl}/upload`, formData);
  // }
  uploadResume(file: File, role: string) {
  const formData = new FormData();

  formData.append('file', file);
  formData.append('role', role); // ✅ ADD THIS

  return this.http.post(`${this.baseUrl}/upload`, formData);
}

  // ✅ Get Candidates
  getCandidates() {
    return this.http.get(`${this.baseUrl}/resume`);
  }
  // ✅ Get Latest Job
// ✅ Get All Jobs
getAllJobs() {
  return this.http.get<any[]>(`${this.baseUrl}/jobs`);
}
}