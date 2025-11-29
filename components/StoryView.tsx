
import React, { useState, useEffect, useRef } from 'react';
import { StoryPage } from '../types';
import { Feather, ChevronLeft, ChevronRight, Plus, Trash2, Save, BookOpen, Sparkles, Loader2, Check, Printer, Wand2 } from 'lucide-react';
import { summarizeStoryForLore, improveNarrative } from '../services/geminiService';

interface StoryViewProps {
  pages: StoryPage[];
  setPages: (pages: StoryPage[]) => void;
  onAddToLore: (summary: string) => void;
  worldLore: string;
}

// Safer ID generator that works in all contexts
const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

const StoryView: React.FC<StoryViewProps> = ({ pages, setPages, onAddToLore, worldLore }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [hasOpened, setHasOpened] = useState(false);
  
  // Summary state
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryStatus, setSummaryStatus] = useState<'idle' | 'success'>('idle');

  // Rewrite State
  const [isRewriting, setIsRewriting] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // Trigger open animation on mount
  useEffect(() => {
    setTimeout(() => setHasOpened(true), 100);
  }, []);

  // Ensure there is always at least one page
  useEffect(() => {
    if (pages.length === 0) {
      setPages([{ id: generateId(), title: 'Capítulo I', content: '' }]);
    }
  }, [pages, setPages]);

  // Safety check for index
  useEffect(() => {
    if (currentIndex >= pages.length && pages.length > 0) {
        setCurrentIndex(pages.length - 1);
    }
  }, [pages.length, currentIndex]);

  const currentPage = pages[currentIndex] || { id: 'temp', title: '', content: '' };

  const handleUpdate = (field: 'content' | 'title', value: string) => {
    const updatedPages = [...pages];
    if (updatedPages[currentIndex]) {
        updatedPages[currentIndex] = { ...updatedPages[currentIndex], [field]: value };
        setPages(updatedPages);
    }
  };

  const changePage = (newIndex: number) => {
    if (isFlipping || newIndex < 0 || newIndex >= pages.length) return;
    
    setDirection(newIndex > currentIndex ? 'next' : 'prev');
    setIsFlipping(true);
    
    // Halfway through animation, swap data
    setTimeout(() => {
        setCurrentIndex(newIndex);
    }, 250); // Matches half of CSS transition duration

    // End animation
    setTimeout(() => {
        setIsFlipping(false);
    }, 500);
  };

  const handleNewPage = () => {
    const newPage: StoryPage = { id: generateId(), title: `Capítulo ${pages.length + 1}`, content: '' };
    const newPages = [...pages, newPage];
    setPages(newPages);
    
    // Animate transition to the new page
    if (!isFlipping) {
        setDirection('next');
        setIsFlipping(true);
        setTimeout(() => {
            setCurrentIndex(newPages.length - 1);
        }, 250);
        setTimeout(() => {
            setIsFlipping(false);
        }, 500);
    } else {
        // If already flipping, just jump (rare edge case)
        setCurrentIndex(newPages.length - 1);
    }
  };

  const handleDeletePage = () => {
    if (isFlipping) return;
    if (!window.confirm("Deseja rasgar esta página permanentemente?")) return;

    if (pages.length <= 1) {
      // Reset to initial state
      setPages([{ id: generateId(), title: 'Nova História', content: '' }]);
      setCurrentIndex(0);
    } else {
      const newPages = [...pages];
      newPages.splice(currentIndex, 1);
      setPages(newPages);
      
      // Adjust index if needed
      if (currentIndex >= newPages.length) {
        setCurrentIndex(Math.max(0, newPages.length - 1));
      }
    }
  };

  const handleSummarizeToLore = async () => {
    if (isSummarizing) return;
    
    // Gather all text
    const fullStory = pages
      .map(p => `--- ${p.title} ---\n${p.content}`)
      .join('\n\n');

    if (!fullStory.trim() || fullStory.length < 50) {
      alert("Escreva mais em sua história antes de registrá-la nas crônicas.");
      return;
    }

    if (!window.confirm("A magia irá ler todo o seu livro e transcrever os eventos principais para as Crônicas do Mundo. Continuar?")) return;

    setIsSummarizing(true);
    setSummaryStatus('idle');

    try {
      const summary = await summarizeStoryForLore(fullStory, worldLore);
      onAddToLore(summary);
      setSummaryStatus('success');
      setTimeout(() => setSummaryStatus('idle'), 3000);
    } catch (e) {
      alert("Houve uma falha na magia de transcrição.");
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleSmartRewrite = async () => {
      if (isRewriting || !textAreaRef.current) return;

      const textarea = textAreaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const hasSelection = start !== end;
      
      const textToImprove = hasSelection 
          ? currentPage.content.substring(start, end)
          : currentPage.content;

      if (!textToImprove.trim()) {
          alert("A página está em branco. Escreva algo para a magia atuar.");
          return;
      }

      const confirmMsg = hasSelection 
          ? "Reescrever apenas o trecho selecionado para corrigir fluidez e gramática?"
          : "Reescrever TODO o capítulo para corrigir fluidez e gramática? (Isso substituirá o texto atual)";

      if (!window.confirm(confirmMsg)) return;

      setIsRewriting(true);

      try {
          const polishedText = await improveNarrative(textToImprove, worldLore);
          
          let newContent = "";
          if (hasSelection) {
              // Replace only selected part
              newContent = currentPage.content.substring(0, start) + polishedText + currentPage.content.substring(end);
          } else {
              // Replace all
              newContent = polishedText;
          }

          handleUpdate('content', newContent);
      } catch (e) {
          alert("A pena mágica falhou.");
      } finally {
          setIsRewriting(false);
      }
  };

  const handlePrintChapter = () => {
    window.print();
  };

  return (
    <div className="flex flex-col h-full w-full relative" style={{ perspective: '2000px' }}>
      
      {/* Styles for specialized animations & PRINT */}
      <style>{`
        .book-enter {
            transform-origin: left center;
            transform: rotateY(-30deg) scale(0.9);
            opacity: 0;
            transition: all 1s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .book-enter-active {
            transform: rotateY(0deg) scale(1);
            opacity: 1;
        }
        .page-flip-container {
            transition: transform 0.5s ease-in-out;
            transform-style: preserve-3d;
        }
        .flipping-next {
            transform: rotateY(-90deg);
        }
        .flipping-prev {
            transform: rotateY(90deg);
        }

        /* PRINT STYLES - A4 Book Format */
        @media print {
            body * {
                visibility: hidden;
            }
            #print-container, #print-container * {
                visibility: visible;
            }
            #print-container {
                display: block !important;
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                background: white;
                color: black;
                font-family: 'Crimson Text', serif;
                padding: 0 !important;
                margin: 0 !important;
                z-index: 9999;
            }
            
            /* Page Settings */
            @page {
                size: A4;
                margin: 2cm 2cm;
            }

            .print-chapter-title {
                text-align: center;
                font-family: 'Cinzel', serif;
                font-size: 24pt;
                font-weight: 700;
                margin-top: 1cm;
                margin-bottom: 2cm;
                text-transform: uppercase;
                color: black;
            }

            .print-content {
                font-size: 12pt;
                line-height: 1.35; /* Spacing tight like a book */
                text-align: justify;
                color: black;
            }

            .print-content p {
                margin-bottom: 0; /* No space between paragraphs */
                margin-top: 0;
                text-indent: 1.5em; /* Standard book indentation */
            }
            
            /* Drop Cap for first paragraph */
            .print-content p:first-of-type::first-letter {
                font-size: 3.5em;
                float: left;
                margin-top: -0.1em;
                margin-right: 0.1em;
                line-height: 0.8;
                font-family: 'Cinzel', serif;
            }
        }
      `}</style>

      {/* HIDDEN PRINT CONTAINER */}
      <div id="print-container" className="hidden">
        <div className="print-chapter-title">{currentPage.title}</div>
        <div className="print-content">
            {currentPage.content.split('\n').map((para, i) => (
                para.trim() ? <p key={i}>{para}</p> : <br key={i}/>
            ))}
        </div>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-3xl font-black font-cinzel text-stone-100 drop-shadow-sm flex items-center gap-3">
            <BookOpen className="text-stone-400" size={32}/> Livro de Contos
          </h2>
        </div>
        <div className="flex items-center gap-4 text-stone-500 font-cinzel text-xs">
           <span>Página {currentIndex + 1} de {pages.length}</span>
        </div>
      </div>

      {/* Desk Surface / Book Container */}
      <div className={`flex-1 w-full relative flex flex-col items-center justify-start transition-all duration-700 ${hasOpened ? 'book-enter-active' : 'book-enter'}`}>
        
        {/* The "Paper" */}
        <div className={`
            relative w-full h-full min-h-[200vh] bg-[#f5f5f4] shadow-[0_0_50px_rgba(0,0,0,0.8)] 
            flex flex-col border-l-[12px] border-stone-800/20 rounded-r-md overflow-hidden
            page-flip-container
            ${isFlipping ? (direction === 'next' ? 'flipping-next' : 'flipping-prev') : ''}
        `}>
            {/* Paper Texture */}
            <div className="absolute inset-0 opacity-100 pointer-events-none z-0" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cream-paper.png')" }}></div>
            
            {/* Binding Shadow */}
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-stone-400/50 to-transparent z-10 pointer-events-none"></div>

            {/* Content Area (Z-20) */}
            <div className="relative z-20 flex flex-col min-h-[80vh] w-full p-8 md:p-12 lg:p-16 pb-24 max-w-none">
                
                {/* Title Input */}
                <input 
                    type="text"
                    value={currentPage.title || ''}
                    onChange={(e) => handleUpdate('title', e.target.value)}
                    className="w-full bg-transparent border-b-2 border-stone-300 text-3xl font-cinzel font-bold text-stone-800 placeholder-stone-400/50 focus:border-stone-500 focus:outline-none py-2 mb-8 text-center"
                    placeholder="Título do Capítulo..."
                />

                {/* Main Text Area */}
                <textarea 
                    ref={textAreaRef}
                    className="flex-1 w-full max-w-none bg-transparent resize-none focus:outline-none text-stone-900 font-serif text-xl leading-relaxed custom-scrollbar placeholder-stone-400/50"
                    placeholder="A tinta aguarda..."
                    value={currentPage.content}
                    onChange={(e) => handleUpdate('content', e.target.value)}
                    spellCheck={false}
                />

                {/* Footer Info */}
                <div className="absolute bottom-4 right-8 flex items-center gap-4 text-stone-400 font-mono text-xs select-none">
                    <span className="flex items-center gap-1"><Feather size={12}/> {currentPage.content.length} chars</span>
                    <span className="flex items-center gap-1"><Save size={12}/> Autosave</span>
                </div>
            </div>
        </div>

        {/* Floating Controls */}
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-6 z-50 bg-stone-900/90 p-3 rounded-full border border-stone-700 shadow-2xl backdrop-blur-sm">
            <button 
                onClick={() => changePage(currentIndex - 1)} 
                disabled={currentIndex === 0 || isFlipping}
                className="text-stone-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition hover:-translate-x-1 p-2"
                title="Página Anterior"
            >
                <ChevronLeft size={32} />
            </button>

            <div className="h-8 w-px bg-stone-700"></div>

            <div className="flex gap-4">
                 <button 
                    onClick={handleDeletePage}
                    className="text-stone-500 hover:text-red-500 transition hover:scale-110 p-2"
                    title="Rasgar Página"
                    disabled={isFlipping}
                >
                    <Trash2 size={24} />
                </button>
                <button 
                    onClick={handleNewPage}
                    className="text-amber-500 hover:text-amber-300 transition hover:rotate-90 transform duration-300 hover:scale-110 p-2"
                    title="Nova Página"
                    disabled={isFlipping}
                >
                    <Plus size={28} />
                </button>
            </div>

            <div className="h-8 w-px bg-stone-700"></div>

            <button 
                onClick={() => changePage(currentIndex + 1)} 
                disabled={currentIndex === pages.length - 1 || isFlipping}
                className="text-stone-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition hover:translate-x-1 p-2"
                title="Próxima Página"
            >
                <ChevronRight size={32} />
            </button>

            {/* Magical Divider */}
             <div className="h-8 w-px bg-stone-700 ml-2"></div>

             <button 
                onClick={handlePrintChapter}
                disabled={isFlipping}
                className="text-stone-400 hover:text-white transition hover:scale-110 p-2"
                title="Exportar PDF (A4)"
            >
                <Printer size={24} />
            </button>

             <button 
                onClick={handleSmartRewrite}
                disabled={isRewriting || isFlipping}
                className="p-2 text-violet-400 hover:text-violet-200 transition hover:scale-110 relative group"
                title="Reescrever Texto Selecionado (IA)"
            >
                {isRewriting ? <Loader2 size={24} className="animate-spin text-violet-500" /> : <Wand2 size={24} />}
                {/* Tooltip for functionality explanation */}
                 <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-black/90 text-stone-300 text-[10px] p-2 rounded w-40 text-center hidden group-hover:block z-[100] border border-stone-700 pointer-events-none">
                    Selecione um texto para reescrever. Se nada for selecionado, reescreve a página.
                </div>
            </button>

            <button 
                onClick={handleSummarizeToLore}
                disabled={isSummarizing || isFlipping}
                className={`
                    p-2 rounded-full border transition-all duration-500 relative overflow-hidden group
                    ${summaryStatus === 'success' 
                        ? 'bg-emerald-900 border-emerald-500 text-emerald-300' 
                        : 'bg-violet-900/50 border-violet-500/50 text-violet-300 hover:bg-violet-800 hover:text-white hover:border-violet-400 hover:shadow-[0_0_15px_rgba(139,92,246,0.5)]'
                    }
                `}
                title="Transcrever para as Crônicas (Lore)"
            >
               {isSummarizing ? (
                   <Loader2 size={24} className="animate-spin" />
               ) : summaryStatus === 'success' ? (
                   <Check size={24} className="animate-bounce" />
               ) : (
                   <Sparkles size={24} />
               )}
            </button>
        </div>
      </div>
    </div>
  );
};

export default StoryView;
