import { useState, useEffect } from 'react';
import { AccountEntry, Report } from './types';
import { ReportInput } from './components/ReportInput';
import { ReportSummary } from './components/ReportSummary';
import { processTrialBalance, loadCategoryOptions } from './utils/accountingUtils';
import { FileSpreadsheet } from 'lucide-react';

function App() {
  const [report, setReport] = useState<Report | null>(null);
  const [categories, setCategories] = useState<any[]>([]); // Added state for categories

  useEffect(() => {
    console.log("🟢 App is running. Please upload the required files.");
  }, []);

  const handleReportSubmit = (entries: AccountEntry[]) => {
    const processedReport = processTrialBalance(entries);
    setReport(processedReport);
  };

  const handleCategoryFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.length) {
      const file = event.target.files[0];
      console.log("📂 Uploading Category Options file:", file.name);

      // Load the categories and update the state after they are loaded
      loadCategoryOptions(file)
        .then((loadedCategories) => {
          setCategories(loadedCategories); // Update categories after loading
        })
        .catch((error) => {
          console.error('❌ Error loading category options:', error);
        });
    }
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
            Convert your accounting reports into a standardized format. Simply upload your
            trial balance, and we'll categorize it into Account Type, Primary, Secondary,
            and Tertiary Classifications.
          </p>
        </div>

        <div className="flex flex-col items-center gap-8">
          {/* Upload Category Options File */}
          <div className="w-full max-w-md text-center">
            <label className="block text-sm font-medium text-gray-700">Upload Category Options</label>
            <input
              type="file"
              accept=".xlsx"
              onChange={handleCategoryFileUpload}
              className="mt-2 p-2 border rounded-lg w-full"
            />
          </div>

          <ReportInput onSubmit={handleReportSubmit} />
          {report && <ReportSummary report={report} categories={categories} />} {/* Pass categories to ReportSummary */}
        </div>
      </div>
    </div>
  );
}

export default App;
