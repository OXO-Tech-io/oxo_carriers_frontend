// Types for the Employee Profile Enhancement + Profile Change Approval
// Workflow feature set. Unlike the legacy snake_case types in types/index.ts
// (which mirror an older, differently-shaped API), these mirror the new
// backend endpoints' raw camelCase JSON shape directly - no mapper needed.

import type { Attachment } from './hrModules';

export type QualificationLevel =
  | 'certificate'
  | 'advanced_certificate'
  | 'diploma'
  | 'advanced_diploma'
  | 'degree'
  | 'postgraduate_diploma'
  | 'masters'
  | 'mphil'
  | 'phd';

// OCD-434: "Degree" and "Masters" were ambiguous (a Master's is also a
// "degree") - values are unchanged (still matches the backend's
// qualification_level enum / qualificationLevelValues), only the labels
// shown to users were clarified.
export const QUALIFICATION_LEVEL_OPTIONS: { value: QualificationLevel; label: string }[] = [
  { value: 'certificate', label: 'Certificate' },
  { value: 'advanced_certificate', label: 'Advanced Certificate' },
  { value: 'diploma', label: 'Diploma' },
  { value: 'advanced_diploma', label: 'Advanced Diploma' },
  { value: 'degree', label: "Bachelor's Degree" },
  { value: 'postgraduate_diploma', label: 'Postgraduate Diploma' },
  { value: 'masters', label: "Master's Degree" },
  { value: 'mphil', label: 'MPhil' },
  { value: 'phd', label: 'PhD' },
];

// Values match the backend's employment_type enum. 'regular' is the legacy
// value from before the level-based list below: it stays valid for existing
// records but is no longer offered for new/edited ones (see
// employmentTypeOptionsFor).
export type EmploymentType =
  | 'regular'
  | 'intern'
  | 'trainee'
  | 'apprentice'
  | 'entry_level'
  | 'mid_level'
  | 'senior'
  | 'staff_principal_lead'
  | 'mid_management'
  | 'executive';

export interface EmploymentTypeOption {
  value: EmploymentType;
  label: string;
  description: string;
}

export const EMPLOYMENT_TYPE_OPTIONS: EmploymentTypeOption[] = [
  {
    value: 'intern',
    label: 'Intern',
    description: 'A student or recent graduate gaining short-term, hands-on experience in a field (can be paid or unpaid).',
  },
  {
    value: 'trainee',
    label: 'Trainee',
    description:
      'Someone undergoing a structured, longer-term training or vocational program inside a company with the goal of moving into a permanent role.',
  },
  {
    value: 'apprentice',
    label: 'Apprentice',
    description:
      'Combines on-the-job training with formal trade or technical education over several years (common in electrical, trade, or craft fields).',
  },
  {
    value: 'entry_level',
    label: 'Entry-Level (Junior)',
    description: 'Staff members who handle routine tasks, learn core operations, and require guidance.',
  },
  {
    value: 'mid_level',
    label: 'Mid-Level (Intermediate)',
    description: 'Independent workers who execute job duties and projects without needing daily supervision.',
  },
  {
    value: 'senior',
    label: 'Senior',
    description:
      'Experienced professionals with deep technical or operational mastery who often mentor juniors and lead small initiatives.',
  },
  {
    value: 'staff_principal_lead',
    label: 'Staff / Principal / Lead',
    description:
      'High-level individual contributors who set technical direction or solve complex enterprise problems without stepping into people management.',
  },
  {
    value: 'mid_management',
    label: 'First-Level / Middle Management',
    description:
      'Supervisors, project managers, or directors who manage daily operations and bridge lower tiers with executives.',
  },
  {
    value: 'executive',
    label: 'Executive / C-Level (Senior Management)',
    description: 'High-ranking leaders (such as CEO, CFO, or CTO) who drive company-wide vision and strategy.',
  },
];

const LEGACY_EMPLOYMENT_TYPE_OPTION: EmploymentTypeOption = {
  value: 'regular',
  label: 'Regular (legacy)',
  description: 'Recorded before employment levels were introduced - choose a level to update it.',
};

// The dropdown list for a record: the current options, plus the legacy
// 'regular' choice only when the record being edited already has it.
export function employmentTypeOptionsFor(current?: string | null): EmploymentTypeOption[] {
  return current === 'regular' ? [LEGACY_EMPLOYMENT_TYPE_OPTION, ...EMPLOYMENT_TYPE_OPTIONS] : EMPLOYMENT_TYPE_OPTIONS;
}

function findEmploymentTypeOption(value?: string | null): EmploymentTypeOption | undefined {
  return [LEGACY_EMPLOYMENT_TYPE_OPTION, ...EMPLOYMENT_TYPE_OPTIONS].find((o) => o.value === value);
}

