import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ApiService } from '../Service/ApiService ';

export type ViolationType =
  | 'TAB_SWITCH'
  | 'WINDOW_MINIMIZE'
  | 'COPY_ATTEMPT'
  | 'PASTE_ATTEMPT'
  | 'RIGHT_CLICK'
  | 'PAGE_REFRESH'
  | 'BACK_BUTTON'
  | 'DEVTOOLS_OPEN'
  | 'MULTI_SCREEN'
  | 'FULLSCREEN_EXIT';

export interface ViolationState {
  warningCount: number;
  blocked: boolean;
  message: string;
  lastViolationType: ViolationType | null;
}

/**
 * Encapsulates all browser-level proctoring detection for a single active
 * assessment attempt. Kept separate from TestComponent so it can be reused
 * by any future test/exam surface, and so future proctoring signals
 * (webcam, screen-share, multi-monitor) can be added here without touching
 * component code.
 */
@Injectable({ providedIn: 'root' })
export class ProctoringService {

  /** Ignore repeat events of the same type within this window (ms). */
  private readonly DEBOUNCE_MS = 3000;

  /** outerWidth/innerWidth or outerHeight/innerHeight gap that suggests devtools is docked open. */
  private readonly DEVTOOLS_THRESHOLD = 160;
  private readonly DEVTOOLS_POLL_MS = 1500;

  private token = '';
  private active = false;

  private lastEventAt: Partial<Record<ViolationType, number>> = {};
  private devtoolsPoll?: ReturnType<typeof setInterval>;

  private readonly state$ = new BehaviorSubject<ViolationState>({
    warningCount: 0,
    blocked: false,
    message: '',
    lastViolationType: null,
  });

  private readonly boundVisibility = () => this.onVisibilityChange();
  private readonly boundBlur = () => this.report('WINDOW_MINIMIZE');
  private readonly boundCopy = () => this.report('COPY_ATTEMPT');
  private readonly boundPaste = () => this.report('PASTE_ATTEMPT');
  private readonly boundCut = () => this.report('COPY_ATTEMPT');
  private readonly boundContextMenu = (e: Event) => {
    e.preventDefault();
    this.report('RIGHT_CLICK');
  };
  private readonly boundBeforeUnload = (e: BeforeUnloadEvent) => {
    this.report('PAGE_REFRESH');
    e.preventDefault();
    e.returnValue = '';
  };
  private readonly boundPopState = () => {
    // Immediately cancel the back-navigation and re-arm the guard entry.
    history.pushState(null, '', location.href);
    this.report('BACK_BUTTON');
  };
  private readonly boundFullscreenChange = () => {
    if (!document.fullscreenElement) this.report('FULLSCREEN_EXIT');
  };

  constructor(private apiService: ApiService, private zone: NgZone) {}

  get violationState$(): Observable<ViolationState> {
    return this.state$.asObservable();
  }

  get snapshot(): ViolationState {
    return this.state$.value;
  }

  /** Begin monitoring for the given assessment token. Call once, when the exam starts. */
  start(token: string): void {
    if (this.active) return;
    this.active = true;
    this.token = token;

    this.state$.next({ warningCount: 0, blocked: false, message: '', lastViolationType: null });
    this.lastEventAt = {};

    document.addEventListener('visibilitychange', this.boundVisibility);
    window.addEventListener('blur', this.boundBlur);
    document.addEventListener('copy', this.boundCopy);
    document.addEventListener('paste', this.boundPaste);
    document.addEventListener('cut', this.boundCut);
    document.addEventListener('contextmenu', this.boundContextMenu);
    window.addEventListener('beforeunload', this.boundBeforeUnload);

    // Seed a history entry so the first back-press is interceptable.
    history.pushState(null, '', location.href);
    window.addEventListener('popstate', this.boundPopState);

    document.addEventListener('fullscreenchange', this.boundFullscreenChange);

    this.devtoolsPoll = setInterval(() => this.checkDevTools(), this.DEVTOOLS_POLL_MS);

    this.tryEnterFullscreen();
  }

  /** Stop all monitoring. Call on submit, disqualification, or component destroy. */
  stop(): void {
    if (!this.active) return;
    this.active = false;

    document.removeEventListener('visibilitychange', this.boundVisibility);
    window.removeEventListener('blur', this.boundBlur);
    document.removeEventListener('copy', this.boundCopy);
    document.removeEventListener('paste', this.boundPaste);
    document.removeEventListener('cut', this.boundCut);
    document.removeEventListener('contextmenu', this.boundContextMenu);
    window.removeEventListener('beforeunload', this.boundBeforeUnload);
    window.removeEventListener('popstate', this.boundPopState);
    document.removeEventListener('fullscreenchange', this.boundFullscreenChange);

    if (this.devtoolsPoll) clearInterval(this.devtoolsPoll);

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }

  private onVisibilityChange(): void {
    if (document.hidden) this.report('TAB_SWITCH');
  }

  private checkDevTools(): void {
    const widthDiff = window.outerWidth - window.innerWidth;
    const heightDiff = window.outerHeight - window.innerHeight;
    if (widthDiff > this.DEVTOOLS_THRESHOLD || heightDiff > this.DEVTOOLS_THRESHOLD) {
      this.report('DEVTOOLS_OPEN');
    }
  }

  private tryEnterFullscreen(): void {
    const el = document.documentElement as any;
    const request = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
    if (request) {
      request.call(el).catch(() => {
        // Some browsers require a direct user gesture; silently ignore if blocked.
      });
    }
  }

  private report(type: ViolationType): void {
    if (!this.active || this.snapshot.blocked) return;

    const now = Date.now();
    const last = this.lastEventAt[type] ?? 0;
    if (now - last < this.DEBOUNCE_MS) return;
    this.lastEventAt[type] = now;

    this.apiService.recordViolation(this.token, type).subscribe({
      next: (res: any) => {
        this.zone.run(() => {
          this.state$.next({
            warningCount: res?.warningCount ?? this.snapshot.warningCount,
            blocked: !!res?.blocked,
            message: res?.message ?? '',
            lastViolationType: type,
          });
          if (res?.blocked) this.stop();
        });
      },
      error: () => {
        // A failed network report shouldn't crash the exam; the server
        // remains the source of truth and will reflect the real count
        // once connectivity/reporting succeeds again.
      },
    });
  }
}