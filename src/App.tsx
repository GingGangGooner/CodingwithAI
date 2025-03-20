import React, { useState } from 'react';
import { AccountEntry, Report } from './types';
import { ReportInput } from './components/ReportInput';
import { ReportSummary } from './components/ReportSummary';
import { processReport } from './utils/accountingUtils';
import { FileSpreadsheet } from 'lucide-react';

function App() {
  const [report, setReport] = useState<Report | null>(null);

  const handleReportSubmit = (entries: AccountEntry[]) => {
    const processedReport = processReport(entries);
    setReport(processedReport);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <FileSpreadsheet className="w-10 h-10 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Accounting Report Standardizer
            </h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Convert your accounting reports into a standardized format. Simply paste your
            data in CSV format (Account Name, Amount) and we'll categorize it into
            Assets, Equity, Revenue, and Costs.
          </p>
        </div>

        <div className="flex flex-col items-center gap-8">
          <ReportInput onSubmit={handleReportSubmit} />
          {report && <ReportSummary report={report} />}
        </div>
      </div>
    </div>
  );
}

export default App;