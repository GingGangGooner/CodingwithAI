import { useState, useEffect } from "react";
import { Report, AccountEntry } from "../types";
import { FileDown } from "lucide-react";
import { exportToExcel } from "../utils/accountingUtils";

// Define a fixed type for the totals, ensuring all expected categories are included
interface TotalsByType {
  Asset: { debit: number; credit: number };
  Liability: { debit: number; credit: number };
  Equity: { debit: number; credit: number };
  "Revenue/Income": { debit: number; credit: number };
  "Cost/Expense": { debit: number; credit: number };
  Uncategorized: { debit: number; credit: number };
}

const typeColors: Record<string, string> = {
  Asset: "bg-emerald-900 text-white",
  Liability: "bg-yellow-600 text-white",
  Equity: "bg-blue-800 text-white",
  "Revenue/Income": "bg-purple-800 text-white",
  "Cost/Expense": "bg-red-800 text-white",
  Uncategorized: "bg-gray-800 text-white",
};

export function ReportSummary({ report, categories }: { report: Report; categories: any[] }) {
  const [editedEntries, setEditedEntries] = useState(report.entries);
  
  // Initialize with default values for each account type
  const [totalsByType, setTotalsByType] = useState<TotalsByType>({
    Asset: { debit: 0, credit: 0 },
    Liability: { debit: 0, credit: 0 },
    Equity: { debit: 0, credit: 0 },
    "Revenue/Income": { debit: 0, credit: 0 },
    "Cost/Expense": { debit: 0, credit: 0 },
    Uncategorized: { debit: 0, credit: 0 },
  });

  // 🛠 Handle dropdown change
  const handleCategoryChange = (index: number, field: keyof AccountEntry, value: string) => {
    const updatedEntries = [...editedEntries];
    updatedEntries[index] = { ...updatedEntries[index], [field]: value };
    setEditedEntries(updatedEntries);
    updateTotals(updatedEntries);
  };

  // 🛠 Update totals dynamically when dropdowns are changed
  const updateTotals = (entries: AccountEntry[]) => {
    const newTotals: TotalsByType = {
      Asset: { debit: 0, credit: 0 },
      Liability: { debit: 0, credit: 0 },
      Equity: { debit: 0, credit: 0 },
      "Revenue/Income": { debit: 0, credit: 0 },
      "Cost/Expense": { debit: 0, credit: 0 },
      Uncategorized: { debit: 0, credit: 0 },
    };

    entries.forEach((entry) => {
      if (entry.name.toLowerCase() !== "total") {
        const key = entry.accountType as keyof TotalsByType;
        newTotals[key].debit += entry.debit;
        newTotals[key].credit += entry.credit;
      }
    });

    setTotalsByType(newTotals);
  };

  useEffect(() => {
    updateTotals(editedEntries);
  }, [editedEntries]);

  return (
    <div className="w-full max-w-6xl p-6 bg-white rounded-lg shadow-md overflow-visible">
      <h2 className="text-xl font-semibold mb-4">Report Summary</h2>

      {/* 🔢 Categorized Totals */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {Object.entries(totalsByType).map(([type, totals]) => {
          const totalSum = totals.debit - totals.credit;
          return (
            <div key={type} className={`p-4 rounded-lg ${typeColors[type]}`}>
              <div className="flex items-center justify-between">
                <span className="font-medium">{type}</span>
              </div>
              <div className="mt-2 text-lg font-bold">
                $ {(totals.debit ?? 0).toLocaleString()} / $ {(totals.credit ?? 0).toLocaleString()}
              </div>
              <div className="mt-2 text-xl font-bold">
                Total: ${((totals.debit ?? 0) - (totals.credit ?? 0)).toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>

      {/* 🔹 Table */}
      <div className="w-full">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-50 border">
              <th className="px-4 py-2 text-left">Account</th>
              <th className="px-4 py-2 text-right">Debit</th>
              <th className="px-4 py-2 text-right">Credit</th>
              <th className="px-4 py-2 text-left">Type</th>
              <th className="px-4 py-2 text-left">Primary</th>
              <th className="px-4 py-2 text-left">Secondary</th>
              <th className="px-4 py-2 text-left">Tertiary</th>
            </tr>
          </thead>
          <tbody>
            {editedEntries.map((entry, index) => {
              const isTotalRow = entry.name.toLowerCase() === "total";
              return (
                <tr key={index} className="border-t">
                  <td className="px-4 py-2">{entry.name}</td>
                  <td className="px-4 py-2 text-right">${entry.debit.toLocaleString()}</td>
                  <td className="px-4 py-2 text-right">${entry.credit.toLocaleString()}</td>

                  {/* If this is the "Total" row, show plain text instead of dropdowns */}
                  <td className="px-4 py-2">
                    {isTotalRow ? (
                      <span className="text-gray-500">-</span>
                    ) : (
                      <select
                        value={entry.accountType}
                        onChange={(e) => handleCategoryChange(index, "accountType", e.target.value)}
                        className="border rounded px-2 py-1 w-full"
                      >
                        <option value="Asset">Asset</option>
                        <option value="Liability">Liability</option>
                        <option value="Equity">Equity</option>
                        <option value="Revenue/Income">Revenue/Income</option>
                        <option value="Cost/Expense">Cost/Expense</option>
                        <option value="Uncategorized">Uncategorized</option>
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {isTotalRow ? (
                      <span className="text-gray-500">-</span>
                    ) : (
                      <select
                        value={entry.primaryClassification}
                        onChange={(e) => handleCategoryChange(index, "primaryClassification", e.target.value)}
                        className="border rounded px-2 py-1 w-full"
                      >
                        <option value="Uncategorized">Uncategorized</option>
                        {categories.map((c, i) => (
                          <option key={i} value={c.primary}>{c.primary}</option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {isTotalRow ? (
                      <span className="text-gray-500">-</span>
                    ) : (
                      <select
                        value={entry.secondaryClassification}
                        onChange={(e) => handleCategoryChange(index, "secondaryClassification", e.target.value)}
                        className="border rounded px-2 py-1 w-full"
                      >
                        <option value="Uncategorized">Uncategorized</option>
                        {categories.map((c, i) => (
                          <option key={i} value={c.secondary}>{c.secondary}</option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {isTotalRow ? (
                      <span className="text-gray-500">-</span>
                    ) : (
                      <select
                        value={entry.tertiaryClassification}
                        onChange={(e) => handleCategoryChange(index, "tertiaryClassification", e.target.value)}
                        className="border rounded px-2 py-1 w-full"
                      >
                        <option value="Uncategorized">Uncategorized</option>
                        {categories.map((c, i) => (
                          <option key={i} value={c.tertiary}>{c.tertiary}</option>
                        ))}
                      </select>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 📥 Export Button */}
      <button
        onClick={() => exportToExcel(editedEntries, "Processed_Trial_Balance")}
        className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center gap-2 hover:bg-blue-700 transition mt-4"
      >
        <FileDown className="w-4 h-4" /> Export to Excel
      </button>
    </div>
  );
}
