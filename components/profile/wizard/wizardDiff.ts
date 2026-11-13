import type {
  AddressValue,
  BankAccountValue,
  DependentValue,
  EducationValue,
  EmergencyContactRecordValue,
  NomineeValue,
  ProfileChangeItem,
  ScalarPiiField,
  ScalarUserField,
  WorkHistoryValue,
} from '@/types/profile';
import type {
  WizardDependent,
  WizardEducation,
  WizardEmergencyContact,
  WizardFormValues,
  WizardNominee,
  WizardWorkHistory,
} from './wizardTypes';

const SCALAR_PII_FIELDS: { key: keyof WizardFormValues; field: ScalarPiiField }[] = [
  { key: 'legalName', field: 'full_name_as_nic' },
  { key: 'initialsName', field: 'name_with_initials' },
  { key: 'callingName', field: 'calling_name' },
  { key: 'birthPlace', field: 'birth_place' },
  { key: 'spouseName', field: 'spouse_name' },
  { key: 'spouseNic', field: 'spouse_nic' },
  { key: 'spouseContactNumber', field: 'spouse_contact_number' },
  { key: 'spouseOccupation', field: 'spouse_occupation' },
  { key: 'motherName', field: 'mother_name' },
  { key: 'motherOccupation', field: 'mother_occupation' },
  { key: 'motherContactNumber', field: 'mother_contact_number' },
  { key: 'fatherName', field: 'father_name' },
  { key: 'fatherOccupation', field: 'father_occupation' },
  { key: 'fatherContactNumber', field: 'father_contact_number' },
  { key: 'landlineNumber', field: 'landline_number' },
  { key: 'secondaryContactNumber', field: 'secondary_contact_number' },
  { key: 'medicalConditions', field: 'medical_conditions' },
  { key: 'allergies', field: 'allergies' },
  { key: 'additionalNotes', field: 'additional_notes' },
  { key: 'nationalId', field: 'national_id' },
];

// Non-PII personal/statutory attributes - live on tbl_employee, so they
// travel as 'user_field' changes even though they're edited on the same
// statutory/welfare wizard steps as the PII fields above.
const SCALAR_USER_FIELDS: { key: keyof WizardFormValues; field: ScalarUserField }[] = [
  { key: 'personalEmail', field: 'personalEmail' },
  { key: 'dateOfBirth', field: 'dateOfBirth' },
  { key: 'nationality', field: 'nationality' },
  { key: 'religion', field: 'religion' },
  { key: 'spouseDateOfBirth', field: 'spouseDateOfBirth' },
  { key: 'siblingDetails', field: 'siblingDetails' },
  { key: 'gramaNiladariDivision', field: 'gramaNiladariDivision' },
  { key: 'electorate', field: 'electorate' },
  { key: 'postalCode', field: 'postalCode' },
  { key: 'linkedinProfile', field: 'linkedinProfile' },
  // OCD-456: Education step scalars - field names differ from the RHF key
  // because the underlying tbl_employee columns are primary_school /
  // secondary_school (see employee.schema.ts on the backend), not
  // primarySchoolAttended/secondarySchoolAttended.
  { key: 'primarySchoolAttended', field: 'primarySchool' },
  { key: 'secondarySchoolAttended', field: 'secondarySchool' },
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
    school: nullableStr(d.school),
  };
}

export function emergencyContactToValue(c: WizardEmergencyContact): EmergencyContactRecordValue {
  return { name: c.name, relationship: c.relationship, contactNumber: c.contactNumber };
}

// OCD-456: mirrors CreateUserModal.tsx's own inline education/workHistory
// mapping (handleFinalSubmit) - exported here so the self-service wizard's
// diffing below can reuse the exact same wire-shape conversion.
export function educationToValue(e: WizardEducation): EducationValue {
  return {
    qualificationLevel: e.qualificationLevel as EducationValue['qualificationLevel'],
    qualificationTitle: e.qualificationTitle,
    awardingInstitution: e.awardingInstitution,
    dateAwarded: e.isOngoing ? null : e.dateAwarded || null,
    isOngoing: e.isOngoing,
    remarks: e.remarks || null,
  };
}

