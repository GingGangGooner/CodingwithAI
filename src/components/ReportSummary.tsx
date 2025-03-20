import React from 'react';
import { Report, AccountType } from '../types';
import { PieChart, DollarSign, BarChart2 } from 'lucide-react';

interface ReportSummaryProps {
  report: Report;
}

const typeColors: Record<AccountType, string> = {
  Asset: 'bg-emerald-100 text-emerald-800',
  Equity: 'bg-blue-100 text-blue-800',
  Revenue: 'bg-purple-100 text-purple-800',
  Cost: 'bg-red-100 text-red-800'
};

export function ReportSummary({ report }: ReportSummaryProps) {
  const total = Object.values(report.totalsByType).reduce((sum, val) => sum + val, 0);

  return (
    <div className="w-full max-w-2xl p-6 bg-white rounded-lg shadow-md">
      <div className="flex items-center gap-2 mb-6">
        <BarChart2 className="w-5 h-5 text-blue-600" />
        <h2 className="text-xl font-semibold">Report Summary</h2>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {Object.entries(report.totalsByType).map(([type, amount]) => (
          <div
            key={type}
            className={`p-4 rounded-lg ${typeColors[type as AccountType]}`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{type}</span>
              <DollarSign className="w-4 h-4" />
            </div>
            <div className="mt-2 text-xl font-bold">
              ${amount.toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-4">Detailed Entries</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left">Account</th>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {report.entries.map((entry, index) => (
                <tr key={index} className="border-t">
                  <td className="px-4 py-2">{entry.name}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded-full text-sm ${typeColors[entry.type]}`}>
                      {entry.type}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    ${entry.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}