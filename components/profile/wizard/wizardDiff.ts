import type {
  AddressValue,
  BankAccountValue,
  DependentValue,
  EmergencyContactRecordValue,
  NomineeValue,
  ProfileChangeItem,
  ScalarPiiField,
} from '@/types/profile';
import type { WizardDependent, WizardEmergencyContact, WizardFormValues, WizardNominee } from './wizardTypes';

const SCALAR_PII_FIELDS: { key: keyof WizardFormValues; field: ScalarPiiField }[] = [
  { key: 'legalName', field: 'full_name_as_nic' },
  { key: 'initialsName', field: 'name_with_initials' },
  { key: 'dateOfBirth', field: 'date_of_birth' },
  { key: 'birthPlace', field: 'birth_place' },
  { key: 'nationality', field: 'nationality' },
  { key: 'spouseName', field: 'spouse_name' },
  { key: 'motherName', field: 'mother_name' },
  { key: 'fatherName', field: 'father_name' },
  { key: 'landlineNumber', field: 'landline_number' },
  { key: 'nationalId', field: 'national_id' },
];

const WELFARE_FIELDS: { key: keyof WizardFormValues; field: 'anniversary_date' | 'hobbies' | 'community_activities' | 'professional_memberships' }[] = [
  { key: 'weddingAnniversaryDate', field: 'anniversary_date' },
  { key: 'hobbies', field: 'hobbies' },
  { key: 'communityActivities', field: 'community_activities' },
  { key: 'professionalMemberships', field: 'professional_memberships' },
];

function nullableStr(value: string): string | null {
  return value.trim() === '' ? null : value;
}

function addressFromValues(
  original: WizardFormValues,
  prefix: 'permanent' | 'residing'
): AddressValue | null {
  const line1 = prefix === 'permanent' ? original.permanentAddressLine1 : original.residingAddressLine1;
  const line2 = prefix === 'permanent' ? original.permanentAddressLine2 : original.residingAddressLine2;
  const city = prefix === 'permanent' ? original.permanentCity : original.residingCity;
  const district = prefix === 'permanent' ? original.permanentDistrict : original.residingDistrict;
  if (!line1.trim() && !city.trim() && !district.trim()) return null;
  return { addressLine1: line1, addressLine2: nullableStr(line2), city, district };
}

function bankAccountFromValues(v: WizardFormValues): BankAccountValue {
  return {
    bankName: nullableStr(v.bankName),
    accountHolderName: nullableStr(v.accountHolderName),
    accountNumber: nullableStr(v.accountNumber),
    bankBranch: nullableStr(v.bankBranch),
    bankBranchCode: nullableStr(v.bankBranchCode),
    swiftCode: nullableStr(v.swiftCode),
  };
}

// Exported for reuse by the Create Employee wizard, which needs the exact
// same wire-shape mapping when submitting a brand-new employee's nominees/
// dependents/emergency contacts directly (no diffing involved there).
export function nomineeToValue(n: WizardNominee): NomineeValue {
  return {
    nameWithInitials: n.nameWithInitials,
    nic: n.nic,
    relationship: n.relationship,
    proportionPercent: Number(n.proportionPercent) || 0,
  };
}

export function dependentToValue(d: WizardDependent): DependentValue {
  return {
    fullName: d.fullName,
    nic: nullableStr(d.nic),
    dateOfBirth: d.dateOfBirth,
    gender: d.gender as DependentValue['gender'],
    relationship: d.relationship as DependentValue['relationship'],
    mobileNumber: nullableStr(d.mobileNumber),
  };
}

export function emergencyContactToValue(c: WizardEmergencyContact): EmergencyContactRecordValue {
  return { name: c.name, relationship: c.relationship, contactNumber: c.contactNumber };
}

