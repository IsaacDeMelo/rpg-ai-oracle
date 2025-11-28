
import React, { useRef } from 'react';
import { Book, Download, Upload, Feather, Save } from 'lucide-react';

interface LoreViewProps {
  lore: string;
  setLore: (lore: string) => void;
}

const LoreView: React.FC<LoreViewProps> = ({ lore, setLore }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportTXT = () => {
    const blob = new Blob([lore], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cronicas_do_mundo.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleImportTXT = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text === 'string') {
          if (lore.length > 0) {
              if (window.confirm("Deseja substituir a história atual? (Cancelar irá adicionar ao final)")) {
                  setLore(text);
              } else {
                  setLore(lore + "\n\n" + text);
              }
          } else {
            setLore(text);
          }
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-2 border-amber-900/30 pb-4 gap-4">
        <div>
           <h2 className="text-4xl font-black font-cinzel text-stone-100 drop-shadow-sm flex items-center gap-3">
             <Book className="text-amber-600" size={36}/> Crônicas do Mundo
           </h2>
           <p className="text-stone-500 font-cinzel text-sm mt-1">A história universal que molda o destino de todos (Contexto Global da IA)</p>
        </div>
        
        <div className="flex gap-3">
           <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImportTXT} 
            className="hidden" 
            accept=".txt"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-400 hover:text-stone-200 px-4 py-3 rounded flex items-center gap-2 transition shadow-lg"
            title="Importar TXT"
          >
            <Upload size={18} /> <span className="font-cinzel text-sm">Importar</span>
          </button>
          
          <button 
            onClick={handleExportTXT}
            disabled={!lore}
            className="bg-stone-800 hover:bg-stone-700 border border-amber-900/50 text-amber-500 px-5 py-3 rounded flex items-center gap-2 transition shadow-lg hover:shadow-amber-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={20} /> <span className="font-cinzel font-bold">Exportar TXT</span>
          </button>
        </div>
      </div>

      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-amber-900/20 to-stone-900/20 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative bg-stone-900 rounded-sm border-2 border-stone-700 shadow-2xl p-1">
             {/* Paper Header */}
            <div className="bg-[#e7e5e4] text-stone-900 p-2 font-cinzel font-bold text-center border-b-2 border-stone-400 tracking-widest shadow-inner opacity-90">
                REGISTRO AKÁSHICO
            </div>
            
            <textarea
                value={lore}
                onChange={(e) => setLore(e.target.value)}
                placeholder="Escreva aqui a história do seu mundo, grandes guerras, deuses, geografia política e eventos importantes. Tudo escrito aqui será usado como CONTEXTO para a Inteligência Artificial nas batalhas e simulações."
                className="w-full h-[60vh] bg-[#d6d3d1] text-stone-900 p-8 font-serif text-lg leading-relaxed focus:outline-none resize-none custom-scrollbar selection:bg-amber-300 placeholder-stone-500/50 shadow-inner"
                style={{
                    backgroundImage: "url('https://www.transparenttextures.com/patterns/cream-paper.png')",
                }}
            />
            
            <div className="bg-stone-950 p-3 flex justify-between items-center text-xs text-stone-500 border-t border-stone-700">
                <span className="flex items-center gap-2"><Feather size={14}/> {lore.length} caracteres</span>
                <span className="uppercase tracking-widest font-bold text-emerald-600 flex items-center gap-1"><Save size={14}/> Salvo Automaticamente</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LoreView;
