import { useState, useEffect } from "react";
import { Report, AccountEntry } from "../types";
import { FileDown } from "lucide-react";
import { exportToExcel } from "../utils/accountingUtils";

const typeColors: Record<string, string> = {
  Asset: "bg-emerald-900 text-white",
  Liability: "bg-yellow-600 text-white",
  Equity: "bg-blue-800 text-white",
  "Revenue/Income": "bg-purple-800 text-white",
  "Cost/Expense": "bg-red-800 text-white",
  Uncategorized: "bg-gray-800 text-white",
};

export function ReportSummary({ report, categories }: { report: Report; categories: any }) {
  const [editedEntries, setEditedEntries] = useState(report.entries);

  const handleCategoryChange = (index: number, field: keyof AccountEntry, value: string) => {
    const updatedEntries = [...editedEntries];
    updatedEntries[index] = { 
      ...updatedEntries[index], 
      [field]: value,
      ...(field === 'accountType' && { primaryClassification: '', secondaryClassification: '', tertiaryClassification: '' }),
      ...(field === 'primaryClassification' && { secondaryClassification: '', tertiaryClassification: '' }),
      ...(field === 'secondaryClassification' && { tertiaryClassification: '' }),
    };
    setEditedEntries(updatedEntries);
  };

  const [totalsByType, setTotalsByType] = useState({
    Asset: { debit: 0, credit: 0 },
    Liability: { debit: 0, credit: 0 },
    Equity: { debit: 0, credit: 0 },
    "Revenue/Income": { debit: 0, credit: 0 },
    "Cost/Expense": { debit: 0, credit: 0 },
    Uncategorized: { debit: 0, credit: 0 },
  });

  useEffect(() => {
    const newTotals = {
      Asset: { debit: 0, credit: 0 },
      Liability: { debit: 0, credit: 0 },
      Equity: { debit: 0, credit: 0 },
      "Revenue/Income": { debit: 0, credit: 0 },
      "Cost/Expense": { debit: 0, credit: 0 },
      Uncategorized: { debit: 0, credit: 0 },
    };
  
    editedEntries.forEach((entry) => {
      let type = entry.accountType || "Uncategorized";
  
      if (type.toLowerCase().includes("revenue") || type.toLowerCase().includes("income")) {
        type = "Revenue/Income";
      } else if (type.toLowerCase().includes("cost") || type.toLowerCase().includes("expense")) {
        type = "Cost/Expense";
      } else if (!newTotals[type]) {
        type = "Uncategorized";
      }
  
      newTotals[type].debit += entry.debit;
      newTotals[type].credit += entry.credit;
    });
  
    setTotalsByType(newTotals);
  }, [editedEntries]);
  

  return (
    <div>
      <div className='grid grid-cols-3 gap-4 mb-6'>
        {Object.entries(totalsByType).map(([type, totals]) => (
          <div key={type} className={`p-4 rounded-lg ${typeColors[type]}`}>
            <div className='flex items-center justify-between'>
              <span className='font-medium'>{type}</span>
            </div>
            <div className='mt-2 text-lg font-bold'>
              ${totals.debit.toLocaleString()} / ${totals.credit.toLocaleString()}
            </div>
              <div className='mt-2 text-xl font-bold'>
                Total: ${Math.abs((totals.debit ?? 0) - (totals.credit ?? 0)) < 0.01 
                            ? 0 
                            : ((totals.debit ?? 0) - (totals.credit ?? 0))
                          .toLocaleString()}
              </div>
          </div>
        ))}
      </div>

      <div className="w-full max-w-6xl p-6 bg-white rounded-lg shadow-md overflow-visible">
        <h2 className="text-xl font-semibold mb-4">Report Summary</h2>
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
              {editedEntries
                .filter((entry) => entry.account.toLowerCase() !== "total")
                .map((entry, index) => (
                  <tr key={index} className="border-t">
                    <td className="px-4 py-2">{entry.account}</td>
                    <td className="px-4 py-2 text-right">
                      ${entry.debit.toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-right">
                      ${entry.credit.toLocaleString()}
                    </td>
                    <td className="px-4 py-2">
                      <select
                        value={entry.accountType}
                        onChange={(e) => handleCategoryChange(index, "accountType", e.target.value)}
                        className="border rounded px-2 py-1 w-full"
                      >
                        <option value="">Uncategorized</option>
                        {Object.keys(categories).map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <select
                        value={entry.primaryClassification}
                        onChange={(e) => handleCategoryChange(index, "primaryClassification", e.target.value)}
                        className="border rounded px-2 py-1 w-full"
                        disabled={!entry.accountType}
                      >
                        <option value="">Uncategorized</option>
                        {entry.accountType &&
                          Object.keys(categories[entry.accountType] || {}).map((primary) => (
                            <option key={primary} value={primary}>
                              {primary}
                            </option>
                          ))}
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <select
                        value={entry.secondaryClassification}
                        onChange={(e) => handleCategoryChange(index, "secondaryClassification", e.target.value)}
                        className="border rounded px-2 py-1 w-full"
                        disabled={!entry.primaryClassification}
                      >
                        <option value="">Uncategorized</option>
                        {entry.accountType &&
                          entry.primaryClassification &&
                          Object.keys(categories[entry.accountType]?.[entry.primaryClassification] || {}).map((secondary) => (
                            <option key={secondary} value={secondary}>
                              {secondary}
                            </option>
                          ))}
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <select
                        value={entry.tertiaryClassification}
                        onChange={(e) => handleCategoryChange(index, "tertiaryClassification", e.target.value)}
                        className="border rounded px-2 py-1 w-full"
                        disabled={!entry.secondaryClassification}
                      >
                        <option value="">Uncategorized</option>
                        {entry.accountType &&
                          entry.primaryClassification &&
                          entry.secondaryClassification &&
                          categories[entry.accountType]?.[entry.primaryClassification]?.[
                            entry.secondaryClassification
                          ]?.map((tertiary: string) => (
                            <option key={tertiary} value={tertiary}>
                              {tertiary}
                            </option>
                          ))}
                      </select>
                    </td>
                  </tr>
                ))}

              {/* Dynamically Calculated Total Row */}
              <tr className="font-bold bg-gray-100 border-t">
                <td className="px-4 py-2">Total</td>
                <td className="px-4 py-2 text-right">
                  $
                  {editedEntries
                    .filter((e) => e.account.toLowerCase() !== "total")
                    .reduce((sum, entry) => sum + entry.debit, 0)
                    .toLocaleString()}
                </td>
                <td className="px-4 py-2 text-right">
                  $
                  {editedEntries
                    .filter((e) => e.account.toLowerCase() !== "total")
                    .reduce((sum, entry) => sum + entry.credit, 0)
                    .toLocaleString()}
                </td>
                <td className="px-4 py-2 text-center" colSpan={4}>
                  Total of all Accounts
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <button
          onClick={() => exportToExcel(editedEntries, "Processed_Trial_Balance")}
          className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center gap-2 hover:bg-blue-700 transition mt-4"
        >
          <FileDown className="w-4 h-4" /> Export to Excel
        </button>
      </div>
    </div>
  );
}