function diffRecords<TRow extends { id: number | null }, TValue>(
  original: TRow[],
  current: TRow[],
  toValue: (row: TRow) => TValue,
  entityType: 'nominee' | 'dependent' | 'emergency_contact_record'
): ProfileChangeItem[] {
  const items: ProfileChangeItem[] = [];
  const originalById = new Map(original.filter((r) => r.id !== null).map((r) => [r.id as number, r]));
  const currentIds = new Set(current.filter((r) => r.id !== null).map((r) => r.id as number));

  for (const row of current) {
    if (row.id === null) {
      items.push({ entityType, operation: 'create', recordId: null, after: toValue(row) as any });
      continue;
    }
    const originalRow = originalById.get(row.id);
    if (!originalRow) continue;
    if (JSON.stringify(toValue(originalRow)) !== JSON.stringify(toValue(row))) {
      items.push({
        entityType,
        operation: 'update',
        recordId: row.id,
        before: toValue(originalRow) as any,
        after: toValue(row) as any,
      });
    }
  }

  for (const row of original) {
    if (row.id !== null && !currentIds.has(row.id)) {
      items.push({ entityType, operation: 'delete', recordId: row.id, before: toValue(row) as any });
    }
  }

  return items;
}

// Builds the full ProfileChangeItem[] bundle by comparing the form's current
// values against the values it was seeded with (buildDefaultValues) - only
// fields/records that actually changed are included, matching the
// before/after diffing convention every existing change modal already uses.
export function buildWizardChanges(original: WizardFormValues, current: WizardFormValues): ProfileChangeItem[] {
  const changes: ProfileChangeItem[] = [];

  for (const { key, field } of SCALAR_PII_FIELDS) {
    const before = nullableStr(original[key] as string);
    const after = nullableStr(current[key] as string);
    if (before !== after) {
      changes.push({ entityType: 'employee_pii_field', field, operation: 'update', before, after });
    }
  }

  if (original.sex !== current.sex && current.sex) {
    changes.push({
      entityType: 'employee_pii_field',
      field: 'sex',
      operation: 'update',
      before: original.sex || null,
      after: current.sex,
    });
  }

  if (original.maritalStatus !== current.maritalStatus && current.maritalStatus) {
    changes.push({
      entityType: 'employee_pii_field',
      field: 'marital_status',
      operation: 'update',
      before: original.maritalStatus || null,
      after: current.maritalStatus,
    });
  }

  for (const { key, field } of WELFARE_FIELDS) {
    const before = nullableStr(original[key] as string);
    const after = nullableStr(current[key] as string);
    if (before !== after) {
      changes.push({ entityType: 'welfare_field', field, operation: 'update', before, after });
    }
  }

  const permanentBefore = addressFromValues(original, 'permanent');
  const permanentAfter = addressFromValues(current, 'permanent');
  if (JSON.stringify(permanentBefore) !== JSON.stringify(permanentAfter) && permanentAfter) {
    changes.push({ entityType: 'employee_pii_field', field: 'address', operation: 'update', before: permanentBefore, after: permanentAfter });
  }

  const residingBefore = addressFromValues(original, 'residing');
  const residingAfter = addressFromValues(current, 'residing');
  if (JSON.stringify(residingBefore) !== JSON.stringify(residingAfter)) {
    changes.push({ entityType: 'employee_pii_field', field: 'residing_address', operation: 'update', before: residingBefore, after: residingAfter });
  }

  const mobileBefore = nullableStr(original.mobileNumber);
  const mobileAfter = nullableStr(current.mobileNumber);
  if (mobileBefore !== mobileAfter) {
    changes.push({ entityType: 'user_field', field: 'contactNumber', operation: 'update', before: mobileBefore, after: mobileAfter });
  }

  const bankBefore = bankAccountFromValues(original);
  const bankAfter = bankAccountFromValues(current);
  if (JSON.stringify(bankBefore) !== JSON.stringify(bankAfter)) {
    changes.push({ entityType: 'user_field', field: 'bank_account', operation: 'update', before: bankBefore, after: bankAfter });
  }

  if (original.bloodType !== current.bloodType && current.bloodType) {
    changes.push({
      entityType: 'employee_pii_field',
      field: 'blood_type',
      operation: 'update',
      before: (original.bloodType || null) as any,
      after: current.bloodType as any,
    });
  }

  changes.push(...diffRecords(original.nominees, current.nominees, nomineeToValue, 'nominee'));
  changes.push(...diffRecords(original.dependents, current.dependents, dependentToValue, 'dependent'));
  changes.push(...diffRecords(original.emergencyContacts, current.emergencyContacts, emergencyContactToValue, 'emergency_contact_record'));

  return changes;
}
