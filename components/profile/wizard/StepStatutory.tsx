'use client';

import { useEffect, useRef, useState } from 'react';
import { UseFormReturn, useFieldArray } from 'react-hook-form';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { SEX_OPTIONS, MARITAL_STATUS_OPTIONS } from '@/types/profile';
import { Field, RepeatableCard, SectionTitle, inputClass } from './shared';
import type { WizardFormValues } from './wizardTypes';
import {
  noEmoji,
  noFutureDate,
  validateNic,
  validateMobileNumber,
  validatePhoneNumber,
  validatePostalCode,
  validateLocationName,
  validateAddressLine,
  NIC_PATTERN,
  NIC_FORMAT_HINT,
  MOBILE_NUMBER_HINT,
} from '@/lib/validation/textValidation';

interface StepProps {
  form: UseFormReturn<WizardFormValues>;
  email: string;
  designation: string;
  // OCD-444: excludes this employee's own already-saved NIC from the
  // duplicate check below - only set by the self-service Profile Wizard
  // (app/(dashboard)/profile/wizard/page.tsx), which edits an *existing*
  // employee's own record. The Create Employee wizard leaves this undefined,
  // since there's no "self" to exclude for a brand-new employee.
  currentEmployeeId?: string;
}

const NIC_CHECK_DEBOUNCE_MS = 500;

// OCD-472: the old 2-nominee cap is removed - nominees are no longer capped
// here at all (validated only for per-row/total proportion, see below).

function calculateAge(dateOfBirth: string): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age -= 1;
  return age;
}

// Spouse fields synced into a mirrored "spouse" dependent record - see the
// sync effect below (OCD-431).
const SPOUSE_SYNCED_FIELDS = ['spouseName', 'spouseNic', 'spouseDateOfBirth', 'spouseContactNumber', 'spouseOccupation'] as const;

