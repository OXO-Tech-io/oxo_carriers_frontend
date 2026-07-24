"use client";

import { useState } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import { UserRole } from "@/types";
import { Stepper, StepPanel, type StepDefinition } from "@/components/ui/Stepper";
import {
  nomineeToValue,
  dependentToValue,
  emergencyContactToValue,
} from "@/components/profile/wizard/wizardDiff";
import type { WizardFormValues } from "@/components/profile/wizard/wizardTypes";
import StepStatutory from "@/components/profile/wizard/StepStatutory";
import StepRemittance from "@/components/profile/wizard/StepRemittance";
import StepDependents from "@/components/profile/wizard/StepDependents";
import StepEmergencyContacts from "@/components/profile/wizard/StepEmergencyContacts";
import StepWelfare from "@/components/profile/wizard/StepWelfare";
import StepBasicInfo from "./employee-wizard/StepBasicInfo";
import StepEmployment from "./employee-wizard/StepEmployment";
import StepBank from "./employee-wizard/StepBank";
import StepReview from "./employee-wizard/StepReview";
import { defaultEmployeeWizardValues, EmployeeWizardValues } from "./employee-wizard/wizardTypes";
import type { NomineeValue, DependentValue, EmergencyContactRecordValue, BloodType } from "@/types/profile";

export interface CreateEmployeeProfilePayload {
  statutory: {
    nationalId: string;
    fullNameAsNic: string;
    nameWithInitials: string;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    district: string;
    dateOfBirth: string;
    birthPlace: string;
    sex: string;
    maritalStatus: string;
    nationality: string;
    spouseName: string | null;
    motherName: string;
    fatherName: string;
  };
  nominees: NomineeValue[];
  remittance: {
    residingAddressLine1: string | null;
    residingAddressLine2: string | null;
    residingCity: string | null;
    residingDistrict: string | null;
    landlineNumber: string | null;
  };
  dependents: DependentValue[];
  emergencyContacts: EmergencyContactRecordValue[];
  bloodType?: BloodType;
  welfare: {
    weddingAnniversaryDate: string | null;
    hobbies: string | null;
    communityActivities: string | null;
    professionalMemberships: string | null;
  };
}

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    employee_id?: string;
    email: string;
    first_name: string;
    last_name: string;
    role: UserRole;
    department: string;
    position: string;
    hire_date: string;
    manager_id: string;
    hourly_rate?: string;
    bank_name?: string;
    account_holder_name?: string;
    account_number?: string;
    bank_branch?: string;
    bank_branch_code?: string;
    swift_code?: string;
    company_name?: string;
    contact_number?: string;
    profile?: CreateEmployeeProfilePayload;
  }) => Promise<void>;
  currentUserRole?: UserRole;
}

// Service Providers have no login/profile at all, so they get the original,
// minimal 3-step flow. Everyone else fills in the full profile - the same
// data an employee would otherwise have to submit themselves later via the
// Employee Profile Wizard (components/profile/wizard) - directly at creation
// time, reusing that wizard's own Step components verbatim.
const SERVICE_PROVIDER_STEPS: StepDefinition[] = [
  { key: "basic", label: "Basic Info" },
  { key: "bank", label: "Bank Details" },
  { key: "review", label: "Review & Confirm" },
];

const EMPLOYEE_STEPS: StepDefinition[] = [
  { key: "basic", label: "Basic Info" },
  { key: "employment", label: "Employment Details" },
  { key: "statutory", label: "Statutory Info" },
  { key: "remittance", label: "Remittance" },
  { key: "dependents", label: "Dependents" },
  { key: "emergency", label: "Emergency Contacts" },
  { key: "welfare", label: "Welfare" },
  { key: "review", label: "Review & Confirm" },
];

