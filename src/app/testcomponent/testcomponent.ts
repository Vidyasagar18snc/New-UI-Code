// ═══════════════════════════════════════════════════════════════
//  AI Recruiter — MCQ Exam Portal  |  testcomponent.ts
// ═══════════════════════════════════════════════════════════════

import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
// add to imports[] — required for the question slide animation
import {
  trigger,
  transition,
  style,
  animate,
  query,
  animateChild,
} from '@angular/animations';
import { ApiService } from '../Service/ApiService ';

export interface Question {
  id: string;
  question: string;
  options: string[];
  category?: string;    // e.g. "JavaScript", "React", "System Design"
  points?: number;      // defaults to 1
}

export interface SubmitPayload {
  token: string;
  answers: { questionId: string; selectedAnswer: string }[];
}

// ── Animation ────────────────────────────────────────────────────
const QUESTION_ANIM = trigger('questionAnim', [
  transition(':increment', [
    style({ opacity: 0, transform: 'translateX(24px)' }),
    animate('220ms ease', style({ opacity: 1, transform: 'translateX(0)' })),
  ]),
  transition(':decrement', [
    style({ opacity: 0, transform: 'translateX(-24px)' }),
    animate('220ms ease', style({ opacity: 1, transform: 'translateX(0)' })),
  ]),
]);

// ════════════════════════════════════════════════════════════════
@Component({
  selector: 'app-testcomponent',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './testcomponent.html',
  styleUrl: './testcomponent.css',
  animations: [QUESTION_ANIM],
})
export class TestComponent implements OnInit, OnDestroy {

  // ── Token & validity ─────────────────────────────────────────
  token!: string;
  isValid   = false;
  loading   = true;
  errorMessage = '';

  // ── Meta ─────────────────────────────────────────────────────
  assessmentTitle = '';   // populated from API or kept blank for default

  // ── Questions & answers ──────────────────────────────────────
  questions: Question[] = [];
  answers:  { [qId: string]: string  } = {};
  flagged:  { [qId: string]: boolean } = {};

  readonly letters = ['A', 'B', 'C', 'D', 'E'];

  // ── Navigation ───────────────────────────────────────────────
  currentIndex = 0;
  examStarted  = false;

  // ── Timer ────────────────────────────────────────────────────
  /** Total seconds for the exam — override via API response or adjust here */
  timeSeconds  = 30 * 60;   // 30 minutes default
  totalMinutes = 30;

  private timerRef!: ReturnType<typeof setInterval>;
  private startedAt!: number;  // epoch ms when exam began

  // ── Submission ───────────────────────────────────────────────
  submitted            = false;
  isSubmitting         = false;
  showUnansweredWarning = false;
  submittedAnswerCount  = 0;
  completionTime        = '';     // e.g. "12 min 34 sec"
  lastSaved: number | null = null;

  // ── Score ring ───────────────────────────────────────────────
  scorePercent   = 0;
  scoreRingColor = '#1D9E75';
  scoreRingDash  = '0 264';       // circumference ≈ 2π×42 ≈ 263.9

  private readonly CIRCUMFERENCE = 2 * Math.PI * 42; // r=42

