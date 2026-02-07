import React from 'react';
import { useStore } from '../store/useStore';
import { Sparkles, ArrowRight } from 'lucide-react';

export const ColumnSelector: React.FC = () => {
  const { headers, targetColumn, setTargetColumn } = useStore();

  if (headers.length === 0) return null;

  return (
    <div className="w-full max-w-5xl mx-auto mt-8 px-4">
      <div className="flex flex-col items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
           <Sparkles className="w-6 h-6 text-purple-500" />
           Choose Target Column
        </h2>
        <p className="text-gray-500 mt-2 text-center max-w-lg">
          Select the column where you want the AI to write the comments. This column will also provide the keywords if available.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 justify-center">
        {headers.map((header) => (
          <button
            key={header}
            onClick={() => setTargetColumn(header)}
            className={`
              relative group px-5 py-3 rounded-2xl text-sm font-medium transition-all duration-300 border
              ${targetColumn === header 
                ? 'bg-black text-white border-black shadow-lg scale-105' 
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:shadow-md hover:-translate-y-0.5'
              }
            `}
          >
            {header}
            {targetColumn === header && (
               <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
            )}
          </button>
        ))}
      </div>
      
      {targetColumn && (
         <div className="flex justify-center mt-6 animate-fade-in">
            <div className="flex items-center gap-2 text-sm text-gray-400">
               <span>Column selected</span>
               <ArrowRight className="w-4 h-4" />
               <span className="font-semibold text-gray-900">{targetColumn}</span>
            </div>
         </div>
      )}
    </div>
  );
};
