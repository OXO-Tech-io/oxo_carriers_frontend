import { useQuery } from '@tanstack/react-query';
import { bankAccountRulesService } from '@/lib/services/bankAccountRules.service';
import { setBankAccountRulesConfig } from '@/lib/validation/bankAccountRules';

export const bankAccountRulesQueryKey = ['bank-account-rules'] as const;

/**
 * Loads the bank account rules and hands them to the synchronous validators in
 * lib/validation/bankAccountRules.ts. The rules change rarely, so they're kept
 * for the whole session rather than refetched on every form mount.
 */
export const useBankAccountRulesQuery = () =>
  useQuery({
    queryKey: bankAccountRulesQueryKey,
    queryFn: async () => {
      const config = await bankAccountRulesService.getRules();
      setBankAccountRulesConfig(config);
      return config;
    },
    staleTime: 30 * 60 * 1000,
  });
