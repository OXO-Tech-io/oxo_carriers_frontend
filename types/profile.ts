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
  // Tab 1 - statutory
  legalName: string | null;
  initialsName: string | null;
  dateOfBirth: string | null;
  birthPlace: string | null;
  sex: Sex | null;
  maritalStatus: MaritalStatus | null;
  nationality: string | null;
  spouseName: string | null;
  motherName: string | null;
  fatherName: string | null;
  // Tab B - residing address (if different from permanent) + landline
  residingAddressLine1: string | null;
  residingAddressLine2: string | null;
  residingCity: string | null;
  residingDistrict: string | null;
  landlineNumber: string | null;
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
}

export interface EmergencyContactRecordValue {
  name: string;
  relationship: string;
  contactNumber: string;
}

export interface ExperienceSummary {
  totalExperienceYears: number;
  totalExperienceExclInternshipYears: number;
  postDegreeExperienceYears: number;
  postDegreeExperienceExclInternshipYears: number;
  hasDegreeDate: boolean;
}

export type ScalarPiiField =
  | 'full_name_as_nic'
  | 'name_with_initials'
  | 'date_of_birth'
  | 'birth_place'
  | 'nationality'
  | 'spouse_name'
  | 'mother_name'
  | 'father_name'
  | 'landline_number'
  | 'national_id';

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
      field: 'sex';
      operation: 'update';
      before: Sex | null;
      after: Sex;
    }
  | {
      entityType: 'employee_pii_field';
      field: 'marital_status';
      operation: 'update';
      before: MaritalStatus | null;
      after: MaritalStatus;
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
