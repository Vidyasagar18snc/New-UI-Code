import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../Service/ApiService ';

// ✅ FIXED IMPORT (no space + correct path)


@Component({
  selector: 'app-jdcomponent',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './jdcomponent.html',
  styleUrls: ['./jdcomponent.css']
})
export class Jdcomponent {

  constructor(private api: ApiService) {}

  jobTitle = '';
  experience = '';
  location = '';
  description = '';

  skillInput = '';
  skills: string[] = [];

  addSkill() {
    if (this.skillInput.trim()) {
      this.skills.push(this.skillInput.trim());
      this.skillInput = '';
    }
  }

  removeSkill(index: number) {
    this.skills.splice(index, 1);
  }

  // ✅ UPDATED API CALL
  submitJob() {

    console.log("Button Clicked"); // 🔍 DEBUG

    const jobData = {
      title: this.jobTitle,
      skills: this.skills,
      experience: Number(this.experience),
      location: this.location,        // ✅ added
      description: this.description   // ✅ added
    };

    console.log("Sending Data:", jobData); // 🔍 DEBUG

    this.api.createJob(jobData).subscribe({
      next: (res) => {
        console.log("Success:", res);
        alert('Job Created Successfully');
      },
      error: (err) => {
        console.error("Error:", err);
        alert('Error creating job');
      }
    });
  }
}