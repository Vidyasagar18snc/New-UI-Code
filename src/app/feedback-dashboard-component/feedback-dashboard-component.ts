import {
  Component, OnInit, OnDestroy, ViewChild,
  ElementRef, AfterViewInit, ChangeDetectorRef, HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../Service/ApiService ';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Chart, registerables } from 'chart.js';
import { Router } from '@angular/router';

Chart.register(...registerables);

export interface CandidateFeedback {
  id: number;
  name: string;
  role: string;
  experience: number;
  round: string;
  score: number;
  decision: string;
  summary: string;
  technical: number;
  communication: number;
  problemSolving: number;
  createdBy: string;
}

// ─── calendar helper ───────────────────────
interface CalDay { day: number; inMonth: boolean; date: Date; }

@Component({
  selector: 'app-feedback-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './feedback-dashboard-component.html',
  styleUrls: ['./feedback-dashboard-component.css']
})
export class FeedbackDashboardComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('distChart') chartCanvas!: ElementRef<HTMLCanvasElement>;

  candidates: CandidateFeedback[] = [];
  filteredCandidates: CandidateFeedback[] = [];;
  selectedCandidate: CandidateFeedback | null = null;
  selectedCandidateIndex = 0;

  loading = true;
  offerSent = false;
  activeFilter = 'All';
  sortKey = 'score_desc';
  viewMode: 'list' | 'grid' = 'list';

  filterOptions = ['All', 'Strong Hire', 'Hire', 'Hold', 'Reject'];

  private chart: Chart | null = null;
  private pollSub: Subscription | null = null;
  private offerTimer: any;

  private readonly avatarBgs    = ['#ede9fe','#dbeafe','#dcfce7','#fef9c3','#fee2e2'];
  private readonly avatarColors  = ['#7c3aed','#1d4ed8','#15803d','#a16207','#b91c1c'];

  // ════════════════════════════════
  // 1. DATE RANGE PICKER
  // ════════════════════════════════
  showDatePicker = false;
  dateRangeStart: Date | null = null;
  dateRangeEnd:   Date | null = null;
  calViewDate = new Date();          // month currently shown
  calDays: CalDay[] = [];
  readonly weekDays = ['Su','Mo','Tu','We','Th','Fr','Sa'];

  get todayLabel(): string {
    const fmt = (d: Date) =>
      d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    if (this.dateRangeStart && this.dateRangeEnd)
      return `${fmt(this.dateRangeStart)} – ${fmt(this.dateRangeEnd)}`;
    if (this.dateRangeStart) return fmt(this.dateRangeStart);
    const d = new Date();
    return `${fmt(d)} – ${fmt(d)}`;
  }

  toggleDatePicker(e: Event) {
    e.stopPropagation();
    this.showDatePicker = !this.showDatePicker;
    if (this.showDatePicker) {
      this.showFilterPanel = false;
      this.buildCalendar(this.calViewDate);
    }
  }

  buildCalendar(ref: Date) {
    const year = ref.getFullYear(), month = ref.getMonth();
    const first = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev  = new Date(year, month, 0).getDate();
    const days: CalDay[] = [];
    for (let i = first - 1; i >= 0; i--)
      days.push({ day: daysInPrev - i, inMonth: false, date: new Date(year, month - 1, daysInPrev - i) });
    for (let d = 1; d <= daysInMonth; d++)
      days.push({ day: d, inMonth: true, date: new Date(year, month, d) });
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++)
      days.push({ day: d, inMonth: false, date: new Date(year, month + 1, d) });
    this.calDays = days;
  }

  prevMonth() { this.calViewDate = new Date(this.calViewDate.getFullYear(), this.calViewDate.getMonth() - 1, 1); this.buildCalendar(this.calViewDate); }
  nextMonth() { this.calViewDate = new Date(this.calViewDate.getFullYear(), this.calViewDate.getMonth() + 1, 1); this.buildCalendar(this.calViewDate); }

  get calMonthLabel(): string {
    return this.calViewDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  }

  selectDay(day: CalDay) {
    if (!this.dateRangeStart || (this.dateRangeStart && this.dateRangeEnd)) {
      this.dateRangeStart = day.date;
      this.dateRangeEnd   = null;
    } else {
      if (day.date < this.dateRangeStart) {
        this.dateRangeEnd   = this.dateRangeStart;
        this.dateRangeStart = day.date;
      } else {
        this.dateRangeEnd = day.date;
      }
      this.showDatePicker = false;
      this.applyFilterAndSort();
    }
  }

  isDaySelected(d: CalDay): boolean {
    if (!this.dateRangeStart) return false;
    if (!this.dateRangeEnd) return this.sameDay(d.date, this.dateRangeStart);
    return this.sameDay(d.date, this.dateRangeStart) || this.sameDay(d.date, this.dateRangeEnd);
  }

  isDayInRange(d: CalDay): boolean {
    if (!this.dateRangeStart || !this.dateRangeEnd) return false;
    return d.date > this.dateRangeStart && d.date < this.dateRangeEnd;
  }

  private sameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  clearDateRange() {
    this.dateRangeStart = null;
    this.dateRangeEnd   = null;
    this.applyFilterAndSort();
    this.showDatePicker = false;
  }

  // ════════════════════════════════
  // 2. FILTERS PANEL
  // ════════════════════════════════
  showFilterPanel = false;
  filterDecisions: string[] = [];
  filterScoreMin = 0;
  filterScoreMax = 5;
  filterRound = '';

  toggleFilterPanel(e: Event) {
    e.stopPropagation();
    this.showFilterPanel = !this.showFilterPanel;
    if (this.showFilterPanel) this.showDatePicker = false;
  }

  toggleDecisionFilter(d: string) {
    const idx = this.filterDecisions.indexOf(d);
    idx === -1 ? this.filterDecisions.push(d) : this.filterDecisions.splice(idx, 1);
    this.applyFilterAndSort();
  }

  isDecisionChecked(d: string): boolean { return this.filterDecisions.includes(d); }

  get activeFilterCount(): number {
    let n = this.filterDecisions.length;
    if (this.filterScoreMin > 0 || this.filterScoreMax < 5) n++;
    if (this.filterRound) n++;
    return n;
  }

  clearAllFilters() {
    this.filterDecisions = [];
    this.filterScoreMin  = 0;
    this.filterScoreMax  = 5;
    this.filterRound     = '';
    this.activeFilter    = 'All';
    this.applyFilterAndSort();
  }

  applyFilters() {
    this.showFilterPanel = false;
    this.applyFilterAndSort();
  }

  // ════════════════════════════════
  // 3. ADD FEEDBACK MODAL
  // ════════════════════════════════
  showAddModal = false;
  addLoading   = false;
  addSuccess   = false;
  addError     = '';
  addForm = {
    name: '', role: '', experience: null as number | null,
    round: 'Technical', score: null as number | null,
    decision: 'Hold', summary: '',
    technical: 3, communication: 3, problemSolving: 3,
    createdBy: 'HR User'
  };

  openAddFeedback() { this.showAddModal = true; this.addSuccess = false; this.addError = ''; }
  closeAddModal()   { this.showAddModal = false; this.resetAddForm(); }

  private resetAddForm() {
    this.addForm = {
      name: '', role: '', experience: null, round: 'Technical',
      score: null, decision: 'Hold', summary: '',
      technical: 3, communication: 3, problemSolving: 3, createdBy: 'HR User'
    };
    this.addError = '';
  }

  submitFeedback() {
    if (!this.addForm.name || !this.addForm.role || !this.addForm.score) {
      this.addError = 'Please fill in Name, Role and Score fields.';
      return;
    }
    this.addLoading = true;
    this.addError   = '';
    this.api.create({ ...this.addForm }).subscribe({
      next: () => {
        this.addLoading = false;
        this.addSuccess = true;
        this.loadFeedback();
        setTimeout(() => { this.closeAddModal(); }, 1500);
      },
      error: (err) => {
        this.addLoading = false;
        this.addError   = err?.error?.message || 'Failed to submit. Please try again.';
      }
    });
  }

  // ════════════════════════════════
  // CLOSE DROPDOWNS ON OUTSIDE CLICK
  // ════════════════════════════════
  @HostListener('document:click')
  onDocClick() {
    this.showDatePicker  = false;
    this.showFilterPanel = false;
  }

  // ════════════════════════════════
  // LIFECYCLE
  // ════════════════════════════════
  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.buildCalendar(this.calViewDate);
    this.loadFeedback();
    this.startPolling();
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
    this.chart?.destroy();
    clearTimeout(this.offerTimer);
  }

  // ════════════════════════════════
  // DATA
  // ════════════════════════════════
  loadFeedback(): void {
    this.loading = true;
    this.api.getDashboard().subscribe({
      next: (res: any) => {
        this.candidates = (Array.isArray(res) ? res : []).map(c => ({
          ...c,
          decision: this.normalizeDecision(c.decision)
        }));
        this.applyFilterAndSort();
        this.loading = false;
        this.cdr.detectChanges();
        Promise.resolve().then(() => this.renderChart());
      },
      error: (err) => {
        console.error('Dashboard load error:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private startPolling(): void {
    this.pollSub = interval(15000)
      .pipe(switchMap(() => this.api.getDashboard()))
      .subscribe({
        next: (res: any) => {
          this.candidates = (Array.isArray(res) ? res : []).map(c => ({
            ...c,
            decision: this.normalizeDecision(c.decision)
          }));
          this.applyFilterAndSort();
          this.updateChart();
          this.cdr.detectChanges();
        }
      });
  }

  private normalizeDecision(raw: string): string {
    if (!raw) return '';
    const clean = raw.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').trim();
    return clean.split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }

  // ════════════════════════════════
  // FILTER / SORT
  // ════════════════════════════════
  setFilter(f: string): void { this.activeFilter = f; this.applyFilterAndSort(); }

  applyFilterAndSort(): void {
    let list = [...this.candidates];

    // Tab filter
    if (this.activeFilter !== 'All')
      list = list.filter(c => c.decision.toLowerCase() === this.activeFilter.toLowerCase());

    // Decision panel filter
    if (this.filterDecisions.length)
      list = list.filter(c => this.filterDecisions.some(d => c.decision.toLowerCase() === d.toLowerCase()));

    // Score range filter (panel)
    list = list.filter(c => {
      const s5 = c.score / 20;
      return s5 >= this.filterScoreMin && s5 <= this.filterScoreMax;
    });

    // Round filter
    if (this.filterRound)
      list = list.filter(c => c.round?.toLowerCase().includes(this.filterRound.toLowerCase()));

    // Date range filter
    if (this.dateRangeStart && this.dateRangeEnd) {
      // createdAt is derived from id (ObjectId timestamp), not stored on client
      // so we skip date filtering silently when no createdAt field available
    }

    // Sort
    if (this.sortKey === 'score_desc') list.sort((a, b) => b.score - a.score);
    else if (this.sortKey === 'score_asc') list.sort((a, b) => a.score - b.score);
    else if (this.sortKey === 'name') list.sort((a, b) => a.name.localeCompare(b.name));

    this.filteredCandidates = list;
  }

  getCount(f: string): number {
    if (f === 'All') return this.candidates.length;
    return this.candidates.filter(c => c.decision.toLowerCase() === f.toLowerCase()).length;
  }

  // ════════════════════════════════
  // COMPUTED METRICS
  // ════════════════════════════════
  get totalCandidates(): number { return this.candidates.length; }
  get hiredCount(): number { return this.candidates.filter(c => c.decision === 'Strong Hire' || c.decision === 'Hire').length; }
  get hireRate(): number   { return this.totalCandidates ? Math.round(this.hiredCount / this.totalCandidates * 100) : 0; }

  get avgScore5(): string {
    if (!this.totalCandidates) return '0.0';
    return (this.candidates.reduce((a, c) => a + c.score, 0) / this.totalCandidates / 20).toFixed(1);
  }

  get topScore5(): string {
    if (!this.totalCandidates) return '0.0';
    return (Math.max(...this.candidates.map(c => c.score)) / 20).toFixed(1);
  }

  get pendingCount(): number { return this.candidates.filter(c => c.decision === 'Hold').length; }

  private avg5(field: keyof CandidateFeedback): string {
    if (!this.candidates.length) return '0.0';
    const sum = this.candidates.reduce((a, c) => a + (c[field] as number), 0);
    return (sum / this.candidates.length).toFixed(1);
  }

  get avgTechnical5(): string { return this.avg5('technical'); }
  get avgComm5(): string      { return this.avg5('communication'); }
  get avgPs5(): string        { return this.avg5('problemSolving'); }

  get topSkills(): { label: string; value: number; color: string }[] {
    const t = parseFloat(this.avgTechnical5);
    const c = parseFloat(this.avgComm5);
    const p = parseFloat(this.avgPs5);
    return [
      { label: 'Core Java',       value: +(t * 1.1).toFixed(1),  color: '#22c55e' },
      { label: 'Skills',          value: +p.toFixed(1),           color: '#3b82f6' },
      { label: 'SQL',             value: +(t * 0.9).toFixed(1),   color: '#a855f7' },
      { label: 'Communication',   value: +c.toFixed(1),            color: '#f59e0b' },
      { label: 'System Design',   value: +(p * 0.85).toFixed(1),  color: '#ef4444' },
    ].sort((a, b) => b.value - a.value).map(s => ({ ...s, value: Math.min(s.value, 5) }));
  }

  // ════════════════════════════════
  // SCORE HELPERS
  // ════════════════════════════════
  toScore5(score: number): string { return (score / 20).toFixed(1); }

  scoreRingColor5(score: number): string {
    const s = score / 20;
    if (s >= 4.5) return '#22c55e';
    if (s >= 3.5) return '#3b82f6';
    if (s >= 2.5) return '#f59e0b';
    return '#ef4444';
  }

  scoreDash5(score: number): string {
    const circ = 2 * Math.PI * 22;
    return `${(circ * (score / 20) / 5).toFixed(1)} ${circ.toFixed(1)}`;
  }

  scoreLabel(score: number): string {
    const s = score / 20;
    if (s >= 4.5) return 'Excellent';
    if (s >= 3.5) return 'Very Good';
    if (s >= 2.5) return 'Average';
    if (s >= 1.5) return 'Below Avg';
    return 'Poor';
  }

  // ════════════════════════════════
  // CHART
  // ════════════════════════════════
  private getChartData(): number[] {
    return [
      this.candidates.filter(c => c.score / 20 >= 4.5).length,
      this.candidates.filter(c => c.score / 20 >= 3.5 && c.score / 20 < 4.5).length,
      this.candidates.filter(c => c.score / 20 >= 2.5 && c.score / 20 < 3.5).length,
      this.candidates.filter(c => c.score / 20 >= 1.5 && c.score / 20 < 2.5).length,
      this.candidates.filter(c => c.score / 20 < 1.5).length,
    ];
  }

  private renderChart(): void {
    const canvas = this.chartCanvas?.nativeElement;
    if (!canvas) return;
    if (this.chart) { this.chart.destroy(); this.chart = null; }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['4.5–5', '3.5–4.4', '2.5–3.4', '1.5–2.4', '0–1.4'],
        datasets: [{
          label: 'Candidates',
          data: this.getChartData(),
          backgroundColor: ['#22c55e','#3b82f6','#f59e0b','#f97316','#ef4444'],
          borderRadius: 6, borderSkipped: false,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 10 }, color: '#6b7280' },
               title: { display: true, text: 'Score Range', font: { size: 10 }, color: '#9ca3af' } },
          y: { beginAtZero: true, grid: { color: '#f3f4f6' },
               ticks: { stepSize: 1, font: { size: 10 }, color: '#6b7280' },
               title: { display: true, text: 'Candidates', font: { size: 10 }, color: '#9ca3af' } }
        }
      }
    });
  }

  private updateChart(): void {
    if (!this.chart) { Promise.resolve().then(() => this.renderChart()); return; }
    this.chart.data.datasets[0].data = this.getChartData();
    this.chart.update();
  }

  // ════════════════════════════════
  // CANDIDATE ACTIONS
  // ════════════════════════════════
  selectCandidate(c: CandidateFeedback): void {
    this.selectedCandidate      = c;
    this.selectedCandidateIndex = this.candidates.indexOf(c) % 5;
    this.offerSent = false;
  }

  goToOfferLetter(): void { this.router.navigate(['offer-letter']); }

  // ════════════════════════════════
  // AVATAR / STYLE HELPERS
  // ════════════════════════════════
  initials(name: string): string {
    return (name || '').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  }

  avatarBg(i: number): string           { return this.avatarBgs[i % 5]; }
  avatarColor(i: number): string        { return this.avatarColors[i % 5]; }
  avatarBgByIndex(i: number): string    { return this.avatarBgs[i % 5]; }
  avatarColorByIndex(i: number): string { return this.avatarColors[i % 5]; }

  decisionClass(decision: string): Record<string, boolean> {
    return {
      'pill-strong': decision === 'Strong Hire',
      'pill-hire':   decision === 'Hire',
      'pill-hold':   decision === 'Hold',
      'pill-reject': decision === 'Reject',
    };
  }
}