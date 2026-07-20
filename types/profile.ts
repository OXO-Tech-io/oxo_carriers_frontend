// Types for the Employee Profile Enhancement + Profile Change Approval
// Workflow feature set. Unlike the legacy snake_case types in types/index.ts
// (which mirror an older, differently-shaped API), these mirror the new
// backend endpoints' raw camelCase JSON shape directly - no mapper needed.

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

export const QUALIFICATION_LEVEL_OPTIONS: { value: QualificationLevel; label: string }[] = [
  { value: 'certificate', label: 'Certificate' },
  { value: 'advanced_certificate', label: 'Advanced Certificate' },
  { value: 'diploma', label: 'Diploma' },
  { value: 'advanced_diploma', label: 'Advanced Diploma' },
  { value: 'degree', label: 'Degree' },
  { value: 'postgraduate_diploma', label: 'Postgraduate Diploma' },
  { value: 'masters', label: 'Masters' },
  { value: 'mphil', label: 'MPhil' },
  { value: 'phd', label: 'PhD' },
];

export type EmploymentType = 'regular' | 'intern' | 'trainee';

export const EMPLOYMENT_TYPE_OPTIONS: { value: EmploymentType; label: string }[] = [
  { value: 'regular', label: 'Regular' },
  { value: 'intern', label: 'Intern' },
  { value: 'trainee', label: 'Trainee' },
];

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
  createdAt: string;
  updatedAt: string;
}

export interface BankAccountValue {
  bankName: string | null;
  accountHolderName: string | null;
  accountNumber: string | null;
  bankBranch: string | null;
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

export interface ExperienceSummary {
  totalExperienceYears: number;
  totalExperienceExclInternshipYears: number;
  postDegreeExperienceYears: number;
  postDegreeExperienceExclInternshipYears: number;
  hasDegreeDate: boolean;
}

export type ProfileChangeItem =
  | {
      entityType: 'user_field';
      field: 'title' | 'contactNumber' | 'undergraduateDegreeCompletionDate';
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
      entityType: 'employee_pii_field';
      field: 'address';
      operation: 'update';
      before: AddressValue | null;
      after: AddressValue;
    }
  | {
      entityType: 'employee_pii_field';
      field: 'emergency_contact';
      operation: 'update';
      before: EmergencyContactValue | null;
      after: EmergencyContactValue;
    }
  | {
      entityType: 'employee_pii_field';
      field: 'blood_type';
      operation: 'update';
      before: BloodType | null;
      after: BloodType;
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
    };

export type ProfileChangeRequestStatus =
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'returned_for_modification'
  | 'cancelled';

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
  createdAt: string;
  updatedAt: string;
}

export interface SubmitProfileChangeRequestInput {
  changes: ProfileChangeItem[];
  comments?: string;
  previousRequestId?: number;
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