  // ─────────────────────────────────────────────────────────────
  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private cdr: ChangeDetectorRef,
  ) {}

  // ══════════════════════════════════════════════════════════════
  //  Lifecycle
  // ══════════════════════════════════════════════════════════════
  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
      if (this.token) {
        this.validateToken();
      } else {
        this.errorMessage = 'Invalid or missing assessment link.';
        this.loading = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  // ══════════════════════════════════════════════════════════════
  //  Token validation & question loading
  // ══════════════════════════════════════════════════════════════
  private validateToken(): void {
    this.apiService.validateInterview(this.token).subscribe({
      next: (res: any) => {
        if (res.valid) {
          this.isValid = true;
          // Optional: pick up title / duration from validation response
          if (res.title)    this.assessmentTitle = res.title;
          if (res.duration) {
            this.timeSeconds  = res.duration * 60;
            this.totalMinutes = res.duration;
          }
          this.loadQuestions();
        } else {
          this.errorMessage = res.message || 'This link is no longer valid.';
          this.loading = false;
        }
      },
      error: () => {
        this.errorMessage = 'Server error. Please try again later.';
        this.loading = false;
      },
    });
  }

  private loadQuestions(): void {
    this.apiService.getQuestions().subscribe({
      next: (data: any[]) => {
        this.questions = data;
        this.loading   = false;
        // Timer does NOT start here — it starts when the candidate
        // clicks "Begin assessment" on the intro screen.
      },
      error: () => {
        this.errorMessage = 'Failed to load questions. Please refresh and try again.';
        this.loading  = false;
        this.isValid  = false;
      },
    });
  }

  // ══════════════════════════════════════════════════════════════
  //  Exam start (called by "Begin assessment" button)
  // ══════════════════════════════════════════════════════════════
  beginExam(): void {
    this.examStarted = true;
    this.startTimer();
  }

  // ══════════════════════════════════════════════════════════════
  //  Timer
  // ══════════════════════════════════════════════════════════════
  private startTimer(): void {
    this.startedAt = Date.now();
    this.timerRef  = setInterval(() => {
      if (this.timeSeconds > 0) {
        this.timeSeconds--;
        this.cdr.markForCheck();
      } else {
        this.clearTimer();
        this.doSubmit();   // auto-submit on time-up
      }
    }, 1000);
  }

  private clearTimer(): void {
    if (this.timerRef) clearInterval(this.timerRef);
  }

  get formattedTime(): string {
    const m = Math.floor(this.timeSeconds / 60).toString().padStart(2, '0');
    const s = (this.timeSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  private buildCompletionTime(): string {
    const elapsed = Math.floor((Date.now() - this.startedAt) / 1000);
    const m = Math.floor(elapsed / 60);
    const s = elapsed % 60;
    return m === 0 ? `${s} sec` : `${m} min ${s} sec`;
  }

  // ══════════════════════════════════════════════════════════════
  //  Progress / counts
  // ══════════════════════════════════════════════════════════════
  get progressPercent(): number {
    if (!this.questions.length) return 0;
    return Math.round(((this.currentIndex + 1) / this.questions.length) * 100);
  }

  get currentQuestion(): Question | null {
    return this.questions[this.currentIndex] ?? null;
  }

  get answeredCount(): number {
    return Object.keys(this.answers).length;
  }

  get remainingCount(): number {
    return this.questions.length - this.answeredCount;
  }

  get flaggedCount(): number {
    return Object.values(this.flagged).filter(Boolean).length;
  }

  /** Returns questions that have not been answered — used in the warning box */
  get unansweredQuestions(): Question[] {
    return this.questions.filter(q => !this.answers[q.id]);
  }

  // ══════════════════════════════════════════════════════════════
  //  Answer & flag helpers
  // ══════════════════════════════════════════════════════════════
  isAnswered(qId: string): boolean {
    return !!this.answers[qId];
  }

  getAnswer(qId: string): string {
    return this.answers[qId] ?? '';
  }

  selectAnswer(qId: string, option: string): void {
    this.answers[qId] = option;
    this.lastSaved    = Date.now();
  }

  isFlagged(qId: string | undefined): boolean {
    return qId ? !!this.flagged[qId] : false;
  }

  toggleFlag(qId: string | undefined): void {
    if (!qId) return;
    this.flagged[qId] = !this.flagged[qId];
  }

  // ══════════════════════════════════════════════════════════════
  //  Navigation
  // ══════════════════════════════════════════════════════════════
  navigate(dir: 1 | -1): void {
    this.currentIndex = Math.max(
      0,
      Math.min(this.questions.length - 1, this.currentIndex + dir),
    );
    this.showUnansweredWarning = false;
  }

  goTo(index: number): void {
    this.currentIndex = index;
    this.showUnansweredWarning = false;
  }

  // ══════════════════════════════════════════════════════════════
  //  Submit flow
  // ══════════════════════════════════════════════════════════════

  /** Called by "Submit test" button */
  submitTest(): void {
    if (this.remainingCount > 0) {
      this.showUnansweredWarning = true;
    } else {
      this.doSubmit();
    }
  }

  cancelSubmit(): void {
    this.showUnansweredWarning = false;
  }

  confirmSubmit(): void {
    this.showUnansweredWarning = false;
    this.doSubmit();
  }

  private doSubmit(): void {
    if (this.isSubmitting) return;   // prevent double-click

    this.isSubmitting = true;
    this.clearTimer();

    // Snapshot stats before clearing state
    this.submittedAnswerCount = this.answeredCount;
    this.completionTime       = this.buildCompletionTime();

    const payload: SubmitPayload = {
      token: this.token,
      answers: this.questions.map(q => ({
        questionId:     q.id,
        selectedAnswer: this.answers[q.id] ?? '',
      })),
    };

    this.apiService.submitTest(payload).subscribe({
      next: (res: any) => {
        // If the API returns a score, use it; otherwise leave 0
        if (typeof res?.score === 'number') {
          this.scorePercent = res.score;
        }
        this.buildScoreRing();
        this.submitted    = true;
        this.isSubmitting = false;
      },
      error: () => {
        this.isSubmitting = false;
        // Surface error inline — replace alert() with a toast/snackbar in production
        alert('Error submitting test. Please check your connection and try again.');
      },
    });
  }

  // ══════════════════════════════════════════════════════════════
  //  Score ring helpers
  // ══════════════════════════════════════════════════════════════
  private buildScoreRing(): void {
    const filled = Math.round((this.scorePercent / 100) * this.CIRCUMFERENCE);
    this.scoreRingDash  = `${filled} ${this.CIRCUMFERENCE}`;
    this.scoreRingColor = this.scorePercent >= 70
      ? '#1D9E75'   // teal  — good
      : this.scorePercent >= 40
        ? '#EF9F27' // amber — average
        : '#E24B4A'; // red   — needs improvement
  }
}