export type AccountType = 'Equity' | 'Revenue' | 'Cost' | 'Asset';

export interface AccountEntry {
  name: string;
  amount: number;
  type: AccountType;
  originalCategory?: string;
}

export interface Report {
  entries: AccountEntry[];
  totalsByType: Record<AccountType, number>;
}