import React, { useState } from 'react';
import { Key, Check, Eye, EyeOff } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Card } from './ui/Card';

export const ApiKeyInput: React.FC = () => {
  const { apiKey, setApiKey } = useStore();
  const [isVisible, setIsVisible] = useState(false);
  const [localKey, setLocalKey] = useState(apiKey);
  const [isSaved, setIsSaved] = useState(!!apiKey);

  const handleSave = () => {
    setApiKey(localKey);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000); // Reset "Saved" state for visual feedback
  };

  return (
    <div className="w-full max-w-xl mx-auto mt-6">
       <div className="bg-white/60 backdrop-blur-md rounded-2xl p-4 shadow-sm border border-white/40 flex items-center gap-3">
          <div className="bg-yellow-500/10 p-2 rounded-xl">
             <Key className="w-5 h-5 text-yellow-600" />
          </div>
          <div className="flex-1 relative">
            <input 
              type={isVisible ? "text" : "password"}
              value={localKey}
              onChange={(e) => setLocalKey(e.target.value)}
              placeholder="Enter Gemini API Key..."
              className="w-full bg-transparent border-none outline-none text-gray-800 placeholder-gray-400 text-sm font-medium"
            />
          </div>
          <button 
            onClick={() => setIsVisible(!isVisible)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          <button 
            onClick={handleSave}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
               apiKey && localKey === apiKey
                ? 'bg-green-100 text-green-700'
                : 'bg-black text-white hover:bg-gray-800 shadow-md hover:shadow-lg'
            }`}
          >
             {apiKey && localKey === apiKey ? (
               <span className="flex items-center gap-1"><Check className="w-3 h-3" /> Ready</span>
             ) : 'Save Key'}
          </button>
       </div>
    </div>
  );
};
