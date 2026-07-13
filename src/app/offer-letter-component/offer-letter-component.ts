import { Component, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../Service/ApiService ';
import { NotificationService } from '../Service/NotificationService';
import { OfferRequestDTO } from '../Model/OfferRequestDTO ';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-send-offer',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './offer-letter-component.html',
  styleUrls: ['./offer-letter-component.css']
})
export class OfferLetterComponent implements OnInit {

  offer: OfferRequestDTO = {
    name: 'Priya Sharma',
    email: 'priya@example.com',
    candidatePhone: '+91 98765 43210',
    address: '12 MG Road, Bengaluru - 560001, Karnataka, India',
    role: 'Senior Engineer',
    department: 'Engineering',
    employmentType: 'Full-time',
    joiningDate: '2026-07-01',
    location: 'Bengaluru, India',
    reportingManager: 'Rohit Verma',
    salary: '1200000',
    payFrequency: 'Monthly',
    currency: 'INR (₹)',
    probationPeriod: '6 Months',
    noticePeriod: '30 Days',
    offerValidity: '2026-06-15',
    additionalNotes: 'Please bring the necessary documents on your date of joining.',
    companyName: 'hginfotech',
    companyAddress: '4th Floor, Tech Park, Whitefield, Bengaluru',
    hrEmail: 'info@hginfotech.sg',
    hrPhone: '+91 98765 43210',
    hrSignatoryName: 'Rahul Menon',
    hrSignatoryTitle: 'Head of People'
  };

  loading = false;
  toastMsg = '';
  toastType: 'success' | 'error' = 'success';
  today = new Date();
  completedCount = 0;
  
  // Stepper & Active Panels
  activeStep: 1 | 2 | 3 = 1;
  activeField = '';
  showDispatchModal = false;
  dispatchState: 'folding' | 'sealing' | 'flying' | 'success' | 'error' = 'folding';
  sigAnimActive = true;

  // Form Card Collapse/Expand Flags
  cardCandidateOpen = true;
  cardRoleOpen = true;
  cardSalaryOpen = true;
  cardAddOpen = true;

  // Ask AI recruit Chat Panel
  showAiPanel = false;
  aiInput = '';
  aiMessages: { role: 'user' | 'ai'; text: string }[] = [
    { role: 'ai', text: '👋 Hi! I\'m AI Recruit. Ask me anything about candidate shortlisting, resume tips, or job requirements.' }
  ];
  aiLoading = false;

  // Notifications Bell
  showNotifPanel = false;

  // Profile menu
  showProfileMenu = false;
  employeeName = localStorage.getItem('employeeName') || 'HR Admin';

  departments = ['Engineering', 'Product', 'Design', 'Sales', 'HR', 'Finance', 'Operations'];
  empTypes = ['Full-time', 'Part-time', 'Contract', 'Internship'];
  payFrequencies = ['Monthly', 'Bi-weekly', 'Weekly', 'One-time'];
  currencies = ['INR (₹)', 'USD ($)', 'EUR (€)', 'GBP (£)'];

  checklistItems = [
    { label: 'Candidate Name', completed: false },
    { label: 'Designation', completed: false },
    { label: 'Salary Breakup', completed: false },
    { label: 'Joining Date', completed: false },
    { label: 'Company Details', completed: false },
    { label: 'HR Signatory', completed: false }
  ];

  salaryBreakup: { component: string; monthly: number; annual: number }[] = [];

  constructor(
    private offerService: ApiService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    public notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.calculateSalaryBreakup();
    this.updateChecklist();
  }

  @HostListener('document:click')
  onDocClick(): void {
    this.showNotifPanel = false;
    this.showProfileMenu = false;
  }

  onFieldChange(fieldName?: string): void {
    if (fieldName === 'salary') {
      this.calculateSalaryBreakup();
    }
    this.updateChecklist();
    
    if (fieldName === 'hrSignatoryName') {
      this.sigAnimActive = false;
      this.cdr.detectChanges();
      setTimeout(() => {
        this.sigAnimActive = true;
        this.cdr.detectChanges();
      }, 20);
    }
  }

  isFieldFilled(field: string): boolean {
    return !!(this.offer as any)[field]?.toString().trim();
  }

  updateChecklist(): void {
    this.checklistItems[0].completed = !!this.offer.name?.trim();
    this.checklistItems[1].completed = !!this.offer.role?.trim();
    this.checklistItems[2].completed = !!this.offer.salary?.toString().trim();
    this.checklistItems[3].completed = !!this.offer.joiningDate?.trim();
    this.checklistItems[4].completed = !!(this.offer.companyName?.trim() && this.offer.companyAddress?.trim());
    this.checklistItems[5].completed = !!(this.offer.hrSignatoryName?.trim() && this.offer.hrSignatoryTitle?.trim());
    
    this.completedCount = this.checklistItems.filter(c => c.completed).length;
  }

