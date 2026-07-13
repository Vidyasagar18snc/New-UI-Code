export interface OfferRequestDTO {
  name: string;
  email: string;    
  role: string;
  salary: string;
  joiningDate: string; // ISO format date string
  address: string;
  location: string;
  department: string;
  employmentType: 'Full-time' | 'Part-time' | 'Contract' | 'Internship';
  companyName: string;
  companyAddress: string;
  hrEmail: string;
  hrPhone: string;
  hrSignatoryName: string;
  hrSignatoryTitle: string;
  candidatePhone?: string;
  reportingManager?: string;
  probationPeriod?: string;
  noticePeriod?: string;
  offerValidity?: string;
  additionalNotes?: string;
  payFrequency?: string;
  currency?: string;
}