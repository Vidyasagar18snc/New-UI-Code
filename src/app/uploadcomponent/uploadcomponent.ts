import { Component, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../Service/ApiService ';
import { NotificationService } from '../Service/NotificationService';
import { Router } from '@angular/router';

export interface UploadResult {
  fileName: string;
  name: string;
  status: 'uploading' | 'success' | 'duplicate' | 'error';
  message: string;
  progress: number;
}

@Component({
  selector: 'app-uploadcomponent',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './uploadcomponent.html',
  styleUrls: ['./uploadcomponent.css'],
})
export class Uploadcomponent implements OnInit {

  constructor(
    private api: ApiService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    public notificationService: NotificationService
  ) { }

  // ─── File state ───
  selectedFiles: File[] = [];
  jobRole = '';
  language = 'auto';
  roles: string[] = [];
  rolesLoading = false;

  // ─── Upload state ───
  uploading = false;
  uploadResults: UploadResult[] = [];
  showResultsPanel = false;

  // ─── Auto-redirect state ───
  redirectCountdown = 0;
  private redirectTimer: any = null;
  private redirectInterval: any = null;

  // ─── Drag state ───
  isDragging = false;

  // ─── Ask AI chat ───
  showAiPanel = false;
  aiInput = '';
  aiMessages: { role: 'user' | 'ai'; text: string }[] = [
    { role: 'ai', text: '👋 Hi! I\'m AI Recruit. Ask me anything about candidate shortlisting, resume tips, or job requirements.' }
  ];
  aiLoading = false;

  // ─── Notifications ───
  showNotifPanel = false;

  get notifications$() {
    return this.notificationService.notifications$;
  }

  get notifications() {
    return this.notificationService.notifications;
  }

  get unreadCount(): number {
    return this.notificationService.unreadCount;
  }

  // ─── Profile menu ───
  showProfileMenu = false;
  employeeName = localStorage.getItem('employeeName') || 'HR Admin';

  // ─── Lifecycle ───
  ngOnInit() {
    this.rolesLoading = true;
    this.api.getAllJobs().subscribe({
      next: (jobs: any[]) => {
        this.roles = jobs.map(j => j.title);
        this.rolesLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.rolesLoading = false; }
    });
  }

  ngOnDestroy() {
    this.clearRedirectTimers();
  }

  // ─── Outside click handler ───
  @HostListener('document:click')
  onDocClick() {
    this.showNotifPanel = false;
    this.showProfileMenu = false;
    // keep AI panel open on doc click — user has to close it explicitly
  }

  // ════════════════════════════════
  // ASK AI RECRUIT
  // ════════════════════════════════
  toggleAiPanel(e: Event) {
    e.stopPropagation();
    this.showAiPanel = !this.showAiPanel;
    if (this.showAiPanel) {
      this.showNotifPanel = false;
      this.showProfileMenu = false;
    }
  }

  closeAiPanel() { this.showAiPanel = false; }

  sendAiMessage() {
    const text = this.aiInput.trim();
    if (!text || this.aiLoading) return;
    this.aiMessages.push({ role: 'user', text });
    this.aiInput = '';
    this.aiLoading = true;

    setTimeout(() => {
      this.aiMessages.push({ role: 'ai', text: this.getAiReply(text) });
      this.aiLoading = false;
      this.cdr.detectChanges();
    }, 900);
  }

  private getAiReply(q: string): string {
    const lq = q.toLowerCase();

    if (
      (lq.includes('why') || lq.includes('reason') || lq.includes('criteria') || lq.includes('explain')) &&
      (lq.includes('shortlist') || lq.includes('shortlisted'))
    ) {
      return '✨ Candidates are shortlisted when their match score exceeds the qualification threshold (typically 75%+). This is determined by checkmarks on mandatory skills, meeting or exceeding the minimum years of experience, and overall resume parsing confidence.';
    }

    if (
      lq.includes('jd matching') ||
      lq.includes('matching work') ||
      lq.includes('matching algorithm') ||
      lq.includes('how are resumes matched') ||
      lq.includes('how does matching work') ||
      lq.includes('match work')
    ) {
      return '🎯 JD matching works by parsing the uploaded resume and extracting key attributes like years of experience, direct skills, and contextual qualifications. It then computes a match score by comparing these against the required experience, skills list, and description of the selected Job Description.';
    }

    if (
      lq.includes('score') ||
      lq.includes('rank') ||
      lq.includes('highest') ||
      lq.includes('best candidate') ||
      lq.includes('top scorer') ||
      lq.includes('top candidate')
    ) {
      return '🏆 The candidate with the highest match score is displayed at the top of the Candidate Rankings dashboard. Match scores are dynamically computed out of 100 based on how well their resume alignment fits the JD criteria.';
    }

    if (
      lq.includes('format') ||
      lq.includes('pdf') ||
      lq.includes('docx') ||
      lq.includes('doc')
    ) {
      return '📄 We support PDF, DOC, and DOCX formats. For best parsing results, use a clean, single-column layout PDF with named sections (Skills, Experience, Education).';
    }

    if (
      lq.includes('duplicate') ||
      lq.includes('already') ||
      lq.includes('exist')
    ) {
      return '⚠️ If a candidate with the same email already exists in the system, the upload will be flagged as a duplicate to prevent double-processing.';
    }

    if (
      lq.includes('how') &&
      (lq.includes('upload') || lq.includes('parse'))
    ) {
      return '📤 Steps: 1) Select a Job Role 2) Drag & drop or click to browse for resumes 3) Click "Upload Resumes" and the AI will parse and rank them instantly.';
    }

    if (
      lq.includes('role') ||
      lq.includes('job') ||
      lq.includes('jd')
    ) {
      return '💼 Select a Job Role from the dropdown before uploading. The AI then matches the resume against that JD\'s required skills and experience.';
    }

    return '🤖 I can help you with uploading resumes, shortlisting criteria, supported formats, candidate ranking, and JD matching. What would you like to know?';
  }

  onAiKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.sendAiMessage(); }
  }

  // ════════════════════════════════
  // NOTIFICATIONS
  // ════════════════════════════════
  toggleNotifPanel(e: Event) {
    e.stopPropagation();
    this.showNotifPanel = !this.showNotifPanel;
    if (this.showNotifPanel) { this.showAiPanel = false; this.showProfileMenu = false; }
  }

  markAllRead() { this.notificationService.markAllAsRead(); }

  markRead(n: any) { this.notificationService.markAsRead(n.id); }

  // ════════════════════════════════
  // PROFILE MENU
  // ════════════════════════════════
  toggleProfileMenu(e: Event) {
    e.stopPropagation();
    this.showProfileMenu = !this.showProfileMenu;
    if (this.showProfileMenu) { this.showAiPanel = false; this.showNotifPanel = false; }
  }

  goToDashboard() {
    this.clearRedirectTimers();
    this.router.navigate(['/dashboard']);
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/PortalLogin']);
  }

  // ════════════════════════════════
  // FILE HANDLING
  // ════════════════════════════════
  onFileSelect(event: any) {
    const files = Array.from(event.target.files) as File[];
    this.addFiles(files);
  }

  removeFile(index: number) {
    this.selectedFiles.splice(index, 1);
  }

  onDragOver(event: DragEvent) { event.preventDefault(); this.isDragging = true; }
  onDragLeave(event: DragEvent) { event.preventDefault(); this.isDragging = false; }
  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    this.addFiles(Array.from(event.dataTransfer?.files || []));
  }

  private addFiles(files: File[]) {
    const valid = files.filter(f => {
      const ext = f.name.toLowerCase();
      return ext.endsWith('.pdf') || ext.endsWith('.doc') || ext.endsWith('.docx');
    });
    this.selectedFiles = [...this.selectedFiles, ...valid];
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  // ════════════════════════════════
  // UPLOAD — with real progress UI
  // ════════════════════════════════
  upload() {
    if (this.selectedFiles.length === 0 || !this.jobRole) return;

    // Cancel any pending redirect from a previous upload batch
    this.clearRedirectTimers();

    this.uploading = true;
    this.showResultsPanel = true;
    this.uploadResults = this.selectedFiles.map(f => ({
      fileName: f.name,
      name: '',
      status: 'uploading' as const,
      message: 'Parsing resume…',
      progress: 0,
    }));

    // Animate progress bars
    this.uploadResults.forEach((_, i) => this.animateProgress(i));

    let completed = 0;
    this.selectedFiles.forEach((file, i) => {
      this.api.uploadResume(file, this.jobRole).subscribe({
        next: (res: any) => {
          this.uploadResults[i].progress = 100;
          this.uploadResults[i].name = res?.name || file.name;

          if (res?.status === 'Duplicate Candidate') {
            this.uploadResults[i].status = 'duplicate';
            this.uploadResults[i].message = `${res.name} already applied for ${res.role}.`;
          } else if (res?.status === 'Shortlisted') {
            this.uploadResults[i].status = 'success';
            this.uploadResults[i].message = `✅ ${res.name} shortlisted for ${res.role}!`;
          } else if (res?.status === 'Rejected') {
            this.uploadResults[i].status = 'success';
            this.uploadResults[i].message = `Processed — ${res.name} moved to Rejected pool.`;
          } else if (res?.status === 'Review') {
            this.uploadResults[i].status = 'success';
            this.uploadResults[i].message = `${res.name} added to Review queue.`;
          } else {
            this.uploadResults[i].status = 'success';
            this.uploadResults[i].message = 'Resume uploaded successfully.';
          }

          completed++;
          this.cdr.detectChanges();
          if (completed === this.selectedFiles.length) this.onAllDone();
        },
        error: (err) => {
          const cleanMessage = this.parseErrorMessage(err);
          const isDuplicate = /already exists|duplicate/i.test(cleanMessage);

          this.uploadResults[i].status = isDuplicate ? 'duplicate' : 'error';
          this.uploadResults[i].progress = 100;
          this.uploadResults[i].message = isDuplicate
            ? `⚠️ ${cleanMessage}`
            : `❌ ${cleanMessage}`;

          completed++;
          this.cdr.detectChanges();
          if (completed === this.selectedFiles.length) this.onAllDone();
        }
      });
    });
    
  }

  private animateProgress(index: number) {
    const tick = () => {
      if (this.uploadResults[index].status === 'uploading') {
        const cur = this.uploadResults[index].progress;
        if (cur < 85) {
          this.uploadResults[index].progress = Math.min(85, cur + Math.random() * 12);
          this.cdr.detectChanges();
          setTimeout(tick, 220);
        }
      }
    };
    setTimeout(tick, 100);
  }

  /**
   * Called once every file in the batch has finished processing
   * (AI parsing + shortlist/reject/review decision complete).
   * Shows the results panel for a few seconds, then auto-redirects
   * to the dashboard so HR immediately sees the updated candidate list.
   */
  private onAllDone() {
    this.uploading = false;
    this.selectedFiles = [];
    this.cdr.detectChanges();

    this.startAutoRedirect();
  }

  /**
   * Starts a visible countdown (in the results panel) then navigates
   * to /dashboard automatically. User can cancel by clicking
   * "View Candidates Now" / "Stay Here" or closing the panel.
   */
  private startAutoRedirect(delaySeconds: number = 3): void {
    this.redirectCountdown = delaySeconds;

    this.redirectInterval = setInterval(() => {
      this.redirectCountdown--;
      this.cdr.detectChanges();
      if (this.redirectCountdown <= 0) {
        clearInterval(this.redirectInterval);
      }
    }, 1000);

    this.redirectTimer = setTimeout(() => {
      this.clearRedirectTimers();
      this.showResultsPanel = false;
      this.uploadResults = [];
      this.router.navigate(['/dashboard']);
    }, delaySeconds * 1000);
  }

  private clearRedirectTimers(): void {
    if (this.redirectTimer) {
      clearTimeout(this.redirectTimer);
      this.redirectTimer = null;
    }
    if (this.redirectInterval) {
      clearInterval(this.redirectInterval);
      this.redirectInterval = null;
    }
    this.redirectCountdown = 0;
  }

  /** Lets the HR cancel the auto-redirect and stay on the upload page */
  cancelAutoRedirect(): void {
    this.clearRedirectTimers();
  }

  closeResults() {
    this.clearRedirectTimers();
    this.showResultsPanel = false;
    this.uploadResults = [];
  }

  goToCandidates() {
    this.clearRedirectTimers();
    this.router.navigate(['/dashboard']);
  }
  /**
 * Extracts a clean, human-readable message from a backend error response.
 * Strips raw HTTP status prefixes like `400 BAD_REQUEST "message"` and
 * unwraps quoted strings, so the UI never shows technical/protocol noise.
 */
private parseErrorMessage(err: any): string {
  let raw =
    err?.error?.message ||
    err?.error?.error ||
    (typeof err?.error === 'string' ? err.error : '') ||
    err?.message ||
    'Something went wrong while processing this resume.';

  // Strip leading HTTP status code + reason phrase, e.g. "400 BAD_REQUEST "
  raw = raw.replace(/^\d{3}\s+[A-Z_]+\s*/, '');

  // Strip wrapping quotes left over from backend string formatting
  raw = raw.replace(/^"(.*)"$/, '$1').trim();

  // Capitalize first letter for a polished look
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}
}
