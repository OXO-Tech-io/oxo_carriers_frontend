'use client';

import { useEffect, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import api from '@/lib/api';
import { Field, SectionTitle, inputClass } from './shared';
import type { WizardFormValues } from './wizardTypes';
import {
  noEmoji,
  validatePhoneNumber,
  validateAddressLine,
  validateLocationName,
  validateBankName,
  validateBankAccountNumber,
  validateBankBranchCode,
  validateSwiftCode,
  BANK_ACCOUNT_NUMBER_PATTERN,
  MOBILE_NUMBER_HINT,
} from '@/lib/validation/textValidation';

interface StepProps {
  form: UseFormReturn<WizardFormValues>;
  // OCD-444: see the identical prop on StepStatutory.tsx - excludes this
  // employee's own already-saved bank account number from the duplicate
  // check below. Only set by the self-service Profile Wizard.
  currentEmployeeId?: string;
}

const ACCOUNT_CHECK_DEBOUNCE_MS = 500;

export default function StepRemittance({ form, currentEmployeeId }: StepProps) {
  const {
    register,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = form;
  const accountNumber = watch('accountNumber');
  const [checkingAccount, setCheckingAccount] = useState(false);

  // OCD-444: flag a duplicate bank account number as soon as the user
  // leaves the field. UsersService.create's own check stays in place as the
  // authoritative, race-proof gate at final submission.
  useEffect(() => {
    const value = (accountNumber || '').trim();
    if (!value || !BANK_ACCOUNT_NUMBER_PATTERN.test(value)) return;

    const timer = setTimeout(async () => {
      setCheckingAccount(true);
      try {
        const response = await api.get('/users/check-bank-account', {
          params: { accountNumber: value, excludeEmployeeId: currentEmployeeId },
        });
        if (watch('accountNumber') !== value) return;
        if (response.data?.exists) {
          setError('accountNumber', {
            type: 'manual',
            message: 'This bank account number is already associated with another employee profile.',
          });
        } else if (errors.accountNumber?.type === 'manual') {
          clearErrors('accountNumber');
        }
      } catch {
        // Non-blocking - the server-side check at submission is the real gate.
      } finally {
        setCheckingAccount(false);
      }
    }, ACCOUNT_CHECK_DEBOUNCE_MS);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountNumber]);

  // OCD-470: default assumption is that the residing address is the same as
  // the permanent one - the checkbox below is the only way to diverge from
  // that, and unchecking it clears out whatever was entered so the fields
  // read back as "same as permanent" (see wizardDiff.ts's addressFromValues).
  const differsFromPermanent = watch('residingAddressDiffersFromPermanent');

  useEffect(() => {
    if (!differsFromPermanent) {
      setValue('residingAddressLine1', '');
      setValue('residingAddressLine2', '');
      setValue('residingCity', '');
      setValue('residingDistrict', '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [differsFromPermanent]);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <SectionTitle>Residing Address</SectionTitle>
        <label className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
          <input type="checkbox" {...register('residingAddressDiffersFromPermanent')} className="h-4 w-4" />
          Residing Address is different from Permanent Address
        </label>
        {!differsFromPermanent ? (
          <p className="text-xs text-[var(--gray-400)] font-medium">
            The permanent address entered on the Statutory Information tab will be used as the residing address.
          </p>
        ) : (
          <>
            <Field label="Address Line 1" error={errors.residingAddressLine1?.message}>
              <input
                {...register('residingAddressLine1', { validate: { validateAddressLine, noEmoji } })}
                className={inputClass}
              />
            </Field>
            <Field label="Address Line 2" error={errors.residingAddressLine2?.message}>
              <input
                {...register('residingAddressLine2', { validate: { validateAddressLine, noEmoji } })}
                className={inputClass}
              />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="City" error={errors.residingCity?.message}>
                <input {...register('residingCity', { validate: { validateLocationName, noEmoji } })} className={inputClass} />
              </Field>
              <Field label="District" error={errors.residingDistrict?.message}>
                <input {...register('residingDistrict', { validate: { validateLocationName, noEmoji } })} className={inputClass} />
              </Field>
            </div>
          </>
        )}
        <Field
          label="Landline Number (if available)"
          error={errors.landlineNumber?.message}
          hint={MOBILE_NUMBER_HINT}
        >
          <input
            {...register('landlineNumber', { validate: validatePhoneNumber })}
            placeholder="0XXXXXXXXX"
            inputMode="numeric"
            maxLength={10}
            className={inputClass}
          />
        </Field>
      </div>

      <div className="bg-[var(--gray-25)] p-4 rounded-2xl border border-[var(--gray-50)] space-y-4">
        <SectionTitle>Bank Account Details</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Name as in Bank A/C" required error={errors.accountHolderName?.message}>
            <input
              {...register('accountHolderName', {
                required: 'Account holder name is required',
                validate: { validateBankName, noEmoji },
              })}
              className={inputClass}
            />
          </Field>
          <Field
            label="Bank A/C Number"
            required
            error={errors.accountNumber?.message}
            hint={checkingAccount ? 'Checking availability...' : 'Numeric digits only (6-20 digits)'}
          >
            <input
              {...register('accountNumber', {
                required: 'Account number is required',
                validate: validateBankAccountNumber,
              })}
              inputMode="numeric"
              className={inputClass}
            />
          </Field>
          <Field label="Bank" required error={errors.bankName?.message}>
            <input
              {...register('bankName', { required: 'Bank is required', validate: { validateBankName, noEmoji } })}
              className={inputClass}
            />
          </Field>
          <Field label="Branch" required error={errors.bankBranch?.message}>
            <input
              {...register('bankBranch', { required: 'Branch is required', validate: { validateBankName, noEmoji } })}
              className={inputClass}
            />
          </Field>
          <Field label="Branch Code" error={errors.bankBranchCode?.message} hint="3-10 alphanumeric characters">
            <input {...register('bankBranchCode', { validate: validateBankBranchCode })} className={inputClass} />
          </Field>
          <Field
            label="Swift Code"
            error={errors.swiftCode?.message}
            hint="8 or 11 characters, e.g. BCEYLKLX"
          >
            <input {...register('swiftCode', { validate: validateSwiftCode })} className={inputClass} />
          </Field>
        </div>
      </div>
    </div>
  );
}
