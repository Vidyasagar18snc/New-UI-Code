import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import {
  trigger,
  transition,
  style,
  animate,
} from '@angular/animations';
import { ApiService } from '../Service/ApiService ';

export interface Question {
  id: string;
  question: string;
  options: string[];
  category?: string;
  points?: number;
}

export interface SubmitPayload {
  token: string;
  answers: { questionId: string; selectedAnswer: string }[];
}

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

@Component({
  selector: 'app-testcomponent',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './testcomponent.html',
  styleUrl: './testcomponent.css',
  animations: [QUESTION_ANIM],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestComponent implements OnInit, OnDestroy {

  token!: string;
  isValid = false;
  loading = true;
  errorMessage = '';

  assessmentTitle = '';

  questions: Question[] = [];
  answers: { [qId: string]: string } = {};
  flagged: { [qId: string]: boolean } = {};

  readonly letters = ['A', 'B', 'C', 'D', 'E'];

  currentIndex = 0;
  examStarted = false;

  timeSeconds = 30 * 60;
  totalMinutes = 30;

  private timerRef!: ReturnType<typeof setInterval>;
  private startedAt!: number;

  submitted = false;
  isSubmitting = false;
  showUnansweredWarning = false;
  submittedAnswerCount = 0;
  completionTime = '';
  lastSaved: number | null = null;

  scorePercent = 0;
  scoreRingColor = '#1D9E75';
  scoreRingDash = '0 264';

  private readonly CIRCUMFERENCE = 2 * Math.PI * 42;

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
      if (this.token) {
        this.validateToken();
      } else {
        this.errorMessage = 'Invalid or missing assessment link.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  private validateToken(): void {
    this.apiService.validateInterview(this.token).subscribe({
      next: (res: any) => {
        if (res.valid) {
          this.isValid = true;
          if (res.title) this.assessmentTitle = res.title;
          if (res.duration) {
            this.timeSeconds = res.duration * 60;
            this.totalMinutes = res.duration;
          }
          this.cdr.markForCheck();
          this.loadQuestions();
        } else {
          this.errorMessage = res.message || 'This link is no longer valid.';
          this.loading = false;
          this.cdr.markForCheck();
        }
      },
      error: () => {
        this.errorMessage = 'Server error. Please try again later.';
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  private loadQuestions(): void {
    this.apiService.getQuestions().subscribe({
      next: (data: any[]) => {
        this.questions = data;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorMessage = 'Failed to load questions. Please refresh and try again.';
        this.loading = false;
        this.isValid = false;
        this.cdr.markForCheck();
      },
    });
  }

  beginExam(): void {
    this.examStarted = true;
    this.startTimer();
    this.cdr.markForCheck();
  }

  private startTimer(): void {
    this.startedAt = Date.now();
    this.timerRef = setInterval(() => {
      if (this.timeSeconds > 0) {
        this.timeSeconds--;
        this.cdr.markForCheck();
      } else {
        this.clearTimer();
        this.doSubmit();
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

  get unansweredQuestions(): Question[] {
    return this.questions.filter(q => !this.answers[q.id]);
  }

  isAnswered(qId: string): boolean {
    return !!this.answers[qId];
  }

  getAnswer(qId: string): string {
    return this.answers[qId] ?? '';
  }

  selectAnswer(qId: string, option: string): void {
    this.answers[qId] = option;
    this.lastSaved = Date.now();
    this.cdr.markForCheck();
  }

  isFlagged(qId: string | undefined): boolean {
    return qId ? !!this.flagged[qId] : false;
  }

  toggleFlag(qId: string | undefined): void {
    if (!qId) return;
    this.flagged[qId] = !this.flagged[qId];
    this.cdr.markForCheck();
  }

  navigate(dir: 1 | -1): void {
    this.currentIndex = Math.max(
      0,
      Math.min(this.questions.length - 1, this.currentIndex + dir),
    );
    this.showUnansweredWarning = false;
    this.cdr.markForCheck();
  }

  goTo(index: number): void {
    this.currentIndex = index;
    this.showUnansweredWarning = false;
    this.cdr.markForCheck();
  }

  submitTest(): void {
    if (this.remainingCount > 0) {
      this.showUnansweredWarning = true;
    } else {
      this.doSubmit();
    }
    this.cdr.markForCheck();
  }

  cancelSubmit(): void {
    this.showUnansweredWarning = false;
    this.cdr.markForCheck();
  }

  confirmSubmit(): void {
    this.showUnansweredWarning = false;
    this.doSubmit();
  }

  private doSubmit(): void {
    if (this.isSubmitting) return;

    this.isSubmitting = true;
    this.clearTimer();

    this.submittedAnswerCount = this.answeredCount;
    this.completionTime = this.buildCompletionTime();

    const payload: SubmitPayload = {
      token: this.token,
      answers: this.questions.map(q => ({
        questionId: q.id,
        selectedAnswer: this.answers[q.id] ?? '',
      })),
    };

    this.apiService.submitTest(payload).subscribe({
      next: (res: any) => {
        if (typeof res?.score === 'number') {
          this.scorePercent = res.score;
        }
        this.buildScoreRing();
        this.submitted = true;
        this.isSubmitting = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isSubmitting = false;
        this.cdr.markForCheck();
        alert('Error submitting test. Please check your connection and try again.');
      },
    });
  }

  private buildScoreRing(): void {
    const filled = Math.round((this.scorePercent / 100) * this.CIRCUMFERENCE);
    this.scoreRingDash = `${filled} ${this.CIRCUMFERENCE}`;
    this.scoreRingColor = this.scorePercent >= 70
      ? '#1D9E75'
      : this.scorePercent >= 40
        ? '#EF9F27'
        : '#E24B4A';
  }

}