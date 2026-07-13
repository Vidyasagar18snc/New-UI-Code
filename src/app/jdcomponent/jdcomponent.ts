import { Component, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../Service/ApiService ';
import { NotificationService } from '../Service/NotificationService';
import { Router } from '@angular/router';

@Component({
  selector: 'app-jdcomponent',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './jdcomponent.html',
  styleUrls: ['./jdcomponent.css']
})
export class Jdcomponent {

  constructor(
    private api: ApiService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    public notificationService: NotificationService
  ) { }

  jobTitle = '';
  experience: number | null = null;
  location = '';
  budget = '';
  description = '';
  skillInput = '';
  skills: string[] = [];
  charCount = 0;

  suggestedSkills: string[] = [];
  aiSuggesting = false;
  aiEnhancing = false;

  selectedFile: File | null = null;
  loading = false;

  isDragging = false;

  // ─── Toast Notification state ───
  toastMessage = '';
  toastType: 'success' | 'error' | 'info' = 'success';
  showToast = false;

  triggerToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.showToast = false;
      this.cdr.detectChanges();
    }, 4000);
  }

  // ─── AI Chat state ───
  showAiPanel = false;
  aiInput = '';
  aiMessages: { role: 'user' | 'ai'; text: string }[] = [
    { role: 'ai', text: '👋 Hi! I\'m AI Recruit. Ask me to generate a job description, suggest skills, or help write requirements.' }
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

  // ─── Profile Menu state ───
  showProfileMenu = false;
  employeeName = localStorage.getItem('employeeName') || 'HR Admin';

  // ─── Outside click handler ───
  @HostListener('document:click')
  onDocClick() {
    this.showNotifPanel = false;
    this.showProfileMenu = false;
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

    // 1. Skill suggestions
    if (lq.includes('skill')) {
      return '💡 For frontend roles, consider adding: TypeScript, React, state management (Redux/Zustand), and responsive design.';
    }

    // 2. JD drafting
    if (lq.includes('description') || lq.includes('write') || lq.includes('generate')) {
      return '📝 I can generate a JD! Just give me a title like "Backend Engineer" and I\'ll pre-fill the form for you.';
    }

    // 3. Shortlist criteria / reasons
    if (
      (lq.includes('why') || lq.includes('reason') || lq.includes('criteria') || lq.includes('explain')) &&
      (lq.includes('shortlist') || lq.includes('shortlisted'))
    ) {
      return '✨ Candidates are shortlisted when their match score exceeds the qualification threshold (typically 75%+). This is determined by checkmarks on mandatory skills, meeting or exceeding the minimum years of experience, and overall resume parsing confidence.';
    }

    // 4. JD Matching mechanics
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

    // 5. Candidate Match Scores / Rankings
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

    // 6. Supported Formats
    if (
      lq.includes('format') ||
      lq.includes('pdf') ||
      lq.includes('docx') ||
      lq.includes('doc')
    ) {
      return '📄 We support PDF, DOC, and DOCX formats. For best parsing results, use a clean, single-column layout PDF with named sections (Skills, Experience, Education).';
    }

    return '🤖 I can help you draft job descriptions, suggest required skills, match candidates to JDs, or explain shortlisting reasons. What would you like to know?';
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
  goToDashboard() { this.router.navigate(['/dashboard']); }
  logout() {
    localStorage.clear();
    this.router.navigate(['/PortalLogin']);
  }

  // ════════════════════════════════
  // JOB DESCRIPTION LOGIC
  // ════════════════════════════════

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
  }

  onFileDropped(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    const file = event.dataTransfer?.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  uploadJD() {
    if (!this.selectedFile) {
      this.triggerToast('Please select a file first', 'error');
      return;
    }

    this.loading = true;

    this.api.uploadJD(this.selectedFile).subscribe({
      next: (res: any) => {
        console.log('Parsed JD:', res);

        this.jobTitle = res.title || '';
        this.experience = res.experience || null;
        this.location = res.location || '';
        this.description = res.description || '';
        this.skills = res.skills || [];
        this.budget = res.budget || '';

        this.updateCharCount();
        this.loading = false;
        this.cdr.detectChanges();

        this.triggerToast('JD parsed successfully ✅', 'success');
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        this.cdr.detectChanges();
        this.triggerToast('Error parsing JD', 'error');
      }
    });
  }

  addSkill() {
    const trimmed = this.skillInput.trim();
    if (trimmed && !this.skills.includes(trimmed)) {
      this.skills.push(trimmed);
    }
    this.skillInput = '';
    if (this.suggestedSkills.includes(trimmed)) {
      this.suggestedSkills = this.suggestedSkills.filter(s => s !== trimmed);
    }
  }

  removeSkill(index: number) {
    this.skills.splice(index, 1);
  }

  suggestSkills() {
    const title = this.jobTitle.trim();
    if (!title) {
      this.triggerToast('Please enter a Job Title first so AI can suggest skills.', 'error');
      return;
    }

    this.aiSuggesting = true;
    this.suggestedSkills = [];
    this.cdr.detectChanges();

    setTimeout(() => {
      const lt = title.toLowerCase();
      let pool: string[] = [];

      if (lt.includes('frontend') || lt.includes('ui developer') || lt.includes('angular') || lt.includes('react') || lt.includes('vue')) {
        pool = ['React', 'Angular', 'TypeScript', 'JavaScript', 'HTML5', 'CSS3', 'Sass', 'Redux', 'Git', 'Webpack'];
      } else if (lt.includes('backend') || lt.includes('spring') || lt.includes('node') || lt.includes('python') || lt.includes('java ')) {
        pool = ['Java', 'Spring Boot', 'Node.js', 'REST APIs', 'PostgreSQL', 'Docker', 'Hibernate', 'AWS', 'Kubernetes', 'Microservices'];
      } else if (lt.includes('fullstack') || lt.includes('full stack') || lt.includes('software') || lt.includes('developer') || lt.includes('engineer') || lt.includes('programmer')) {
        pool = ['React', 'Angular', 'TypeScript', 'Java', 'Spring Boot', 'SQL', 'MongoDB', 'Git', 'REST APIs', 'Docker'];
      } else if (lt.includes('designer') || lt.includes('ui') || lt.includes('ux') || lt.includes('graphic')) {
        pool = ['Figma', 'Adobe XD', 'Sketch', 'Wireframing', 'Prototyping', 'User Research', 'UI Design', 'Design Systems', 'HTML/CSS'];
      } else if (lt.includes('qa') || lt.includes('testing') || lt.includes('test') || lt.includes('quality')) {
        pool = ['Selenium', 'Cypress', 'JUnit', 'Test Automation', 'Manual Testing', 'API Testing', 'Postman', 'CI/CD', 'Jira'];
      } else if (lt.includes('data') || lt.includes('analyst') || lt.includes('science') || lt.includes('scientist') || lt.includes('machine') || lt.includes('ml') || lt.includes('ai')) {
        pool = ['Python', 'R', 'SQL', 'Pandas', 'NumPy', 'Machine Learning', 'Tableau', 'PowerBI', 'TensorFlow', 'Data Pipelines'];
      } else if (lt.includes('manager') || lt.includes('pm') || lt.includes('product') || lt.includes('scrum') || lt.includes('agile')) {
        pool = ['Agile/Scrum', 'Product Roadmap', 'Jira', 'Stakeholder Management', 'User Stories', 'Market Research', 'KPI Tracking'];
      } else if (lt.includes('devops') || lt.includes('cloud') || lt.includes('system') || lt.includes('admin') || lt.includes('infra')) {
        pool = ['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Jenkins', 'Terraform', 'Linux', 'Git', 'Ansible', 'Bash Scripting'];
      } else {
        pool = ['Communication', 'Problem Solving', 'Teamwork', 'Agile Methodology', 'Project Management', 'Git', 'SQL'];
      }

      this.suggestedSkills = pool.filter(s => !this.skills.includes(s));
      this.aiSuggesting = false;
      this.cdr.detectChanges();

      if (this.suggestedSkills.length === 0) {
        this.triggerToast('All suggested skills are already added!', 'info');
      } else {
        this.triggerToast('AI suggested skills loaded! ✨', 'success');
      }
    }, 1000);
  }

  addSuggestedSkill(skill: string, index: number) {
    if (!this.skills.includes(skill)) {
      this.skills.push(skill);
    }
    this.suggestedSkills.splice(index, 1);
    this.cdr.detectChanges();
  }

  enhanceDescription() {
    const title = this.jobTitle.trim();
    if (!title) {
      this.triggerToast('Please enter a Job Title first so AI can enhance the description.', 'error');
      return;
    }

    this.aiEnhancing = true;
    this.cdr.detectChanges();

    setTimeout(() => {
      const exp = this.experience ? `${this.experience}+ years` : 'relevant';
      const loc = this.location.trim() || 'our office';
      const skillsList = this.skills.length > 0 ? this.skills.join(', ') : 'standard tools';

      let enhancedText = '';

      if (this.description.trim().length > 20) {
        const originalText = this.description.trim();
        enhancedText = `### Role Overview\nWe are looking for a highly skilled **${title}** with **${exp}** of experience to join our team at **${loc}**. The candidate will lead and contribute to key engineering challenges.\n\n### Key Responsibilities\n${originalText.includes('•') || originalText.includes('-') ? originalText : originalText.split('\n').map(line => line.trim() ? `• ${line}` : '').join('\n')}\n\n### Requirements & Key Skills\n• Strong expertise in: ${skillsList}\n• Hands-on experience with production-grade architectures and modern development practices\n• Proactive problem-solving abilities and strong teamwork skills`;
      } else {
        enhancedText = `### Role Overview\nWe are seeking a talented and motivated **${title}** to join our team in **${loc}**. In this role, you will collaborate with cross-functional teams to design, develop, and deploy high-quality, scalable solutions. We are looking for someone with **${exp}** of experience who is passionate about delivering exceptional results.\n\n### Key Responsibilities\n• Collaborate with product managers, developers, and stakeholders to define requirements and deliver solutions.\n• Design, develop, test, and deploy clean, maintainable, and efficient code.\n• Perform code reviews, mentor junior team members, and enforce engineering best practices.\n• Troubleshoot, debug, and optimize application performance.\n• Contribute to the continuous improvement of development processes, tools, and methodologies.\n• Participating in agile ceremonies (scrum, sprint planning, retrospective).\n\n### Requirements & Qualifications\n• **Experience**: ${exp} in a similar software engineering role.\n• **Core Skills**: Hands-on experience with **${skillsList}**.\n• Solid understanding of design patterns, data structures, and algorithms.\n• Experience with version control systems (Git) and CI/CD pipelines.\n• Excellent communication skills and a collaborative team player mindset.\n\n### What We Offer\n• Competitive salary and benefits package.\n• Dynamic, collaborative, and inclusive work environment.\n• Opportunities for professional growth and career development.\n• Flexible working hours and hybrid/remote work options.`;
      }

      this.description = enhancedText;
      this.updateCharCount();
      this.aiEnhancing = false;
      this.cdr.detectChanges();

      this.triggerToast('Job Description enhanced by AI! ✨', 'success');
    }, 1500);
  }

  updateCharCount() {
    this.charCount = this.description.length;
  }

  resetForm() {
    this.jobTitle = '';
    this.experience = null;
    this.location = '';
    this.budget = '';
    this.description = '';
    this.skills = [];
    this.skillInput = '';
    this.selectedFile = null;
    this.charCount = 0;
    this.suggestedSkills = [];
  }

  submitJob() {
    if (!this.jobTitle.trim()) {
      this.triggerToast('Job title is required', 'error');
      return;
    }

    const jobData = {
      title: this.jobTitle.trim(),
      experience: this.experience ? Number(this.experience) : 0,
      budget: this.budget.trim(),
      skills: this.skills,
      location: this.location.trim(),
      description: this.description.trim()
    };

    console.log('Sending job:', jobData);

    this.api.createJob(jobData).subscribe({
      next: (res) => {
        console.log('Saved:', res);
        this.triggerToast('Job created successfully ✅', 'success');
        this.resetForm();
        setTimeout(() => {
          this.router.navigate(['/jd-details']);
        }, 1200);
      },
      error: (err) => {
        console.error('Error:', err);
        this.triggerToast('Failed to create job ❌', 'error');
      }
    });
  }
}