  calculateSalaryBreakup(): void {
    const salary = parseFloat(this.offer.salary);
    if (isNaN(salary) || salary <= 0) {
      this.salaryBreakup = [];
      return;
    }

    // Baseline calculation based on proportional scaling (using 12,00,000 baseline from screenshot)
    const factor = salary / 1200000;

    const basicMonthly = Math.round(50000 * factor);
    const hraMonthly = Math.round(25000 * factor);
    const specialMonthly = Math.round(15000 * factor);
    const epfMonthly = Math.round(6000 * factor);
    const gratuityMonthly = Math.round(2402 * factor);
    const variableMonthly = Math.round(1599 * factor);

    const basicAnnual = basicMonthly * 12;
    const hraAnnual = hraMonthly * 12;
    const specialAnnual = specialMonthly * 12;
    const epfAnnual = epfMonthly * 12;
    const gratuityAnnual = gratuityMonthly * 12;

    const totalGrossMonthly = basicMonthly + hraMonthly + specialMonthly + epfMonthly + gratuityMonthly;
    const totalGrossAnnual = basicAnnual + hraAnnual + specialAnnual + epfAnnual + gratuityAnnual;

    // Remaining variable adjustment to ensure total equals annual salary
    const variableAnnual = salary - totalGrossAnnual;
    const totalCostMonthly = totalGrossMonthly + variableMonthly;
    const totalCostAnnual = totalGrossAnnual + variableAnnual;

    this.salaryBreakup = [
      { component: 'Basic Salary', monthly: basicMonthly, annual: basicAnnual },
      { component: 'House Rent Allowance (HRA)', monthly: hraMonthly, annual: hraAnnual },
      { component: 'Special Allowance', monthly: specialMonthly, annual: specialAnnual },
      { component: 'Employer Provident Fund (EPF)', monthly: epfMonthly, annual: epfAnnual },
      { component: 'Gratuity', monthly: gratuityMonthly, annual: gratuityAnnual },
      { component: 'Total Gross (CTC)', monthly: totalGrossMonthly, annual: totalGrossAnnual },
      { component: 'Performance Bonus (Variable)', monthly: variableMonthly, annual: variableAnnual },
      { component: 'Total Cost to Company (CTC)', monthly: totalCostMonthly, annual: totalCostAnnual }
    ];
  }

