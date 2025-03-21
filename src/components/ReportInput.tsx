import { useState, useRef } from 'react';
import { FileText, FileUp, AlertCircle } from 'lucide-react';
import { AccountEntry } from '../types';
import { categorizeAccount } from '../utils/accountingUtils';
import { read, utils } from 'xlsx';

interface ReportInputProps {
  onSubmit: (entries: AccountEntry[]) => void;
}

export function ReportInput({ onSubmit }: ReportInputProps) {
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseAmount = (value: any): number => {
    if (value === null || value === undefined || value === '') {
      throw new Error('Amount is required');
    }
    let strValue = String(value).trim();
    if (strValue.match(/^\(.*\)$/)) {
      strValue = '-' + strValue.replace(/[()]/g, '');
    }
    strValue = strValue.replace(/[$£€¥,\s]/g, '').trim();
    const number = parseFloat(strValue);
    if (isNaN(number) || !isFinite(number)) {
      throw new Error('Invalid number format');
    }
    return number;
  };

  const processFileData = (data: any[][]) => {
    try {
      if (!Array.isArray(data) || data.length < 2) {
        throw new Error("File must contain at least a header row and one data row");
      }
  
      let headerRow: string[] | null = null;
      let headerRowIndex = -1;
  
      // 🔍 Scan the first few rows to find the actual headers
      for (let i = 0; i < Math.min(10, data.length); i++) { 
        const row = data[i].map(cell => String(cell || '').trim().toLowerCase().replace(/\s+/g, ' '));
  
        if (row.some(cell => cell.includes('debit')) && row.some(cell => cell.includes('credit'))) {
          headerRow = row;
          headerRowIndex = i;
          break;
        }
      }
  
      if (!headerRow) {
        throw new Error("❌ Could not detect headers. Ensure the file contains 'Debit' and 'Credit' columns.");
      }
  
      console.log("✅ Detected header row:", headerRow, "at row index:", headerRowIndex);
  
      // Find column indices
      let nameColumnIndex = headerRow.findIndex(header => header.includes('account name'));
      if (nameColumnIndex === -1) {
        nameColumnIndex = headerRow.findIndex(header => header.includes('account'));
      }
      if (nameColumnIndex === -1) {
        nameColumnIndex = 0; // Fallback to first column
      }
  
      let debitColumnIndex = headerRow.findIndex(header => header.includes('debit'));
      let creditColumnIndex = headerRow.findIndex(header => header.includes('credit'));
  
      if (debitColumnIndex === -1 || creditColumnIndex === -1) {
        throw new Error(`❌ Missing required columns. Found headers: ${headerRow.join(', ')}`);
      }
  
      const entries: AccountEntry[] = [];
  
      // 📊 Process data starting from the detected header row
      for (let i = headerRowIndex + 1; i < data.length; i++) {
        const row = data[i];
  
        if (!row || !row[nameColumnIndex]) continue;
  
        const name = String(row[nameColumnIndex]).trim();
        const debit = debitColumnIndex !== -1 && row[debitColumnIndex] ? parseAmount(row[debitColumnIndex]) : 0;
        const credit = creditColumnIndex !== -1 && row[creditColumnIndex] ? parseAmount(row[creditColumnIndex]) : 0;
  
        if (debit === 0 && credit === 0) continue;
  
        const category = categorizeAccount(name);
  
        entries.push({
          name,
          debit,
          credit,
          accountType: category.accountType,
          primaryClassification: category.primary,
          secondaryClassification: category.secondary,
          tertiaryClassification: category.tertiary,
        });
      }
  
      if (entries.length === 0) {
        throw new Error("No valid entries found. Ensure data is formatted correctly.");
      }
  
      onSubmit(entries);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process file data");
    }
  };
  

  const handleFileUpload = async (file: File) => {
    try {
      setFileName(file.name);
      setError(null);
      const data = await file.arrayBuffer();
      const workbook = read(data, { cellDates: true, cellNF: false, cellText: false });

      if (workbook.SheetNames.length === 0) {
        throw new Error('The uploaded file contains no sheets');
      }

      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData: any[][] = utils.sheet_to_json(worksheet, { header: 1, raw: true, defval: null });

      processFileData(jsonData as any[][]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read file');
    }
  };

  return (
    <div className="w-full max-w-2xl p-6 bg-white rounded-lg shadow-md">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-blue-600" />
        <h2 className="text-xl font-semibold">Input Report Data</h2>
      </div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}
      <div className="mb-6 border-2 border-dashed rounded-lg p-6 text-center">
        <FileUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
        <p className="text-gray-600 mb-2">Drag and drop your Excel file here, or</p>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".xlsx,.xls"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              handleFileUpload(e.target.files[0]);
            }
          }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          browse to upload
        </button>
        {fileName && !error && (
          <p className="mt-2 text-sm text-green-600">Processing file: {fileName}</p>
        )}
      </div>
    </div>
  );
}