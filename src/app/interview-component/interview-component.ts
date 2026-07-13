import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ApiService } from '../Service/ApiService ';
import { Router } from '@angular/router';

interface FeedbackForm {
  name: string;
  role: string;
  experience: number;
  round: string;
  technical: number;
  communication: number;
  problemSolving: number;
  createdBy: string;
}

interface RatingField {
  name: string;
  value: number;
  hover: number;
  isTech?: boolean;
  isComm?: boolean;
  isGeneral?: boolean;
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  selector: 'app-interview',
  templateUrl: './interview-component.html',
  styleUrls: ['./interview-component.css']
})
export class InterviewComponent {

  feedback: FeedbackForm = {
    name: '',
    role: '',
    experience: 0,
    round: '',
    technical: 0,
    communication: 0,
    problemSolving: 0,
    createdBy: ''
  };

  loading = false;
  successMsg = '';
  isSuggesting = false;
  activeField = '';

  // Dynamic Performance Rating fields
  ratingFields: RatingField[] = [
    { name: 'Technical', value: 0, hover: 0, isTech: true },
    { name: 'Communication', value: 0, hover: 0, isComm: true },
    { name: 'Skills', value: 0, hover: 0, isGeneral: true }
  ];

  constructor(private api: ApiService, private router: Router, private cdr: ChangeDetectorRef) {}

  /** AI suggestions engine simulation based on Job Role */
  suggestSkills(): void {
    if (!this.feedback.role) {
      alert('Please enter a role in the candidate details first.');
      return;
    }

    this.isSuggesting = true;

    // Dynamic timeout to simulate AI computation
    setTimeout(() => {
      const roleLower = this.feedback.role.toLowerCase();
      let suggested: RatingField[] = [];

      if (roleLower.includes('react') || roleLower.includes('angular') || roleLower.includes('vue') || roleLower.includes('frontend') || roleLower.includes('front-end') || roleLower.includes('web')) {
        suggested = [
          { name: roleLower.includes('react') ? 'React' : roleLower.includes('angular') ? 'Angular' : 'Frontend Frameworks', value: 0, hover: 0, isTech: true },
          { name: 'HTML & CSS', value: 0, hover: 0, isTech: true },
          { name: 'JavaScript', value: 0, hover: 0, isTech: true },
          { name: 'TypeScript', value: 0, hover: 0, isTech: true },
          { name: 'Communication', value: 0, hover: 0, isComm: true }
        ];
      } else if (roleLower.includes('java') || roleLower.includes('spring') || roleLower.includes('backend') || roleLower.includes('back-end')) {
        suggested = [
          { name: 'Core Java', value: 0, hover: 0, isTech: true },
          { name: 'Spring Boot', value: 0, hover: 0, isTech: true },
          { name: 'SQL Databases', value: 0, hover: 0, isTech: true },
          { name: 'REST APIs', value: 0, hover: 0, isTech: true },
          { name: 'Communication', value: 0, hover: 0, isComm: true }
        ];
      } else if (roleLower.includes('python') || roleLower.includes('data') || roleLower.includes('machine') || roleLower.includes('ml') || roleLower.includes('ai')) {
        suggested = [
          { name: 'Python Programming', value: 0, hover: 0, isTech: true },
          { name: 'Machine Learning / AI', value: 0, hover: 0, isTech: true },
          { name: 'SQL & Data Pipelines', value: 0, hover: 0, isTech: true },
          { name: 'Data Analysis & Visuals', value: 0, hover: 0, isTech: true },
          { name: 'Communication', value: 0, hover: 0, isComm: true }
        ];
      } else if (roleLower.includes('devops') || roleLower.includes('cloud') || roleLower.includes('aws') || roleLower.includes('docker') || roleLower.includes('kubernetes')) {
        suggested = [
          { name: 'Docker & Kubernetes', value: 0, hover: 0, isTech: true },
          { name: 'CI/CD Pipelines', value: 0, hover: 0, isTech: true },
          { name: 'AWS & Cloud Services', value: 0, hover: 0, isTech: true },
          { name: 'Bash & Python Scripting', value: 0, hover: 0, isTech: true },
          { name: 'Communication', value: 0, hover: 0, isComm: true }
        ];
      } else if (roleLower.includes('qa') || roleLower.includes('test') || roleLower.includes('automation') || roleLower.includes('selenium')) {
        suggested = [
          { name: 'Selenium / Playwright', value: 0, hover: 0, isTech: true },
          { name: 'Test Cases & Planning', value: 0, hover: 0, isTech: true },
          { name: 'API Testing (Postman)', value: 0, hover: 0, isTech: true },
          { name: 'Automation Coding', value: 0, hover: 0, isTech: true },
          { name: 'Communication', value: 0, hover: 0, isComm: true }
        ];
      } else if (roleLower.includes('designer') || roleLower.includes('ui') || roleLower.includes('ux') || roleLower.includes('figma')) {
        suggested = [
          { name: 'Figma & Design Tools', value: 0, hover: 0, isTech: true },
          { name: 'UI / Layout Design', value: 0, hover: 0, isTech: true },
          { name: 'UX & Prototyping', value: 0, hover: 0, isTech: true },
          { name: 'User Research', value: 0, hover: 0, isTech: true },
          { name: 'Communication', value: 0, hover: 0, isComm: true }
        ];
      } else if (roleLower.includes('manager') || roleLower.includes('product') || roleLower.includes('scrum') || roleLower.includes('agile')) {
        suggested = [
          { name: 'Agile & Scrum Practices', value: 0, hover: 0, isGeneral: true },
          { name: 'Roadmap & Strategy', value: 0, hover: 0, isGeneral: true },
          { name: 'Stakeholder Comm.', value: 0, hover: 0, isComm: true },
          { name: 'Project & Risk Mgmt', value: 0, hover: 0, isGeneral: true },
          { name: 'Team Leadership', value: 0, hover: 0, isGeneral: true }
        ];
      } else {
        // Fallback dynamic generator based on custom role names
        const words = this.feedback.role.split(/\s+/).filter(w => w.length > 2);
        const coreTech = words.length > 0 ? words[0] : 'Role Core Tech';
        suggested = [
          { name: `${coreTech} Core Skill`, value: 0, hover: 0, isTech: true },
          { name: 'Related Technologies', value: 0, hover: 0, isTech: true },
          { name: 'Problem Solving & Logic', value: 0, hover: 0, isGeneral: true },
          { name: 'Professional Skills', value: 0, hover: 0, isTech: true },
          { name: 'Communication', value: 0, hover: 0, isComm: true }
        ];
      }

      this.ratingFields = suggested;
      this.isSuggesting = false;
      this.cdr.detectChanges(); // Force view update immediately
    }, 1200);
  }

