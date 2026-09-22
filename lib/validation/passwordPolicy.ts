// OCD-447: Strong password policy for password reset / set-password forms.
// Mirrors `src/utils/passwordPolicy.ts` in the backend rule-for-rule so the
// real-time checklist shown here always agrees with what the server will
// ultimately accept - this file is a UX convenience, the backend module is
// the actual security control (never trust client-side validation alone).
//
// Kept alongside textValidation.ts rather than merged into it - that file
// covers unrelated text-input rules (emoji stripping, NIC/email formats)
// for the employee wizard forms.

export interface PasswordRuleResult {
  id: string;
  label: string;
  passed: boolean;
}

export interface PasswordPolicyResult {
  isValid: boolean;
  rules: PasswordRuleResult[];
  failedMessages: string[];
}

export const PASSWORD_MIN_LENGTH = 8;

// Small denylist of common/easily-guessable passwords called out in OCD-447.
export const COMMON_PASSWORDS: ReadonlySet<string> = new Set(
  [
    'password',
    'password1',
    'password123',
    '12345678',
    '123456789',
    '1234567890',
    'qwerty123',
    'qwertyuiop',
    'letmein123',
    'admin1234',
    'welcome123',
    'iloveyou1',
    'abc123456',
    '11111111',
    '00000000',
    'changeme1',
  ].map((p) => p.toLowerCase())
);

const SPECIAL_CHAR_PATTERN = /[!@#$%^&*(),.?":{}|<>_\-+=[\]/\\~`';]/;

export function evaluatePasswordPolicy(password: string): PasswordPolicyResult {
  const value = password ?? '';

  const rules: PasswordRuleResult[] = [
    {
      id: 'minLength',
      label: `At least ${PASSWORD_MIN_LENGTH} characters`,
      passed: value.length >= PASSWORD_MIN_LENGTH,
    },
    {
      id: 'uppercase',
      label: 'One uppercase letter (A-Z)',
      passed: /[A-Z]/.test(value),
    },
    {
      id: 'lowercase',
      label: 'One lowercase letter (a-z)',
      passed: /[a-z]/.test(value),
    },
    {
      id: 'digit',
      label: 'One number (0-9)',
      passed: /[0-9]/.test(value),
    },
    {
      id: 'specialChar',
      label: 'One special character (@ # $ % & * !)',
      passed: SPECIAL_CHAR_PATTERN.test(value),
    },
    {
      id: 'notCommon',
      label: 'Not a common or easily guessable password',
      passed: value.length > 0 && !COMMON_PASSWORDS.has(value.toLowerCase()),
    },
  ];

  return {
    isValid: rules.every((r) => r.passed),
    rules,
    failedMessages: rules.filter((r) => !r.passed).map((r) => r.label),
  };
}

export function isPasswordPolicyCompliant(password: string): boolean {
  return evaluatePasswordPolicy(password).isValid;
}

export type PasswordStrength = 'weak' | 'medium' | 'strong';

/**
 * Optional strength meter (OCD-447 "Optional Enhancement"). Weak until the
 * mandatory policy is fully satisfied; then Medium/Strong based on length,
 * since every rule already being true means the meter's only remaining job
 * is to reward extra length/entropy.
 */
export function getPasswordStrength(password: string): PasswordStrength {
  const { isValid } = evaluatePasswordPolicy(password);
  if (!isValid) return 'weak';
  return password.length >= 12 ? 'strong' : 'medium';
}
