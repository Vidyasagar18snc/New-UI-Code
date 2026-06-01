import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

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
  menu: MenuItem[] = [
    { name: 'Dashboard',                icon: 'layout-dashboard',    route: '/' },
    { name: 'Upload Resume',            icon: 'upload-cloud',        route: '/upload' },
    { name: 'Job Description',          icon: 'file-text',           route: '/job' },
    { name: 'JD Details',              icon: 'briefcase-business',  route: '/jd-details' },
    { name: 'Interview Feedback',       icon: 'message-square-check',route: '/interviewFeedback' },
    { name: 'Offer Letter',            icon: 'file-signature',      route: '/offer-letter' },
    { name: 'Ranking',                 icon: 'trophy',              route: '/rank' },
    { name: 'Feedback Dashboard',      icon: 'bar-chart-3',         route: '/Feedbackdashboard' },
    { name: 'Asset Tracking',          icon: 'laptop',              route: '/asset-tracking' },
    { name: 'Analytics',               icon: 'line-chart',          route: '/Analytics' },
    { name: 'Test',                    icon: 'flask-conical',       route: '/test' },
    { name: 'Employee Dashboard',      icon: 'users',               route: '/employee-dashboard' },
    { name: 'HR Doc Verification',     icon: 'badge-check',         route: '/hr-document-verification' },
    { name: 'Interview Schedule',      icon: 'calendar-days',       route: '/interview-dashboard' },
    { name: 'Employee Details',        icon: 'user-round',          route: '/Employee-Details' },
    { name: 'Asset Management',        icon: 'boxes',               route: '/assestdashboard' },
  ];
}