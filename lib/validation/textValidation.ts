// Shared text-input validation helpers for the Create Employee wizard
// (components/modals/employee-wizard/*). No equivalent existed anywhere else
// in the codebase yet (OCD-413) - if a later batch needs the same behaviour
// in the shared profile wizard steps, this is the place to extend from.

// Covers the emoji ranges users can actually produce via keyboard/emoji
// picker/copy-paste: emoticons, misc symbols & pictographs, supplemental
// symbols, transport/map symbols, dingbats, regional-indicator flag letters,
// the variation-selector/ZWJ modifiers used to combine them, and the
// skin-tone modifiers. Deliberately narrower than "every non-ASCII
// character" so accented/Sinhala/Tamil names etc. are unaffected.
const EMOJI_REGEX =
  /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}\u{1F000}-\u{1F0FF}]/u;

export function containsEmoji(value: string): boolean {
  return EMOJI_REGEX.test(value);
}

/** Strips emoji characters from a string, e.g. for sanitizing pasted text. */
export function stripEmoji(value: string): string {
  return value.replace(new RegExp(EMOJI_REGEX.source, 'gu'), '');
}

/**
 * react-hook-form `validate` rule - use as `validate: noEmoji` (or combine
 * with other validate functions in an object) in a `register(name, { ... })`
 * call. Passes through empty/non-string values so it composes cleanly with a
 * separate `required` rule.
 */
export function noEmoji(value: unknown): string | true {
  if (typeof value !== 'string' || !value) return true;
  return containsEmoji(value) ? 'Emoji characters are not allowed' : true;
}

// Standard email-format check (OCD-415) - deliberately simple (no full RFC
// 5322 support) to match the examples called out in the ticket: requires a
// non-space local part, an "@", a non-space domain, and at least one "." in
// the domain.
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// --- The validators below were added for OCD-416/417/419/420/427/429/433
// (shared profile-wizard steps: components/profile/wizard/Step*.tsx). Kept
// here alongside the emoji/email helpers above so both the Create Employee
// wizard's own step files and the shared statutory/remittance/dependents/
// emergency/welfare steps can reuse the exact same rules. ---

// Sri Lankan NIC: old format (9 digits + V/X, either case) or new 12-digit
// format. Used for the employee's own NIC, Spouse NIC and Nominee NIC.
export const NIC_PATTERN = /^(\d{9}[VvXx]|\d{12})$/;
export const NIC_FORMAT_HINT = 'Accepted formats: 200113700319 (12-digit NIC) or 687981346V (Old NIC format).';

export function validateNic(value: string): string | true {
  if (typeof value !== 'string' || !value) return true;
  return NIC_PATTERN.test(value) ? true : 'Please enter a valid NIC number (e.g. 200113700319 or 687981346V).';
}

// Sri Lankan mobile number: starts with 07, exactly 10 digits.
export const MOBILE_NUMBER_PATTERN = /^07\d{8}$/;
export const MOBILE_NUMBER_HINT = 'Format: 07XXXXXXXX (10 digits)';

export function validateMobileNumber(value: string): string | true {
  if (typeof value !== 'string' || !value) return true;
  return MOBILE_NUMBER_PATTERN.test(value)
    ? true
    : 'Please enter a valid mobile number starting with 07 and containing 10 digits.';
}

// Broader contact-number check for fields that may hold either a mobile or a
// landline number (10 digits, starting with 0, any area code).
export const PHONE_NUMBER_PATTERN = /^0\d{9}$/;

export function validatePhoneNumber(value: string): string | true {
  if (typeof value !== 'string' || !value) return true;
  return PHONE_NUMBER_PATTERN.test(value)
    ? true
    : 'Please enter a valid 10-digit contact number starting with 0.';
}

// Sri Lankan postal code: exactly 5 numeric digits.
export const POSTAL_CODE_PATTERN = /^\d{5}$/;

export function validatePostalCode(value: string): string | true {
  if (typeof value !== 'string' || !value) return true;
  return POSTAL_CODE_PATTERN.test(value) ? true : 'Postal code must contain exactly 5 digits.';
}

