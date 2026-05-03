import {
  JobStatus,
  ApplicationStatus,
  AssignmentStatus,
  PaymentStatus,
  PaymentType,
  DisputeStatus,
  EmployerBadge,
  JobType,
  EscrowStatus,
  MilestoneStatus,
  OnlinePaymentType,
  ExperienceLevel,
} from "./enums";

export type PrivacyVisibility = "PUBLIC" | "ACCEPTED_ONLY" | "PRIVATE";
export type JobSalaryType = "HOURLY" | "FIXED";

export interface WorkerPrivacySettings {
  phone: PrivacyVisibility;
  address: PrivacyVisibility;
  dateOfBirth: PrivacyVisibility;
  location: PrivacyVisibility;
}

export interface EmployerPrivacySettings {
  phone: PrivacyVisibility;
  address: PrivacyVisibility;
  companyDescription: PrivacyVisibility;
}

export type ProgressStepStatus = "done" | "active" | "pending" | "failed";

export interface ProgressStep {
  key: string;
  label: string;
  status: ProgressStepStatus;
  timestamp?: string | null;
}

export interface ApplicationProgress {
  applicationId: string;
  applicationStatus: ApplicationStatus;
  jobId: string;
  jobTitle: string;
  jobAddress: string;
  startTime: string;
  endTime: string;
  salaryPerHour: number;
  currentStep: number;
  steps: ProgressStep[];
  workerInfo: Record<string, unknown>;
  employerInfo: Record<string, unknown>;
  assignment?: {
    id: string;
    status: AssignmentStatus;
    startedAt: string | null;
    checkedInAt: string | null;
    completedAt: string | null;
    notes: string | null;
  } | null;
}

export interface ApplicationChatSender {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

export interface ApplicationChatMessage {
  id: string;
  body: string;
  createdAt: string;
  senderId: string;
  sender: ApplicationChatSender;
}

export interface ApplicationChatResponse {
  messages: ApplicationChatMessage[];
  canSend: boolean;
}

export interface JobCategory {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
}

export interface Skill {
  id: string;
  name: string;
  description: string | null;
}

export interface JobSkill {
  id: string;
  jobId: string;
  skillId: string;
  skill: Skill;
}

export interface EmployerProfileInfo {
  id: string;
  companyName: string | null;
  ratingAvg: number;
  totalReviews: number;
  totalJobsPosted: number;
  trustScore: number;
  isVerifiedBusiness: boolean;
  badge: EmployerBadge;
}

export interface Job {
  id: string;
  employerId: string;
  categoryId: string;
  title: string;
  description: string;
  salaryPerHour?: number;
  salaryType?: JobSalaryType;
  requiredWorkers: number;
  startTime?: string;
  endTime?: string;
  provinceCode?: string;
  wardCode?: string;
  address?: string;
  lat: number | null;
  lng: number | null;
  status: JobStatus;
  category: JobCategory;
  employer: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
  jobSkills: JobSkill[];
  applications?: JobApplication[];
  employerProfile?: EmployerProfileInfo | null;
  distance?: number;
  createdAt: string;
  updatedAt: string;
  
  // JobType & specific fields
  jobType?: JobType;
  
  // PART_TIME fields
  contractDuration?: string;
  workSchedule?: string;
  paymentNote?: string;
  
