// frontend/types/index.ts
export enum UserRole {
  HR_MANAGER = 'hr_manager',
  HR_EXECUTIVE = 'hr_executive',
  EMPLOYEE = 'employee',
}

export interface User {
    id: number;
    employee_id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: UserRole | 'hr_manager' | 'hr_executive' | 'employee';
    department: string;
    position: string;
    hire_date: string;
    manager_id?: number;
    must_change_password?: boolean;
    created_at: string;
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