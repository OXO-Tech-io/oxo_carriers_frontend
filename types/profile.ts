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

export interface EmployeeEducation {
  id: number;
  userId: number;
  qualificationLevel: QualificationLevel;
  qualificationTitle: string;
  awardingInstitution: string;
  dateAwarded: string | null;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeWorkHistory {
  id: number;
  userId: number;
  organization: string;
  positionHeld: string;
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
  address: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BankAccountValue {
  bankName: string | null;
  accountHolderName: string | null;
  accountNumber: string | null;
  bankBranch: string | null;
}

export type ProfileChangeItem =
  | {
      entityType: 'user_field';
      field: 'contactNumber' | 'undergraduateDegreeCompletionDate';
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
      before: string | null;
      after: string;
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
