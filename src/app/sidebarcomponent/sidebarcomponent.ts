import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebarcomponent',
imports: [CommonModule, RouterModule],
  templateUrl: './sidebarcomponent.html',
  styleUrl: './sidebarcomponent.css',
})
export class Sidebarcomponent {
 menu = [
    { name: 'Dashboard', icon: '📊', route: '/' },
    { name: 'Upload Resume', icon: '📤', route: '/upload' },
    { name: 'Job Description', icon: '🧾', route: '/job' },
    { name: 'Jd Details', icon: '💼', route: '/jd-details' },
    { name: 'Smart Matching', icon: '🎯', route: '/matching' },
    { name: 'Fake Detection', icon: '🚨', route: '/detection' },
    { name: 'Ranking', icon: '🏆', route: '/ranking' },
    { name: 'Interview', icon: '📅', route: '/interview' },
    { name: 'Email', icon: '✉️', route: '/email' },
    { name: 'Analytics', icon: '📊', route: '/analytics' }
  ];
}
