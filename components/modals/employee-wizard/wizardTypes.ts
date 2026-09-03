import { UserRole } from "@/types";
import { buildDefaultValues, type WizardFormValues } from "@/components/profile/wizard/wizardTypes";
import type { EmploymentType, QualificationLevel } from "@/types/profile";

// Extends the profile wizard's own form shape (statutory info, nominees,
// remittance, dependents, emergency contacts, welfare) so the same Step*
// components can be reused verbatim here - see components/profile/wizard/Step*.tsx,
// generalized to a generic `T extends WizardFormValues` form type for this reuse.
export interface EmployeeWizardValues extends WizardFormValues {
  employee_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  employee_category: "" | "internal" | "client_side";
  department: string;
  position: string;
  work_location: "" | "office" | "remote" | "hybrid";
  primarySchoolAttended: string;
  secondarySchoolAttended: string;
  hire_date: string;
  manager_id: string;
  hourly_rate: string;
  // Service-Provider-only simple bank fields (StepBank.tsx). Non-Service-Provider
  // roles use the profile wizard's own bankName/accountHolderName/accountNumber/
  // bankBranch/bankBranchCode/swiftCode fields (from WizardFormValues, via StepRemittance)
  // instead - reconciled into these at submit time in CreateUserModal.
  bank_name: string;
  account_holder_name: string;
  account_number: string;
  bank_branch: string;
  company_name: string;
  contact_number: string;
  // Admin-only additions (StepEducation.tsx/StepWorkHistory.tsx) - written
  // directly at creation time, unlike the employee's own self-service
  // education/work-history change requests (see EducationChangeModal.tsx).
  education: WizardEducation[];
  workHistory: WizardWorkHistory[];
  // Gates the "Create Employee" button on StepReview.tsx.
  declarationAccepted: boolean;
}

export interface WizardEducation {
  qualificationLevel: QualificationLevel | "";
  qualificationTitle: string;
  awardingInstitution: string;
  dateAwarded: string;
  isOngoing: boolean;
  remarks: string;
}

export interface WizardWorkHistory {
  organization: string;
  positionHeld: string;
  employmentType: EmploymentType | "";
  startDate: string;
  endDate: string;
  remarks: string;
}

export const defaultEmployeeWizardValues: EmployeeWizardValues = {
  ...buildDefaultValues({
    user: null,
    pii: null,
    nominees: undefined,
    dependents: undefined,
    emergencyContacts: undefined,
    welfareInfo: null,
  }),
  employee_id: "",
  email: "",
  first_name: "",
  last_name: "",
  role: UserRole.EMPLOYEE,
  employee_category: "",
  department: "",
  position: "",
  work_location: "",
  primarySchoolAttended: "",
  secondarySchoolAttended: "",
  hire_date: "",
  manager_id: "",
  hourly_rate: "",
  bank_name: "",
  account_holder_name: "",
  account_number: "",
  bank_branch: "",
  company_name: "",
  contact_number: "",
  education: [],
  workHistory: [],
  declarationAccepted: false,
};

// 0.5 days per remaining month in the hire year, then a flat quarter-based
// allowance from the following year onward.
export function calculateLeaveEntitlement(hireDate: string): {
  firstYear: number;
  secondYearOnwards: number;
  quarter: string;
  remainingMonths: number;
} | null {
  if (!hireDate) return null;

  const date = new Date(hireDate);
  const month = date.getMonth() + 1; // 1-12
  const hireMonth = date.getMonth(); // 0-11

  const remainingMonths = 12 - hireMonth;
  const firstYear = Math.round(remainingMonths * 0.5 * 10) / 10;

  let secondYearOnwards: number;
  let quarter: string;

  if (month >= 1 && month <= 3) {
    secondYearOnwards = 14;
    quarter = "Q1 (Jan-Mar)";
  } else if (month >= 4 && month <= 6) {
    secondYearOnwards = 10;
    quarter = "Q2 (Apr-Jun)";
  } else if (month >= 7 && month <= 9) {
    secondYearOnwards = 7;
    quarter = "Q3 (Jul-Sep)";
  } else {
    secondYearOnwards = 4;
    quarter = "Q4 (Oct-Dec)";
  }

  return { firstYear, secondYearOnwards, quarter, remainingMonths };
}
