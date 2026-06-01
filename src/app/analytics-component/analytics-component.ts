import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { Sidebarcomponent } from '../sidebarcomponent/sidebarcomponent';
import { App } from '../app';

Chart.register(...registerables);

export interface MetricCard {
  label: string;
  value: string;
  delta: string;
  trend: 'up' | 'down';
}

export interface SkillGap {
  skill: string;
  required: number;
  available: number;
}

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule,FormsModule,HttpClientModule,],
  templateUrl: './analytics-component.html',
  styleUrl: './analytics-component.css'
})
export class AnalyticsComponent implements AfterViewInit {

  // ── Metric cards ─────────────────────────────────────────
  metrics: MetricCard[] = [
    { label: 'Total resumes',    value: '1,284', delta: '↑ 18% this week',       trend: 'up'   },
    { label: 'Avg match score',  value: '72%',   delta: '↑ 4pts vs last month',  trend: 'up'   },
    { label: 'Fake detected',    value: '9.3%',  delta: '↑ 1.2% flagged more',   trend: 'down' },
    { label: 'Interview rate',   value: '34%',   delta: '↑ 6% conversion',       trend: 'up'   },
  ];

  // ── Funnel data ───────────────────────────────────────────
  funnelLabels  = ['Uploaded','Parsed','Matched','Shortlisted','Interviewed','Hired'];
  funnelData    = [1284, 1201, 874, 412, 198, 67];
  funnelColors  = ['#378ADD','#378ADD','#1D9E75','#1D9E75','#7F77DD','#EF9F27'];

  // ── Weekly trend ──────────────────────────────────────────
  weekLabels    = ['W1','W2','W3','W4','W5','W6','W7','W8'];
  uploadsData   = [120,145,132,178,165,201,188,234];
  matchesData   = [80, 95, 88, 120,115,148,132,171];

  // ── Fake detection ────────────────────────────────────────
  fakeLabels    = ['Genuine','Suspicious','Flagged fake'];
  fakeData      = [82, 11, 7];
  fakeColors    = ['#1D9E75','#EF9F27','#E24B4A'];

  // ── Match score distribution ──────────────────────────────
  scoreLabels   = ['0-20','20-40','40-60','60-70','70-80','80-90','90-100'];
  scoreData     = [18, 54, 143, 212, 287, 198, 72];
  scoreColors   = ['#E24B4A','#E24B4A','#EF9F27','#378ADD','#1D9E75','#1D9E75','#7F77DD'];

  // ── Interview conversion ──────────────────────────────────
  interviewLabels = ['Shortlisted','Pending','Rejected'];
  interviewData   = [38, 29, 33];
  interviewColors = ['#378ADD','#888780','#E24B4A'];

  // ── Skills gap ────────────────────────────────────────────
  skillsData: SkillGap[] = [
    { skill: 'React',      required: 87, available: 72 },
    { skill: 'Python',     required: 92, available: 88 },
    { skill: 'SQL',        required: 78, available: 81 },
    { skill: 'Node.js',    required: 65, available: 52 },
    { skill: 'AWS',        required: 74, available: 43 },
    { skill: 'Docker',     required: 58, available: 34 },
    { skill: 'TypeScript', required: 71, available: 55 },
    { skill: 'ML/AI',      required: 83, available: 29 },
  ];

  // ── Canvas refs ───────────────────────────────────────────
  @ViewChild('funnelCanvas')    funnelCanvas!:    ElementRef<HTMLCanvasElement>;
  @ViewChild('trendCanvas')     trendCanvas!:     ElementRef<HTMLCanvasElement>;
  @ViewChild('fakeCanvas')      fakeCanvas!:      ElementRef<HTMLCanvasElement>;
  @ViewChild('scoreCanvas')     scoreCanvas!:     ElementRef<HTMLCanvasElement>;
  @ViewChild('interviewCanvas') interviewCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('skillsCanvas')    skillsCanvas!:    ElementRef<HTMLCanvasElement>;

  private charts: Chart[] = [];

