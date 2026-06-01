import { Component } from '@angular/core';
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

  constructor(private api: ApiService, private router: Router) {}

  /** Clamps a rating field to [1, 5] after input */
  clampRating(field: 'technical' | 'communication' | 'problemSolving'): void {
    const val = this.feedback[field];
    if (val < 1) this.feedback[field] = 1;
    if (val > 5) this.feedback[field] = 5;
  }

  /** Submits feedback to backend via ApiService */
  submitFeedback(): void {
    this.loading = true;
    this.successMsg = '';

    this.api.create(this.feedback).subscribe({
      next: (res: any) => {
        console.log('Feedback submitted:', res);
        this.successMsg = 'Feedback submitted successfully!';
        this.loading = false;
        this.resetForm();
        this.router.navigate(['/Feedbackdashboard']);
      },
      error: (err: any) => {
        console.error('Submit error:', err);
        this.loading = false;
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
  }
}