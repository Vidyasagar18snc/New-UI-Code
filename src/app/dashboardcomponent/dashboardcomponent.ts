import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ApiService } from '../Service/ApiService ';

@Component({
  selector: 'app-dashboardcomponent',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboardcomponent.html',
  styleUrls: ['./dashboardcomponent.css'],
})
export class Dashboardcomponent implements OnInit {
  candidates: any[] = [];
  filteredCandidates: any[] = [];
  loading = true;
  activeFilter = 'all';

  private avatarColors = ['#534AB7','#1D9E75','#D85A30','#185FA5','#993556','#BA7517'];

  stats = [
    { title: 'Total resumes', value: 0, colorClass: 'si-purple',
      svgPath: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>' },
    { title: 'Shortlisted', value: 0, colorClass: 'si-green',
      svgPath: '<polyline points="20 6 9 17 4 12"/>' },
    { title: 'Rejected', value: 0, colorClass: 'si-red',
      svgPath: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>' },
    { title: 'Pending', value: 0, colorClass: 'si-amber',
      svgPath: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>' },
  ];

  constructor(private api: ApiService,private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadCandidates();
    setTimeout(() => { if (!this.candidates.length) this.loadCandidates(); }, 1000);
  }

 loadCandidates() {
  this.loading = true;

  this.api.getCandidates().subscribe({
    next: (res: any) => {
      console.log("API Response:", res);

      this.candidates = [...(res || [])];
      this.applyFilter();
      this.updateStats();

      this.loading = false;

      this.cdr.detectChanges();
    },

    error: (err) => {
      console.error('Error loading candidates', err);
      this.loading = false;

      this.cdr.detectChanges();
    }
  });
}

  updateStats() {
    this.stats[0].value = this.candidates.length;
    this.stats[1].value = this.candidates.filter(c => c.status === 'Shortlisted').length;
    this.stats[2].value = this.candidates.filter(c => c.status === 'Rejected').length;
    this.stats[3].value = this.candidates.filter(c => c.status === 'Pending').length;
  }

  setFilter(status: string) {
    this.activeFilter = status;
    this.applyFilter();
  }

  applyFilter() {
    this.filteredCandidates = this.activeFilter === 'all'
      ? this.candidates
      : this.candidates.filter(c => c.status === this.activeFilter);
  }

  getInitials(name: string): string {
    return (name || '').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  }

  getAvatarColor(i: number): string { return this.avatarColors[i % this.avatarColors.length]; }
  getAvatarBg(i: number): string { return this.avatarColors[i % this.avatarColors.length] + '22'; }

  getScoreColor(score: number): string {
    return score >= 80 ? '#1D9E75' : score >= 65 ? '#BA7517' : '#E24B4A';
  }

  getBadgeClass(status: string): string {
    const map: any = { Shortlisted: 'b-green', Rejected: 'b-red', Pending: 'b-amber' };
    return map[status] || 'b-purple';
  }

  getDotClass(status: string): string {
    const map: any = { Shortlisted: 'bd-green', Rejected: 'bd-red', Pending: 'bd-amber' };
    return map[status] || 'bd-purple';
  }
}