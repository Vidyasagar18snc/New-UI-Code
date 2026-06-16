import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

 

@Injectable({
  providedIn: 'root',
})
export class ApiService {

  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}


  // ✅ Create Job
  createJob(job: any) {
    return this.http.post(`${this.baseUrl}/jobs`, job);
  }

  uploadResume(file: File, role: string) {
    const formData = new FormData();

    formData.append('file', file);
    formData.append('role', role); // ✅ ADD THIS

    return this.http.post(`${this.baseUrl}/upload`, formData);
  }

  getCandidates() {
    return this.http.get(`${this.baseUrl}/resume`);
  }

  getAllJobs() {
    return this.http.get<any[]>(`${this.baseUrl}/jobs`);
  }
  validateInterview(token: string) {
    return this.http.get<any>(`${this.baseUrl}/test/validate?token=${token}`);
  }

  getQuestions() {
    return this.http.get<any[]>(`${this.baseUrl}/test/questions`);
  }

  submitTest(payload: any) {
    return this.http.post(`${this.baseUrl}/submit`, payload);
  }
  getRanking() {
    return this.http.get<any[]>(`${this.baseUrl}/all`);
  }
  // 🔥 NEW → Upload JD
  uploadJD(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post(`${this.baseUrl}/upload-jd`, formData);
  }
  create(feedback: any) {
    return this.http.post(`${this.baseUrl}/feedback`, feedback);
  }
  getDashboard() {
    return this.http.get(`${this.baseUrl}/feedback/dashboard`);
  }
  sendOffer(data: any) {
    return this.http.post(`${this.baseUrl}/send`, data);
  }
  updateJob(id: string, data: any) {
    return this.http.put(`${this.baseUrl}/jobs/${id}`, data);
    //
  }
  deleteJob(id: string | number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/jobs/${id}`);
  }
  getShortlistedCandidates() {
    return this.http.get<any[]>(`${this.baseUrl}/shortlisted`);
  }
  getPanels(role: string) {
    return this.http.get(`${this.baseUrl}/by-role?role=${role}`);
  }
  getAvailableSlots(panelEmail: string, date: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/free-slots?email=${panelEmail}&date=${date}`);
  }
  scheduleInterview(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/schedule-interview`, payload);
  }
  panelLogin(data: any) {
    return this.http.post(
      `${this.baseUrl}/panel/login`,

      data,
    );
  }
  getMyCandidates(panelId: string) {
    return this.http.get(`${this.baseUrl}/my-candidates/${panelId}`);
  }
  getSlots(token: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/slots?token=${token}`);
  }

  // Select Slot

  selectSlot(payload: any): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/select-slot`,

      payload,
    );
  }
  getOfferByToken(token: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/${token}`);
  }

  // ACCEPT / REJECT OFFER

respondOffer(
  token: string,
  action: string,
  rejectionReason?: string
): Observable<any> {

  let url =
    `${this.baseUrl}/respond?token=${token}&action=${action}`;

  if (rejectionReason) {
    url += `&rejectionReason=${encodeURIComponent(rejectionReason)}`;
  }

  return this.http.post(url, {});
}
  uploadDocuments(formData: FormData) {
    return this.http.post(
      `${this.baseUrl}/onboarding/upload-document`,

      formData,
    );
  }
  // GET DOCUMENTS

  getDocuments() {
    return this.http.get(`${this.baseUrl}/onboarding/documents`);
  }

  // VERIFY DOCUMENT

  verifyAllDocuments(candidateId: string) {
    return this.http.post(
      `${this.baseUrl}/onboarding/verify-all-documents?candidateId=${candidateId}`,

      {},
    );
  }
  employeeLogin(payload: any) {
    return this.http.post(
      `${this.baseUrl}/login`,

      payload,
    );
  }
  resetPassword(payload: any) {
    return this.http.post(
      `${this.baseUrl}/reset-password`,

      payload,
    );
  }
 

  employeeCheckIn(employeeId: string) {
    return this.http.post(
      `${this.baseUrl}/attendance/checkin/${employeeId}`,

      {},
    );
  }

  employeeCheckOut(employeeId: string) {
    return this.http.post(
      `${this.baseUrl}/attendance/checkout/${employeeId}`,

      {},
    );
  }

  

  getTotalAttendance(employeeId: string) {
    return this.http.get(`${this.baseUrl}/attendance/total/${employeeId}`);
  }



  getLeaveBalance(employeeId: string) {
    return this.http.get(`${this.baseUrl}/attendance/leaves/${employeeId}`);
  }

  // TODAY ATTENDANCE

  getTodayAttendance(employeeId: string) {
    return this.http.get(`${this.baseUrl}/attendance/today/${employeeId}`);
  }
  createAsset(data:any){
return this.http.post(`${this.baseUrl}/create`,data);
}

