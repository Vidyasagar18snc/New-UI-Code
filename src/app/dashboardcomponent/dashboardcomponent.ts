import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../Service/ApiService ';
import { Router, RouterModule } from '@angular/router';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  visible: boolean;
}

interface DeleteConfirm {
  show: boolean;
  candidate: any | null;
  deleting: boolean;
}

@Component({
  selector: 'app-dashboardcomponent',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './dashboardcomponent.html',
  styleUrls: ['./dashboardcomponent.css'],
})
export class Dashboardcomponent implements OnInit {

  candidates: any[] = [];
  filteredCandidates: any[] = [];
  loading = true;
  activeFilter = 'all';
  searchQuery = '';
  saving = false;
  greeting: string = '';
  loggedInUser: string = '';

  selectedCandidate: any = null;
  showEditModal = false;
  modalAnimating = false;

  toasts: Toast[] = [];
  private toastCounter = 0;
  private toastTimers: Map<number, any> = new Map();

  deleteConfirm: DeleteConfirm = { show: false, candidate: null, deleting: false };

  // ── PAGINATION ────────────────────────────────────────────────────────────
  pageSize = 10;
  pageSizeOptions = [10, 25, 50, 100];
  currentPage = 1;
  showFiltersDropdown = false;

  private avatarColors = [
    '#534AB7', '#1D9E75', '#D85A30',
    '#185FA5', '#993556', '#BA7517'
  ];

  stats: any[] = [
    {
      title: 'Total Employees', value: 0, colorClass: 'si-purple',
      delta: 'From uploaded resumes', deltaType: 'up',
      svgPath: `<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>`
    },
    {
      title: 'Open Positions', value: 24, colorClass: 'si-blue',
      delta: '↑ 3 from last month', deltaType: 'up',
      svgPath: `<rect x="2" y="7" width="20" height="14" rx="2"/>
                <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>`
    },
    {
      title: 'Onboarding', value: 23, colorClass: 'si-green',
      delta: '↑ 5 in progress', deltaType: 'up',
      svgPath: `<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="8.5" cy="7" r="4"/>
                <polyline points="17 11 19 13 23 9"/>`
    },
    {
      title: 'Exits (This Month)', value: 7, colorClass: 'si-red',
      delta: '↓ 2 from last month', deltaType: 'down',
      svgPath: `<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>`
    }
  ];

  lifecycle = [
    { label: 'Attract', count: 240, icon: 'target' },
    { label: 'Recruit', count: 83, icon: 'users' },
    { label: 'Onboard', count: 23, icon: 'user-plus' },
    { label: 'Employee', count: 1124, icon: 'user' },
    { label: 'transition', count: 178, icon: 'book' },
    { label: 'Exit', count: 7, icon: 'log-out' },
    { label: 'Offboard', count: 3, icon: 'arrow-right' },
    { label: 'Alumni', count: 268, icon: 'users' },
  ];

  workforceData = [
    { label: 'Engineering', count: 0, pct: 0, color: '#6d28d9' },
    { label: 'HR',          count: 0, pct: 0, color: '#2563eb' },
    { label: 'Admin',       count: 0, pct: 0, color: '#16a34a' },
  ];
  workforceTotal = 0;

  // ── CHRO INSIGHTS ────────────────────────────────────────────────────────
  chroInsights = [
    {
      key: 'attrition',
      icon: 'trending-up', color: '#6d28d9',
      title: 'Attrition Rate', subtitle: 'This month',
      value: '0%', delta: '0%', trend: 'down', sentiment: 'good'
    },
    {
      key: 'timeToHire',
      icon: 'clock', color: '#2563eb',
      title: 'Time to Hire', subtitle: 'Avg hiring turnaround',
      value: '0 days', delta: '0 days', trend: 'down', sentiment: 'good'
    },
    {
      key: 'offerAcceptance',
      icon: 'award', color: '#16a34a',
      title: 'Offer Acceptance Rate', subtitle: 'Offers accepted / total offers',
      value: '0%', delta: '0%', trend: 'up', sentiment: 'good'
    },
    {
      key: 'retention',
      icon: 'users', color: '#d97706',
      title: 'Employee Retention Rate', subtitle: 'Active retained employees',
      value: '0%', delta: '0%', trend: 'up', sentiment: 'good'
    },
    {
      key: 'pendingOnboarding',
      icon: 'folder', color: '#ec4899',
      title: 'Pending Onboarding', subtitle: 'Onboarding not yet completed',
      value: '0', delta: '0', trend: 'up', sentiment: 'bad'
    },
  ];

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.loggedInUser = localStorage.getItem('employeeName') || 'User';
    this.setGreeting();