export function employmentTypeLabel(value?: string | null): string {
  return findEmploymentTypeOption(value)?.label ?? '';
}

export function employmentTypeDescription(value?: string | null): string {
  return findEmploymentTypeOption(value)?.description ?? '';
}

export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'unknown';

export const BLOOD_TYPE_OPTIONS: { value: BloodType; label: string }[] = [
  { value: 'A+', label: 'A+' },
  { value: 'A-', label: 'A-' },
  { value: 'B+', label: 'B+' },
  { value: 'B-', label: 'B-' },
  { value: 'AB+', label: 'AB+' },
  { value: 'AB-', label: 'AB-' },
  { value: 'O+', label: 'O+' },
  { value: 'O-', label: 'O-' },
  { value: 'unknown', label: 'Unknown' },
];

export type UserTitle = 'mr' | 'ms' | 'mrs' | 'dr' | 'prof';

export const TITLE_OPTIONS: { value: UserTitle; label: string }[] = [
  { value: 'mr', label: 'Mr.' },
  { value: 'ms', label: 'Ms.' },
  { value: 'mrs', label: 'Mrs.' },
  { value: 'dr', label: 'Dr.' },
  { value: 'prof', label: 'Prof.' },
];

export type Sex = 'male' | 'female';

export const SEX_OPTIONS: { value: Sex; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
];

export type MaritalStatus = 'married' | 'single';

export const MARITAL_STATUS_OPTIONS: { value: MaritalStatus; label: string }[] = [
  { value: 'married', label: 'Married' },
  { value: 'single', label: 'Single' },
];

export type DependentRelationship = 'spouse' | 'child';

export const DEPENDENT_RELATIONSHIP_OPTIONS: { value: DependentRelationship; label: string }[] = [
  { value: 'spouse', label: 'Spouse' },
  { value: 'child', label: 'Child' },
];

export type WorkLocation = 'office' | 'remote' | 'hybrid';

