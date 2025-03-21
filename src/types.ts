// types.ts - Updated Types for Categorization
// types.ts
export type AccountType = 
  | 'Asset' 
  | 'Liability' 
  | 'Equity' 
  | 'Revenue/Income' 
  | 'Cost/Expense' 
  | 'Uncategorized';

export interface AccountEntry {
  account: string;
  debit: number;
  credit: number;
  accountType: AccountType;
  primaryClassification: string;
  secondaryClassification: string;
  tertiaryClassification: string;
}

export interface Report {
  entries: AccountEntry[];
  totalsByType: Record<AccountType, { debit: number; credit: number }>;
}
