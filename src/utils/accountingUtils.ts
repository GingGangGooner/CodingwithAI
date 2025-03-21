import { AccountType, AccountEntry, Report } from '../types';
import * as XLSX from 'xlsx';

let categoryOptions: any[] = [];

// **1️⃣ Load Available Categories from "Automa8e Chart of Accounts.xlsx"**
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

        const categoryOptions = XLSX.utils.sheet_to_json(sheet);

        if (categoryOptions.length === 0) {
          console.error("⚠️ No category options found!");
          reject(new Error("No category options found in the file"));
        } else {
          console.log(`✅ Loaded ${categoryOptions.length} category entries`);
          resolve(categoryOptions); // Resolve the promise with the loaded categories
        }
      };

      reader.onerror = (error) => {
        reject(error); // Reject the promise if there's a file reading error
      };

      reader.readAsArrayBuffer(file); // Trigger the file reader to start reading
    } catch (error) {
      console.error("❌ Failed to load category options:", error);
      reject(error); // Reject the promise if there's a general error
    }
  });
}


// **2️⃣ Categorize Accounts Without Chart of Accounts**
export function categorizeAccount(accountName: string): any {
  if (!accountName || typeof accountName !== 'string' || accountName.trim() === '') {
    console.warn(`⚠️ Skipping empty account name.`);
    return createUncategorized();
  }

  console.warn(`⚠️ No predefined categories found for "${accountName}"`);
  return createUncategorized();
}

// **3️⃣ Helper Function to Return "Uncategorized" Entries**
function createUncategorized() {
  return {
    accountType: 'Uncategorized',
    primary: 'Uncategorized',
    secondary: 'Uncategorized',
    tertiary: 'Uncategorized'
  };
}

// **4️⃣ Process Trial Balance Data**
export function processTrialBalance(entries: AccountEntry[]): Report {
  const categorizedEntries = entries.map((entry) => {
    const category = categorizeAccount(entry.name);
    return {
      ...entry,
      accountType: category.accountType,
      primaryClassification: category.primary,
      secondaryClassification: category.secondary,
      tertiaryClassification: category.tertiary
    };
  });

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

  return {
    entries: categorizedEntries,
    totalsByType
  };
}

// **5️⃣ Export Processed Trial Balance to Excel**
export function exportToExcel(data: any[], fileName: string) {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Trial Balance");
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}