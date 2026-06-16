import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../Service/ApiService ';

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
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboardcomponent.html',
  styleUrls: ['./dashboardcomponent.css'],
})
export class Dashboardcomponent implements OnInit {

  candidates: any[] = [];
  filteredCandidates: any[] = [];
  loading = true;
  activeFilter = 'all';
  saving = false;            // spinner on Save button

  selectedCandidate: any = null;
  showEditModal = false;
  modalAnimating = false;    // drives slide-in class

  toasts: Toast[] = [];
  private toastCounter = 0;
  private toastTimers: Map<number, any> = new Map();

  deleteConfirm: DeleteConfirm = { show: false, candidate: null, deleting: false };

  private avatarColors = [
    '#534AB7', '#1D9E75', '#D85A30',
    '#185FA5', '#993556', '#BA7517'
  ];

  stats = [
    {
      title: 'Total Resumes', value: 0, colorClass: 'si-purple',
      svgPath: `<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>`
    },
    {
      title: 'Shortlisted', value: 0, colorClass: 'si-green',
      svgPath: `<polyline points="20 6 9 17 4 12"/>`
    },
    {
      title: 'Rejected', value: 0, colorClass: 'si-red',
      svgPath: `<circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>`
    },
    {
      title: 'Pending Review', value: 0, colorClass: 'si-amber',
      svgPath: `<circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>`
    }
  ];

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadCandidates();
  }


  loadCandidates(): void {
    this.loading = true;
    this.api.getCandidates().subscribe({
      next: (res: any) => {
        // Normalise: plain array OR { data: [] }
        this.candidates = Array.isArray(res)
          ? [...res]
          : Array.isArray(res?.data) ? [...res.data] : [];

        this.applyFilter();
        this.updateStats();
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

  updateStats(): void {
    this.stats[0].value = this.candidates.length;
    this.stats[1].value = this.candidates.filter(c => c.status === 'Shortlisted').length;
    this.stats[2].value = this.candidates.filter(c => c.status === 'Rejected').length;
    this.stats[3].value = this.candidates.filter(c => c.status === 'Pending').length;
  }


  setFilter(status: string): void {
    this.activeFilter = status;
    this.applyFilter();
  }

  applyFilter(): void {
    this.filteredCandidates =
      this.activeFilter === 'all'
        ? this.candidates
        : this.candidates.filter(c => c.status === this.activeFilter);
  }


  editCandidate(candidate: any): void {
    this.selectedCandidate = { ...candidate };
    this.showEditModal = true;
    // trigger slide-in animation next tick
    setTimeout(() => { this.modalAnimating = true; }, 10);
  }

  closeModal(): void {
    this.modalAnimating = false;
    // wait for slide-out CSS transition (300ms) then hide
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
          // fallback: patch local copy
          const localIdx = this.candidates.findIndex(
            c => (c.candidateId || c.id) === candidateId
          );
          if (localIdx !== -1) this.candidates[localIdx] = { ...this.selectedCandidate };
        }

        this.applyFilter();
        this.updateStats();
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
        this.updateStats();
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

    // slide in
    setTimeout(() => {
      const t = this.toasts.find(x => x.id === id);
      if (t) { t.visible = true; this.cdr.detectChanges(); }
    }, 20);

    // auto-dismiss after 3.5 s
    const timer = setTimeout(() => this.dismissToast(id), 3500);
    this.toastTimers.set(id, timer);
  }

  dismissToast(id: number): void {
    const toast = this.toasts.find(t => t.id === id);
    if (!toast) return;
    toast.visible = false;
    this.cdr.detectChanges();
    // remove from DOM after slide-out
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
      error:   '✕',
      warning: '⚠',
      info:    'ℹ'
    };
    return icons[type];
  }

  // ── HELPERS ───────────────────────────────────────────────────────────────

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
}