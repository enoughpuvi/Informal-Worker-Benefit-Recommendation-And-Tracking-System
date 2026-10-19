export interface User {
  id: number;
  email: string;
  full_name: string;
  phone?: string;
  role: 'worker' | 'admin';
  is_active: boolean;
  created_at?: string;
}

export interface WorkerProfile {
  id?: number;
  user_id?: number;
  date_of_birth?: string;
  age?: number;
  gender?: string;
  address?: string;
  state?: string;
  district?: string;
  city?: string;
  pincode?: string;
  occupation?: string;
  employment_type?: string;
  experience_years?: number;
  employer_status?: string;
  monthly_income?: number;
  working_days_month?: number;
  marital_status?: string;
  family_members?: number;
  dependents_count?: number;
  children_count?: number;
  elderly_count?: number;
  education_level?: string;
  disability_status?: boolean;
  disability_type?: string;
  existing_benefits?: string;
  bank_account?: boolean;
  identity_proof_type?: string;
  profile_completion?: number;
  missing_fields?: string[];
}

export interface Scheme {
  scheme_id: string;
  scheme_name: string;
  description: string;
  category: string;
  department?: string;
  government_level?: string;
  state?: string;
  target_occupation?: string;
  minimum_age?: number;
  maximum_age?: number;
  income_limit?: number;
  gender?: string;
  education?: string;
  disability_eligibility?: string;
  family_criteria?: string;
  required_documents?: string;
  benefits: string;
  benefit_amount?: number;
  application_process?: string;
  official_url?: string;
  status: 'active' | 'inactive';
  last_updated?: string;
}

export interface TimelineStep {
  stage_id: string;
  title: string;
  description: string;
  state: 'COMPLETED' | 'CURRENT' | 'PENDING' | 'REJECTED';
  timestamp?: string;
  admin_remarks?: string;
}

export interface StatusHistoryItem {
  id: number;
  application_id: number;
  previous_status?: string;
  new_status: string;
  changed_by_name?: string;
  timestamp: string;
  remarks?: string;
}

export interface DocumentItem {
  id: number;
  application_id?: number;
  application_no?: string;
  scheme_name?: string;
  worker_id: number;
  document_type: string;
  file_name: string;
  file_path: string;
  file_size: number;
  upload_date: string;
  status: 'Uploaded' | 'Under Verification' | 'Verified' | 'Rejected';
  admin_remarks?: string;
  verified_at?: string;
}

export interface Application {
  id: number;
  application_no: string;
  worker_id: number;
  scheme_id: string;
  application_date: string;
  current_status: string;
  benefit_amount?: number;
  benefit_disbursed_date?: string;
  admin_remarks?: string;
  last_updated?: string;
  scheme?: Scheme;
  worker?: User;
  status_history?: StatusHistoryItem[];
  documents?: DocumentItem[];
  timeline_steps?: TimelineStep[];
}

export interface ScoreBreakdown {
  occupation: number;
  income: number;
  age: number;
  location: number;
  family: number;
  disability: number;
  education: number;
  other: number;
}

export interface RecommendationItem {
  scheme: Scheme;
  match_score: number;
  reasons: string[];
  caveats: string[];
  breakdown: ScoreBreakdown;
  eligibility_status: 'Eligible' | 'Potentially Eligible' | 'Not Eligible';
}

export interface EligibilityResult {
  scheme_id: string;
  scheme_name: string;
  status: 'Eligible' | 'Potentially Eligible' | 'Not Eligible';
  is_eligible: boolean;
  match_percentage: number;
  satisfied_criteria: string[];
  missing_criteria: string[];
  failed_criteria: string[];
  remarks?: string;
}

export interface NotificationItem {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: string;
  related_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface ChartItem {
  name: string;
  value: number;
  secondary?: number;
}

export interface ProcessingTimeStats {
  average_days: number;
  min_days: number;
  max_days: number;
  total_completed_cases: number;
}

export interface AdminAnalytics {
  total_workers: number;
  total_schemes: number;
  active_schemes: number;
  total_applications: number;
  pending_applications: number;
  approved_applications: number;
  rejected_applications: number;
  disbursed_applications: number;
  total_benefits_disbursed_amount: number;
  approval_rate: number;
  rejection_rate: number;
  processing_time: ProcessingTimeStats;
  applications_by_status: ChartItem[];
  applications_by_occupation: ChartItem[];
  applications_by_scheme: ChartItem[];
  monthly_trends: Array<{ month: string; applied: number; approved: number; disbursed: number }>;
}

export interface DatasetRowPreview {
  row_index: number;
  scheme_id: string;
  scheme_name: string;
  category: string;
  target_occupation: string;
  income_limit?: string;
  age_range: string;
  status: 'VALID' | 'INVALID' | 'DUPLICATE_IN_FILE' | 'EXISTS_WILL_UPDATE' | 'NEW';
  errors: string[];
  data: Record<string, any>;
}

export interface DatasetPreviewResponse {
  filename: string;
  total_rows: number;
  valid_count: number;
  invalid_count: number;
  duplicate_count: number;
  update_count: number;
  new_count: number;
  columns_found: string[];
  missing_required_columns: string[];
  rows: DatasetRowPreview[];
  is_valid_for_import: boolean;
  import_token: string;
}

export interface IssueReport {
  id: number;
  ticket_no: string;
  user_id: number;
  user_name: string;
  user_email: string;
  user_role: string;
  category: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  subject: string;
  description: string;
  related_application_no?: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  admin_response?: string;
  resolved_by?: string;
  created_at: string;
  updated_at?: string;
}

export interface IssueReportCreatePayload {
  category: string;
  priority: string;
  subject: string;
  description: string;
  related_application_no?: string;
}

export type PortalCategory =
  | 'Labour and Employment'
  | 'Pension and Social Security'
  | 'Health and Insurance'
  | 'Agriculture'
  | 'Education'
  | 'Housing'
  | 'Women and Child Welfare'
  | 'Financial Assistance'
  | 'Skill Development';

export interface TrustedPortal {
  id: string;
  name: string;
  hindi_name?: string;
  description: string;
  government_level: 'Central' | 'State';
  state: string;
  responsible_department: string;
  categories: string[];
  information_available: string[];
  supported_languages: string[];
  official_url: string;
  application_url?: string;
  portal_type: 'Informational & Discovery' | 'Direct Application & Service' | 'State Unified Portal';
  verification_status: 'Verified' | 'Needs verification';
  last_verified_date: string;
  review_frequency_days: number;
  schemes_count: number;
  notes?: string;
}

export interface PortalScheme {
  id: string;
  portal_id: string;
  portal_name: string;
  name: string;
  category: string;
  responsible_department: string;
  state_applicability: string;
  target_occupation: string;
  eligibility: string;
  benefits: string;
  required_documents: string[];
  official_information_url: string;
  application_url: string;
  last_verified_date: string;
  verification_status: 'Verified' | 'Needs verification';
}


