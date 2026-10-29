// OCD-598: per-bank account number rules. The rules and the fallback digit
// range live in the backend's tbl_bank_account_rules / tbl_bank_account_settings
// tables and are fetched from GET /bank-account-rules by useBankAccountRulesQuery,
// which stores them here so the synchronous form validators below can read them.
// Any component that validates a bank account number must call that hook so the
// rules are loaded.
//
// The bank is captured as free text, so a rule is resolved by matching the
// entered name against known aliases. Unrecognised banks fall back to the
// generic numeric digit range. No supported bank uses alphanumeric account
// numbers, so every rule is digits-only.

export interface BankAccountRule {
  bank: string;
  aliases: string[];
  lengths: number[];
  /** Optional prefix constraint keyed by length (e.g. Standard Chartered: { "11": ["18", "01"] }). */
  prefixes?: Record<string, string[]> | null;
}

export interface BankAccountRulesConfig {
  rules: BankAccountRule[];
  fallbackAccountNumberMin: number;
  fallbackAccountNumberMax: number;
}

/** Dropdown choice for banks without a rule; uses the generic numeric rule. */
export const OTHER_BANK_OPTION = 'Other';

const normalise = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]/g, '');

let config: BankAccountRulesConfig | null = null;

/** Replaces the loaded rules. Aliases are normalised so table edits like "BOC" still match. */
export function setBankAccountRulesConfig(next: BankAccountRulesConfig): void {
  config = {
    ...next,
    rules: next.rules.map((rule) => ({ ...rule, aliases: rule.aliases.map(normalise).filter(Boolean) })),
  };
}

/** The loaded rules, or null while GET /bank-account-rules hasn't resolved yet. */
export function getBankAccountRulesConfig(): BankAccountRulesConfig | null {
  return config;
}

/**
 * Resolves the rule for a free-text bank name. Short abbreviations (<= 5
 * chars) must match the whole name; longer aliases may appear within it. The
 * longest matching alias wins so "Commercial Bank of Ceylon" is not mistaken
 * for "Bank of Ceylon".
 */
export function getBankAccountRule(bankName: string | null | undefined): BankAccountRule | null {
  const name = normalise(bankName ?? '');
  if (!name || !config) return null;
  let best: { rule: BankAccountRule; length: number } | null = null;
  for (const rule of config.rules) {
    for (const alias of rule.aliases) {
      const matches = alias.length <= 5 ? name === alias : name.includes(alias);
      if (matches && (!best || alias.length > best.length)) best = { rule, length: alias.length };
    }
  }
  return best?.rule ?? null;
}

export function describeBankAccountRule(bankName: string | null | undefined): string {
  const rule = getBankAccountRule(bankName);
  if (!rule) {
    if (!config) return 'Numeric digits only';
    return `Numeric digits only (${config.fallbackAccountNumberMin}-${config.fallbackAccountNumberMax} digits)`;
  }
  const lengths = rule.lengths.join(' or ');
  return `${rule.bank}: ${lengths} digits, numeric only`;
}

/**
 * Returns true when valid (or empty), otherwise a user-facing error message.
 * Until the rules have loaded only the digits-only check applies - the backend
 * re-validates against the same rules on submit.
 */
export function validateAccountNumberForBank(
  accountNumber: string | null | undefined,
  bankName: string | null | undefined,
): string | true {
  const value = (accountNumber ?? '').trim();
  if (!value) return true;
  if (!/^\d+$/.test(value)) return 'Bank account number must contain numeric digits only (no spaces, hyphens or letters).';
  if (!config) return true;

  const rule = getBankAccountRule(bankName);
  if (!rule) {
    const { fallbackAccountNumberMin: min, fallbackAccountNumberMax: max } = config;
    return value.length >= min && value.length <= max
      ? true
      : `Bank account number must contain ${min}-${max} numeric digits only.`;
  }

  if (!rule.lengths.includes(value.length)) {
    return `${rule.bank} account numbers must be ${rule.lengths.join(' or ')} digits long.`;
  }
  const allowed = rule.prefixes?.[String(value.length)];
  if (allowed && !allowed.some((p) => value.startsWith(p))) {
    return `${rule.bank} ${value.length}-digit account numbers must start with ${allowed.join(' or ')}.`;
  }
  return true;
}
