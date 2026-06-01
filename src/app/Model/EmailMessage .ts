export interface EmailMessage {
  id: string;
  candidateName: string;
  candidateInitials: string;
  avatarColor: 'purple' | 'teal' | 'amber' | 'red' | 'blue';
  subject: string;
  preview: string;
  type: 'interview' | 'offer' | 'reject' | 'followup' | 'new';
  time: string;
  unread: boolean;
  opened?: boolean;
  replied?: boolean;
}

export interface EmailTemplate {
  id: string;
  title: string;
  description: string;
  iconColor: string;
  iconStroke: string;
  usageCount: number;
  subject: string;
  body: string;
  
  type: 'interview' | 'offer' | 'reject' | 'followup' | 'document' | 'custom';
}