    this.stats.forEach((s: any) => {
      s.safeSvg = this.sanitizer.bypassSecurityTrustHtml(s.svgPath);
    });

    this.loadTotalUploadedResumes();
    this.loadShortlistedCount();
    this.loadOpenPositionsCount();
    this.loadKTCount();
    this.loadDeboardingCount();
    this.loadAlumniCount();
    this.loadAttritionSummary();
    this.loadOfferAcceptanceSummary();
    this.loadPendingOnboardingSummary();
    this.loadRetentionSummary();
    this.loadDepartmentOverview();
    this.loadTimeToHireSummary();
    this.loadCandidates();
  }

  loadDepartmentOverview(): void {
    this.api.getDepartmentOverview().subscribe({
      next: (res: {
        totalEmployees: number;
        engineering: number;
        admin: number;
        hr: number;
        operations: number;
        finance: number;
      }) => {
        const eng = this.workforceData.find(w => w.label === 'Engineering');
        if (eng) eng.count = res.engineering;

        const hr = this.workforceData.find(w => w.label === 'HR');
        if (hr) hr.count = res.hr;

        const admin = this.workforceData.find(w => w.label === 'Admin');
        if (admin) admin.count = res.admin;

        this.workforceTotal = this.workforceData.reduce((sum, w) => sum + w.count, 0);
        this.workforceData.forEach(w => {
          w.pct = this.workforceTotal > 0 ? Math.round((w.count / this.workforceTotal) * 100) : 0;
        });

        this.cdr.detectChanges();
      },
      error: (err) => console.error('Failed to load department overview:', err)
    });
  }

  loadTimeToHireSummary(): void {
    this.api.getTimeToHireSummary().subscribe({
      next: (res: { currentMonthDays: number; lastMonthDays: number; change: number }) => {
        const row = this.chroInsights.find(i => i.key === 'timeToHire');
        if (row) {
          row.value = `${res.currentMonthDays} days`;
          row.trend = res.change > 0 ? 'up' : 'down';
          row.sentiment = res.change > 0 ? 'bad' : 'good';
          row.delta = `${Math.abs(res.change)} days`;
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load time to hire summary:', err);
      }
    });
  }

  loadRetentionSummary(): void {
    this.api.getRetentionSummary().subscribe({
      next: (res: { currentMonthRate: number; lastMonthRate: number; change: number }) => {
        const row = this.chroInsights.find(i => i.key === 'retention');
        if (row) {
          row.value = `${res.currentMonthRate}%`;
          row.trend = res.change >= 0 ? 'up' : 'down';
          row.sentiment = res.change >= 0 ? 'good' : 'bad';
          row.delta = `${Math.abs(res.change)}%`;
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load retention summary:', err);
      }
    });
  }

  loadPendingOnboardingSummary(): void {
    this.api.getPendingOnboardingSummary().subscribe({
      next: (res: { currentMonthPendingCount: number; lastMonthPendingCount: number; change: number }) => {
        const row = this.chroInsights.find(i => i.key === 'pendingOnboarding');
        if (row) {
          row.value = `${res.currentMonthPendingCount}`;
          row.trend = res.change > 0 ? 'up' : 'down';
          row.sentiment = res.change > 0 ? 'bad' : 'good';
          row.delta = `${Math.abs(res.change)}`;
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load pending onboarding summary:', err);
      }
    });
  }

  loadOfferAcceptanceSummary(): void {
    this.api.getOfferAcceptanceSummary().subscribe({
      next: (res: { currentMonthRate: number; lastMonthRate: number; change: number }) => {
        const row = this.chroInsights.find(i => i.key === 'offerAcceptance');
        if (row) {
          row.value = `${res.currentMonthRate}%`;
          row.trend = res.change >= 0 ? 'up' : 'down';
          row.sentiment = res.change >= 0 ? 'good' : 'bad';
          row.delta = `${Math.abs(res.change)}%`;
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load offer acceptance summary:', err);
      }
    });
  }

  loadTotalUploadedResumes(): void {
    this.api.getTotalUploadedResumes().subscribe({
      next: (res: { totalUploadedResumes: number }) => {
        const total = res.totalUploadedResumes;

        this.stats[0].value = total;
        this.stats[0].delta = `${total} uploaded resumes`;

        const empStage = this.lifecycle.find(s => s.label === 'Employee');
        if (empStage) empStage.count = total;

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load total resumes:', err);
      }
    });
  }

  loadShortlistedCount(): void {
    this.api.getShortlistedCount().subscribe({
      next: (count: number) => {
        this.stats[2].value = count;
        this.stats[2].delta = `${count} shortlisted candidates`;

        const onboardStage = this.lifecycle.find(s => s.label === 'Onboard');
        if (onboardStage) onboardStage.count = count;

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load shortlisted count:', err);
      }
    });
  }

  loadOpenPositionsCount(): void {
    this.api.getOpenPositionsCount().subscribe({
      next: (count: number) => {
        this.stats[1].value = count;
        this.stats[1].delta = `${count} open positions`;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load open positions count:', err);
      }
    });
  }

  loadKTCount(): void {
    this.api.getTotalKTCount().subscribe({
      next: (count: number) => {
        const ktStage = this.lifecycle.find(s => s.label === 'transition');
        if (ktStage) ktStage.count = count;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load KT count:', err);
      }
    });
  }

  loadDeboardingCount(): void {
    this.api.getTotalDeboardingCount().subscribe({
      next: (count: number) => {
        const exitStage = this.lifecycle.find(s => s.label === 'Exit');
        if (exitStage) exitStage.count = count;
        this.stats[3].value = count;
        this.stats[3].delta = `${count} total exits`;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load deboarding count:', err);
      }
    });
  }

  loadAlumniCount(): void {
    this.api.getTotalAlumniCount().subscribe({
      next: (res: { alumniCount: number }) => {
        const alumniStage = this.lifecycle.find(s => s.label === 'Alumni');
        if (alumniStage) alumniStage.count = res.alumniCount;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load alumni count:', err);
      }
    });
  }

  // ── ATTRITION RATE (CHRO INSIGHTS) ────────────────────────────────────────

  loadAttritionSummary(): void {
    this.api.getAttritionSummary().subscribe({
      next: (res: { currentMonthRate: number; lastMonthRate: number; change: number }) => {
        const row = this.chroInsights.find(i => i.key === 'attrition');
        if (row) {
          row.value = `${res.currentMonthRate}%`;
          row.trend = res.change > 0 ? 'up' : 'down';
          row.sentiment = res.change > 0 ? 'bad' : 'good';
          row.delta = `${Math.abs(res.change)}%`;
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load attrition summary:', err);
      }
    });
  }

  // ── CANDIDATES ────────────────────────────────────────────────────────────

  loadCandidates(): void {
    this.loading = true;
    this.api.getCandidates().subscribe({
      next: (res: any) => {
        this.candidates = Array.isArray(res)
          ? [...res]
          : Array.isArray(res?.data) ? [...res.data] : [];

        this.applyFilter();
        this.updateLifecycleFromCandidates();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        this.showToast('Failed to load candidates. Please try again.', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  viewResume(candidate: any): void {
    const candidateId = candidate.candidateId || candidate.id;
    const url = this.api.getResumeViewUrl(candidateId);
    window.open(url, '_blank');
  }

  updateLifecycleFromCandidates(): void {
    const attractCount = this.candidates.length;
    const recruitCount = this.candidates.filter(c => c.status === 'Shortlisted').length;

    const attractStage = this.lifecycle.find(s => s.label === 'Attract');
    if (attractStage) attractStage.count = attractCount;

    const recruitStage = this.lifecycle.find(s => s.label === 'Recruit');
    if (recruitStage) recruitStage.count = recruitCount;
  }

  setFilter(status: string): void {
    this.activeFilter = status;
    this.applyFilter();
  }

  applyFilter(): void {
    let temp = this.activeFilter === 'all'
      ? this.candidates
      : this.candidates.filter(c => c.status === this.activeFilter);

    if (this.searchQuery && this.searchQuery.trim() !== '') {
      const q = this.searchQuery.toLowerCase().trim();
      temp = temp.filter(c =>
        c.name?.toLowerCase().includes(q) ||
        c.role?.toLowerCase().includes(q) ||
        (c.matchedSkills && c.matchedSkills.some((s: string) => s.toLowerCase().includes(q)))
      );
    }
    this.filteredCandidates = temp;
    this.currentPage = 1; // reset pagination whenever filter/search changes
  }

  // ── PAGINATION HELPERS ───────────────────────────────────────────────────

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredCandidates.length / this.pageSize));
  }

  get pagedCandidates(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredCandidates.slice(start, start + this.pageSize);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get pageStart(): number {
    return this.filteredCandidates.length === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }

  get pageEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredCandidates.length);
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
  }

  goToPage(p: number): void {
    if (p < 1 || p > this.totalPages) return;
    this.currentPage = p;
  }

  prevPage(): void { this.goToPage(this.currentPage - 1); }
  nextPage(): void { this.goToPage(this.currentPage + 1); }

  // ── TOOLBAR ACTIONS ──────────────────────────────────────────────────────

  goToNewApplicant(): void {
    this.router.navigate(['/upload']);
  }

  toggleFiltersDropdown(): void {
    this.showFiltersDropdown = !this.showFiltersDropdown;
  }

  exportCandidates(): void {
    const rows = this.filteredCandidates;

    if (!rows.length) {
      this.showToast('No candidates to export', 'warning');
      return;
    }

    const headers = ['Applicant ID', 'Name', 'Role', 'Score', 'Status', 'Applied Date'];

    const escapeCsv = (val: any): string => {
      const str = String(val ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvRows = rows.map(c => [
      c.candidateId || c.id || '',
      c.name || '',
      c.role || '',
      c.score ?? '',
      c.status || '',
      c.appliedDate || ''
    ]);

    const csvContent = [headers, ...csvRows]
      .map(row => row.map(escapeCsv).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 10);

    link.href = url;
    link.setAttribute('download', `candidates_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    this.showToast(`Exported ${rows.length} candidate(s)`, 'success');
  }

  // ── EDIT MODAL ────────────────────────────────────────────────────────────

  editCandidate(candidate: any): void {
    this.selectedCandidate = { ...candidate };
    this.showEditModal = true;
    setTimeout(() => { this.modalAnimating = true; }, 10);
  }

  closeModal(): void {
    this.modalAnimating = false;
    setTimeout(() => { this.showEditModal = false; }, 300);
  }

  saveCandidate(): void {
    if (!this.selectedCandidate || this.saving) return;

    const candidateId = this.selectedCandidate.candidateId || this.selectedCandidate.id;
    this.saving = true;

    this.api.updateCandidate(candidateId, this.selectedCandidate).subscribe({
      next: (updated: any) => {
        const resolved = updated?.data ?? updated;
        const index = this.candidates.findIndex(
          c => (c.candidateId || c.id) === (resolved.candidateId || resolved.id)
        );

        if (index !== -1) {
          this.candidates[index] = resolved;
        } else {
          const localIdx = this.candidates.findIndex(
            c => (c.candidateId || c.id) === candidateId
          );
          if (localIdx !== -1) this.candidates[localIdx] = { ...this.selectedCandidate };
        }

        this.applyFilter();
        this.updateLifecycleFromCandidates();
        this.saving = false;
        this.closeModal();
        this.showToast(`${resolved.name || 'Candidate'} updated successfully`, 'success');
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.saving = false;
        this.showToast(err?.error?.message || 'Update failed. Please try again.', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  // ── VIEW FEEDBACK ─────────────────────────────────────────────────────────

  viewFeedback(candidate: any): void {
    const candidateId = candidate.candidateId || candidate.id;
    this.router.navigate(['/Feedbackdashboard'], {
      queryParams: {
        candidateId: candidateId,
        name: candidate.name,
        role: candidate.role
      }
    });
  }

  // ── DELETE CONFIRM ────────────────────────────────────────────────────────

  confirmDelete(candidate: any): void {
    this.deleteConfirm = { show: true, candidate, deleting: false };
  }

  cancelDelete(): void {
    this.deleteConfirm = { show: false, candidate: null, deleting: false };
  }

  executeDelete(): void {
    if (!this.deleteConfirm.candidate || this.deleteConfirm.deleting) return;

    const candidate = this.deleteConfirm.candidate;
    const candidateId = candidate.candidateId || candidate.id;
    this.deleteConfirm.deleting = true;

    this.api.deleteCandidate(candidateId).subscribe({
      next: () => {
        this.candidates = this.candidates.filter(
          c => (c.candidateId || c.id) !== candidateId
        );
        this.applyFilter();
        this.updateLifecycleFromCandidates();
        this.deleteConfirm = { show: false, candidate: null, deleting: false };
        this.showToast(`${candidate.name} removed from the system`, 'warning');
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.deleteConfirm.deleting = false;
        this.showToast(err?.error?.message || 'Delete failed. Please try again.', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  // ── TOAST SYSTEM ─────────────────────────────────────────────────────────

  showToast(message: string, type: Toast['type'] = 'success'): void {
    const id = ++this.toastCounter;
    const toast: Toast = { id, message, type, visible: false };
    this.toasts.push(toast);

    setTimeout(() => {
      const t = this.toasts.find(x => x.id === id);
      if (t) { t.visible = true; this.cdr.detectChanges(); }
    }, 20);

    const timer = setTimeout(() => this.dismissToast(id), 3500);
    this.toastTimers.set(id, timer);
  }

  dismissToast(id: number): void {
    const toast = this.toasts.find(t => t.id === id);
    if (!toast) return;
    toast.visible = false;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.toasts = this.toasts.filter(t => t.id !== id);
      clearTimeout(this.toastTimers.get(id));
      this.toastTimers.delete(id);
      this.cdr.detectChanges();
    }, 400);
  }

  toastIcon(type: Toast['type']): string {
    const icons: Record<Toast['type'], string> = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };
    return icons[type];
  }

  setGreeting(): void {
    const hour = new Date().getHours();
    if (hour < 12) {
      this.greeting = 'Morning';
    } else if (hour < 17) {
      this.greeting = 'Afternoon';
    } else {
      this.greeting = 'Evening';
    }
  }

  getInitials(name: string): string {
    return (name || '').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  }

  getAvatarColor(i: number): string {
    return this.avatarColors[i % this.avatarColors.length];
  }

  getAvatarBg(i: number): string {
    return this.avatarColors[i % this.avatarColors.length] + '22';
  }

  getScoreColor(score: number): string {
    return score >= 80 ? '#1D9E75' : score >= 65 ? '#BA7517' : '#E24B4A';
  }

  getBadgeClass(status: string): string {
    return { Shortlisted: 'b-green', Rejected: 'b-red', Pending: 'b-amber' }[status] || 'b-purple';
  }

  getDotClass(status: string): string {
    return { Shortlisted: 'bd-green', Rejected: 'bd-red', Pending: 'bd-amber' }[status] || 'bd-purple';
  }

  // ── DONUT CHART HELPERS ───────────────────────────────────────────────────
  private readonly CIRCUMFERENCE = 2 * Math.PI * 48;

  // NOTE: now takes raw `count`, not the rounded `pct`, so the three arcs
  // always sum to exactly 100% of the circle (no seam gap from rounding).
  getDashArray(count: number): string {
    const fraction = this.workforceTotal > 0 ? count / this.workforceTotal : 0;
    const len = fraction * this.CIRCUMFERENCE;
    const rest = this.CIRCUMFERENCE - len;
    return `${len.toFixed(3)} ${rest.toFixed(3)}`;
  }

  getDashOffset(uptoIndex: number): string {
    let cumulativeCount = 0;
    for (let i = 0; i <= uptoIndex; i++) {
      cumulativeCount += this.workforceData[i].count;
    }
    const fraction = this.workforceTotal > 0 ? cumulativeCount / this.workforceTotal : 0;
    const offset = fraction * this.CIRCUMFERENCE;
    return `-${offset.toFixed(3)}`;
  }

  get scoreChartData() {
    const sorted = [...this.candidates].sort((a, b) => a.score - b.score);
    const width = 280;
    const height = 100;
    const padX = 10;
    const padY = 15;

    if (sorted.length === 0) {
      return { linePath: '', areaPath: '', points: [] as any[] };
    }

    const points: { x: number, y: number, score: number, name: string }[] = [];
    const stepX = sorted.length > 1 ? (width - padX * 2) / (sorted.length - 1) : 0;

    sorted.forEach((c, idx) => {
      const x = padX + idx * stepX;
      const y = height - padY - (c.score / 100) * (height - padY * 2);
      points.push({ x, y, score: c.score, name: c.name });
    });

    let linePath = '';
    let areaPath = '';

    if (points.length > 0) {
      linePath = 'M ' + points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ');
      areaPath = `M ${points[0].x.toFixed(1)},${height} L ` +
        points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ') +
        ` L ${points[points.length - 1].x.toFixed(1)},${height} Z`;
    }

    return { linePath, areaPath, points };
  }

  get topSkills(): { name: string, count: number }[] {
    const counts: Record<string, number> = {};
    this.candidates.forEach(c => {
      if (c.matchedSkills && Array.isArray(c.matchedSkills)) {
        c.matchedSkills.forEach((s: string) => {
          if (s) {
            counts[s] = (counts[s] || 0) + 1;
          }
        });
      }
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }

  get pipelineStats() {
    const total = this.candidates.length || 1;
    const shortlisted = this.candidates.filter(c => c.status === 'Shortlisted').length;
    const pending = this.candidates.filter(c => c.status === 'Pending').length;
    const rejected = this.candidates.filter(c => c.status === 'Rejected').length;

    return {
      shortlistedPct: Math.round((shortlisted / total) * 100),
      pendingPct: Math.round((pending / total) * 100),
      rejectedPct: Math.round((rejected / total) * 100),
      shortlisted,
      pending,
      rejected,
      total: this.candidates.length
    };
  }
}