import {
  Component, OnInit, OnDestroy, ViewChild,
  ElementRef, AfterViewInit, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
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
  decision: string;       // API may return any casing — we normalize in normalizeDecision()
  summary: string;
  technical: number;
  communication: number;
  problemSolving: number;
  createdBy: string;
}

export interface MetricCard {
  label: string;
  value: string | number;
  sub: string;
  color: string;
  pct: number;
}

@Component({
  selector: 'app-feedback-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './feedback-dashboard-component.html',
  styleUrls: ['./feedback-dashboard-component.css']
})
export class FeedbackDashboardComponent implements OnInit, AfterViewInit, OnDestroy {

  // FIX: static: false (default) — canvas only exists after *ngIf="!loading" is true,
  //      so we never access this in ngAfterViewInit directly.
  @ViewChild('distChart') chartCanvas!: ElementRef<HTMLCanvasElement>;

  candidates: CandidateFeedback[] = [];
  filteredCandidates: CandidateFeedback[] = [];
  selectedCandidate: CandidateFeedback | null = null;
  selectedCandidateIndex = 0;

  loading = true;
  offerSent = false;
  activeFilter = 'All';

  // FIX: filter labels must exactly match normalized decision values
  filterOptions = ['All', 'Strong Hire', 'Hire', 'Hold', 'Reject'];
  metrics: MetricCard[] = [];

  private chart: Chart | null = null;
  private pollSub: Subscription | null = null;
  private offerTimer: any;
  private chartReady = false;

  private readonly avatarBgs    = ['#ede9fe','#dbeafe','#dcfce7','#fef9c3','#fee2e2'];
  private readonly avatarColors  = ['#7c3aed','#1d4ed8','#15803d','#a16207','#b91c1c'];

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef,private router: Router
  ) {}

  ngOnInit(): void {
    this.loadFeedback();
    this.startPolling();
  }

  ngAfterViewInit(): void {
    // Chart canvas may not exist yet if still loading — renderChart() is called
    // after loading = false + cdr.detectChanges() inside loadFeedback()
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
    this.chart?.destroy();
    clearTimeout(this.offerTimer);
  }



  loadFeedback(): void {
    this.loading = true;
    this.api.getDashboard().subscribe({
      next: (res: any) => {
        // FIX: normalize decision casing from API before using
        this.candidates = (Array.isArray(res) ? res : []).map(c => ({
          ...c,
          decision: this.normalizeDecision(c.decision)
        }));
        this.applyFilter();
        this.buildMetrics();
        this.loading = false;

        // FIX: run change detection first so *ngIf="!loading" renders the canvas,
        //      then initialize the chart on the next microtask tick
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
          this.applyFilter();
          this.buildMetrics();
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

  

  setFilter(f: string): void {
    this.activeFilter = f;
    this.applyFilter();
  }

  private applyFilter(): void {
    const sorted = [...this.candidates].sort((a, b) => b.score - a.score);
    // FIX: case-insensitive compare as safety net even after normalization
    this.filteredCandidates = this.activeFilter === 'All'
      ? sorted
      : sorted.filter(c =>
          c.decision.toLowerCase() === this.activeFilter.toLowerCase()
        );
  }

  

  selectCandidate(c: CandidateFeedback): void {
    this.selectedCandidate = c;
    this.selectedCandidateIndex = this.candidates.indexOf(c) % 5;
    this.offerSent = false;
  }

  sendOffer(c: CandidateFeedback): void {
    this.offerSent = true;
    this.offerTimer = setTimeout(() => {
      this.offerSent = false;
      this.cdr.detectChanges();
    }, 3000);
    console.log('Offer sent to:', c.name);
  }


  private buildMetrics(): void {
    const total  = this.candidates.length;
    const hired  = this.candidates.filter(c =>
      c.decision === 'Strong Hire' || c.decision === 'Hire'
    ).length;
    const avg    = total
      ? Math.round(this.candidates.reduce((a, c) => a + c.score, 0) / total)
      : 0;
    const top    = total ? Math.max(...this.candidates.map(c => c.score)) : 0;

    this.metrics = [
      { label: 'Total Candidates', value: total,                            sub: 'This cycle',        color: '#6366f1', pct: 100 },
      { label: 'Hire Rate',        value: total ? Math.round(hired / total * 100) + '%' : '0%',
                                                                             sub: `${hired} of ${total}`, color: '#22c55e', pct: total ? Math.round(hired / total * 100) : 0 },
      { label: 'Avg Score',        value: avg + '%',                        sub: 'Across all rounds', color: '#f59e0b', pct: avg },
      { label: 'Top Score',        value: top + '%',                        sub: 'Best performer',    color: '#a855f7', pct: top },
    ];
  }



  private getChartData(): number[] {
    return [
      this.candidates.filter(c => c.score >= 90).length,
      this.candidates.filter(c => c.score >= 75 && c.score < 90).length,
      this.candidates.filter(c => c.score >= 60 && c.score < 75).length,
      this.candidates.filter(c => c.score < 60).length,
    ];
  }

  private renderChart(): void {
    // FIX: guard — canvas element must exist in DOM
    const canvas = this.chartCanvas?.nativeElement;
    if (!canvas) {
      console.warn('Chart canvas not ready yet');
      return;
    }

    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['90–100', '75–89', '60–74', 'Below 60'],
        datasets: [{
          data: this.getChartData(),
          backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'],
          borderRadius: 6,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 10 } }
          },
          y: {
            beginAtZero: true,
            grid: { color: '#f3f4f6' },
            ticks: { stepSize: 1, font: { size: 10 } }
          }
        }
      }
    });

    this.chartReady = true;
  }

  private updateChart(): void {
    if (!this.chart) {
      // Chart was not yet rendered (e.g. still loading on first poll) — try to render
      Promise.resolve().then(() => this.renderChart());
      return;
    }
    this.chart.data.datasets[0].data = this.getChartData();
    this.chart.update();
  }


  initials(name: string): string {
    return (name || '')
      .split(' ')
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  avatarBg(i: number): string         { return this.avatarBgs[i % 5]; }
  avatarColor(i: number): string      { return this.avatarColors[i % 5]; }
  avatarBgByIndex(i: number): string  { return this.avatarBgs[i % 5]; }
  avatarColorByIndex(i: number): string { return this.avatarColors[i % 5]; }

  scoreRingColor(score: number): string {
    if (score >= 85) return '#22c55e';
    if (score >= 70) return '#3b82f6';
    if (score >= 55) return '#f59e0b';
    return '#ef4444';
  }

  scoreDash(score: number): string {
    const circ = 2 * Math.PI * 20;
    return `${(circ * score / 100).toFixed(1)} ${circ.toFixed(1)}`;
  }

  // FIX: return object for [ngClass] — works correctly for conditional single class
  decisionClass(decision: string): Record<string, boolean> {
    return {
      'pill-strong': decision === 'Strong Hire',
      'pill-hire':   decision === 'Hire',
      'pill-hold':   decision === 'Hold',
      'pill-reject': decision === 'Reject',
    };
  }
  goToOfferLetter() {
  this.router.navigate(['offer-letter']);
}
}