  // ONLINE fields
  onlinePaymentType?: OnlinePaymentType;
  totalBudget?: number;
  hourlyRateMin?: number;
  hourlyRateMax?: number;
  deadline?: string;
  experienceLevel?: ExperienceLevel;
  deliverableType?: string;
  projectScope?: string;
}

export interface JobApplication {
  id: string;
  jobId: string;
  workerId: string;
  coverLetter: string | null;
  status: ApplicationStatus;
  appliedAt: string;
  respondedAt: string | null;
  worker: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
  job?: Job;
}

export interface JobAssignment {
  id: string;
  jobId: string;
  workerId: string;
  applicationId: string;
  status: AssignmentStatus;
  startedAt: string | null;
  checkedInAt: string | null;
  completedAt: string | null;
  notes: string | null;
}

export interface Review {
  id: string;
  reviewerId: string;
  revieweeId: string;
  jobId: string;
  rating: number;
  comment: string | null;
  reviewer: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
  job: {
    id: string;
    title: string;
  };
  createdAt: string;
}

export interface WorkerProfile {
  id: string;
  userId: string;
  bio: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  provinceCode: string | null;
  wardCode: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  isAvailable: boolean;
  ratingAvg: number;
  totalReviews: number;
  totalJobsCompleted: number;
  workerSkills: WorkerSkill[];
  privacySettings?: WorkerPrivacySettings;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
}

export interface EmployerProfile {
  id: string;
  userId: string;
  companyName: string | null;
  companyDescription: string | null;
  phone: string | null;
  provinceCode: string | null;
  wardCode: string | null;
  address: string | null;
  ratingAvg: number;
  totalReviews: number;
  totalJobsPosted: number;
  trustScore: number;
  isVerifiedBusiness: boolean;
  badge: EmployerBadge;
  privacySettings?: EmployerPrivacySettings;
}

export interface WorkerSkill {
  id: string;
  workerProfileId: string;
  skillId: string;
  yearsOfExperience: number | null;
  skill: Skill;
}

export interface Province {
  code: string;
  name: string;
  nameEn: string;
  fullName: string;
}

export interface Ward {
  code: string;
  name: string;
  nameEn: string;
  fullName: string;
  provinceCode: string;
}

export interface ProvinceDetail extends Province {
  wards: Ward[];
}

// Request DTOs
export interface CreateJobRequest {
  categoryId: string;
  title: string;
  description: string;
  salaryPerHour: number;
  salaryType?: JobSalaryType;
  requiredWorkers: number;
  startTime: string;
  endTime: string;
  provinceCode: string;
  wardCode: string;
  address: string;
  latitude?: number;
  longitude?: number;
  skillIds?: string[];
  jobType?: JobType;
  // Part-time fields
  contractDuration?: string;
  workSchedule?: string;
  paymentNote?: string;
  // Online fields
  totalBudget?: number;
  deliverableType?: string;
}

export interface ApplyJobRequest {
  coverLetter?: string;
}

export interface JobFilterParams {
  page?: number;
  limit?: number;
  provinceCode?: string;
  wardCode?: string;
  category?: string;
  salaryMin?: number;
  salaryMax?: number;
  search?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  jobType?: JobType;
}

export interface CreateReviewRequest {
  revieweeId: string;
  jobId: string;
  rating: number;
  comment?: string;
}

export interface CreateWorkerProfileRequest {
  bio?: string;
  phone?: string;
  dateOfBirth?: string;
  provinceCode?: string;
  wardCode?: string;
  address?: string;
  lat?: number;
  lng?: number;
  skillIds?: string[];
  privacySettings?: WorkerPrivacySettings;
}

export interface CreateEmployerProfileRequest {
  companyName?: string;
  companyDescription?: string;
  phone?: string;
  provinceCode?: string;
  wardCode?: string;
  address?: string;
  privacySettings?: EmployerPrivacySettings;
}

// Payment types
export interface PaymentConfirmation {
  id: string;
  jobId: string;
  workerId: string;
  employerId: string;
  type: PaymentType;
  amount: number;
  status: PaymentStatus;
  confirmedByWorker: boolean;
  confirmedAt: string | null;
  note: string | null;
  job?: Job;
  worker?: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
  createdAt: string;
}

export interface Dispute {
  id: string;
  jobId: string;
  raisedById: string;
  reason: string;
  status: DisputeStatus;
  resolution: string | null;
  resolvedById: string | null;
  resolvedAt: string | null;
  job?: Job;
  raisedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
  createdAt: string;
}

export interface Milestone {
  id: string;
  escrowId: string;
  orderIndex: number;
  title: string;
  description: string | null;
  amount: number;
  status: MilestoneStatus;
  workerId: string | null;
  proposedByWorker: boolean;
  proposalAccepted: boolean;
  submissionNote: string | null;
  revisionNote: string | null;
  releaseNote: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
  releasedAt: string | null;
  createdAt: string;
}

export interface Escrow {
  id: string;
  jobId: string;
  employerId: string;
  totalAmount: number;
  serviceFee: number;
  chargeAmount: number;
  releasedAmount: number;
  status: EscrowStatus;
  payosOrderCode: number | null;
  payosPaymentLinkId: string | null;
  payosCheckoutUrl: string | null;
  fundedAt: string | null;
  milestones: Milestone[];
  createdAt: string;
}

export interface MatchedCandidate {
  workerId: string;
  fullName: string;
  avatarUrl: string | null;
  matchScore: number;
  matchReasons: string[];
  skills: string[];
  ratingAvg: number;
  totalJobsCompleted: number;
  isAvailable: boolean;
  profileUrl: string;
}
