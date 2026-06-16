export interface Job {
  id: string;
  title: string;
  department?: string;
  experience: number;
  location: string;
  skills: string[];
  description: string;
  status?: 'active' | 'draft' | 'closed';
  aiMatchScore?: number;
  aiSkillScore?: number;
  aiExpScore?: number;
  isExpanded?: boolean;
  budget:string;

}