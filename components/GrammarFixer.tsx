import React, { useState, useRef, useEffect } from 'react';
import { correctGrammar, playTextToSpeech, stopAudio } from '../services/geminiService';
import { calculateDiff, DiffPart } from '../services/diffService';
import { CorrectionResult, LoadingState } from '../types';
import Button from './Button';
import HistoryItem from './HistoryItem';
import { Wand2, X, Copy, Check, AlertCircle, History, Volume2, Square, Loader2, Languages, Lightbulb, FileDiff, BookOpen } from 'lucide-react';

const EXAMPLE_SENTENCES = [
  "Me and my friend was going to the store yesterday but it where closed.",
  "I definately reccomend this movie it's really good and the actors is great.",
  "Their are too many people in this room, its hard too breath.",
  "Could you please tell me where is the library at?"
];

interface PlayingState {
  type: 'input' | 'output' | null;
  loading: boolean;
}

const GrammarFixer: React.FC = () => {
  const [input, setInput] = useState('');
  const [lastSubmittedInput, setLastSubmittedInput] = useState('');
  const [output, setOutput] = useState('');
  const [hindiOutput, setHindiOutput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [grammarRules, setGrammarRules] = useState<string[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>({ status: 'idle' });
  const [history, setHistory] = useState<CorrectionResult[]>([]);
  const [copied, setCopied] = useState(false);
  const [playing, setPlaying] = useState<PlayingState>({ type: null, loading: false });
  const [showDiff, setShowDiff] = useState(false);
  
  // Ref for auto-resizing textarea if needed
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Stop audio if component unmounts
  useEffect(() => {
    return () => stopAudio();
  }, []);

  const handleCorrect = async () => {
    if (!input.trim()) return;

    // Stop any playing audio before correcting
    if (playing.type) {
        stopAudio();
        setPlaying({ type: null, loading: false });
    }

    setLoadingState({ status: 'loading' });
    setOutput(''); 
    setHindiOutput('');
    setSuggestions([]);
    setGrammarRules([]);
    setShowDiff(false);

    try {
      const result = await correctGrammar(input);
      setOutput(result.corrected);
      setHindiOutput(result.hindi);
      setSuggestions(result.suggestions);
      setGrammarRules(result.grammarRules);
      setLastSubmittedInput(input);
      setLoadingState({ status: 'success' });
      
      const newHistoryItem: CorrectionResult = {
        original: input,
        corrected: result.corrected,
        hindi: result.hindi,
        suggestions: result.suggestions,
        grammarRules: result.grammarRules,
        timestamp: Date.now()
      };
      
      setHistory(prev => [newHistoryItem, ...prev]);
    } catch (error) {
      setLoadingState({ 
        status: 'error', 
        message: 'Failed to correct grammar. Please try again.' 
      });
    }
  };

  const handleSpeak = async (text: string, type: 'input' | 'output') => {
    if (!text) return;

    // If currently playing the same type, stop it
    if (playing.type === type && !playing.loading) {
      stopAudio();
      setPlaying({ type: null, loading: false });
      return;
    }

    // Set loading state for the requested type
    setPlaying({ type, loading: true });

    try {
      await playTextToSpeech(text, () => {
        setPlaying({ type: null, loading: false });
      });
      // Playback started successfully
      setPlaying({ type, loading: false });
    } catch (error) {
      console.error("TTS failed", error);
      setPlaying({ type: null, loading: false });
    }
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    stopAudio();
    setPlaying({ type: null, loading: false });
    setInput('');
    setOutput('');
    setHindiOutput('');
    setSuggestions([]);
    setGrammarRules([]);
    setLastSubmittedInput('');
    setLoadingState({ status: 'idle' });
  };

  const loadExample = () => {
    stopAudio();
    setPlaying({ type: null, loading: false });
    const random = EXAMPLE_SENTENCES[Math.floor(Math.random() * EXAMPLE_SENTENCES.length)];
    setInput(random);
    setOutput('');
    setHindiOutput('');
    setSuggestions([]);
    setGrammarRules([]);
    setLastSubmittedInput('');
    setLoadingState({ status: 'idle' });
  };

  const renderDiff = () => {
    const parts = calculateDiff(lastSubmittedInput, output);
    return (
      <div className="leading-relaxed">
        {parts.map((part, index) => {
          if (part.type === 'add') {
            return (
              <span key={index} className="bg-green-100 text-green-800 rounded px-0.5">
                {part.value}
              </span>
            );
          } else if (part.type === 'remove') {
            return (
              <span key={index} className="bg-red-100 text-red-800 line-through opacity-70 rounded px-0.5 mx-0.5 select-none">
                {part.value}
              </span>
            );
          }
          return <span key={index}>{part.value}</span>;
        })}
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      
      {/* Main Input/Output Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
        
        {/* Input Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 flex flex-col overflow-hidden h-96 md:h-[36rem] transition-all focus-within:ring-2 focus-within:ring-primary-100">
          <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <label htmlFor="input-text" className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Input Text
            </label>
            <div className="flex items-center space-x-2">
              {input && (
                <button
                  onClick={() => handleSpeak(input, 'input')}
                  disabled={playing.loading && playing.type === 'input'}
                  className={`text-xs flex items-center transition-all px-2 py-1 rounded hover:bg-gray-200 ${playing.type === 'input' ? 'text-primary-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
                  title={playing.type === 'input' ? "Stop listening" : "Listen to text"}
                >
                    {playing.loading && playing.type === 'input' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : playing.type === 'input' ? (
                        <Square className="w-4 h-4 fill-current" />
                    ) : (
                        <Volume2 className="w-4 h-4" />
                    )}
                </button>
              )}
              {input && (
                <button 
                    onClick={handleClear}
                    className="text-xs text-gray-400 hover:text-red-500 flex items-center transition-colors px-2 py-1 rounded hover:bg-red-50"
                >
                    <X className="w-3 h-3 mr-1" /> Clear
                </button>
              )}
            </div>
          </div>
          <div className="flex-1 relative">
            <textarea
              id="input-text"
              ref={inputRef}
              className="w-full h-full p-5 resize-none border-none outline-none text-gray-700 text-lg leading-relaxed bg-transparent placeholder-gray-300"
              placeholder="Type or paste your text here to check for grammar, spelling, and punctuation errors..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              spellCheck={false}
            />
            {!input && (
               <div className="absolute bottom-5 left-5 right-5">
                 <button 
                   onClick={loadExample}
                   className="text-sm text-primary-600 bg-primary-50 px-3 py-1.5 rounded-full hover:bg-primary-100 transition-colors inline-flex items-center"
                 >
                   Try an example
                 </button>
               </div>
            )}
          </div>
        </div>

        {/* Output Card */}
        <div className={`bg-white rounded-2xl shadow-lg border border-gray-100 flex flex-col overflow-hidden h-96 md:h-[36rem] relative ${loadingState.status === 'success' ? 'ring-2 ring-green-100 border-green-200' : ''}`}>
          <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center">
              Corrected Output
              {loadingState.status === 'success' && (
                <span className="ml-2 flex items-center text-green-600 text-xs bg-green-100 px-2 py-0.5 rounded-full">
                  <Check className="w-3 h-3 mr-1" /> Perfected
                </span>
              )}
            </label>
            <div className="flex items-center space-x-2">
                {output && (
                  <button
                    onClick={() => setShowDiff(!showDiff)}
                    className={`text-xs flex items-center transition-all px-2 py-1 rounded ${showDiff ? 'bg-primary-50 text-primary-600 font-medium ring-1 ring-primary-200' : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700'}`}
                    title={showDiff ? "Hide changes" : "Highlight changes"}
                  >
                     <FileDiff className="w-4 h-4" />
                  </button>
                )}
                {output && (
                    <button
                        onClick={() => handleSpeak(output, 'output')}
                        disabled={playing.loading && playing.type === 'output'}
                        className={`text-xs flex items-center transition-all px-2 py-1 rounded hover:bg-gray-200 ${playing.type === 'output' ? 'text-primary-600 font-medium' : 'text-gray-500 hover:text-primary-600'}`}
                        title={playing.type === 'output' ? "Stop listening" : "Listen to result"}
                    >
                        {playing.loading && playing.type === 'output' ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : playing.type === 'output' ? (
                            <Square className="w-4 h-4 fill-current" />
                        ) : (
                            <Volume2 className="w-4 h-4" />
                        )}
                    </button>
                )}
                {output && (
                <button 
                    onClick={handleCopy}
                    className={`text-xs flex items-center transition-all px-2 py-1 rounded hover:bg-gray-200 ${copied ? 'text-green-600 font-medium' : 'text-gray-500 hover:text-primary-600'}`}
                >
                    {copied ? (
                    <>
                        <Check className="w-3.5 h-3.5 mr-1" /> Copied
                    </>
                    ) : (
                    <>
                        <Copy className="w-3.5 h-3.5 mr-1" /> Copy
                    </>
                    )}
                </button>
                )}
            </div>
          </div>
          
          <div className="flex-1 relative bg-gray-50/30 flex flex-col overflow-hidden">
            {loadingState.status === 'loading' ? (
              <div className="w-full h-full flex flex-col items-center justify-center space-y-4 p-8 animate-pulse">
                <div className="w-3/4 h-4 bg-gray-200 rounded"></div>
                <div className="w-5/6 h-4 bg-gray-200 rounded"></div>
                <div className="w-2/3 h-4 bg-gray-200 rounded"></div>
                <span className="text-sm text-gray-400 mt-4">Analyzing grammar and style...</span>
              </div>
            ) : output ? (
              <div className="flex-1 overflow-auto flex flex-col">
                {/* Corrected Text / Diff View */}
                <div className="p-5 text-gray-800 text-lg leading-relaxed border-b border-gray-100">
                   {showDiff ? renderDiff() : output}
                </div>

                <div className="p-4 space-y-4">
                  {/* Grammar Rules */}
                  {grammarRules && grammarRules.length > 0 && (
                     <div className="bg-sky-50 border border-sky-100 rounded-lg p-3">
                       <div className="flex items-center space-x-2 mb-2">
                          <BookOpen className="w-4 h-4 text-sky-500" />
                          <span className="text-xs font-semibold text-sky-600 uppercase tracking-wide">
                            Grammar Rules Applied
                          </span>
                       </div>
                       <ul className="space-y-1.5">
                         {grammarRules.map((rule, idx) => (
                           <li key={idx} className="text-sm text-sky-900 flex items-start">
                             <span className="mr-2 text-sky-400">•</span>
                             {rule}
                           </li>
                         ))}
                       </ul>
                     </div>
                  )}

                  {/* Style Suggestions */}
                  {suggestions && suggestions.length > 0 && (
                     <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3">
                       <div className="flex items-center space-x-2 mb-2">
                          <Lightbulb className="w-4 h-4 text-indigo-500" />
                          <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">
                            Style Suggestions
                          </span>
                       </div>
                       <ul className="space-y-1.5">
                         {suggestions.map((suggestion, idx) => (
                           <li key={idx} className="text-sm text-indigo-900 flex items-start">
                             <span className="mr-2 text-indigo-400">•</span>
                             {suggestion}
                           </li>
                         ))}
                       </ul>
                     </div>
                  )}
                </div>
                
                {/* Hindi Translation */}
                {hindiOutput && (
                    <div className="border-t border-gray-100 bg-orange-50/40 p-5 mt-auto">
                       <div className="flex items-center space-x-2 mb-2">
                          <Languages className="w-4 h-4 text-orange-500" />
                          <span className="text-xs font-semibold text-orange-600 uppercase tracking-wide">
                            Hindi Translation
                          </span>
                       </div>
                       <p className="text-gray-800 text-lg leading-relaxed font-sans">
                         {hindiOutput}
                       </p>
                    </div>
                )}
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                <Wand2 className="w-12 h-12 mb-4 text-gray-200" />
                <p>Correction will appear here</p>
              </div>
            )}
            
            {loadingState.status === 'error' && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/90 z-10 p-6">
                <div className="text-center text-red-500">
                  <AlertCircle className="w-10 h-10 mx-auto mb-2" />
                  <p>{loadingState.message}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Button (Centered Overlay on Desktop, Bottom on Mobile) */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 hidden md:block">
           <Button 
            onClick={handleCorrect}
            disabled={!input.trim()}
            isLoading={loadingState.status === 'loading'}
            className="rounded-full w-14 h-14 !p-0 shadow-xl border-4 border-slate-50 flex items-center justify-center"
            title="Fix Grammar"
          >
            <Wand2 className="w-6 h-6" />
          </Button>
        </div>

      </div>

      {/* Mobile Only Action Button */}
      <div className="md:hidden">
        <Button 
          onClick={handleCorrect} 
          disabled={!input.trim()}
          isLoading={loadingState.status === 'loading'}
          className="w-full py-4 text-lg shadow-lg"
          icon={<Wand2 className="w-5 h-5" />}
        >
          Fix Grammar
        </Button>
      </div>

      {/* History Section */}
      {history.length > 0 && (
        <div className="mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center space-x-2 mb-6">
            <History className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-800">Recent Corrections</h2>
          </div>
          <div className="space-y-4">
            {history.map((item, index) => (
              <HistoryItem key={`${item.timestamp}-${index}`} item={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GrammarFixer;