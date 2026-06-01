import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { Subscription, interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ApiService } from '../Service/ApiService ';

export interface Ranking {
  rank: number;
  candidateName: string;
  score: number;   // expected 0–100
  timeTaken: number;
}

const AVATAR_COLORS = [
  { bg: '#ede9fe', fg: '#5b21b6' },
  { bg: '#dbeafe', fg: '#1e40af' },
  { bg: '#dcfce7', fg: '#166534' },
  { bg: '#fef3c7', fg: '#92400e' },
  { bg: '#fce7f3', fg: '#9d174d' },
  { bg: '#e0f2fe', fg: '#075985' },
  { bg: '#fef9c3', fg: '#854d0e' },
  { bg: '#fee2e2', fg: '#991b1b' },
];

const POLL_INTERVAL_MS = 5_000;
const PAGE_SIZE = 8;

@Component({
  selector: 'app-rank-component',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './rank-component.html',
  styleUrl: './rank-component.css',
})
export class RankComponent implements OnInit, OnDestroy {

  rankings:  Ranking[] = [];
  filtered:  Ranking[] = [];
  loading    = true;
  refreshing = false;
  lastUpdated: Date | null = null;

  searchQuery = '';
  sortKey: 'rank' | 'score' | 'time' | 'name' = 'rank';

  currentPage  = 1;
  readonly pageSize = PAGE_SIZE;

  private pollSub: Subscription | null = null;

  /* ── Computed stats ─────────────────────────────────────── */
  get totalCandidates(): number { return this.rankings.length; }

  get topScore(): number {
    return this.rankings.length ? Math.max(...this.rankings.map(r => r.score)) : 0;
  }

  get avgScore(): number {
    if (!this.rankings.length) return 0;
    return Math.round(this.rankings.reduce((s, r) => s + r.score, 0) / this.rankings.length);
  }

  get avgTime(): number {
    if (!this.rankings.length) return 0;
    return Math.round(this.rankings.reduce((s, r) => s + r.timeTaken, 0) / this.rankings.length);
  }

  /* ── Pagination ─────────────────────────────────────────── */
  get totalPages():  number   { return Math.max(1, Math.ceil(this.filtered.length / this.pageSize)); }
  get pageNumbers(): number[] { return Array.from({ length: this.totalPages }, (_, i) => i + 1); }
  get showStart():   number   { return (this.currentPage - 1) * this.pageSize + 1; }
  get showEnd():     number   { return Math.min(this.currentPage * this.pageSize, this.filtered.length); }
  get pagedData():   Ranking[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filtered.slice(start, start + this.pageSize);
  }

  constructor(
    private apiService: ApiService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadRankings(true);
    this.startPolling();
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  /* ── Data loading ───────────────────────────────────────── */
  loadRankings(initial = false): void {
    if (initial) this.loading = true;
    this.apiService.getRanking().subscribe({
      next: (res: any[]) => {
        this.rankings    = res as Ranking[];
        this.lastUpdated = new Date();
        this.loading     = false;
        this.applyFilterAndSort();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Ranking fetch error:', err);
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  manualRefresh(): void {
    this.refreshing = true;
    this.apiService.getRanking().subscribe({
      next: (res: any[]) => {
        this.rankings    = res as Ranking[];
        this.lastUpdated = new Date();
        this.applyFilterAndSort();
        setTimeout(() => (this.refreshing = false), 600);
      },
      error: (err) => {
        console.error('Refresh error:', err);
        this.refreshing = false;
      },
    });
  }

  startPolling(): void {
    this.pollSub = interval(POLL_INTERVAL_MS)
      .pipe(switchMap(() => this.apiService.getRanking()))
      .subscribe({
        next: (res: any[]) => {
          this.rankings    = res as Ranking[];
          this.lastUpdated = new Date();
          this.applyFilterAndSort();
        },
        error: (err) => console.error('Polling error:', err),
      });
  }

  /* ── Filter / sort ──────────────────────────────────────── */
  applyFilterAndSort(): void {
    const q = this.searchQuery.toLowerCase().trim();
    let result = q
      ? this.rankings.filter(r => r.candidateName.toLowerCase().includes(q))
      : [...this.rankings];

    switch (this.sortKey) {
      case 'score': result.sort((a, b) => b.score    - a.score);   break;
      case 'time':  result.sort((a, b) => a.timeTaken - b.timeTaken); break;
      case 'name':  result.sort((a, b) => a.candidateName.localeCompare(b.candidateName)); break;
      default:      result.sort((a, b) => a.rank     - b.rank);    break;
    }

    this.filtered = result;
    if (this.currentPage > this.totalPages) this.currentPage = 1;
  }

  onSearch():    void { this.currentPage = 1; this.applyFilterAndSort(); }
  onSortChange():void { this.currentPage = 1; this.applyFilterAndSort(); }
  goToPage(p: number): void { this.currentPage = p; }

  /* ── Display helpers ────────────────────────────────────── */
  initials(name: string): string {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }

  avatarColor(index: number): { bg: string; fg: string } {
    return AVATAR_COLORS[index % AVATAR_COLORS.length];
  }

  globalIndex(candidate: Ranking): number {
    return this.rankings.findIndex(
      r => r.candidateName === candidate.candidateName && r.rank === candidate.rank,
    );
  }

  formattedTime(): string {
    return this.lastUpdated
      ? this.lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      : '';
  }
}