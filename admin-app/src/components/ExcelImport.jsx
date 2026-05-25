import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react';
import Modal from './Modal';
import { Button } from './Button';

const ExcelImport = ({ isOpen, onClose, onImport, title = "Import Services from Excel" }) => {
  const [file, setFile] = useState(null);
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.match(/\.(xlsx|xls|csv)$/)) {
        setError('Please select a valid Excel or CSV file.');
        return;
      }
      setFile(selectedFile);
      setError(null);
      parseFile(selectedFile);
    }
  };

  const parseFile = (file) => {
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const bstr = e.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const jsonData = XLSX.utils.sheet_to_json(ws);
        
        if (jsonData.length === 0) {
          throw new Error('The selected file is empty.');
        }

        // Basic validation of required columns
        const firstRow = jsonData[0];
        const required = ['name', 'service_type'];
        const missing = required.filter(col => !(col in firstRow));

        if (missing.length > 0) {
          throw new Error(`Missing required columns: ${missing.join(', ')}`);
        }

        setData(jsonData);
        setPreview(true);
      } catch (err) {
        setError(err.message);
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleImport = async () => {
    setLoading(true);
    try {
      await onImport(data);
      onClose();
      // Reset state
      setFile(null);
      setData([]);
      setPreview(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setData([]);
    setError(null);
    setPreview(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="xl">
      <div className="space-y-6">
        {!preview ? (
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-3xl p-12 transition-colors hover:border-brand-red/30">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-brand-red mb-4">
              <FileSpreadsheet size={32} />
            </div>
            <h4 className="text-lg font-black text-gray-900 mb-1">Select Excel File</h4>
            <p className="text-gray-400 text-sm font-medium mb-8 text-center max-w-xs">
              Upload an .xlsx or .csv file with columns for name and service_type.
            </p>
            
            <label className="cursor-pointer">
              <input type="file" className="hidden" onChange={handleFileChange} accept=".xlsx, .xls, .csv" />
              <div className="px-8 py-3 bg-brand-red text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:opacity-90 transition-all shadow-lg shadow-red-100 flex items-center gap-2">
                <Upload size={16} /> Choose File
              </div>
            </label>

            {error && (
              <div className="mt-6 flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100">
                <AlertCircle size={14} /> {error}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-green-50 px-4 py-3 rounded-2xl border border-green-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <p className="text-xs font-black text-green-900 leading-none mb-1">File Validated</p>
                  <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest">{file?.name} — {data.length} Records Detected</p>
                </div>
              </div>
              <button 
                onClick={reset}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <div className="border border-gray-100 rounded-2xl overflow-hidden max-h-64 overflow-y-auto custom-scrollbar">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    {data.length > 0 && Object.keys(data[0]).slice(0, 4).map(key => (
                      <th key={key} className="px-4 py-3 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">{key}</th>
                    ))}
                    <th className="px-4 py-3 text-right text-[9px] font-black text-gray-400 uppercase tracking-widest">...</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.slice(0, 5).map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                      {Object.values(row).slice(0, 4).map((val, j) => (
                        <td key={j} className="px-4 py-3 text-xs font-medium text-gray-600 truncate max-w-[150px]">{String(val)}</td>
                      ))}
                      <td className="px-4 py-3 text-right text-[10px] text-gray-300">...</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.length > 5 && (
                <div className="px-4 py-2 bg-gray-50/30 text-center border-t border-gray-50">
                   <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">And {data.length - 5} more rows...</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button 
                onClick={handleImport} 
                disabled={loading}
                className="flex-1 bg-brand-red text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:opacity-90 disabled:opacity-50 transition-all shadow-xl shadow-red-100"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : `Import ${data.length} Services`}
              </Button>
              <Button 
                variant="outline" 
                onClick={reset}
                className="px-6 py-4 border-slate-300 text-gray-500 font-bold rounded-2xl hover:bg-gray-50"
              >
                Cancel
              </Button>
            </div>
            
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100">
                <AlertCircle size={14} /> {error}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ExcelImport;
