"use client";

import { useState } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import { UserRole } from "@/types";
import type { UserTitle } from "@/types/profile";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
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
import StepEducation from "./employee-wizard/StepEducation";
import StepWorkHistory from "./employee-wizard/StepWorkHistory";
import StepReview from "./employee-wizard/StepReview";
import { defaultEmployeeWizardValues, EmployeeWizardValues } from "./employee-wizard/wizardTypes";
import type {
  NomineeValue,
  DependentValue,
  EmergencyContactRecordValue,
  BloodType,
  EducationValue,
  WorkHistoryValue,
} from "@/types/profile";

export interface CreateEmployeeProfilePayload {
  statutory: {
    nationalId: string;
    legalName: string;
    initialsName: string;
    callingName: string | null;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    district: string;
    gramaNiladariDivision: string | null;
    electorate: string | null;
    postalCode: string | null;
    dateOfBirth: string;
    birthPlace: string;
    sex: string;
    maritalStatus: string;
    nationality: string;
    religion: string | null;
    secondaryContactNumber: string | null;
    spouseName: string | null;
    spouseNic: string | null;
    spouseDateOfBirth: string | null;
    spouseContactNumber: string | null;
    spouseOccupation: string | null;
    motherName: string;
    motherOccupation: string | null;
    motherContactNumber: string | null;
    fatherName: string;
    fatherOccupation: string | null;
    fatherContactNumber: string | null;
    siblingDetails: string | null;
    primarySchoolAttended: string | null;
    secondarySchoolAttended: string | null;
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
    linkedinProfile: string | null;
    additionalNotes: string | null;
  };
  health: {
    medicalConditions: string | null;
    allergies: string | null;
  };
  education: EducationValue[];
  workHistory: WorkHistoryValue[];
  declarationAccepted: boolean;
}

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    employee_id?: string;
    email: string;
    // OCD-449: personal contact email, distinct from the account/login email
    // above - omitted for Service Providers, same as first/last name.
    personal_email?: string;
    first_name: string;
    last_name: string;
    // OCD-475: parity with Edit Profile.
    title?: UserTitle;
    role: UserRole;
    // Omitted for Service Providers (a separate, minimal flow) - required for
    // every other role, enforced server-side in UsersService.create.
    employee_category?: "internal" | "client_side";
    department: string;
    position: string;
    work_location?: "office" | "remote" | "hybrid";
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
    // OCD-477: parity with My Profile's Education tab.
    undergraduate_degree_completion_date?: string;
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
  { key: "education", label: "Education" },
  { key: "workHistory", label: "Work History" },
  { key: "review", label: "Review & Confirm" },
];

