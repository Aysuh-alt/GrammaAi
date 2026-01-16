import React from 'react';
import { CorrectionResult } from '../types';
import { ArrowRight, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface HistoryItemProps {
  item: CorrectionResult;
}

const HistoryItem: React.FC<HistoryItemProps> = ({ item }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(item.corrected);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col md:flex-row gap-4 items-start">
        {/* Original */}
        <div className="flex-1 w-full space-y-1">
          <p className="text-sm text-gray-500 font-medium uppercase tracking-wider text-xs mb-1">Original</p>
          <div className="text-red-800 bg-red-50 p-3 rounded-md text-sm border border-red-100">
            {item.original}
          </div>
        </div>
        
        <div className="hidden md:flex items-center self-center text-gray-300">
          <ArrowRight className="w-5 h-5" />
        </div>

        {/* Results Column */}
        <div className="flex-1 w-full space-y-3">
          {/* Corrected English */}
          <div className="space-y-1 relative">
             <div className="flex justify-between items-center mb-1">
                <p className="text-sm text-gray-500 font-medium uppercase tracking-wider text-xs">Corrected</p>
                <button 
                    onClick={handleCopy}
                    className="text-gray-400 hover:text-primary-600 transition-colors p-1"
                    title="Copy corrected text"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
             </div>
             <div className="text-green-800 bg-green-50 p-3 rounded-md text-sm border border-green-100">
               {item.corrected}
             </div>
          </div>
        </div>
      </div>
      <div className="mt-3 text-right">
        <span className="text-xs text-gray-400">
          {new Date(item.timestamp).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
};

export default HistoryItem;