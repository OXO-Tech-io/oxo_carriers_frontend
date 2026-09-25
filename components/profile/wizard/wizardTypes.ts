import type {
  DependentRelationship,
  EmployeeDependent,
  EmployeeEducation,
  EmployeeEmergencyContact,
  EmployeeNominee,
  EmployeePii,
  EmployeeWelfareInfo,
  EmployeeWorkHistory,
  EmploymentType,
  MaritalStatus,
  QualificationLevel,
  Sex,
} from '@/types/profile';
import type { User } from '@/types';

export interface WizardNominee {
  id: number | null;
  nameWithInitials: string;
  nic: string;
  relationship: string;
  proportionPercent: string;
}

export interface WizardDependent {
  id: number | null;
  fullName: string;
  nic: string;
  dateOfBirth: string;
  gender: Sex | '';
  relationship: DependentRelationship | '';
  mobileNumber: string;
  school: string;
}

export interface WizardEmergencyContact {
  id: number | null;
  name: string;
  relationship: string;
  contactNumber: string;
}

// OCD-456: Education & Work History, added as self-service wizard steps
// mirroring Create Employee's StepEducation/StepWorkHistory
// (components/modals/employee-wizard). `id` is optional (rather than
// required, unlike WizardNominee/WizardDependent/WizardEmergencyContact
// above) purely so this type stays structurally compatible with
// employee-wizard/wizardTypes.ts's own WizardEducation/WizardWorkHistory
// (which never carry an `id` at all) - EmployeeWizardValues extends this
// same WizardFormValues and reuses those admin-side types for these two
// fields. The profile wizard itself always populates `id` explicitly
// (a real id for existing records, `null` for newly-added ones) - see
// buildDefaultValues below and wizardDiff.ts's diffing.
export interface WizardEducation {
  id?: number | null;
  qualificationLevel: QualificationLevel | '';
  qualificationTitle: string;
  awardingInstitution: string;
  dateAwarded: string;
  isOngoing: boolean;
  remarks: string;
}

export interface WizardWorkHistory {
  id?: number | null;
  organization: string;
  positionHeld: string;
  employmentType: EmploymentType | '';
  startDate: string;
  endDate: string;
  remarks: string;
}

export interface WizardFormValues {
  // Tab 1 - Statutory Employee Information
  nationalId: string;
  legalName: string;
  initialsName: string;
  callingName: string;
  permanentAddressLine1: string;
  permanentAddressLine2: string;
  permanentCity: string;
  permanentDistrict: string;
  gramaNiladariDivision: string;
  electorate: string;
  postalCode: string;
  dateOfBirth: string;
  birthPlace: string;
  sex: Sex | '';
  maritalStatus: MaritalStatus | '';
  nationality: string;
  religion: string;
  secondaryContactNumber: string;
  spouseName: string;
  spouseNic: string;
  spouseDateOfBirth: string;
  spouseContactNumber: string;
  spouseOccupation: string;
  motherName: string;
  motherOccupation: string;
  motherContactNumber: string;
  fatherName: string;
  fatherOccupation: string;
  fatherContactNumber: string;
  siblingDetails: string;
  mobileNumber: string;
  nominees: WizardNominee[];

  // Tab B - Salary Remittance & Correspondence
  // OCD-470: when false (the default), the residing-address fields below stay
  // empty/disabled and the permanent address is assumed as the residing
  // address; when true, the user has opted to enter a different one.
  residingAddressDiffersFromPermanent: boolean;
  residingAddressLine1: string;
  residingAddressLine2: string;
  residingCity: string;
  residingDistrict: string;
  landlineNumber: string;
  accountHolderName: string;
  accountNumber: string;
  bankName: string;
  bankBranch: string;
  bankBranchCode: string;
  swiftCode: string;

  // Tab C - Medical Insurance & Welfare (dependents)
  dependents: WizardDependent[];

  // Tab D - Emergency Contacts
  emergencyContacts: WizardEmergencyContact[];
  bloodType: string;
  medicalConditions: string;
  allergies: string;

  // Tab E - Welfare
  weddingAnniversaryDate: string;
  hobbies: string;
  communityActivities: string;
  professionalMemberships: string;
  linkedinProfile: string;
  additionalNotes: string;

  // Tab F - Education (OCD-456: previously only editable via the separate
  // "Education" tab/modals on My Profile - now a wizard step, mirroring
  // Create Employee's StepEducation).
  primarySchoolAttended: string;
  secondarySchoolAttended: string;
  undergraduateDegreeCompletionDate: string;
  education: WizardEducation[];

  // Tab G - Work History (OCD-456: same as above, mirroring StepWorkHistory).
  workHistory: WizardWorkHistory[];
}

export interface WizardSourceData {
  user: User | null | undefined;
  pii: EmployeePii | null | undefined;
  nominees: EmployeeNominee[] | undefined;
  dependents: EmployeeDependent[] | undefined;
  emergencyContacts: EmployeeEmergencyContact[] | undefined;
  welfareInfo: EmployeeWelfareInfo | null | undefined;
  education?: EmployeeEducation[] | undefined;
  workHistory?: EmployeeWorkHistory[] | undefined;
}

