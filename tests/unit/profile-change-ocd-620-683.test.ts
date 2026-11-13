import { describe, it, expect } from 'vitest';
import { validateBankBranchCode } from '@/lib/validation/textValidation';
import {
  applyChangesToDefaults,
  buildWizardChanges,
  isBasicUserFieldChange,
} from '@/components/profile/wizard/wizardDiff';
import { buildDefaultValues } from '@/components/profile/wizard/wizardTypes';
import { buildBasicChanges } from '@/components/modals/EditEmployeeModal';
import { fieldLabel } from '@/components/modals/ProfileChangeDiffModal';
import type { ProfileChangeItem } from '@/types/profile';

const base = () => buildDefaultValues({ user: undefined, pii: undefined, nominees: [], dependents: [], emergencyContacts: [], welfareInfo: undefined });

describe('OCD-641 branch code', () => {
  it('accepts exactly 3 digits', () => {
    expect(validateBankBranchCode('007')).toBe(true);
    expect(validateBankBranchCode('065')).toBe(true);
    expect(validateBankBranchCode('123')).toBe(true);
  });
  it('rejects alphanumeric, short and long values', () => {
    expect(validateBankBranchCode('45A')).not.toBe(true);
    expect(validateBankBranchCode('65')).not.toBe(true);
    expect(validateBankBranchCode('1234')).not.toBe(true);
  });
});

describe('OCD-676 field labels', () => {
  it.each([
    ['calling_name', 'Calling Name'],
    ['medical_conditions', 'Medical Conditions'],
    ['additional_notes', 'Additional Notes'],
    ['spouse_nic', 'Spouse NIC'],
    ['allergies', 'Allergies'],
  ])('labels %s as %s', (field, label) => {
    expect(fieldLabel(field)).toBe(label);
  });
  it('never exposes snake_case for an unknown field', () => {
    expect(fieldLabel('some_new_field')).toBe('Some New Field');
    expect(fieldLabel('someNewField')).toBe('Some New Field');
  });
});

describe('OCD-650/651 basic detail changes', () => {
  const original = {
    title: '' as const,
    first_name: 'Ann',
    last_name: 'Lee',
    email: 'ann@oxoholdings.group',
    department: 'IT',
    position: 'Dev',
    career_path: '' as const,
    work_location: 'office' as const,
    employee_category: 'internal' as const,
    hire_date: '2024-01-02',
    device_id: '',
  };

  it('only emits changed fields', () => {
    const changes = buildBasicChanges(original, { ...original, first_name: 'Anna', department: 'HR' });
    expect(changes).toHaveLength(2);
    expect(changes[0]).toMatchObject({ entityType: 'user_field', field: 'firstName', before: 'Ann', after: 'Anna' });
    expect(changes[1]).toMatchObject({ field: 'department', before: 'IT', after: 'HR' });
  });

  it('emits nothing when unchanged', () => {
    expect(buildBasicChanges(original, { ...original })).toEqual([]);
  });

  it('recognises basic field changes so the wizard can carry them', () => {
    const [change] = buildBasicChanges(original, { ...original, email: 'new@oxoholdings.group' });
    expect(isBasicUserFieldChange(change)).toBe(true);
  });
});

describe('OCD-658 resubmitting a returned request', () => {
  it('pre-fills the form with the returned values and keeps basic changes aside', () => {
    const defaults = base();
    const changes: ProfileChangeItem[] = [
      { entityType: 'employee_pii_field', field: 'calling_name', operation: 'update', before: null, after: 'Ann' },
      { entityType: 'user_field', field: 'firstName', operation: 'update', before: 'A', after: 'Anna' },
      {
        entityType: 'user_field',
        field: 'bank_account',
        operation: 'update',
        before: { bankName: null, accountHolderName: null, accountNumber: null, bankBranch: null },
        after: {
          bankName: 'Bank',
          accountHolderName: 'Ann',
          accountNumber: '123',
          bankBranch: 'Fort',
          bankBranchCode: '007',
          swiftCode: 'ABGHLK33',
        },
      },
    ];
    const { values, basicChanges } = applyChangesToDefaults(defaults, changes);
    expect(values.callingName).toBe('Ann');
    expect(values.bankBranchCode).toBe('007');
    expect(values.swiftCode).toBe('ABGHLK33');
    expect(basicChanges).toHaveLength(1);
    // Re-diffing against the current data reproduces the edited fields.
    const rediff = buildWizardChanges(defaults, values);
    expect(rediff.some((c) => c.entityType === 'user_field' && c.field === 'bank_account')).toBe(true);
    expect(rediff.some((c) => c.entityType === 'employee_pii_field' && c.field === 'calling_name')).toBe(true);
  });

  it('applies record create/update/delete onto existing rows', () => {
    const defaults = {
      ...base(),
      dependents: [
        { id: 1, fullName: 'Kid', nic: '', dateOfBirth: '2018-01-01', gender: 'male' as const, relationship: 'child' as const, mobileNumber: '', school: '' },
      ],
    };
    const { values } = applyChangesToDefaults(defaults, [
      {
        entityType: 'dependent',
        operation: 'update',
        recordId: 1,
        before: null,
        after: { fullName: 'Kid', nic: null, dateOfBirth: '2018-01-01', gender: 'male', relationship: 'child', mobileNumber: '0771234567', school: 'ABC' },
      },
    ]);
    expect(values.dependents[0]).toMatchObject({ id: 1, mobileNumber: '0771234567', school: 'ABC' });
  });
});

describe('OCD-647 personal email in the profile wizard', () => {
  it('is part of the diff when changed', () => {
    const original = { ...base(), personalEmail: 'old@gmail.com' };
    const changes = buildWizardChanges(original, { ...original, personalEmail: 'new@gmail.com' });
    expect(changes).toContainEqual({
      entityType: 'user_field',
      field: 'personalEmail',
      operation: 'update',
      before: 'old@gmail.com',
      after: 'new@gmail.com',
    });
  });
});