export const WORK_LOCATION_OPTIONS: { value: WorkLocation; label: string }[] = [
  { value: 'office', label: 'Office' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
];

// "Related Career Path" next to Designation - values match the backend's
// CAREER_PATHS (src/common/constants/careerPaths.ts).
export type CareerPath =
  | 'pm'
  | 'ba'
  | 'ui_ux'
  | 'qa'
  | 'software_development'
  | 'sales'
  | 'finance'
  | 'marketing'
  | 'hr'
  | 'other';

export const CAREER_PATH_OPTIONS: { value: CareerPath; label: string }[] = [
  { value: 'pm', label: 'PM - Project Management' },
  { value: 'ba', label: 'BA - Business Analyst' },
  { value: 'ui_ux', label: 'UI/UX - User Interface / User Experience Design' },
  { value: 'qa', label: 'QA - Quality Assurance' },
  { value: 'software_development', label: 'Software Development' },
  { value: 'sales', label: 'Sales' },
  { value: 'finance', label: 'Finance' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'hr', label: 'HR - Human Resources' },
  { value: 'other', label: 'Other' },
];

export function careerPathLabel(value?: string | null): string {
  return CAREER_PATH_OPTIONS.find((o) => o.value === value)?.label ?? '';
}

export interface EmployeeEducation {
  id: number;
  userId: number;
  qualificationLevel: QualificationLevel;
  qualificationTitle: string;
  awardingInstitution: string;
  dateAwarded: string | null;
  isOngoing: boolean;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeWorkHistory {
  id: number;
  userId: number;
  organization: string;
  positionHeld: string;
  employmentType: EmploymentType;
  careerPath: CareerPath | null;
  startDate: string;
  endDate: string | null; // null = "Present"
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeePii {
  id: number;
  employeeId: string;
  passportNumber: string | null;
  nationalId: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  district: string | null;
  bloodType: BloodType | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelationship: string | null;
  // Tab 1 - statutory
  legalName: string | null;
  initialsName: string | null;
  callingName: string | null;
  birthPlace: string | null;
  spouseName: string | null;
  spouseNic: string | null;
  spouseContactNumber: string | null;
  spouseOccupation: string | null;
  motherName: string | null;
  motherOccupation: string | null;
  motherContactNumber: string | null;
  fatherName: string | null;
  fatherOccupation: string | null;
  fatherContactNumber: string | null;
  // Tab B - residing address (if different from permanent) + landline
  residingAddressLine1: string | null;
  residingAddressLine2: string | null;
  residingCity: string | null;
  residingDistrict: string | null;
  landlineNumber: string | null;
  secondaryContactNumber: string | null;
  // Health
  medicalConditions: string | null;
  allergies: string | null;
  // Social & declaration
  additionalNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeNominee {
  id: number;
  userId: number;
  nameWithInitials: string | null;
  nic: string | null;
  relationship: string;
  proportionPercent: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeDependent {
  id: number;
  userId: number;
  fullName: string | null;
  nic: string | null;
  dateOfBirth: string;
  gender: Sex;
  relationship: DependentRelationship;
  mobileNumber: string | null;
  // Only meaningful for relationship = 'child'.
  school: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeEmergencyContact {
  id: number;
  userId: number;
  name: string | null;
  relationship: string;
  contactNumber: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeWelfareInfo {
  id: number;
  userId: number;
  weddingAnniversaryDate: string | null;
  hobbies: string | null;
  communityActivities: string | null;
  professionalMemberships: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BankAccountValue {
  bankName: string | null;
  accountHolderName: string | null;
  accountNumber: string | null;
  bankBranch: string | null;
  bankBranchCode: string | null;
  swiftCode: string | null;
}

export interface AddressValue {
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  district: string;
}

export interface EmergencyContactValue {
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string | null;
}

export interface NomineeValue {
  nameWithInitials: string;
  nic: string;
  relationship: string;
  proportionPercent: number;
}

export interface DependentValue {
  fullName: string;
  nic?: string | null;
  dateOfBirth: string;
  gender: Sex;
  relationship: DependentRelationship;
  mobileNumber?: string | null;
  school?: string | null;
}

export interface EducationValue {
  qualificationLevel: QualificationLevel;
  qualificationTitle: string;
  awardingInstitution: string;
  dateAwarded?: string | null;
  isOngoing?: boolean;
  remarks?: string | null;
}

export interface WorkHistoryValue {
  organization: string;
  positionHeld: string;
  employmentType?: EmploymentType;
  careerPath?: CareerPath | null;
  startDate: string;
  endDate?: string | null;
  remarks?: string | null;
}

export interface EmergencyContactRecordValue {
  name: string;
  relationship: string;
  contactNumber: string;
}

export interface ExperienceDuration {
  years: number;
  months: number;
  days: number;
  totalDays: number;
}

export interface ExperienceSummary {
  total: ExperienceDuration;
  totalExclInternship: ExperienceDuration;
  postDegree: ExperienceDuration;
  postDegreeExclInternship: ExperienceDuration;
  hasDegreeDate: boolean;
  /** YYYY-MM-01 of the first degree's graduation month. */
  degreeCompletionDate: string | null;
  degreeDateSource: 'education' | 'profile' | null;
  currentCareerPath: CareerPath | null;
  byCareerPath: Record<CareerPath, ExperienceDuration>;
  entryCount: number;
  uncategorizedEntryCount: number;
  asOf: string;
}

export type ScalarPiiField =
  | 'full_name_as_nic'
  | 'name_with_initials'
  | 'calling_name'
  | 'birth_place'
  | 'spouse_name'
  | 'spouse_nic'
  | 'spouse_contact_number'
  | 'spouse_occupation'
  | 'mother_name'
  | 'mother_occupation'
  | 'mother_contact_number'
  | 'father_name'
  | 'father_occupation'
  | 'father_contact_number'
  | 'landline_number'
  | 'secondary_contact_number'
  | 'medical_conditions'
  | 'allergies'
  | 'additional_notes'
  | 'national_id';

// Non-PII personal/statutory attributes that live on tbl_employee, not
// tbl_employee_pii - travel as 'user_field' changes (see ProfileChangeItem).
// OCD-647/650/651: basic/company details edited from the Edit Employee modal, and the
// Personal Email Address, also travel through the approval workflow as user_field changes.
export type BasicUserField =
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'department'
  | 'position'
  | 'careerPath'
  | 'workLocation'
  | 'employeeCategory'
  | 'hireDate'
  | 'deviceId';

export type ScalarUserField =
  | 'personalEmail'
  | 'dateOfBirth'
  | 'nationality'
  | 'religion'
  | 'spouseDateOfBirth'
  | 'siblingDetails'
  | 'gramaNiladariDivision'
  | 'electorate'
  | 'postalCode'
  | 'linkedinProfile'
  // OCD-456: Education step (primary/secondary school attended), now
  // editable via the self-service profile wizard - maps to
  // tbl_employee.primary_school / secondary_school.
  | 'primarySchool'
  | 'secondarySchool';

export type ProfileChangeItem =
  | {
      entityType: 'user_field';
      field: 'title' | 'contactNumber' | 'undergraduateDegreeCompletionDate' | BasicUserField;
      operation: 'update';
      before: string | null;
      after: string | null;
    }
  | {
      entityType: 'user_field';
      field: 'bank_account';
      operation: 'update';
      before: BankAccountValue;
      after: BankAccountValue;
    }
  | {
      entityType: 'user_field';
      field: 'sex';
      operation: 'update';
      before: Sex | null;
      after: Sex;
    }
  | {
      entityType: 'user_field';
      field: 'maritalStatus';
      operation: 'update';
      before: MaritalStatus | null;
      after: MaritalStatus;
    }
  | {
      entityType: 'user_field';
      field: ScalarUserField;
      operation: 'update';
      before: string | null;
      after: string | null;
    }
  | {
      entityType: 'employee_pii_field';
      field: 'address';
      operation: 'update';
      before: AddressValue | null;
      after: AddressValue;
    }
  | {
      entityType: 'employee_pii_field';
      field: 'residing_address';
      operation: 'update';
      before: AddressValue | null;
      after: AddressValue | null;
    }
  | {
      entityType: 'employee_pii_field';
      field: 'blood_type';
      operation: 'update';
      before: BloodType | null;
      after: BloodType;
    }
  | {
      entityType: 'employee_pii_field';
      field: ScalarPiiField;
      operation: 'update';
      before: string | null;
      after: string | null;
    }
  | {
      entityType: 'welfare_field';
      field: 'anniversary_date' | 'hobbies' | 'community_activities' | 'professional_memberships';
      operation: 'update';
      before: string | null;
      after: string | null;
    }
  | {
      entityType: 'education';
      operation: 'create' | 'update' | 'delete';
      recordId: number | null;
      before?: Omit<EmployeeEducation, 'id' | 'userId' | 'createdAt' | 'updatedAt'> | null;
      after?: Omit<EmployeeEducation, 'id' | 'userId' | 'createdAt' | 'updatedAt'> | null;
    }
  | {
      entityType: 'work_history';
      operation: 'create' | 'update' | 'delete';
      recordId: number | null;
      before?: Omit<EmployeeWorkHistory, 'id' | 'userId' | 'createdAt' | 'updatedAt'> | null;
      after?: Omit<EmployeeWorkHistory, 'id' | 'userId' | 'createdAt' | 'updatedAt'> | null;
    }
  | {
      entityType: 'nominee';
      operation: 'create' | 'update' | 'delete';
      recordId: number | null;
      before?: NomineeValue | null;
      after?: NomineeValue | null;
    }
  | {
      entityType: 'dependent';
      operation: 'create' | 'update' | 'delete';
      recordId: number | null;
      before?: DependentValue | null;
      after?: DependentValue | null;
    }
  | {
      entityType: 'emergency_contact_record';
      operation: 'create' | 'update' | 'delete';
      recordId: number | null;
      before?: EmergencyContactRecordValue | null;
      after?: EmergencyContactRecordValue | null;
    };

export type ProfileChangeRequestStatus =
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'returned_for_modification'
  | 'cancelled';

// OCD-603/604/605: stage a pending request is waiting at. Employee and HR
// Executive requests go HR Manager -> Administrator; HR Manager requests go
// straight to the Administrator.
export type ProfileApprovalStage = 'hr_manager' | 'admin';

export const PROFILE_CHANGE_STATUS_BADGES: Record<ProfileChangeRequestStatus, { label: string; className: string }> = {
  pending_approval: { label: 'Pending', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  approved: { label: 'Approved', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected: { label: 'Rejected', className: 'bg-red-50 text-red-700 border-red-200' },
  returned_for_modification: { label: 'Returned', className: 'bg-orange-50 text-orange-700 border-orange-200' },
  cancelled: { label: 'Cancelled', className: 'bg-[var(--gray-50)] text-[var(--gray-500)] border-[var(--gray-200)]' },
};

export interface ProfileChangeRequestEmployee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  employeeId: string | null;
}

export interface ProfileChangeRequestReviewer {
  id: number;
  firstName: string;
  lastName: string;
}

export interface ProfileChangeRequest {
  id: number;
  userId: number;
  submittedBy: number | null;
  employee?: ProfileChangeRequestEmployee | null;
  reviewer?: ProfileChangeRequestReviewer | null;
  status: ProfileChangeRequestStatus;
  changes: ProfileChangeItem[];
  comments: string | null;
  reviewerId: number | null;
  reviewerComments: string | null;
  decidedAt: string | null;
  previousRequestId: number | null;
  approvalStage?: ProfileApprovalStage | null;
  submittedByRole?: string | null;
  hrManagerComments?: string | null;
  hrManagerApprovedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  // OCD-478: supporting documents (NIC copy, address proof, etc.) uploaded
  // alongside the optional Reason for Change (`comments` above).
  attachments?: Attachment[];
}

export interface SubmitProfileChangeRequestInput {
  changes: ProfileChangeItem[];
  comments?: string;
  previousRequestId?: number;
  // OCD-603/604: employeeId of the employee being edited, when HR submits on
  // their behalf. Omitted for self-service requests.
  targetEmployeeId?: string;
  // OCD-478: optional supporting documents attached to the change request -
  // when present, the request is sent as multipart/form-data instead of JSON.
  files?: File[];
}

export interface AppNotification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  payload: Record<string, unknown> | null;
  link: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}
