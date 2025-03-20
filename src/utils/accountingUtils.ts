import { AccountType, AccountEntry, Report } from '../types';

export function categorizeAccount(accountName: string, amount: number): AccountType {
  const lowerName = accountName.toLowerCase();
  
  if (lowerName.includes('cash') || 
      lowerName.includes('receivable') || 
      lowerName.includes('inventory')) {
    return 'Asset';
  }
  
  if (lowerName.includes('revenue') || 
      lowerName.includes('income') || 
      lowerName.includes('sales')) {
    return 'Revenue';
  }
  
  if (lowerName.includes('expense') || 
      lowerName.includes('cost') || 
      lowerName.includes('salary')) {
    return 'Cost';
  }
  
  if (lowerName.includes('capital') || 
      lowerName.includes('equity') || 
      lowerName.includes('retained')) {
    return 'Equity';
  }
  
  // Default to Asset if no match found
  return 'Asset';
}

export function processReport(entries: AccountEntry[]): Report {
  const totalsByType: Record<AccountType, number> = {
    Asset: 0,
    Equity: 0,
    Revenue: 0,
    Cost: 0
  };

  entries.forEach(entry => {
    totalsByType[entry.type] += entry.amount;
  });

  return {
    entries,
    totalsByType
  };
}