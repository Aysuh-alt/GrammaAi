import React from 'react';
import { Sparkles } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-primary-600 p-2 rounded-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            Gramma<span className="text-primary-600">AI</span>
          </h1>
        </div>
        <div className="text-sm text-gray-500 hidden sm:block">
          Powered by Gemini 2.5 Flash
        </div>
      </div>
    </header>
  );
};

export default Header;