getAllAssets(){
return this.http.get(`${this.baseUrl}/assets`);
}

assignAsset(
  assetId: string,
  employeeId: string,
  assignedBy: string,
  assetType: string,
  condition: string,
  remarks: string,
  accessories: string
) {
  return this.http.post(
    `${this.baseUrl}/assign`,
    {},
    {
      params: {
        assetId,
        employeeId,
        assignedBy,
        assetType,
        condition,
        remarks,
        accessories
      }
    }
  );
}

returnAsset(assetId:string,employeeId:string){
return this.http.post(
`${this.baseUrl}/return?assetId=${assetId}&employeeId=${employeeId}`,
{}
);
}
getEmployeeAssets(
  employeeId: string
) {

  return this.http.get(

    `${this.baseUrl}/employee/${employeeId}`
  );
}
updateAsset(id: string, asset: any) {

  return this.http.put(
    `${this.baseUrl}/update/${id}`,
    asset
  );
}
deleteAsset(id: string) {

  return this.http.delete(
    `${this.baseUrl}/delete/${id}`
  );
}
getAllEmployees() {

  return this.http.get(

    `${this.baseUrl}/Employee`
  );
}
getAssetTracking() {

  return this.http.get(

    `${this.baseUrl}/tracking`
  );
}
getTotalEmployeesCount(): Observable<number> {
  return this.http.get<number>(`${this.baseUrl}/employees/count`);
}
// ==============================
// DEBOARDING APIs
// ==============================

initiateDeboarding(data: any) {
  return this.http.post(
    `${this.baseUrl}/Deboardinitiate`,
    data
  );
}

getAllDeboarding() {
  return this.http.get(
    `${this.baseUrl}/Deboardingall`
  );
}



initiateKT(formData: FormData) {

  return this.http.post(
    `${this.baseUrl}/ktinitiate`,
    formData
  );
}

completeKT(employeeId: string) {
  return this.http.post(
    `${this.baseUrl}/ktcomplete?employeeId=${employeeId}`,
    {}
  );
}
  createPanel(panel: any) {
    return this.http.post(`${this.baseUrl}/add`, panel);
  }

  updatePanel(id: string, panel: any) {
    return this.http.put(`${this.baseUrl}/panels/${id}`, panel);
  }

  deletePanel(id: string) {
    return this.http.delete(`${this.baseUrl}/panels/${id}`);
  }
  getAllPanels() {
  return this.http.get(`${this.baseUrl}/panels`);
}
// Forgot Password - Send OTP
forgotPassword(email: string) {
  return this.http.post(
    `${this.baseUrl}/forgot-password?email=${email}`,
    {},
    { responseType: 'text' }
  );
}

// Verify OTP and Reset Password
 verifyOtpAndResetPassword(
  email: string,
  otp: string,
  newPassword: string
) {
  return this.http.post(
    `${this.baseUrl}/forgot-password/reset?email=${email}&otp=${otp}&newPassword=${newPassword}`,
    {},
    { responseType: 'text' }
  );
}
deleteCandidate(id: string) {
  return this.http.delete(
    `${this.baseUrl}/resume/${id}`,
    { responseType: 'text' }
  );
}
// updateCandidate(id: string, payload: any) {
//   return this.http.put<any>(
//     `${this.baseUrl}/update-dashboard/${id}`,
//     payload
//   );
// }
updateCandidate(id: string, candidate: any): Observable<any> {
  return this.http.put(`${this.baseUrl}/candidates/${id}`, {
    name:   candidate.name,
    role:   candidate.role,
    score:  candidate.score,
    status: candidate.status
  });
}
getDocumentUrl(s3Key: string) {
  return this.http.get(
    `${this.baseUrl}/onboarding/document/view?s3Key=${encodeURIComponent(s3Key)}`,
    { responseType: 'text' }
  );
}
getAllOnboardingCandidates() {
  return this.http.get(
    `${this.baseUrl}/onboarding/all`
  );
}

sendBackgroundVerification(
  id: string,
  hrEmail: string
) {
  return this.http.post(
    `${this.baseUrl}/onboarding/background-verification`,
    {},
    {
      params: {
        id,
        hrEmail
      }
    }
  );
}
}