// Geographic/administrative "name" fields (Birth Place, City, District,
// Grama Niladhari Division, Electorate) - letters (incl. accented/local
// script), spaces, apostrophes, periods and hyphens only. No digits or other
// special characters.
export const LOCATION_NAME_PATTERN = /^[\p{L}\s'.-]+$/u;

export function validateLocationName(value: string): string | true {
  if (typeof value !== 'string' || !value) return true;
  return LOCATION_NAME_PATTERN.test(value)
    ? true
    : 'Only letters, spaces, apostrophes, periods and hyphens are allowed.';
}

// Free-form address lines - more permissive than LOCATION_NAME_PATTERN since
// house/street numbers are expected, but still blocks emoji and unsupported
// special characters (e.g. "@@@", "test#$%").
export const ADDRESS_LINE_PATTERN = /^[\p{L}\p{N}\s,./#-]+$/u;

export function validateAddressLine(value: string): string | true {
  if (typeof value !== 'string' || !value) return true;
  return ADDRESS_LINE_PATTERN.test(value) ? true : 'Address contains unsupported characters.';
}

// "Name as in Bank A/C" / Bank / Branch - same alphabetic rule as
// LOCATION_NAME_PATTERN, exported separately so intent stays clear at call
// sites even though the underlying rule is identical today.
export const BANK_NAME_PATTERN = LOCATION_NAME_PATTERN;

export function validateBankName(value: string): string | true {
  if (typeof value !== 'string' || !value) return true;
  return BANK_NAME_PATTERN.test(value)
    ? true
    : 'Only letters, spaces, apostrophes, periods and hyphens are allowed.';
}

// Bank account number - numeric only, reasonable length bounds.
export const BANK_ACCOUNT_NUMBER_PATTERN = /^\d{6,20}$/;

export function validateBankAccountNumber(value: string): string | true {
  if (typeof value !== 'string' || !value) return true;
  return BANK_ACCOUNT_NUMBER_PATTERN.test(value)
    ? true
    : 'Bank account number must contain 6-20 numeric digits only.';
}

// Branch code - alphanumeric, short.
export const BANK_BRANCH_CODE_PATTERN = /^[A-Za-z0-9]{3,10}$/;

export function validateBankBranchCode(value: string): string | true {
  if (typeof value !== 'string' || !value) return true;
  return BANK_BRANCH_CODE_PATTERN.test(value)
    ? true
    : 'Branch code must be 3-10 alphanumeric characters.';
}

// SWIFT/BIC code - 8 or 11 characters: 4-letter bank code, 2-letter country
// code, 2-character location code, optional 3-character branch code.
export const SWIFT_CODE_PATTERN = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;

export function validateSwiftCode(value: string): string | true {
  if (typeof value !== 'string' || !value) return true;
  return SWIFT_CODE_PATTERN.test(value.toUpperCase())
    ? true
    : 'Enter a valid SWIFT/BIC code (8 or 11 characters, e.g. BCEYLKLX).';
}

// LinkedIn profile URL - must be a linkedin.com/in/... profile link.
export const LINKEDIN_URL_PATTERN = /^https?:\/\/([a-z]{2,3}\.)?linkedin\.com\/in\/[A-Z0-9\-_%]+\/?$/i;

export function validateLinkedInUrl(value: string): string | true {
  if (typeof value !== 'string' || !value) return true;
  return LINKEDIN_URL_PATTERN.test(value)
    ? true
    : 'Enter a valid LinkedIn profile URL (e.g. https://www.linkedin.com/in/john-doe).';
}

/**
 * react-hook-form `validate` rule blocking any date strictly after today
 * (OCD-417) - used for Date of Birth, Spouse/Child Date of Birth and
 * Marriage/Wedding Anniversary Date. Passes through empty values so it
 * composes with a separate `required` rule.
 */
export function noFutureDate(value: string): string | true {
  if (typeof value !== 'string' || !value) return true;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return true;
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  return date.getTime() > endOfToday.getTime() ? 'Date cannot be a future date. Please enter a valid date.' : true;
}
