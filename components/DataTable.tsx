import React from 'react';
import { useStore } from '../store/useStore';
import { generateComment } from '../services/geminiService';
import * as XLSX from 'xlsx';
import { Play, Download, Loader2, FileX, Pause, Square } from 'lucide-react';

export const DataTable: React.FC = () => {
  const { 
    data, 
    headers, 
    targetColumn, 
    isGenerating, 
    setIsGenerating, 
    isPaused,
    setIsPaused,
    currentIndex,
    setCurrentIndex,
    progress, 
    setProgress,
    updateRow,
    fileName,
    reset
  } = useStore();

  if (data.length === 0 || !targetColumn) return null;

  const handleGenerate = async () => {
    // If we are paused, resume from currentIndex, otherwise start from 0
    const startIndex = isPaused ? currentIndex : 0;
    
    setIsGenerating(true);
    setIsPaused(false);
    
    // If starting fresh, reset progress
    if (!isPaused) setProgress(0);

    const total = data.length;
    // Process in batches of 3 to avoid rate limits
    const BATCH_SIZE = 3;
    
    for (let i = startIndex; i < total; i += BATCH_SIZE) {
       // Check if stopped/paused externally
       // We use useStore.getState() to check the *fresh* value inside the loop
       const currentState = useStore.getState();
       if (!currentState.isGenerating) {
         // Loop was stopped. If isPaused is set, we just exit, state is preserved.
         return;
       }

       const batch = data.slice(i, i + BATCH_SIZE);
       const promises = batch.map(async (row, batchIndex) => {
          const actualIndex = i + batchIndex;
          const comment = await generateComment(row, targetColumn);
          updateRow(actualIndex, targetColumn, comment);
       });
       
       await Promise.all(promises);
       
       const nextIndex = i + BATCH_SIZE;
       const currentProgress = Math.min(100, Math.round((nextIndex / total) * 100));
       
       // Update Store
       setCurrentIndex(nextIndex);
       setProgress(currentProgress);

       // Rate Limit Protection: Add a small delay between batches
       if (i + BATCH_SIZE < total) {
         await new Promise(resolve => setTimeout(resolve, 1500)); 
       }
    }

    // Finished
    setIsGenerating(false);
    setIsPaused(false);
    setCurrentIndex(0);
    setProgress(100);
  };

  const handlePause = () => {
    setIsGenerating(false);
    setIsPaused(true);
  };

  const handleStop = () => {
    setIsGenerating(false);
    setIsPaused(false);
    setCurrentIndex(0);
    setProgress(0);
  };

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Comments");
    XLSX.writeFile(wb, `AutoTutor_${fileName || 'Export'}`);
  };

  return (
    <div className="w-full max-w-7xl mx-auto mt-8 pb-20 px-4">
      {/* Controls */}
      <div className="sticky top-4 z-20 flex items-center justify-between bg-white/80 backdrop-blur-xl p-4 rounded-2xl shadow-lg border border-white/20 mb-6">
         <div className="flex items-center gap-3">
            <h3 className="font-semibold text-gray-900">
               {fileName}
            </h3>
            <span className="px-2 py-0.5 rounded-md bg-gray-100 text-xs font-medium text-gray-500">
               {data.length} rows
            </span>
         </div>

         <div className="flex items-center gap-3">
             <button 
               onClick={reset}
               className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
               title="Clear All"
             >
               <FileX className="w-5 h-5" />
             </button>
             
             {isGenerating ? (
               <div className="flex items-center gap-2">
                 <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-100 rounded-xl">
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                    <div className="flex flex-col">
                        <span className="text-xs font-medium text-gray-500">Generating... {currentIndex} / {data.length}</span>
                        <div className="w-24 h-1 bg-gray-200 rounded-full mt-1 overflow-hidden">
                           <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                 </div>
                 <button 
                   onClick={handlePause}
                   className="flex items-center gap-2 px-4 py-2.5 bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-xl font-semibold transition-colors"
                 >
                   <Pause className="w-4 h-4 fill-amber-700" />
                   Pause
                 </button>
               </div>
             ) : isPaused ? (
               <div className="flex items-center gap-2">
                 <button
                    onClick={handleGenerate}
                    className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white hover:bg-green-700 rounded-xl font-semibold shadow-lg transition-all duration-300"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    Resume ({progress}%)
                  </button>
                  <button
                    onClick={handleStop}
                    className="flex items-center gap-2 px-4 py-2.5 bg-red-100 text-red-600 hover:bg-red-200 rounded-xl font-semibold transition-colors"
                  >
                    <Square className="w-4 h-4 fill-red-600" />
                    Stop
                  </button>
               </div>
             ) : (
                <button
                  onClick={handleGenerate}
                  className="flex items-center gap-2 px-6 py-2.5 bg-black text-white rounded-xl font-semibold shadow-lg shadow-gray-200 hover:scale-105 active:scale-95 transition-all duration-300"
                >
                  <Play className="w-4 h-4 fill-white" />
                  Generate AI Comments
                </button>
             )}

             <button
               onClick={handleExport}
               className="flex items-center gap-2 px-6 py-2.5 bg-blue-50 text-blue-600 rounded-xl font-semibold border border-blue-100 hover:bg-blue-100 transition-colors"
             >
               <Download className="w-4 h-4" />
               Export
             </button>
         </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider w-12 text-center">#</th>
                {headers.map((h) => (
                  <th 
                    key={h} 
                    className={`p-4 text-xs font-bold uppercase tracking-wider whitespace-nowrap ${
                      h === targetColumn ? 'text-blue-600 bg-blue-50/50' : 'text-gray-500'
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="p-4 text-xs text-gray-400 font-mono text-center">{idx + 1}</td>
                  {headers.map((col) => (
                    <td 
                      key={`${idx}-${col}`} 
                      className={`p-4 text-sm max-w-xs truncate ${
                         col === targetColumn 
                          ? 'text-gray-900 font-medium bg-blue-50/10 border-l border-r border-blue-50' 
                          : 'text-gray-600'
                      }`}
                      title={row[col]}
                    >
                      {row[col]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};