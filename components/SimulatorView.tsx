
import React, { useState, useRef, useEffect } from 'react';
import { Character, ChatMessage } from '../types';
import { simulateCharacterResponse } from '../services/geminiService';
import { MessageSquare, Send, Bot, User, RefreshCw, Loader2, Sparkles } from 'lucide-react';

interface SimulatorViewProps {
  characters: Character[];
  worldLore: string;
}

const SimulatorView: React.FC<SimulatorViewProps> = ({ characters, worldLore }) => {
  const [selectedCharId, setSelectedCharId] = useState<string>('');
  const [sceneInput, setSceneInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const selectedCharacter = characters.find(c => c.id === selectedCharId);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, loading]);

  const handleSend = async () => {
    if (!selectedCharacter || !sceneInput.trim()) return;

    const userMsg: ChatMessage = {
      role: 'user',
      text: sceneInput,
      timestamp: Date.now()
    };

    setChatHistory(prev => [...prev, userMsg]);
    setLoading(true);
    const currentInput = sceneInput;
    setSceneInput('');

    // Pass worldLore to the service
    const responseText = await simulateCharacterResponse(selectedCharacter, currentInput, worldLore);

    const aiMsg: ChatMessage = {
      role: 'model',
      text: responseText,
      timestamp: Date.now()
    };

    setChatHistory(prev => [...prev, aiMsg]);
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setChatHistory([]);
  };

  if (characters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6 bg-stone-900/50 rounded border border-stone-800">
        <Bot size={48} className="text-stone-700 mb-4" />
        <h2 className="text-2xl text-stone-300 font-cinzel mb-2">Oráculo Silencioso</h2>
        <p className="text-stone-500">Crie personagens para invocar suas vozes.</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col md:flex-row gap-6">
      {/* Sidebar: Selection */}
      <div className="w-full md:w-80 bg-stone-900 rounded border-2 border-stone-800 p-5 flex flex-col gap-6 shadow-xl">
        <div>
          <label className="block text-xs font-bold text-stone-500 mb-2 uppercase tracking-widest">Invocação</label>
          <select 
            className="w-full bg-stone-950 border border-stone-700 rounded p-3 text-stone-200 focus:border-violet-500 focus:outline-none font-cinzel"
            value={selectedCharId}
            onChange={(e) => {
              setSelectedCharId(e.target.value);
              setChatHistory([]);
            }}
          >
            <option value="">Escolha a Alma...</option>
            {characters.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {selectedCharacter && (
          <div className="flex-1 overflow-y-auto bg-stone-950/50 rounded p-4 border border-stone-800 flex flex-col items-center">
             <div className="relative mb-4 group">
               <div className="absolute inset-0 bg-violet-500 rounded-full blur-md opacity-20 group-hover:opacity-40 transition duration-500"></div>
               <img 
                  src={selectedCharacter.imageUrl} 
                  alt={selectedCharacter.name} 
                  className="w-32 h-32 rounded-full object-cover border-2 border-stone-600 relative z-10"
                />
             </div>
              <h3 className="font-cinzel font-bold text-xl text-violet-300 text-center mb-1">{selectedCharacter.name}</h3>
              <p className="text-stone-500 text-xs uppercase tracking-widest mb-4">{selectedCharacter.race}</p>
            
            <div className="w-full text-xs space-y-4 text-stone-400 mt-2 border-t border-stone-800 pt-4">
               <div>
                 <strong className="text-stone-500 block mb-1 uppercase tracking-wider">Voz & Personalidade</strong>
                 <p className="italic font-serif leading-relaxed text-stone-300">"{selectedCharacter.voiceNotes || "Padrão"}"</p>
               </div>
               <div>
                 <strong className="text-stone-500 block mb-1 uppercase tracking-wider">Atributos</strong>
                 <div className="flex flex-wrap gap-2">
                   {selectedCharacter.attributes.slice(0, 5).map((attr, idx) => (
                     <span key={idx} className="bg-stone-800 px-2 py-1 rounded text-[10px] text-violet-200 border border-stone-700">{attr.key}: {attr.value}</span>
                   ))}
                 </div>
               </div>
            </div>
          </div>
        )}
      </div>

      {/* Main: Chat Area */}
      <div className="flex-1 flex flex-col bg-stone-900 rounded border-2 border-stone-800 overflow-hidden relative shadow-2xl">
        {!selectedCharacter ? (
          <div className="flex-1 flex flex-col items-center justify-center text-stone-600">
            <Sparkles size={48} className="mb-4 opacity-30" />
            <p className="font-cinzel">Selecione um personagem para iniciar a comunhão.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-4 border-b border-stone-800 flex justify-between items-center bg-stone-950/40">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-violet-500 shadow-[0_0_8px_#8b5cf6] animate-pulse"></span>
                <span className="text-sm font-cinzel font-bold text-stone-300 tracking-wide">Sessão de Roleplay</span>
              </div>
              <button 
                onClick={clearChat} 
                className="text-stone-500 hover:text-stone-200 p-2 rounded hover:bg-stone-800 transition"
                title="Limpar Memória"
              >
                <RefreshCw size={18} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-[url('https://www.transparenttextures.com/patterns/dark-leather.png')]" ref={scrollRef}>
              {chatHistory.length === 0 && (
                <div className="text-center text-stone-500 mt-20 opacity-60">
                  <p className="text-lg font-cinzel">O palco está montado.</p>
                  <p className="text-sm font-serif italic mt-2">Descreva a cena para dar vida a {selectedCharacter.name}.</p>
                </div>
              )}
              
              {chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'model' && (
                    <img src={selectedCharacter.imageUrl} className="w-12 h-12 rounded bg-stone-950 object-cover border border-stone-600 flex-shrink-0 shadow-lg" alt="Bot" />
                  )}
                  
                  <div className={`max-w-[85%] md:max-w-[70%] p-5 text-sm leading-relaxed shadow-lg relative group ${
                    msg.role === 'user' 
                      ? 'bg-stone-800 text-stone-200 rounded-lg rounded-tr-none border border-stone-600' 
                      : 'bg-stone-950/80 text-violet-100 rounded-lg rounded-tl-none border border-violet-900/30'
                  }`}>
                    {/* Name Label */}
                    <span className={`text-[10px] font-bold uppercase tracking-widest absolute -top-5 ${msg.role === 'user' ? 'right-0 text-stone-500' : 'left-0 text-violet-500'}`}>
                        {msg.role === 'user' ? 'Mestre' : selectedCharacter.name}
                    </span>
                    
                    <p className={`whitespace-pre-wrap font-serif text-base ${msg.role === 'model' ? 'italic' : ''}`}>{msg.text}</p>
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-12 h-12 rounded bg-stone-800 flex items-center justify-center flex-shrink-0 text-stone-400 border border-stone-700 shadow-lg">
                      <User size={24} />
                    </div>
                  )}
                </div>
              ))}
              
              {loading && (
                <div className="flex gap-4 animate-pulse">
                   <img src={selectedCharacter.imageUrl} className="w-12 h-12 rounded bg-stone-950 object-cover border border-stone-600 flex-shrink-0 opacity-70" alt="Bot" />
                   <div className="bg-stone-950/50 p-4 rounded-lg rounded-tl-none border border-stone-800 flex items-center">
                     <Loader2 className="animate-spin text-violet-500" size={18} />
                     <span className="ml-3 text-stone-500 text-xs font-cinzel tracking-widest">Interpretando...</span>
                   </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 bg-stone-950 border-t border-stone-800">
              <div className="relative">
                <textarea
                  value={sceneInput}
                  onChange={(e) => setSceneInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Descreva o cenário ou dialogue..."
                  className="w-full bg-stone-900 border border-stone-700 rounded pl-4 pr-14 py-4 text-stone-200 focus:border-violet-500 focus:outline-none resize-none h-16 max-h-32 shadow-inner font-serif"
                  disabled={loading}
                />
                <button 
                  onClick={handleSend}
                  disabled={loading || !sceneInput.trim()}
                  className="absolute right-2 top-2 bottom-2 w-12 bg-stone-800 hover:bg-violet-900 text-stone-400 hover:text-white rounded transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center border border-stone-700 hover:border-violet-500"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SimulatorView;
