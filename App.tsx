import React from 'react';
import Header from './components/Header';
import GrammarFixer from './components/GrammarFixer';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 font-sans selection:bg-primary-100 selection:text-primary-900">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-10 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
            Write with confidence.
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Paste your English text below and let our AI perfect your grammar, punctuation, and style in seconds.
          </p>
        </div>

        <GrammarFixer />
      </main>

      <footer className="mt-20 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-400">
            &copy; {new Date().getFullYear()} Gramma AI. Powered by Google Gemini.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;