// Fields validated (via RHF trigger) before "Next" advances past each step.
// Mirrors STEP_FIELD_NAMES in app/(dashboard)/profile/wizard/page.tsx exactly
// for the steps reused from that wizard.
function stepFieldNames(stepKey: string, role: UserRole): (keyof EmployeeWizardValues)[] {
  const isServiceProvider = role === UserRole.SERVICE_PROVIDER;
  switch (stepKey) {
    case "basic":
      return isServiceProvider ? ["company_name", "email"] : ["first_name", "last_name", "email"];
    case "employment":
      return role === UserRole.CONSULTANT ? ["hourly_rate"] : [];
    case "statutory":
      return [
        "nationalId",
        "fullNameAsNic",
        "nameWithInitials",
        "permanentAddressLine1",
        "permanentCity",
        "permanentDistrict",
        "dateOfBirth",
        "birthPlace",
        "sex",
        "maritalStatus",
        "nationality",
        "mobileNumber",
        "motherName",
        "fatherName",
        "nominees",
      ];
    case "remittance":
      return ["accountHolderName", "accountNumber", "bankName", "bankBranch"];
    case "dependents":
      return ["dependents"];
    case "emergency":
      return ["emergencyContacts"];
    default:
      return [];
  }
}

export default function CreateUserModal({
  isOpen,
  onClose,
  onSubmit,
  currentUserRole,
}: CreateUserModalProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<EmployeeWizardValues>({ defaultValues: defaultEmployeeWizardValues });
  // EmployeeWizardValues extends WizardFormValues (same field names/types, plus
  // the basic/employment/bank fields), so this cast is structurally safe - it
  // lets the profile-wizard's own Step components be reused verbatim without
  // fighting react-hook-form's generic type inference across a bounded `T`.
  const profileForm = form as unknown as UseFormReturn<WizardFormValues>;
  const role = form.watch("role");
  const isServiceProvider = role === UserRole.SERVICE_PROVIDER;
  const maritalStatus = form.watch("maritalStatus");
  const isMarried = maritalStatus === "married";
  const email = form.watch("email");
  const position = form.watch("position");

  const baseSteps = isServiceProvider ? SERVICE_PROVIDER_STEPS : EMPLOYEE_STEPS;
  const steps = baseSteps.map((s) => (s.key === "dependents" ? { ...s, disabled: !isMarried } : s));
  const dependentsIndex = steps.findIndex((s) => s.key === "dependents");

  const resetWizard = () => {
    form.reset(defaultEmployeeWizardValues);
    setStepIndex(0);
  };

  const goNext = async () => {
    const currentKey = steps[stepIndex].key;
    const fieldNames = stepFieldNames(currentKey, role);
    const valid = fieldNames.length === 0 ? true : await form.trigger(fieldNames as any);
    if (!valid) return;
    let nextIndex = stepIndex + 1;
    if (nextIndex === dependentsIndex && !isMarried) nextIndex += 1;
    setStepIndex(Math.min(nextIndex, steps.length - 1));
  };

  const goBack = () => {
    let prevIndex = stepIndex - 1;
    if (prevIndex === dependentsIndex && !isMarried) prevIndex -= 1;
    setStepIndex(Math.max(prevIndex, 0));
  };

  const handleClose = () => {
    resetWizard();
    onClose();
  };

  const handleFinalSubmit = async () => {
    setSubmitting(true);
    try {
      const values = form.getValues();

      const payload = isServiceProvider
        ? {
            employee_id: "",
            email: values.email,
            first_name: values.company_name || "Service Provider",
            last_name: "Service Provider",
            role: values.role,
            department: values.department,
            position: values.position,
            hire_date: values.hire_date,
            manager_id: values.manager_id,
            hourly_rate: values.hourly_rate,
            bank_name: values.bank_name,
            account_holder_name: values.account_holder_name,
            account_number: values.account_number,
            bank_branch: values.bank_branch,
            company_name: values.company_name,
            contact_number: values.contact_number,
          }
        : {
            employee_id: values.employee_id,
            email: values.email,
            first_name: values.first_name,
            last_name: values.last_name,
            role: values.role,
            department: values.department,
            position: values.position,
            hire_date: values.hire_date,
            manager_id: values.manager_id,
            hourly_rate: values.hourly_rate,
            bank_name: values.bankName,
            account_holder_name: values.accountHolderName,
            account_number: values.accountNumber,
            bank_branch: values.bankBranch,
            bank_branch_code: values.bankBranchCode,
            swift_code: values.swiftCode,
            company_name: values.company_name,
            contact_number: values.mobileNumber,
            profile: {
              statutory: {
                nationalId: values.nationalId,
                fullNameAsNic: values.fullNameAsNic,
                nameWithInitials: values.nameWithInitials,
                addressLine1: values.permanentAddressLine1,
                addressLine2: values.permanentAddressLine2 || null,
                city: values.permanentCity,
                district: values.permanentDistrict,
                dateOfBirth: values.dateOfBirth,
                birthPlace: values.birthPlace,
                sex: values.sex,
                maritalStatus: values.maritalStatus,
                nationality: values.nationality,
                spouseName: values.spouseName || null,
                motherName: values.motherName,
                fatherName: values.fatherName,
              },
              nominees: values.nominees.map(nomineeToValue),
              remittance: {
                residingAddressLine1: values.residingAddressLine1 || null,
                residingAddressLine2: values.residingAddressLine2 || null,
                residingCity: values.residingCity || null,
                residingDistrict: values.residingDistrict || null,
                landlineNumber: values.landlineNumber || null,
              },
              dependents: isMarried ? values.dependents.map(dependentToValue) : [],
              emergencyContacts: values.emergencyContacts.map(emergencyContactToValue),
              bloodType: values.bloodType ? (values.bloodType as BloodType) : undefined,
              welfare: {
                weddingAnniversaryDate: values.weddingAnniversaryDate || null,
                hobbies: values.hobbies || null,
                communityActivities: values.communityActivities || null,
                professionalMemberships: values.professionalMemberships || null,
              },
            },
          };

      await onSubmit(payload);
      resetWizard();
    } catch (error) {
      // Error handling is done in parent component; keep the wizard open on failure.
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const isLastStep = stepIndex === steps.length - 1;
  const currentKey = steps[stepIndex].key;

  return (
    <div
      className="fixed inset-0 z-[100] overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div
          className="fixed inset-0 bg-opacity-50 backdrop-blur-sm transition-opacity"
          onClick={handleClose}
        ></div>
        <div
          className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-6xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white px-6 pt-6 pb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-[#101828]">Create New Employee</h3>
              <button
                onClick={handleClose}
                className="text-[#98A2B3] hover:text-[#344054] transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <Stepper steps={steps} currentIndex={stepIndex} />
            </div>

            <StepPanel stepKey={currentKey}>
              {currentKey === "basic" && (
                <StepBasicInfo form={form} currentUserRole={currentUserRole} />
              )}
              {currentKey === "employment" && <StepEmployment form={form} />}
              {currentKey === "bank" && <StepBank form={form} />}
              {currentKey === "statutory" && (
                <StepStatutory form={profileForm} email={email} designation={position} />
              )}
              {currentKey === "remittance" && <StepRemittance form={profileForm} />}
              {currentKey === "dependents" && (
                <StepDependents form={profileForm} isMarried={isMarried} />
              )}
              {currentKey === "emergency" && <StepEmergencyContacts form={profileForm} />}
              {currentKey === "welfare" && <StepWelfare form={profileForm} />}
              {currentKey === "review" && <StepReview form={form} />}
            </StepPanel>

            <div className="flex items-center justify-between pt-6 mt-2 border-t border-[#E4E7EC]">
              <button
                type="button"
                onClick={stepIndex === 0 ? handleClose : goBack}
                className="px-4 py-2.5 text-sm font-semibold text-[#344054] bg-white border border-[#D0D5DD] rounded-lg hover:bg-[#F9FAFB] transition-colors"
              >
                {stepIndex === 0 ? "Cancel" : "Back"}
              </button>
              {isLastStep ? (
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={submitting}
                  className="px-4 py-2.5 text-sm font-semibold text-white bg-[#465FFF] rounded-lg hover:bg-[#3641F5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Creating..." : "Create Employee"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={goNext}
                  className="px-4 py-2.5 text-sm font-semibold text-white bg-[#465FFF] rounded-lg hover:bg-[#3641F5] transition-colors"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