// Fields validated (via RHF trigger) before "Next" advances past each step.
// Mirrors STEP_FIELD_NAMES in app/(dashboard)/profile/wizard/page.tsx exactly
// for the steps reused from that wizard.
function stepFieldNames(stepKey: string, role: UserRole): (keyof EmployeeWizardValues)[] {
  const isServiceProvider = role === UserRole.SERVICE_PROVIDER;
  switch (stepKey) {
    case "basic":
      return isServiceProvider
        ? ["company_name", "email", "contact_number"]
        : ["first_name", "last_name", "email", "personalEmail", "employee_id"];
    case "bank":
      return ["bank_name", "account_holder_name", "account_number", "bank_branch"];
    case "employment":
      return role === UserRole.CONSULTANT
        ? ["employee_category", "hourly_rate", "position", "work_location", "hire_date", "department"]
        : ["employee_category", "position", "work_location", "hire_date", "department"];
    // Every field with a `validate` rule (not just `required` ones) must be
    // listed here - RHF's `trigger()` only checks the exact field names it's
    // given, so a format-only rule (e.g. noEmoji, validateNic,
    // validateLinkedInUrl) would otherwise never actually block "Next"
    // (OCD-413/416/417/419/420/427/429/433).
    case "statutory":
      return [
        "nationalId",
        "legalName",
        "initialsName",
        "callingName",
        "permanentAddressLine1",
        "permanentAddressLine2",
        "permanentCity",
        "permanentDistrict",
        "gramaNiladariDivision",
        "electorate",
        "postalCode",
        "dateOfBirth",
        "birthPlace",
        "sex",
        "maritalStatus",
        "nationality",
        "religion",
        "mobileNumber",
        "secondaryContactNumber",
        "spouseName",
        "spouseNic",
        "spouseDateOfBirth",
        "spouseContactNumber",
        "spouseOccupation",
        "motherName",
        "motherOccupation",
        "motherContactNumber",
        "fatherName",
        "fatherOccupation",
        "fatherContactNumber",
        "siblingDetails",
        "nominees",
      ];
    case "remittance":
      return [
        "residingAddressLine1",
        "residingAddressLine2",
        "residingCity",
        "residingDistrict",
        "landlineNumber",
        "accountHolderName",
        "accountNumber",
        "bankName",
        "bankBranch",
        "bankBranchCode",
        "swiftCode",
      ];
    case "dependents":
      return ["dependents"];
    case "emergency":
      return ["emergencyContacts", "bloodType", "medicalConditions", "allergies"];
    case "welfare":
      return ["weddingAnniversaryDate", "hobbies", "communityActivities", "professionalMemberships", "linkedinProfile", "additionalNotes"];
    case "education":
      return ["education", "primarySchoolAttended", "secondarySchoolAttended"];
    case "workHistory":
      return ["workHistory"];
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
  // OCD-435: the furthest step the user has already validated their way
  // past via "Next" - "View all steps" can jump anywhere up to here, in
  // either direction, without skipping a step's own required-field
  // validation (which already ran when the user first reached it).
  const [maxStepIndex, setMaxStepIndex] = useState(0);
  // OCD-450: guards the backdrop-click / close-button close path with a
  // confirmation once the user has actually entered something.
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
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
    setMaxStepIndex(0);
  };

  const goNext = async () => {
    const currentKey = steps[stepIndex].key;
    const fieldNames = stepFieldNames(currentKey, role);
    const valid = fieldNames.length === 0 ? true : await form.trigger(fieldNames as any);
    if (!valid) return;
    let nextIndex = stepIndex + 1;
    if (nextIndex === dependentsIndex && !isMarried) nextIndex += 1;
    nextIndex = Math.min(nextIndex, steps.length - 1);
    setStepIndex(nextIndex);
    setMaxStepIndex((prev) => Math.max(prev, nextIndex));
  };

  const goBack = () => {
    let prevIndex = stepIndex - 1;
    if (prevIndex === dependentsIndex && !isMarried) prevIndex -= 1;
    setStepIndex(Math.max(prevIndex, 0));
  };

  // OCD-435: "View all steps" can jump to any step already reached before -
  // forward or backward - since each of those steps' required-field
  // validation already ran the first time "Next" carried the user past it.
  const goToStep = (index: number) => {
    if (index <= maxStepIndex) setStepIndex(index);
  };

  const handleClose = () => {
    resetWizard();
    onClose();
  };

  // OCD-450: clicking the backdrop or the close button used to discard
  // everything with no warning. Only prompt if there's actually something
  // to lose.
  const requestClose = () => {
    if (form.formState.isDirty) {
      setShowCloseConfirm(true);
    } else {
      handleClose();
    }
  };

  const confirmDiscard = () => {
    setShowCloseConfirm(false);
    handleClose();
  };

  const handleFinalSubmit = async () => {
    if (!isServiceProvider) {
      const valid = await form.trigger(["declarationAccepted"] as any);
      if (!valid) return;
    }
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
            personal_email: values.personalEmail,
            first_name: values.first_name,
            last_name: values.last_name,
            title: values.title || undefined,
            role: values.role,
            employee_category: values.employee_category as "internal" | "client_side",
            department: values.department,
            position: values.position,
            work_location: values.work_location || undefined,
            hire_date: values.hire_date,
            manager_id: values.manager_id,
            hourly_rate: values.hourly_rate,
            undergraduate_degree_completion_date: values.undergraduateDegreeCompletionDate || undefined,
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
                legalName: values.legalName,
                initialsName: values.initialsName,
                callingName: values.callingName || null,
                addressLine1: values.permanentAddressLine1,
                addressLine2: values.permanentAddressLine2 || null,
                city: values.permanentCity,
                district: values.permanentDistrict,
                gramaNiladariDivision: values.gramaNiladariDivision || null,
                electorate: values.electorate || null,
                postalCode: values.postalCode || null,
                dateOfBirth: values.dateOfBirth,
                birthPlace: values.birthPlace,
                sex: values.sex,
                maritalStatus: values.maritalStatus,
                nationality: values.nationality,
                religion: values.religion || null,
                secondaryContactNumber: values.secondaryContactNumber || null,
                spouseName: values.spouseName || null,
                spouseNic: values.spouseNic || null,
                spouseDateOfBirth: values.spouseDateOfBirth || null,
                spouseContactNumber: values.spouseContactNumber || null,
                spouseOccupation: values.spouseOccupation || null,
                motherName: values.motherName,
                motherOccupation: values.motherOccupation || null,
                motherContactNumber: values.motherContactNumber || null,
                fatherName: values.fatherName,
                fatherOccupation: values.fatherOccupation || null,
                fatherContactNumber: values.fatherContactNumber || null,
                siblingDetails: values.siblingDetails || null,
                primarySchoolAttended: values.primarySchoolAttended || null,
                secondarySchoolAttended: values.secondarySchoolAttended || null,
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
                linkedinProfile: values.linkedinProfile || null,
                additionalNotes: values.additionalNotes || null,
              },
              health: {
                medicalConditions: values.medicalConditions || null,
                allergies: values.allergies || null,
              },
              education: values.education.map((e) => ({
                qualificationLevel: e.qualificationLevel as EducationValue["qualificationLevel"],
                qualificationTitle: e.qualificationTitle,
                awardingInstitution: e.awardingInstitution,
                dateAwarded: e.isOngoing ? null : e.dateAwarded || null,
                isOngoing: e.isOngoing,
                remarks: e.remarks || null,
              })),
              workHistory: values.workHistory.map((w) => ({
                organization: w.organization,
                positionHeld: w.positionHeld,
                employmentType: (w.employmentType || "regular") as WorkHistoryValue["employmentType"],
                startDate: w.startDate,
                endDate: w.endDate || null,
                remarks: w.remarks || null,
              })),
              declarationAccepted: true,
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
          onClick={requestClose}
        ></div>
        <div
          className="relative transform overflow-hidden rounded-2xl bg-[var(--card-bg)] text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-6xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-[var(--card-bg)] px-6 pt-6 pb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-[var(--foreground)]">Create New Employee</h3>
              <button
                onClick={requestClose}
                className="text-[var(--gray-400)] hover:text-[var(--gray-600)] transition-colors"
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
              <Stepper steps={steps} currentIndex={stepIndex} onStepClick={goToStep} />
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
              {currentKey === "education" && <StepEducation form={form} />}
              {currentKey === "workHistory" && <StepWorkHistory form={form} />}
              {currentKey === "review" && <StepReview form={form} />}
            </StepPanel>

            <div className="flex items-center justify-between pt-6 mt-2 border-t border-[var(--gray-100)]">
              <button
                type="button"
                onClick={stepIndex === 0 ? requestClose : goBack}
                className="px-4 py-2.5 text-sm font-semibold text-[var(--gray-600)] bg-[var(--card-bg)] border border-[var(--gray-100)] rounded-lg hover:bg-[var(--gray-25)] transition-colors"
              >
                {stepIndex === 0 ? "Cancel" : "Back"}
              </button>
              {isLastStep ? (
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={submitting}
                  className="px-4 py-2.5 text-sm font-semibold text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Creating..." : "Create Employee"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={goNext}
                  className="px-4 py-2.5 text-sm font-semibold text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmationDialog
        isOpen={showCloseConfirm}
        onClose={() => setShowCloseConfirm(false)}
        onConfirm={confirmDiscard}
        title="Discard new employee?"
        message="You have unsaved changes. Are you sure you want to leave this form? Any unsaved information will be lost."
        confirmLabel="Discard Changes"
        cancelLabel="Continue Editing"
        variant="danger"
      />
    </div>
  );
}
