import React from 'react';
import { UploadCard } from './components/UploadCard';
import { ColumnSelector } from './components/ColumnSelector';
import { DataTable } from './components/DataTable';
import { useStore } from './store/useStore';
import { BrainCircuit } from 'lucide-react';

const App: React.FC = () => {
  const { data } = useStore();

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] pb-20">
      {/* Header */}
      <header className="pt-12 pb-8 px-6 text-center">
        <div className="inline-flex items-center justify-center p-3 bg-white rounded-2xl shadow-sm mb-4">
           <BrainCircuit className="w-8 h-8 text-black" />
        </div>
        <h1 className="text-4xl font-semibold tracking-tight text-gray-900 mb-2">
          Auto-Tutor Comments
        </h1>
        <p className="text-gray-500 font-medium max-w-md mx-auto">
          Intelligent assessment feedback generation powered by Gemini AI.
        </p>
      </header>

      <main className="container mx-auto px-4">
        {data.length === 0 ? (
          <UploadCard />
        ) : (
          <>
            <ColumnSelector />
            <DataTable />
          </>
        )}
      </main>
      
      {/* Footer / Status Bar style decoration */}
      <div className="fixed bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 opacity-80" />
    </div>
  );
};

export default App;
