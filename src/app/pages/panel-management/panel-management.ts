import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../Service/ApiService ';


@Component({
  selector: 'app-panel-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './panel-management.html',
  styleUrls: ['./panel-management.css']
})
export class PanelManagement implements OnInit {

  panels: any[] = [];

  panel = {
    name: '',
    email: '',
    role: '',
    password: '',
    available: true
  };

  constructor(private apiService: ApiService) { }

  ngOnInit(): void {
    this.loadPanels();
  }
  loadPanels(): void {
  this.apiService.getPanels(this.panel.role).subscribe({
    next: (data: any) => {
      this.panels = data;
    },
    error: (err: any) => {
      console.error(err);
    }
  });
}

  savePanel(): void {

    if (
      !this.panel.name ||
      !this.panel.email ||
      !this.panel.role ||
      !this.panel.password
    ) {
      alert('Please fill all fields');
      return;
    }

    this.apiService.createPanel(this.panel).subscribe({
      next: () => {

        alert('Panel Added Successfully');

        this.panel = {
          name: '',
          email: '',
          role: '',
          password: '',
          available: true
        };

        this.loadPanels();
      },
      error: (err: Error) => {
        console.error(err);
      }
    });
  }

  deletePanel(id: string): void {

    if (!confirm('Delete this panel?')) {
      return;
    }

    this.apiService.deletePanel(id).subscribe({
      next: () => {
        this.loadPanels();
      },
      error: (err) => {
        console.error(err);
      }
    });
  }
}