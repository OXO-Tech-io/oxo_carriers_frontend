import type {
  DependentRelationship,
  EmployeeDependent,
  EmployeeEmergencyContact,
  EmployeeNominee,
  EmployeePii,
  EmployeeWelfareInfo,
  MaritalStatus,
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
}

export interface WizardSourceData {
  user: User | null | undefined;
  pii: EmployeePii | null | undefined;
  nominees: EmployeeNominee[] | undefined;
  dependents: EmployeeDependent[] | undefined;
  emergencyContacts: EmployeeEmergencyContact[] | undefined;
  welfareInfo: EmployeeWelfareInfo | null | undefined;
}

export function buildDefaultValues(source: WizardSourceData): WizardFormValues {
  const { user, pii, nominees, dependents, emergencyContacts, welfareInfo } = source;
  return {
    nationalId: pii?.nationalId ?? '',
    legalName: pii?.legalName ?? '',
    initialsName: pii?.initialsName ?? '',
    callingName: pii?.callingName ?? '',
    permanentAddressLine1: pii?.addressLine1 ?? '',
    permanentAddressLine2: pii?.addressLine2 ?? '',
    permanentCity: pii?.city ?? '',
    permanentDistrict: pii?.district ?? '',
    gramaNiladariDivision: pii?.gramaNiladariDivision ?? '',
    electorate: pii?.electorate ?? '',
    postalCode: pii?.postalCode ?? '',
    dateOfBirth: pii?.dateOfBirth ?? '',
    birthPlace: pii?.birthPlace ?? '',
    sex: pii?.sex ?? '',
    maritalStatus: pii?.maritalStatus ?? '',
    nationality: pii?.nationality ?? '',
    religion: pii?.religion ?? '',
    secondaryContactNumber: pii?.secondaryContactNumber ?? '',
    spouseName: pii?.spouseName ?? '',
    spouseNic: pii?.spouseNic ?? '',
    spouseDateOfBirth: pii?.spouseDateOfBirth ?? '',
    spouseContactNumber: pii?.spouseContactNumber ?? '',
    spouseOccupation: pii?.spouseOccupation ?? '',
    motherName: pii?.motherName ?? '',
    motherOccupation: pii?.motherOccupation ?? '',
    motherContactNumber: pii?.motherContactNumber ?? '',
    fatherName: pii?.fatherName ?? '',
    fatherOccupation: pii?.fatherOccupation ?? '',
    fatherContactNumber: pii?.fatherContactNumber ?? '',
    siblingDetails: pii?.siblingDetails ?? '',
    mobileNumber: user?.contact_number ?? '',
    nominees: (nominees ?? []).map((n) => ({
      id: n.id,
      nameWithInitials: n.nameWithInitials ?? '',
      nic: n.nic ?? '',
      relationship: n.relationship,
      proportionPercent: n.proportionPercent,
    })),

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
    linkedinProfile: pii?.linkedinProfile ?? '',
    additionalNotes: pii?.additionalNotes ?? '',
  };
}