export function workHistoryToValue(w: WizardWorkHistory): WorkHistoryValue {
  return {
    organization: w.organization,
    positionHeld: w.positionHeld,
    employmentType: (w.employmentType || 'regular') as WorkHistoryValue['employmentType'],
    careerPath: w.careerPath || null,
    startDate: w.startDate,
    endDate: w.endDate || null,
    remarks: w.remarks || null,
  };
}

// `id` is optional on the row type (rather than the stricter `number | null`
// used everywhere else) solely to accommodate WizardEducation/WizardWorkHistory,
// whose `id` is optional for structural compatibility with the admin-only
// Create Employee wizard's identically-shaped types (see wizardTypes.ts).
// The profile wizard itself always sets `id` explicitly (never leaves it
// `undefined`), so the `row.id !== null` checks below still behave correctly.
function diffRecords<TRow extends { id?: number | null }, TValue>(
  original: TRow[],
  current: TRow[],
  toValue: (row: TRow) => TValue,
  entityType: 'nominee' | 'dependent' | 'emergency_contact_record' | 'education' | 'work_history'
): ProfileChangeItem[] {
  const items: ProfileChangeItem[] = [];
  const originalById = new Map(original.filter((r) => r.id !== null).map((r) => [r.id as number, r]));
  const currentIds = new Set(current.filter((r) => r.id !== null).map((r) => r.id as number));

  for (const row of current) {
    const rowId = row.id ?? null;
    if (rowId === null) {
      items.push({ entityType, operation: 'create', recordId: null, after: toValue(row) as any });
      continue;
    }
    const originalRow = originalById.get(rowId);
    if (!originalRow) continue;
    if (JSON.stringify(toValue(originalRow)) !== JSON.stringify(toValue(row))) {
      items.push({
        entityType,
        operation: 'update',
        recordId: rowId,
        before: toValue(originalRow) as any,
        after: toValue(row) as any,
      });
    }
  }

  for (const row of original) {
    const rowId = row.id ?? null;
    if (rowId !== null && !currentIds.has(rowId)) {
      items.push({ entityType, operation: 'delete', recordId: rowId, before: toValue(row) as any });
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

  for (const { key, field } of SCALAR_USER_FIELDS) {
    const before = nullableStr(original[key] as string);
    const after = nullableStr(current[key] as string);
    if (before !== after) {
      changes.push({ entityType: 'user_field', field, operation: 'update', before, after });
    }
  }

  if (original.sex !== current.sex && current.sex) {
    changes.push({
      entityType: 'user_field',
      field: 'sex',
      operation: 'update',
      before: original.sex || null,
      after: current.sex,
    });
  }

  if (original.maritalStatus !== current.maritalStatus && current.maritalStatus) {
    changes.push({
      entityType: 'user_field',
      field: 'maritalStatus',
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

  // OCD-456: Education step's "Undergraduate Degree Completion Date" - a
  // distinct literal on the `user_field` union (not part of ScalarUserField)
  // since DegreeDateChangeModal.tsx already used this exact shape.
  const degreeDateBefore = nullableStr(original.undergraduateDegreeCompletionDate);
  const degreeDateAfter = nullableStr(current.undergraduateDegreeCompletionDate);
  if (degreeDateBefore !== degreeDateAfter) {
    changes.push({
      entityType: 'user_field',
      field: 'undergraduateDegreeCompletionDate',
      operation: 'update',
      before: degreeDateBefore,
      after: degreeDateAfter,
    });
  }

  changes.push(...diffRecords(original.nominees, current.nominees, nomineeToValue, 'nominee'));
  changes.push(...diffRecords(original.dependents, current.dependents, dependentToValue, 'dependent'));
  changes.push(...diffRecords(original.emergencyContacts, current.emergencyContacts, emergencyContactToValue, 'emergency_contact_record'));
  changes.push(...diffRecords(original.education, current.education, educationToValue, 'education'));
  changes.push(...diffRecords(original.workHistory, current.workHistory, workHistoryToValue, 'work_history'));

  return changes;
}

// ── OCD-650/651/658: carrying pending changes into the wizard ────────────────

// Fields edited on the Edit Employee modal (basic/company details). They are not part of the wizard's
// own form, so they are carried alongside it and merged into the final change request.
const BASIC_USER_FIELDS: string[] = [
  'firstName',
  'lastName',
  'email',
  'department',
  'position',
  'careerPath',
  'workLocation',
  'employeeCategory',
  'hireDate',
  'deviceId',
  'title',
];

export const isBasicUserFieldChange = (item: ProfileChangeItem): boolean =>
  item.entityType === 'user_field' && BASIC_USER_FIELDS.includes(item.field);

function applyRecordChange<TRow extends { id?: number | null }, TValue>(
  rows: TRow[],
  item: { operation: 'create' | 'update' | 'delete'; recordId: number | null; after?: TValue | null },
  toRow: (id: number | null, value: TValue) => TRow
): TRow[] {
  if (item.operation === 'create') return [...rows, toRow(null, item.after as TValue)];
  if (item.operation === 'delete') return rows.filter((r) => r.id !== item.recordId);
  return rows.map((r) => (r.id === item.recordId ? toRow(item.recordId, item.after as TValue) : r));
}

/**
 * Re-applies a previously submitted change bundle on top of the employee's current values, so a request
 * returned for modification can be edited and resubmitted (OCD-658). Basic/company detail changes are
 * returned separately because they have no wizard field.
 */
export function applyChangesToDefaults(
  defaults: WizardFormValues,
  changes: ProfileChangeItem[]
): { values: WizardFormValues; basicChanges: ProfileChangeItem[] } {
  const values: WizardFormValues = {
    ...defaults,
    nominees: [...defaults.nominees],
    dependents: [...defaults.dependents],
    emergencyContacts: [...defaults.emergencyContacts],
    education: [...defaults.education],
    workHistory: [...defaults.workHistory],
  };
  const basicChanges: ProfileChangeItem[] = [];
  const set = (key: keyof WizardFormValues, value: unknown) => {
    (values as unknown as Record<string, unknown>)[key] = value;
  };
  const text = (v: unknown) => (typeof v === 'string' ? v : '');

  for (const item of changes) {
    if (isBasicUserFieldChange(item)) {
      basicChanges.push(item);
      continue;
    }
    if (item.entityType === 'user_field') {
      if (item.field === 'bank_account') {
        const after = item.after as BankAccountValue;
        values.bankName = after.bankName ?? '';
        values.accountHolderName = after.accountHolderName ?? '';
        values.accountNumber = after.accountNumber ?? '';
        values.bankBranch = after.bankBranch ?? '';
        values.bankBranchCode = after.bankBranchCode ?? '';
        values.swiftCode = after.swiftCode ?? '';
      } else if (item.field === 'contactNumber') {
        values.mobileNumber = text(item.after);
      } else if (item.field === 'undergraduateDegreeCompletionDate') {
        values.undergraduateDegreeCompletionDate = text(item.after);
      } else if (item.field === 'sex') {
        values.sex = (item.after as WizardFormValues['sex']) ?? '';
      } else if (item.field === 'maritalStatus') {
        values.maritalStatus = (item.after as WizardFormValues['maritalStatus']) ?? '';
      } else {
        const entry = SCALAR_USER_FIELDS.find((f) => f.field === item.field);
        if (entry) set(entry.key, text(item.after));
      }
    } else if (item.entityType === 'employee_pii_field') {
      if (item.field === 'address') {
        const a = item.after as AddressValue;
        values.permanentAddressLine1 = a.addressLine1;
        values.permanentAddressLine2 = a.addressLine2 ?? '';
        values.permanentCity = a.city;
        values.permanentDistrict = a.district;
      } else if (item.field === 'residing_address') {
        const a = item.after as AddressValue | null;
        values.residingAddressDiffersFromPermanent = !!a;
        values.residingAddressLine1 = a?.addressLine1 ?? '';
        values.residingAddressLine2 = a?.addressLine2 ?? '';
        values.residingCity = a?.city ?? '';
        values.residingDistrict = a?.district ?? '';
      } else if (item.field === 'blood_type') {
        values.bloodType = text(item.after);
      } else {
        const entry = SCALAR_PII_FIELDS.find((f) => f.field === item.field);
        if (entry) set(entry.key, text(item.after));
      }
    } else if (item.entityType === 'welfare_field') {
      const entry = WELFARE_FIELDS.find((f) => f.field === item.field);
      if (entry) set(entry.key, text(item.after));
    } else if (item.entityType === 'nominee') {
      values.nominees = applyRecordChange(values.nominees, item, (id, v: NomineeValue) => ({
        id,
        nameWithInitials: v.nameWithInitials,
        nic: v.nic,
        relationship: v.relationship,
        proportionPercent: String(v.proportionPercent),
      }));
    } else if (item.entityType === 'dependent') {
      values.dependents = applyRecordChange(values.dependents, item, (id, v: DependentValue) => ({
        id,
        fullName: v.fullName,
        nic: v.nic ?? '',
        dateOfBirth: v.dateOfBirth,
        gender: v.gender,
        relationship: v.relationship,
        mobileNumber: v.mobileNumber ?? '',
        school: v.school ?? '',
      }));
    } else if (item.entityType === 'emergency_contact_record') {
      values.emergencyContacts = applyRecordChange(values.emergencyContacts, item, (id, v: EmergencyContactRecordValue) => ({
        id,
        name: v.name,
        relationship: v.relationship,
        contactNumber: v.contactNumber,
      }));
    } else if (item.entityType === 'education') {
      values.education = applyRecordChange(values.education, item, (id, v: EducationValue) => ({
        id,
        qualificationLevel: v.qualificationLevel,
        qualificationTitle: v.qualificationTitle,
        awardingInstitution: v.awardingInstitution,
        dateAwarded: v.dateAwarded ?? '',
        isOngoing: !!v.isOngoing,
        remarks: v.remarks ?? '',
      }));
    } else if (item.entityType === 'work_history') {
      values.workHistory = applyRecordChange(values.workHistory, item, (id, v: WorkHistoryValue) => ({
        id,
        organization: v.organization,
        positionHeld: v.positionHeld,
        employmentType: v.employmentType ?? 'regular',
        careerPath: v.careerPath ?? '',
        startDate: v.startDate,
        endDate: v.endDate ?? '',
        remarks: v.remarks ?? '',
      }));
    }
  }
  return { values, basicChanges };
}

// ── Edit Employee modal -> Edit Full Profile hand-off (OCD-651) ──────────────

const PENDING_BASIC_KEY = (userId: number) => `pendingBasicChanges:${userId}`;

export function stashPendingBasicChanges(userId: number, changes: ProfileChangeItem[]) {
  try {
    if (changes.length) sessionStorage.setItem(PENDING_BASIC_KEY(userId), JSON.stringify(changes));
    else sessionStorage.removeItem(PENDING_BASIC_KEY(userId));
  } catch {
    // sessionStorage unavailable - the changes simply won't be carried over.
  }
}

export function readPendingBasicChanges(userId: number): ProfileChangeItem[] {
  try {
    const raw = sessionStorage.getItem(PENDING_BASIC_KEY(userId));
    return raw ? (JSON.parse(raw) as ProfileChangeItem[]) : [];
  } catch {
    return [];
  }
}

export function clearPendingBasicChanges(userId: number) {
  try {
    sessionStorage.removeItem(PENDING_BASIC_KEY(userId));
  } catch {
    // ignore
  }
}
