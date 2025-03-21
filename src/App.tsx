import { useState, useEffect } from 'react';
import { AccountEntry, Report } from './types';
import { ReportInput } from './components/ReportInput';
import { ReportSummary } from './components/ReportSummary';
import { processTrialBalance, loadCategoryOptions } from './utils/accountingUtils';
import { FileSpreadsheet } from 'lucide-react';

function App() {
  const [report, setReport] = useState<Report | null>(null);
  const [categories, setCategories] = useState<any>({}); // switched to object for category mapping

  useEffect(() => {
    console.log("🟢 App is running. Please upload the required files.");

    // Load persisted categories from localStorage
    const stored = localStorage.getItem("categoryMappings");
    if (stored) {
      try {
        setCategories(JSON.parse(stored));
      } catch (err) {
        console.error("⚠️ Failed to parse stored categories");
      }
    }
  }, []);

  const handleReportSubmit = (entries: AccountEntry[]) => {
    const processedReport = processTrialBalance(entries);
    setReport(processedReport);
  };

  const handleCategoryFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) return;

    const file = event.target.files[0];
    console.log("📂 Uploading Category Options file:", file.name);

    try {
      const loadedCategories = await loadCategoryOptions(file);

      const structured: any = {};
      for (const { accountType, primary, secondary, tertiary } of loadedCategories) {
        if (!structured[accountType]) structured[accountType] = {};
        if (!structured[accountType][primary]) structured[accountType][primary] = {};
        if (!structured[accountType][primary][secondary]) structured[accountType][primary][secondary] = [];
        if (!structured[accountType][primary][secondary].includes(tertiary)) {
          structured[accountType][primary][secondary].push(tertiary);
        }
      }

      setCategories(structured);
      localStorage.setItem("categoryMappings", JSON.stringify(structured));
    } catch (error) {
      console.error("❌ Error loading category options:", error);
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
          {report && <ReportSummary report={report} categories={categories} />}
        </div>
      </div>
    </div>
  );
}

export default App;
