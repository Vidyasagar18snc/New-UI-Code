import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

export interface MenuItem {
  name: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-sidebarcomponent',
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebarcomponent.html',
  styleUrl: './sidebarcomponent.css',
})
export class Sidebarcomponent {
  private router = inject(Router);

  showLogoutModal = false;

  confirmLogout(): void {
    this.showLogoutModal = true;
  }

  cancelLogout(): void {
    this.showLogoutModal = false;
  }

  logout(): void {
    this.showLogoutModal = false;
    localStorage.clear();
    this.router.navigate(['/PortalLogin']);
  }
  menu: MenuItem[] = [
  { name: 'Dashboard', icon: 'layout-dashboard', route: '/dashboard' },

  // Recruitment
  { name: 'Job Description', icon: 'file-text', route: '/job' },
  { name: 'JD Details', icon: 'briefcase-business', route: '/jd-details' },
  { name: 'AI Resume Screening', icon: 'upload-cloud', route: '/upload' },
  { name: 'Candidate Assessment Rank', icon: 'trophy', route: '/rank' },
  { name: 'Panel', icon: 'users-round', route: '/panel-management' },
  { name: 'Interview Schedule', icon: 'calendar-days', route: '/interview-dashboard' },
  { name: 'Candidate Interview Feedback', icon: 'message-square-check', route: '/interviewFeedback' },
  { name: 'Feedback Dashboard', icon: 'bar-chart-3', route: '/Feedbackdashboard' },
  { name: 'Offer Letter', icon: 'file-signature', route: '/offer-letter' },

  // Onboarding
  { name: 'HR Doc Verification', icon: 'badge-check', route: '/hr-document-verification' },
  { name: 'Employee Details', icon: 'user-round', route: '/Employee-Details' },
  { name: 'Employee Asset', icon: 'boxes', route: '/assestdashboard' },
  { name: 'Asset Tracking', icon: 'laptop', route: '/asset-tracking' },

  // Offboarding
  { name: 'KT Transfer', icon: 'book-open-check', route: '/deboarding-dashboard' },

  // Reports
  { name: 'Analytics', icon: 'line-chart', route: '/Analytics' }
];

}