export function buildDefaultValues(source: WizardSourceData): WizardFormValues {
  const { user, pii, nominees, dependents, emergencyContacts, welfareInfo, education, workHistory } = source;
  return {
    nationalId: pii?.nationalId ?? '',
    legalName: pii?.legalName ?? '',
    initialsName: pii?.initialsName ?? '',
    callingName: pii?.callingName ?? '',
    permanentAddressLine1: pii?.addressLine1 ?? '',
    permanentAddressLine2: pii?.addressLine2 ?? '',
    permanentCity: pii?.city ?? '',
    permanentDistrict: pii?.district ?? '',
    // Non-PII personal/statutory attributes now live on tbl_employee (`user`),
    // not tbl_employee_pii (`pii`) - see employee.schema.ts.
    gramaNiladariDivision: user?.grama_niladari_division ?? '',
    electorate: user?.electorate ?? '',
    postalCode: user?.postal_code ?? '',
    dateOfBirth: user?.date_of_birth ?? '',
    birthPlace: pii?.birthPlace ?? '',
    sex: user?.sex ?? '',
    maritalStatus: user?.marital_status ?? '',
    nationality: user?.nationality ?? '',
    religion: user?.religion ?? '',
    secondaryContactNumber: pii?.secondaryContactNumber ?? '',
    spouseName: pii?.spouseName ?? '',
    spouseNic: pii?.spouseNic ?? '',
    spouseDateOfBirth: user?.spouse_date_of_birth ?? '',
    spouseContactNumber: pii?.spouseContactNumber ?? '',
    spouseOccupation: pii?.spouseOccupation ?? '',
    motherName: pii?.motherName ?? '',
    motherOccupation: pii?.motherOccupation ?? '',
    motherContactNumber: pii?.motherContactNumber ?? '',
    fatherName: pii?.fatherName ?? '',
    fatherOccupation: pii?.fatherOccupation ?? '',
    fatherContactNumber: pii?.fatherContactNumber ?? '',
    siblingDetails: user?.sibling_details ?? '',
    mobileNumber: user?.contact_number ?? '',
    nominees: (nominees ?? []).map((n) => ({
      id: n.id,
      nameWithInitials: n.nameWithInitials ?? '',
      nic: n.nic ?? '',
      relationship: n.relationship,
      proportionPercent: n.proportionPercent,
    })),

    // Default to unchecked ("same as permanent") unless a distinct residing
    // address was already recorded for this employee.
    residingAddressDiffersFromPermanent: !!(
      (pii?.residingAddressLine1 ?? '').trim() ||
      (pii?.residingCity ?? '').trim() ||
      (pii?.residingDistrict ?? '').trim()
    ),
    residingAddressLine1: pii?.residingAddressLine1 ?? '',
    residingAddressLine2: pii?.residingAddressLine2 ?? '',
    residingCity: pii?.residingCity ?? '',
    residingDistrict: pii?.residingDistrict ?? '',
    landlineNumber: pii?.landlineNumber ?? '',
    accountHolderName: user?.account_holder_name ?? '',
    accountNumber: user?.account_number ?? '',
    bankName: user?.bank_name ?? '',
    bankBranch: user?.bank_branch ?? '',
    bankBranchCode: user?.bank_branch_code ?? '',
    swiftCode: user?.swift_code ?? '',

    dependents: (dependents ?? []).map((d) => ({
      id: d.id,
      fullName: d.fullName ?? '',
      nic: d.nic ?? '',
      dateOfBirth: d.dateOfBirth,
      gender: d.gender,
      relationship: d.relationship,
      mobileNumber: d.mobileNumber ?? '',
      school: d.school ?? '',
    })),

    emergencyContacts: (emergencyContacts ?? []).map((c) => ({
      id: c.id,
      name: c.name ?? '',
      relationship: c.relationship,
      contactNumber: c.contactNumber ?? '',
    })),
    bloodType: pii?.bloodType ?? '',
    medicalConditions: pii?.medicalConditions ?? '',
    allergies: pii?.allergies ?? '',

    weddingAnniversaryDate: welfareInfo?.weddingAnniversaryDate ?? '',
    hobbies: welfareInfo?.hobbies ?? '',
    communityActivities: welfareInfo?.communityActivities ?? '',
    professionalMemberships: welfareInfo?.professionalMemberships ?? '',
    linkedinProfile: user?.linkedin_profile ?? '',
    additionalNotes: pii?.additionalNotes ?? '',

    primarySchoolAttended: user?.primary_school ?? '',
    secondarySchoolAttended: user?.secondary_school ?? '',
    undergraduateDegreeCompletionDate: user?.undergraduate_degree_completion_date ?? '',
    education: (education ?? []).map((e) => ({
      id: e.id,
      qualificationLevel: e.qualificationLevel,
      qualificationTitle: e.qualificationTitle ?? '',
      awardingInstitution: e.awardingInstitution ?? '',
      dateAwarded: e.dateAwarded ?? '',
      isOngoing: e.isOngoing,
      remarks: e.remarks ?? '',
    })),

    workHistory: (workHistory ?? []).map((w) => ({
      id: w.id,
      organization: w.organization ?? '',
      positionHeld: w.positionHeld ?? '',
      employmentType: w.employmentType,
      startDate: w.startDate ?? '',
      endDate: w.endDate ?? '',
      remarks: w.remarks ?? '',
    })),
  };
}
