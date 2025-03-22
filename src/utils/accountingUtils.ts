import { AccountType, AccountEntry, Report } from '../types';
import * as XLSX from 'xlsx';
import axios from 'axios';

let categoryOptions: any[] = [];

export async function loadCategoryOptions(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    try {
      console.log("🟢 Received category file:", file.name);

      const reader = new FileReader();
      reader.onload = (e) => {
        if (!e.target?.result) {
          console.error("❌ File read error: No result");
          reject(new Error("File read error: No result"));
          return;
        }

        const data = new Uint8Array(e.target.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];

        categoryOptions = XLSX.utils.sheet_to_json(sheet).map((row: any) => ({
          accountType: row["account_type"] || "Uncategorized",
          primary: row["primary_classification"] || "Uncategorized",
          secondary: row["secondary_classification"] || "Uncategorized",
          tertiary: row["tertiary_classification"] || "Uncategorized"
        }));
        
        if (categoryOptions.length === 0) {
          console.error("⚠️ No category options found!");
          reject(new Error("No category options found in the file"));
        } else {
          console.log(`✅ Loaded ${categoryOptions.length} category entries`);
          resolve(categoryOptions);
        }
      };

      reader.onerror = (error) => {
        reject(error);
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error("❌ Failed to load category options:", error);
      reject(error);
    }
  });
}

export async function categorizeAccount(accountName: string): Promise<any> {
  if (!accountName || typeof accountName !== 'string' || accountName.trim() === '') {
    console.warn(`⚠️ Skipping empty account name.`);
    return createUncategorized();
  }

  // Skip categorization for total rows
  if (accountName.toLowerCase() === 'total') {
    return createUncategorized();
  }

  try {
    if (categoryOptions.length === 0) {
      console.warn("⚠️ No category options available");
      return createUncategorized();
    }

    const response = await axios.post('http://localhost:5000/categorize', {
      account_name: accountName,
      categories: categoryOptions
    }, {
      timeout: 5000, // 5 second timeout
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.data) {
      console.warn(`⚠️ No categorization data received for "${accountName}"`);
      return createUncategorized();
    }

    return response.data;
  } catch (error) {
    console.error(`❌ Error categorizing account "${accountName}":`, error);
    return createUncategorized();
  }
}

function createUncategorized() {
  return {
    accountType: 'Uncategorized',
    primary: 'Uncategorized',
    secondary: 'Uncategorized',
    tertiary: 'Uncategorized'
  };
}

export function processTrialBalance(entries: AccountEntry[]): Promise<Report> {
  return new Promise(async (resolve) => {
    const categorizedEntries = await Promise.all(entries.map(async (entry) => {
      const category = await categorizeAccount(entry.account);
      return {
        ...entry,
        accountType: category.accountType,
        primaryClassification: category.primary,
        secondaryClassification: category.secondary,
        tertiaryClassification: category.tertiary
      };
    }));

    console.log("📝 Processed Trial Balance:", categorizedEntries);

    const totalsByType: Record<AccountType, { debit: number; credit: number }> = {
      Asset: { debit: 0, credit: 0 },
      Liability: { debit: 0, credit: 0 },
      Equity: { debit: 0, credit: 0 },
      "Revenue/Income": { debit: 0, credit: 0 },
      "Cost/Expense": { debit: 0, credit: 0 },
      Uncategorized: { debit: 0, credit: 0 }
    };

    categorizedEntries.forEach((entry) => {
      const key = entry.accountType as keyof typeof totalsByType;
      if (key in totalsByType) {
        totalsByType[key].debit += entry.debit;
        totalsByType[key].credit += entry.credit;
      }
    });

    resolve({
      entries: categorizedEntries,
      totalsByType
    });
  });
}

export function exportToExcel(data: any[], fileName: string) {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Trial Balance");
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}