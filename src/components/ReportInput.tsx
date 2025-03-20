import React, { useState, useRef } from 'react';
import { FileText, Upload, FileUp, AlertCircle } from 'lucide-react';
import { AccountEntry } from '../types';
import { categorizeAccount } from '../utils/accountingUtils';
import { read, utils } from 'xlsx';

interface ReportInputProps {
  onSubmit: (entries: AccountEntry[]) => void;
}

export function ReportInput({ onSubmit }: ReportInputProps) {
  const [input, setInput] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseAmount = (value: any): number => {
    // Handle empty values
    if (value === null || value === undefined || value === '') {
      throw new Error('Amount is required');
    }

    // If it's already a number and valid, return it
    if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
      return value;
    }

    // Convert to string for processing
    let strValue = String(value).trim();

    // Handle parentheses as negative numbers: (100) -> -100
    if (strValue.match(/^\(.*\)$/)) {
      strValue = '-' + strValue.replace(/[()]/g, '');
    }

    // Remove currency symbols and thousand separators
    strValue = strValue
      .replace(/[$£€¥]/g, '') // Remove currency symbols
      .replace(/,/g, '') // Remove thousand separators
      .replace(/\s/g, '') // Remove spaces
      .trim();

    // Handle percentage values
    if (strValue.endsWith('%')) {
      strValue = (parseFloat(strValue.slice(0, -1)) / 100).toString();
    }

    // Final cleanup and conversion
    const number = parseFloat(strValue);

    if (isNaN(number) || !isFinite(number)) {
      throw new Error('Invalid number format');
    }

    return number;
  };

  const processFileData = (data: any[]) => {
    try {
      if (!Array.isArray(data) || data.length < 2) {
        throw new Error('File must contain at least a header row and one data row');
      }

      // Find the account name and amount columns
      const headerRow = data[0];
      let nameColumnIndex = -1;
      let amountColumnIndex = -1;

      // First try to find columns by header names
      headerRow.forEach((header: any, index: number) => {
        const headerStr = String(header).toLowerCase();
        if (headerStr.includes('account') || 
            headerStr.includes('name') || 
            headerStr.includes('description')) {
          nameColumnIndex = index;
        } else if (headerStr.includes('amount') || 
                  headerStr.includes('value') || 
                  headerStr.includes('balance') ||
                  headerStr.includes('debit') ||
                  headerStr.includes('credit')) {
          amountColumnIndex = index;
        }
      });

      // If we couldn't find the columns, use first two columns
      if (nameColumnIndex === -1 || amountColumnIndex === -1) {
        nameColumnIndex = 0;
        amountColumnIndex = 1;
      }

      // Process data rows (skip header)
      const entries: AccountEntry[] = [];
      const skippedRows: string[] = [];
      
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        
        // Skip empty rows
        if (!row || !row[nameColumnIndex]) {
          continue;
        }

        const name = String(row[nameColumnIndex]).trim();
        
        // Skip rows with special keywords
        if (name.toLowerCase().includes('total') || 
            name.toLowerCase().includes('classification') ||
            name.toLowerCase().includes('subtotal') ||
            name.toLowerCase().includes('balance sheet') ||
            name.toLowerCase().includes('income statement')) {
          skippedRows.push(name);
          continue;
        }

        try {
          const amount = parseAmount(row[amountColumnIndex]);
          
          entries.push({
            name,
            amount,
            type: categorizeAccount(name, amount),
            originalCategory: ''
          });
        } catch (err) {
          // Log the problematic value for debugging
          console.log(`Debug - Row ${i + 1}:`, {
            name,
            rawAmount: row[amountColumnIndex],
            error: err
          });
          throw new Error(`Invalid amount for "${name}" (Row ${i + 1}): ${row[amountColumnIndex]}`);
        }
      }

      if (entries.length === 0) {
        if (skippedRows.length > 0) {
          throw new Error(`No valid entries found. Skipped rows: ${skippedRows.join(', ')}`);
        }
        throw new Error('No valid entries found in the file');
      }

      setError(null);
      setFileName(null);
      onSubmit(entries);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file data');
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      setFileName(file.name);
      setError(null);

      const data = await file.arrayBuffer();
      const workbook = read(data, {
        cellDates: true,
        cellNF: false,
        cellText: false
      });
      
      if (workbook.SheetNames.length === 0) {
        throw new Error('The uploaded file contains no sheets');
      }

      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = utils.sheet_to_json(worksheet, { 
        header: 1,
        raw: true, // Get raw values for better number handling
        defval: null
      });

      processFileData(jsonData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read file');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const fileType = file.name.split('.').pop()?.toLowerCase();
      
      if (!['xlsx', 'xls', 'csv'].includes(fileType || '')) {
        setError('Please upload only Excel (.xlsx, .xls) or CSV files');
        return;
      }
      
      await handleFileUpload(file);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFileName(null);
    
    try {
      if (!input.trim()) {
        throw new Error('Please enter some data');
      }

      const entries: AccountEntry[] = input
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          const [name, amountStr] = line.split(',').map(s => s.trim());
          if (!name) throw new Error('Account name is required');
          
          try {
            const amount = parseAmount(amountStr);
            return {
              name,
              amount,
              type: categorizeAccount(name, amount),
              originalCategory: ''
            };
          } catch (err) {
            throw new Error(`Invalid amount for account: ${name}`);
          }
        });

      if (entries.length === 0) {
        throw new Error('No valid entries found');
      }

      onSubmit(entries);
      setInput('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process input');
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

      <div 
        className={`mb-6 border-2 border-dashed rounded-lg p-6 text-center
          ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
          ${error ? 'border-red-300' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <FileUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
        <p className="text-gray-600 mb-2">
          Drag and drop your Excel or CSV file here, or
        </p>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".xlsx,.xls,.csv"
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
          <p className="mt-2 text-sm text-green-600">
            Processing file: {fileName}
          </p>
        )}
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or paste data manually</span>
        </div>
      </div>

      <form onSubmit={handleManualSubmit} className="mt-6">
        <textarea
          className="w-full h-48 p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter account data in CSV format:&#10;Account Name, Amount&#10;Example:&#10;Sales Revenue, 5000&#10;Office Supplies, -150"
        />
        <button
          type="submit"
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Process Report
        </button>
      </form>
    </div>
  );
}