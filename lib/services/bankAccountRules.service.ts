import api from '@/lib/api';
import type { ApiResponse } from '@/types/api';
import type { BankAccountRulesConfig } from '@/lib/validation/bankAccountRules';

export const bankAccountRulesService = {
  getRules: async (): Promise<BankAccountRulesConfig> => {
    const res = await api.get<ApiResponse<BankAccountRulesConfig>>('/bank-account-rules');
    return res.data.data;
  },
};