  private get gridColor(): string {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'rgba(255,255,255,0.07)'
      : 'rgba(0,0,0,0.07)';
  }
  private get tickColor(): string {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? '#9ca3af' : '#6b7280';
  }

  ngAfterViewInit(): void {
    this.buildFunnelChart();
    this.buildTrendChart();
    this.buildFakeChart();
    this.buildScoreChart();
    this.buildInterviewChart();
    this.buildSkillsChart();
  }

  ngOnDestroy(): void {
    this.charts.forEach(c => c.destroy());
  }

  // ── Chart builders ────────────────────────────────────────

  private buildFunnelChart(): void {
    const chart = new Chart(this.funnelCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: this.funnelLabels,
        datasets: [{
          label: 'Candidates',
          data: this.funnelData,
          backgroundColor: this.funnelColors,
          borderRadius: 4,
          borderSkipped: false
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            grid: { color: this.gridColor },
            ticks: { color: this.tickColor, callback: (v) => Number(v) >= 1000 ? (Number(v)/1000).toFixed(1)+'k' : v }
          },
          y: { grid: { display: false }, ticks: { color: this.tickColor } }
        }
      }
    });
    this.charts.push(chart);
  }

  private buildTrendChart(): void {
    const chart = new Chart(this.trendCanvas.nativeElement, {
      type: 'line',
      data: {
        labels: this.weekLabels,
        datasets: [
          {
            label: 'Uploads',
            data: this.uploadsData,
            borderColor: '#378ADD',
            backgroundColor: 'rgba(55,138,221,0.08)',
            tension: 0.4, fill: true, pointRadius: 3, borderWidth: 2
          },
          {
            label: 'Matches',
            data: this.matchesData,
            borderColor: '#1D9E75',
            backgroundColor: 'rgba(29,158,117,0.08)',
            tension: 0.4, fill: true, pointRadius: 3, borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: this.gridColor }, ticks: { color: this.tickColor } },
          y: { grid: { color: this.gridColor }, ticks: { color: this.tickColor } }
        }
      }
    });
    this.charts.push(chart);
  }

  private buildFakeChart(): void {
    const chart = new Chart(this.fakeCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels: this.fakeLabels,
        datasets: [{ data: this.fakeData, backgroundColor: this.fakeColors, borderWidth: 0, hoverOffset: 6 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '68%',
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => ' ' + ctx.parsed + '%' } } }
      }
    });
    this.charts.push(chart);
  }

  private buildScoreChart(): void {
    const chart = new Chart(this.scoreCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: this.scoreLabels,
        datasets: [{
          label: 'Candidates', data: this.scoreData,
          backgroundColor: this.scoreColors, borderRadius: 3, borderSkipped: false
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: this.tickColor, font: { size: 11 } } },
          y: { grid: { color: this.gridColor }, ticks: { color: this.tickColor } }
        }
      }
    });
    this.charts.push(chart);
  }

  private buildInterviewChart(): void {
    const chart = new Chart(this.interviewCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels: this.interviewLabels,
        datasets: [{ data: this.interviewData, backgroundColor: this.interviewColors, borderWidth: 0, hoverOffset: 6 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '68%',
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => ' ' + ctx.parsed + '%' } } }
      }
    });
    this.charts.push(chart);
  }

  private buildSkillsChart(): void {
    const chart = new Chart(this.skillsCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: this.skillsData.map(s => s.skill),
        datasets: [
          { label: 'Required in JDs', data: this.skillsData.map(s => s.required), backgroundColor: '#7F77DD', borderRadius: 3, borderSkipped: false },
          { label: 'Found in resumes', data: this.skillsData.map(s => s.available), backgroundColor: '#5DCAA5', borderRadius: 3, borderSkipped: false }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: this.tickColor, autoSkip: false, maxRotation: 0, font: { size: 12 } } },
          y: { grid: { color: this.gridColor }, ticks: { color: this.tickColor, callback: (v) => v + '%' }, max: 100 }
        }
      }
    });
    this.charts.push(chart);
  }
}