  /** Allow adding a new rating criteria dynamically */
  addCustomSkill(): void {
    const skillName = prompt('Enter the name of the custom skill:');
    if (skillName && skillName.trim()) {
      this.ratingFields.push({
        name: skillName.trim(),
        value: 0,
        hover: 0,
        isTech: true
      });
      this.cdr.detectChanges();
    }
  }

  /** Allow removing any of the rating criteria */
  removeSkill(index: number): void {
    if (this.ratingFields.length <= 1) {
      alert('You must have at least one rating category.');
      return;
    }
    this.ratingFields.splice(index, 1);
    this.cdr.detectChanges();
  }

  /** Calculate rounded average rating (1-5) across all rated fields */
  getAverageScore(): number {
    const ratedFields = this.ratingFields.filter(f => f.value > 0);
    if (ratedFields.length === 0) return 0;
    const total = ratedFields.reduce((sum, f) => sum + f.value, 0);
    return parseFloat((total / ratedFields.length).toFixed(1));
  }

  /** Get Recommendation based on score average */
  getRecommendation(): { text: string; class: string } {
    const avg = this.getAverageScore();
    if (avg === 0) return { text: 'Ratings Pending', class: 'pending' };
    if (avg < 2.5) return { text: 'Strong Reject', class: 'reject' };
    if (avg < 3.5) return { text: 'Borderline / Re-evaluate', class: 'borderline' };
    if (avg < 4.5) return { text: 'Recommend Hire', class: 'hire' };
    return { text: 'Strong Hire ✨', class: 'strong-hire' };
  }

  /** Compile formatted custom ratings summary string */
  private compileCustomRatingsSummary(): string {
    const rated = this.ratingFields.filter(f => f.value > 0);
    if (rated.length === 0) return '';
    return 'Detailed Performance Ratings: ' + rated.map(f => `${f.name} (${f.value}/5)`).join(', ');
  }

  /** Submits feedback to backend via ApiService mapping to expected DTO format */
  submitFeedback(): void {
    if (!this.feedback.name || !this.feedback.role) {
      alert('Please fill in candidate name and role.');
      return;
    }

    const techFields = this.ratingFields.filter(f => f.isTech && f.value > 0);
    const commFields = this.ratingFields.filter(f => f.isComm && f.value > 0);

    const techAvg = techFields.length > 0 ? Math.round(techFields.reduce((sum, f) => sum + f.value, 0) / techFields.length) : 0;
    const commAvg = commFields.length > 0 ? Math.round(commFields.reduce((sum, f) => sum + f.value, 0) / commFields.length) : 0;

    const otherFields = this.ratingFields.filter(f => f.value > 0 && !techFields.includes(f) && !commFields.includes(f));
    const problemSolvingAvg = otherFields.length > 0 ? Math.round(otherFields.reduce((sum, f) => sum + f.value, 0) / otherFields.length) : 0;

    const payload = {
      name: this.feedback.name,
      role: this.feedback.role,
      experience: this.feedback.experience,
      round: this.feedback.round,
      technical: techAvg || 1,
      communication: commAvg || 1,
      problemSolving: problemSolvingAvg || 1,
      createdBy: this.feedback.createdBy,
      customRatingsSummary: this.compileCustomRatingsSummary()
    };

    this.loading = true;
    this.successMsg = '';
    this.cdr.detectChanges();

    this.api.create(payload).subscribe({
      next: (res: any) => {
        console.log('Feedback submitted:', res);
        this.successMsg = 'Feedback submitted successfully!';
        this.loading = false;
        this.resetForm();
        this.cdr.detectChanges();
        setTimeout(() => {
          this.router.navigate(['/Feedbackdashboard']);
        }, 1500);
      },
      error: (err: any) => {
        console.error('Submit error:', err);
        this.loading = false;
        this.cdr.detectChanges();
        alert('Error submitting feedback. Please try again.');
      }
    });
  }

  private resetForm(): void {
    this.feedback = {
      name: '',
      role: '',
      experience: 0,
      round: '',
      technical: 0,
      communication: 0,
      problemSolving: 0,
      createdBy: ''
    };
    this.ratingFields = [
      { name: 'Technical', value: 0, hover: 0, isTech: true },
      { name: 'Communication', value: 0, hover: 0, isComm: true },
      { name: 'Skills', value: 0, hover: 0, isGeneral: true }
    ];
    this.activeField = '';
    this.cdr.detectChanges();
  }
}