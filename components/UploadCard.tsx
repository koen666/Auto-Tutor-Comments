import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Card } from './ui/Card';

export const UploadCard: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setData } = useStore();
  const [isDragging, setIsDragging] = useState(false);

  const processFile = async (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const bstr = e.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      // Get raw data array of arrays
      const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
      
      if (jsonData.length > 0) {
        const headers = jsonData[0] as string[];
        // Convert rest to objects
        const data = XLSX.utils.sheet_to_json(ws) as any[];
        setData(data, headers, file.name);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <Card className="w-full max-w-xl mx-auto mt-10 text-center transition-all duration-300 hover:shadow-md">
      <div
        className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-colors duration-200 ${
          isDragging ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200 hover:border-blue-400'
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="bg-blue-500/10 p-4 rounded-full mb-4">
          <Upload className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Upload Gradebook</h3>
        <p className="text-gray-500 text-sm mb-6">Drag & drop your Excel file here, or click to browse.</p>
        
        <div className="flex items-center gap-2 text-xs text-gray-400 font-medium bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
           <FileSpreadsheet className="w-4 h-4" />
           Supports .xlsx, .xls
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleChange}
          accept=".xlsx, .xls"
          className="hidden"
        />
      </div>
    </Card>
  );
};