export default function StepStatutory({ form, email, designation, currentEmployeeId }: StepProps) {
  const {
    register,
    control,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'nominees',
    // OCD-471/OCD-428: at least one nominee is required, and the individual +
    // cumulative proportions must be valid before "Next"/submit can proceed.
    rules: {
      validate: (value) => {
        if (!value || value.length === 0) {
          return 'At least one nominee must be added for EPF/ETF beneficiary allocation.';
        }
        const total = value.reduce((sum, n) => sum + (Number(n.proportionPercent) || 0), 0);
        if (total > 100) return 'Total nominee proportion cannot exceed 100%.';
        if (total !== 100) return 'Total nominee proportion must equal 100%.';
        return true;
      },
    },
  });
  const { prepend: prependDependent, update: updateDependent } = useFieldArray({ control, name: 'dependents' });

  const maritalStatus = watch('maritalStatus');
  const isMarried = maritalStatus === 'married';
  const age = calculateAge(watch('dateOfBirth'));
  const nomineesWatch = watch('nominees');
  const totalProportion = (nomineesWatch ?? []).reduce((sum, n) => sum + (Number(n.proportionPercent) || 0), 0);

  const spouseName = watch('spouseName');
  const spouseNic = watch('spouseNic');
  const spouseDateOfBirth = watch('spouseDateOfBirth');
  const spouseContactNumber = watch('spouseContactNumber');
  const employeeSex = watch('sex');
  const dependentsWatch = watch('dependents');
  const nationalId = watch('nationalId');

  // OCD-444: flag a duplicate NIC as soon as the user leaves the field,
  // instead of only discovering it after "Create Employee"/final submit -
  // UsersService.create's own check stays in place as the authoritative,
  // race-proof gate.
  const [checkingNic, setCheckingNic] = useState(false);
  useEffect(() => {
    const value = (nationalId || '').trim();
    if (!value || !NIC_PATTERN.test(value)) return;

    const timer = setTimeout(async () => {
      setCheckingNic(true);
      try {
        const response = await api.get('/users/check-nic', {
          params: { nationalId: value, excludeEmployeeId: currentEmployeeId },
        });
        if (watch('nationalId') !== value) return;
        if (response.data?.exists) {
          setError('nationalId', {
            type: 'manual',
            message: 'An employee profile with this NIC number already exists.',
          });
        } else if (errors.nationalId?.type === 'manual') {
          clearErrors('nationalId');
        }
      } catch {
        // Non-blocking - the server-side check at submission is the real gate.
      } finally {
        setCheckingNic(false);
      }
    }, NIC_CHECK_DEBOUNCE_MS);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nationalId]);

  // OCD-426: clear spouse details as soon as marital status moves away from
  // "married" (not on initial mount, so loading an existing single
  // employee's data doesn't get wiped before the user touches anything).
  const prevMaritalStatusRef = useRef(maritalStatus);
  useEffect(() => {
    const prev = prevMaritalStatusRef.current;
    if (prev === 'married' && maritalStatus !== 'married') {
      SPOUSE_SYNCED_FIELDS.forEach((f) => setValue(f, ''));
    }
    prevMaritalStatusRef.current = maritalStatus;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maritalStatus]);

  // OCD-431: mirror spouse information entered above into a "spouse" family
  // member record in the Dependents section automatically, keeping it in
  // sync whenever the spouse fields change, and removing it again once
  // marital status is no longer "married".
  useEffect(() => {
    const list = dependentsWatch ?? [];
    const idx = list.findIndex((d) => d.relationship === 'spouse');
    if (isMarried && spouseName.trim()) {
      if (idx === -1) {
        prependDependent({
          id: null,
          fullName: spouseName,
          nic: spouseNic,
          dateOfBirth: spouseDateOfBirth,
          gender: employeeSex === 'male' ? 'female' : employeeSex === 'female' ? 'male' : '',
          relationship: 'spouse',
          mobileNumber: spouseContactNumber,
          school: '',
        });
      } else {
        const current = list[idx];
        if (
          current.fullName !== spouseName ||
          current.nic !== spouseNic ||
          current.dateOfBirth !== spouseDateOfBirth ||
          current.mobileNumber !== spouseContactNumber
        ) {
          updateDependent(idx, {
            ...current,
            fullName: spouseName,
            nic: spouseNic,
            dateOfBirth: spouseDateOfBirth,
            mobileNumber: spouseContactNumber,
          });
        }
      }
    }
    // Removal when no longer married is handled by the spouse-clear effect
    // above (it empties spouseName, which this effect then reacts to) plus
    // StepDependents.tsx itself only renders/keeps this array for married
    // employees - no separate remove() call needed here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMarried, spouseName, spouseNic, spouseDateOfBirth, spouseContactNumber]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field
          label="National Identity Card Number"
          required
          error={errors.nationalId?.message}
          hint={checkingNic ? 'Checking availability...' : NIC_FORMAT_HINT}
        >
          <input
            {...register('nationalId', { required: 'NIC number is required', validate: { validateNic, noEmoji } })}
            className={inputClass}
          />
        </Field>
        <Field label="Full Name as in NIC" required error={errors.legalName?.message}>
          <input {...register('legalName', { required: 'Full name is required', validate: noEmoji })} className={inputClass} />
        </Field>
        <Field label="Name with Initials" required error={errors.initialsName?.message}>
          <input
            {...register('initialsName', { required: 'Name with initials is required', validate: noEmoji })}
            className={inputClass}
          />
        </Field>
        <Field label="Calling Name" required error={errors.callingName?.message}>
          <input
            {...register('callingName', { required: 'Calling name is required', validate: noEmoji })}
            placeholder="e.g. Amila Perera"
            className={inputClass}
          />
        </Field>
        <Field label="Designation">
          <input value={designation} disabled className={inputClass} />
        </Field>
      </div>

      <div className="space-y-3">
        <SectionTitle>Permanent Address</SectionTitle>
        <Field label="Address Line 1" required error={errors.permanentAddressLine1?.message}>
          <input
            {...register('permanentAddressLine1', {
              required: 'Address line 1 is required',
              validate: { validateAddressLine, noEmoji },
            })}
            className={inputClass}
          />
        </Field>
        <Field label="Address Line 2" error={errors.permanentAddressLine2?.message}>
          <input {...register('permanentAddressLine2', { validate: { validateAddressLine, noEmoji } })} className={inputClass} />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="City" required error={errors.permanentCity?.message}>
            <input
              {...register('permanentCity', { required: 'City is required', validate: { validateLocationName, noEmoji } })}
              className={inputClass}
            />
          </Field>
          <Field label="District" required error={errors.permanentDistrict?.message}>
            <input
              {...register('permanentDistrict', {
                required: 'District is required',
                validate: { validateLocationName, noEmoji },
              })}
              className={inputClass}
            />
          </Field>
          <Field label="Grama Niladari Division" required error={errors.gramaNiladariDivision?.message}>
            <input
              {...register('gramaNiladariDivision', {
                required: 'Grama Niladhari Division is required',
                validate: { validateLocationName, noEmoji },
              })}
              className={inputClass}
            />
          </Field>
          <Field label="Electorate" required error={errors.electorate?.message}>
            <input
              {...register('electorate', { required: 'Electorate is required', validate: { validateLocationName, noEmoji } })}
              className={inputClass}
            />
          </Field>
          <Field
            label="Postal Code"
            required
            error={errors.postalCode?.message}
            hint="Format: 5 digits (e.g. 10100)"
          >
            <input
              {...register('postalCode', { required: 'Postal code is required', validate: validatePostalCode })}
              inputMode="numeric"
              maxLength={5}
              className={inputClass}
            />
          </Field>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Date of Birth" required error={errors.dateOfBirth?.message}>
          <input
            type="date"
            {...register('dateOfBirth', { required: 'Date of birth is required', validate: noFutureDate })}
            className={inputClass}
          />
        </Field>
        <Field label="Age">
          <input value={age === null ? '' : `${age} years`} disabled className={inputClass} />
        </Field>
        <Field label="Birth Place" required error={errors.birthPlace?.message}>
          <input
            {...register('birthPlace', { required: 'Birth place is required', validate: { validateLocationName, noEmoji } })}
            className={inputClass}
          />
        </Field>
        <Field label="Sex" required error={errors.sex?.message}>
          <select {...register('sex', { required: 'Sex is required' })} className={inputClass}>
            <option value="">Select</option>
            {SEX_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Married or Single" required error={errors.maritalStatus?.message}>
          <select {...register('maritalStatus', { required: 'Marital status is required' })} className={inputClass}>
            <option value="">Select</option>
            {MARITAL_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Nationality" required error={errors.nationality?.message}>
          <input {...register('nationality', { required: 'Nationality is required', validate: noEmoji })} className={inputClass} />
        </Field>
        <Field label="Religion" required error={errors.religion?.message}>
          <input {...register('religion', { required: 'Religion is required', validate: noEmoji })} className={inputClass} />
        </Field>
        <Field
          label="Mobile Number"
          required
          error={errors.mobileNumber?.message}
          hint={MOBILE_NUMBER_HINT}
        >
          <input
            {...register('mobileNumber', { required: 'Mobile number is required', validate: validateMobileNumber })}
            placeholder="07XXXXXXXX"
            inputMode="numeric"
            maxLength={10}
            className={inputClass}
          />
        </Field>
        <Field
          label="Secondary Contact Number"
          required
          error={errors.secondaryContactNumber?.message}
          hint={MOBILE_NUMBER_HINT}
        >
          <input
            {...register('secondaryContactNumber', {
              required: 'Secondary contact number is required',
              validate: validateMobileNumber,
            })}
            placeholder="07XXXXXXXX"
            inputMode="numeric"
            maxLength={10}
            className={inputClass}
          />
        </Field>
        <Field label="Email">
          <input value={email} disabled className={inputClass} />
        </Field>
      </div>

      <div className="space-y-3">
        <SectionTitle>
          Spouse Details {isMarried ? <span className="text-red-500">*</span> : '(only applicable if married)'}
        </SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Name of the Spouse (with initials)"
            required={isMarried}
            error={errors.spouseName?.message}
          >
            <input
              {...register('spouseName', {
                required: isMarried ? 'Spouse Name is required.' : false,
                validate: noEmoji,
              })}
              disabled={!isMarried}
              className={inputClass}
            />
          </Field>
          <Field label="Spouse NIC" required={isMarried} error={errors.spouseNic?.message} hint={isMarried ? NIC_FORMAT_HINT : undefined}>
            <input
              {...register('spouseNic', {
                required: isMarried ? 'Spouse NIC is required.' : false,
                validate: { validateNic, noEmoji },
              })}
              disabled={!isMarried}
              className={inputClass}
            />
          </Field>
          <Field label="Spouse Date of Birth" required={isMarried} error={errors.spouseDateOfBirth?.message}>
            <input
              type="date"
              {...register('spouseDateOfBirth', {
                required: isMarried ? 'Spouse Date of Birth is required.' : false,
                validate: noFutureDate,
              })}
              disabled={!isMarried}
              className={inputClass}
            />
          </Field>
          <Field
            label="Spouse Contact Number"
            required={isMarried}
            error={errors.spouseContactNumber?.message}
            hint={isMarried ? MOBILE_NUMBER_HINT : undefined}
          >
            <input
              {...register('spouseContactNumber', {
                required: isMarried ? 'Spouse Contact Number is required.' : false,
                validate: validateMobileNumber,
              })}
              disabled={!isMarried}
              placeholder="07XXXXXXXX"
              inputMode="numeric"
              maxLength={10}
              className={inputClass}
            />
          </Field>
          <Field label="Spouse Occupation & Workplace" className="sm:col-span-2" error={errors.spouseOccupation?.message}>
            <input {...register('spouseOccupation', { validate: noEmoji })} disabled={!isMarried} className={inputClass} />
          </Field>
        </div>
      </div>

      <div className="space-y-3">
        <SectionTitle>Parents & Siblings</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Name of the Mother (with initials)" required error={errors.motherName?.message}>
            <input
              {...register('motherName', { required: "Mother's name is required", validate: noEmoji })}
              className={inputClass}
            />
          </Field>
          <Field label="Mother's Occupation & Workplace" error={errors.motherOccupation?.message}>
            <input {...register('motherOccupation', { validate: noEmoji })} className={inputClass} />
          </Field>
          <Field
            label="Mother's Contact Number"
            error={errors.motherContactNumber?.message}
            hint={MOBILE_NUMBER_HINT}
          >
            <input
              {...register('motherContactNumber', { validate: validatePhoneNumber })}
              placeholder="07XXXXXXXX"
              inputMode="numeric"
              maxLength={10}
              className={inputClass}
            />
          </Field>
          <Field label="Name of the Father (with initials)" required error={errors.fatherName?.message}>
            <input
              {...register('fatherName', { required: "Father's name is required", validate: noEmoji })}
              className={inputClass}
            />
          </Field>
          <Field label="Father's Occupation & Workplace" error={errors.fatherOccupation?.message}>
            <input {...register('fatherOccupation', { validate: noEmoji })} className={inputClass} />
          </Field>
          <Field
            label="Father's Contact Number"
            error={errors.fatherContactNumber?.message}
            hint={MOBILE_NUMBER_HINT}
          >
            <input
              {...register('fatherContactNumber', { validate: validatePhoneNumber })}
              placeholder="07XXXXXXXX"
              inputMode="numeric"
              maxLength={10}
              className={inputClass}
            />
          </Field>
        </div>
        <Field label="Sibling Details (Name, Age, Gender, Occupation, Contact)" error={errors.siblingDetails?.message}>
          <textarea {...register('siblingDetails', { validate: noEmoji })} rows={3} className={inputClass} />
        </Field>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <SectionTitle>
            Nominees (EPF/ETF beneficiaries) <span className="text-red-500">*</span>
          </SectionTitle>
          <div className="flex items-center gap-3">
            <span
              className={`text-[11px] font-bold ${
                totalProportion === 100 ? 'text-green-600' : 'text-red-500'
              }`}
            >
              {totalProportion}% allocated
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ id: null, nameWithInitials: '', nic: '', relationship: '', proportionPercent: '' })}
            >
              Add Nominee
            </Button>
          </div>
        </div>
        {errors.nominees?.root?.message && (
          <p className="text-xs text-red-500 font-medium">{errors.nominees.root.message}</p>
        )}
        {fields.length === 0 && !errors.nominees?.root?.message && (
          <p className="text-xs text-[var(--gray-400)] font-medium">No nominees added yet.</p>
        )}
        {fields.map((f, index) => (
          <RepeatableCard key={f.id} title={`Nominee ${index + 1}`} onRemove={() => remove(index)}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Name with Initials" required error={errors.nominees?.[index]?.nameWithInitials?.message}>
                <input
                  {...register(`nominees.${index}.nameWithInitials`, { required: 'Name is required', validate: noEmoji })}
                  className={inputClass}
                />
              </Field>
              <Field
                label="National Identity Card Number"
                required
                error={errors.nominees?.[index]?.nic?.message}
                hint={NIC_FORMAT_HINT}
              >
                <input
                  {...register(`nominees.${index}.nic`, { required: 'NIC is required', validate: validateNic })}
                  className={inputClass}
                />
              </Field>
              <Field label="Relationship" required error={errors.nominees?.[index]?.relationship?.message}>
                <input
                  {...register(`nominees.${index}.relationship`, { required: 'Relationship is required', validate: noEmoji })}
                  className={inputClass}
                />
              </Field>
              <Field label="Proportion (%)" required error={errors.nominees?.[index]?.proportionPercent?.message}>
                <input
                  type="number"
                  min={0}
                  max={100}
                  {...register(`nominees.${index}.proportionPercent`, {
                    required: 'Proportion is required',
                    validate: (value) => {
                      const num = Number(value);
                      if (Number.isNaN(num)) return 'Enter a valid number';
                      if (num <= 0) return 'Proportion must be greater than 0';
                      if (num > 100) return 'Nominee proportion cannot exceed 100%.';
                      return true;
                    },
                  })}
                  className={inputClass}
                />
              </Field>
            </div>
          </RepeatableCard>
        ))}
      </div>
    </div>
  );
}
