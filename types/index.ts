// frontend/types/index.ts
export enum UserRole {
  HR_MANAGER = 'hr_manager',
  HR_EXECUTIVE = 'hr_executive',
  FINANCE_MANAGER = 'finance_manager',
  FINANCE_EXECUTIVE = 'finance_executive',
  PAYMENT_APPROVER = 'payment_approver',
  EMPLOYEE = 'employee',
  CONSULTANT = 'consultant',
  SERVICE_PROVIDER = 'service_provider',
}

export enum VoucherStatus {
  PENDING_REVIEW = 'pending_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  INFORMATION_REQUEST = 'information_request',
  BANK_UPLOAD = 'bank_upload',
  PAID = 'paid',
}

export interface Vendor {
  id: number;
  email: string;
  company_name: string;
  contact_number?: string | null;
  bank_name?: string | null;
  account_holder_name?: string | null;
  account_number?: string | null;
  bank_branch?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentVoucher {
  id: number;
  voucher_number: string;
  created_by: number;
  vendor_id?: number;
  service_provider_id?: number; // legacy
  amount: number;
  vat: number;
  description: string | null;
  invoice_url: string | null;
  status: VoucherStatus;
  executive_comment: string | null;
  reviewed_by: number | null;
  reviewed_at: string | null;
  resubmitted_at: string | null;
  bank_upload_by: number | null;
  bank_upload_at: string | null;
  paid_by: number | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  created_by_first_name?: string;
  created_by_last_name?: string;
  sp_first_name?: string;
  sp_last_name?: string;
  sp_company_name?: string;
  sp_email?: string;
  reviewed_by_first_name?: string;
  reviewed_by_last_name?: string;
}

export interface User {
    id: number;
    employee_id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: UserRole | 'hr_manager' | 'hr_executive' | 'employee' | 'consultant' | 'service_provider';
    department: string;
    position: string;
    hire_date: string;
    manager_id?: number;
    hourly_rate?: number | null;
    must_change_password?: boolean;
    created_at: string;
  }

export type ConsultantSubmissionStatus = 'pending' | 'approved' | 'rejected';

export interface ConsultantWorkSubmission {
  id: number;
  user_id: number;
  project: string;
  tech: string;
  total_hours: number;
  comment?: string | null;
  log_sheet_url: string;
  status: ConsultantSubmissionStatus;
  admin_comment?: string | null;
  resubmission_of?: number | null;
  created_at: string;
  user?: { id: number; first_name: string; last_name: string; email: string; employee_id: string; hourly_rate?: number | null };
}
  
  export interface LeaveType {
    id: number;
    name: string;
    description: string;
    max_days: number;
    is_active: boolean;
  }
  
  export interface LeaveBalance {
    id: number;
    user_id: number;
    leave_type_id: number;
    total_days: number;
    used_days: number;
    remaining_days: number;
    year: number;
    leave_type: LeaveType;
  }
  
  export interface LeaveRequest {
    id: number;
    user_id: number;
    leave_type_id: number;
    start_date: string;
    end_date: string;
    total_days: number;
    reason: string;
    status: 'pending' | 'team_leader_approved' | 'hr_approved' | 'rejected' | 'cancelled';
    team_leader_approval_date?: string;
    hr_approval_date?: string;
    rejection_reason?: string;
    attachment_url?: string;
    created_at: string;
    user: User;
    leave_type: LeaveType;
  }
  
  export interface SalaryComponent {
    id: number;
    name: string;
    type: 'earning' | 'deduction';
    is_default: boolean;
    is_active: boolean;
  }
  
  export interface SalarySlip {
    id: number;
    user_id: number;
    month_year: string;
    basic_salary: number;
    total_earnings: number;
    total_deductions: number;
    net_salary: number;
    status: 'generated' | 'paid' | 'pending';
    pdf_url?: string;
    created_at: string;
    user: User;
    details: SalarySlipDetail[];
  }
  
  export interface SalarySlipDetail {
    id: number;
    salary_id: number;
    component_id: number;
    amount: number;
    type: 'earning' | 'deduction';
    component: SalaryComponent;
  }
  
  export interface AuthResponse {
    token: string;
    user: User;
  }
  
  export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
  }

export enum FacilityType {
  WORKSTATION = 'workstation',
  BOARD_ROOM = 'board_room',
  MEETING_ROOM = 'meeting_room',
  ACCOMMODATION = 'accommodation'
}

export interface Facility {
  id: number;
  name: string;
  type: FacilityType;
  description?: string;
  facilities?: string;
  capacity?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FacilityBooking {
  id: number;
  facility_id: number;
  user_id: number;
  start_time: string;
  end_time: string;
  purpose?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  created_at: string;
  updated_at: string;
  facility_name?: string;
  facility_type?: FacilityType;
  first_name?: string;
  last_name?: string;
}