  validate(): string | null {
    if (!this.offer.name?.trim()) return 'Candidate name';
    if (!this.offer.email?.trim()) return 'Email address';
    if (!this.offer.role?.trim()) return 'Designation';
    if (!this.offer.salary?.toString().trim()) return 'Salary';
    if (!this.offer.joiningDate?.trim()) return 'Joining date';

    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(this.offer.email)) return 'Valid email address';
    return null;
  }

  saveAsDraft(): void {
    this.showToast('Offer letter saved as draft successfully!', 'success');
  }

  sendOffer(): void {
    const missing = this.validate();
    if (missing) {
      this.showToast('Please fill in: ' + missing, 'error');
      return;
    }
    this.loading = true;
    this.showDispatchModal = true;
    this.dispatchState = 'folding';
    this.activeStep = 2; // Stepper: Preview
    this.cdr.detectChanges();

    let apiDone = false;
    let apiResult: 'success' | 'error' | null = null;
    let errorMsg = '';
    
    // Start backend PDF generation & S3 upload immediately in the background
    this.offerService.sendOffer(this.offer).subscribe({
      next: () => {
        apiDone = true;
        apiResult = 'success';
        handleStateTransition();
      },
      error: (err) => {
        apiDone = true;
        apiResult = 'error';
        errorMsg = err?.error?.message || err?.message || 'Server error';
        handleStateTransition();
      }
    });

    let currentPhase: 'folding' | 'sealing' | 'flying' | 'done' = 'folding';

    // Step 2: Transition to sealing after 1000ms
    setTimeout(() => {
      if (this.dispatchState !== 'folding') return;
      this.dispatchState = 'sealing';
      currentPhase = 'sealing';
      this.cdr.detectChanges();

      // Step 3: Transition to flying after 1000ms
      setTimeout(() => {
        if (this.dispatchState !== 'sealing') return;
        this.dispatchState = 'flying';
        this.activeStep = 3; // Stepper: Send
        currentPhase = 'flying';
        this.cdr.detectChanges();

        // Step 4: Animation is fully complete after 800ms
        setTimeout(() => {
          if (this.dispatchState !== 'flying') return;
          currentPhase = 'done';
          handleStateTransition();
        }, 800);
      }, 1000);
    }, 1000);

    const self = this;
    function handleStateTransition() {
      // Don't transition if API is still pending
      if (!apiDone) return;
      
      // If API finished early, wait until at least 'flying' starts to show success/error
      if (currentPhase === 'folding' || currentPhase === 'sealing') return;

      if (apiResult === 'success') {
        self.dispatchState = 'success';
        self.loading = false;
        self.showToast('Offer letter sent successfully!', 'success');
      } else {
        self.dispatchState = 'error';
        self.loading = false;
        self.showToast('Failed to send: ' + errorMsg, 'error');
      }
      self.cdr.detectChanges();
    }
  }

  closeDispatchModal(): void {
    this.showDispatchModal = false;
    this.activeStep = 1;
    this.cdr.detectChanges();
  }

  getMonthlySalary(): number {
    const sal = parseFloat(this.offer.salary);
    return isNaN(sal) ? 0 : sal / 12;
  }

  getDailySalary(): number {
    const sal = parseFloat(this.offer.salary);
    return isNaN(sal) ? 0 : sal / 365;
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  // ════════════════════════════════
  // ASK AI RECRUIT
  // ════════════════════════════════
  toggleAiPanel(e: Event) {
    e.stopPropagation();
    this.showAiPanel = !this.showAiPanel;
    if (this.showAiPanel) {
      this.showNotifPanel  = false;
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

    // Simulate AI response with smart canned replies
    setTimeout(() => {
      this.aiMessages.push({ role: 'ai', text: this.getAiReply(text) });
      this.aiLoading = false;
      this.cdr.detectChanges();
    }, 900);
  }

  private getAiReply(q: string): string {
    const lq = q.toLowerCase();

    // 1. Shortlist criteria / reasons
    if (
      (lq.includes('why') || lq.includes('reason') || lq.includes('criteria') || lq.includes('explain')) &&
      (lq.includes('shortlist') || lq.includes('shortlisted'))
    ) {
      return '✨ Candidates are shortlisted when their match score exceeds the qualification threshold (typically 75%+). This is determined by checkmarks on mandatory skills, meeting or exceeding the minimum years of experience, and overall resume parsing confidence.';
    }

    // 2. JD Matching mechanics
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

    // 3. Candidate Match Scores / Rankings
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

    // 4. Supported Formats
    if (
      lq.includes('format') ||
      lq.includes('pdf') ||
      lq.includes('docx') ||
      lq.includes('doc')
    ) {
      return '📄 We support PDF, DOC, and DOCX formats. For best parsing results, use a clean, single-column layout PDF with named sections (Skills, Experience, Education).';
    }

    // 5. Duplicate Uploads
    if (
      lq.includes('duplicate') ||
      lq.includes('already') ||
      lq.includes('exist')
    ) {
      return '⚠️ If a candidate with the same email already exists in the system, the upload will be flagged as a duplicate to prevent double-processing.';
    }

    // 6. How to Upload / Steps
    if (
      lq.includes('how') &&
      (lq.includes('upload') || lq.includes('parse'))
    ) {
      return '📤 Steps: 1) Select a Job Role 2) Drag & drop or click to browse for resumes 3) Click "Upload Resumes" and the AI will parse and rank them instantly.';
    }

    // 7. Role / Job Selection
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

  get notifications$() { return this.notificationService.notifications$; }
  get notifications() { return this.notificationService.notifications; }
  get unreadCount(): number { return this.notificationService.unreadCount; }

  // ════════════════════════════════
  // PROFILE MENU
  // ════════════════════════════════
  toggleProfileMenu(e: Event) {
    e.stopPropagation();
    this.showProfileMenu = !this.showProfileMenu;
    if (this.showProfileMenu) { this.showAiPanel = false; this.showNotifPanel = false; }
  }

  goToDashboard() { this.router.navigate(['/dashboard']); }

  logout() {
    localStorage.clear();
    this.router.navigate(['/PortalLogin']);
  }

  private showToast(msg: string, type: 'success' | 'error'): void {
    this.toastMsg  = msg;
    this.toastType = type;
    this.cdr.detectChanges();

    setTimeout(() => {
      this.toastMsg = '';
      this.cdr.detectChanges();
    }, 4000);
  }
}