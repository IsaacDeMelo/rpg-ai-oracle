
import React, { useState } from 'react';
import { Character } from '../types';
import { simulateBattle } from '../services/geminiService';
import { Swords, Loader2, Skull, Trophy, Dna, ShieldCheck, Zap, PenTool } from 'lucide-react';

// Simple Markdown renderer component
const SimpleMarkdown: React.FC<{text: string}> = ({ text }) => {
    return (
        <div className="prose prose-invert prose-stone max-w-none">
            {text.split('\n').map((line, i) => {
                if (line.startsWith('### ')) return <h3 key={i} className="text-xl font-cinzel text-amber-500 mt-6 mb-3 border-b border-amber-900/30 pb-1 inline-block">{line.replace('### ', '')}</h3>;
                if (line.startsWith('## ')) return <h2 key={i} className="text-2xl font-cinzel text-amber-400 mt-8 mb-4 flex items-center gap-2"><Swords size={20}/> {line.replace('## ', '')}</h2>;
                if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-bold text-amber-100 my-3 bg-amber-950/20 p-2 rounded border-l-2 border-amber-600">{line.replace(/\*\*/g, '')}</p>;
                if (line.trim() === '') return <br key={i}/>;
                return <p key={i} className="text-stone-300 mb-2 leading-relaxed font-serif">{line}</p>;
            })}
        </div>
    )
}

interface BattleViewProps {
  characters: Character[];
  worldLore: string;
}

const BattleView: React.FC<BattleViewProps> = ({ characters, worldLore }) => {
  const [fighter1Id, setFighter1Id] = useState('');
  const [fighter2Id, setFighter2Id] = useState('');
  const [battleContext, setBattleContext] = useState('');
  const [battleLog, setBattleLog] = useState('');
  const [loading, setLoading] = useState(false);

  const fighter1 = characters.find(c => c.id === fighter1Id);
  const fighter2 = characters.find(c => c.id === fighter2Id);

  const handleFight = async () => {
    if (!fighter1 || !fighter2) return;
    if (fighter1.id === fighter2.id) {
        alert("Um personagem não pode lutar contra sua própria sombra.");
        return;
    }

    setLoading(true);
    setBattleLog('');
    
    // Pass lore and specific context
    const result = await simulateBattle(fighter1, fighter2, battleContext, worldLore);
    setBattleLog(result);
    setLoading(false);
  };

  const FighterCard = ({ fighter, side }: { fighter?: Character, side: 'left' | 'right' }) => (
    <div className={`flex-1 group relative transition-all duration-500 ${fighter ? 'opacity-100' : 'opacity-60 grayscale'}`}>
        {/* Card Frame */}
        <div className={`
            h-[400px] rounded-lg border-2 border-stone-800 bg-stone-900/80 overflow-hidden relative shadow-2xl
            ${fighter ? (side === 'left' ? 'border-blue-900/50 shadow-blue-900/20' : 'border-red-900/50 shadow-red-900/20') : ''}
        `}>
            {fighter ? (
                <>
                    {/* Background Image with Gradient */}
                    <div className="absolute inset-0 z-0">
                         <img src={fighter.imageUrl} alt={fighter.name} className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition duration-1000" />
                         <div className={`absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/60 to-transparent`} />
                         <div className={`absolute inset-0 bg-gradient-to-${side === 'left' ? 'r' : 'l'} from-stone-950/80 to-transparent`} />
                    </div>

                    {/* Content */}
                    <div className={`absolute bottom-0 w-full p-6 z-10 flex flex-col ${side === 'left' ? 'items-start text-left' : 'items-end text-right'}`}>
                         <div className={`text-xs font-bold tracking-[0.2em] uppercase mb-1 ${side === 'left' ? 'text-blue-400' : 'text-red-400'}`}>
                            {side === 'left' ? 'Desafiante' : 'Oponente'}
                         </div>
                         <h3 className="text-4xl font-black font-cinzel text-white leading-none mb-2 drop-shadow-lg">{fighter.name}</h3>
                         <div className="flex items-center gap-2 text-stone-300 font-cinzel text-sm mb-4">
                            <span>{fighter.race}</span>
                            <span className="w-1 h-1 rounded-full bg-stone-500"></span>
                            <span>{fighter.height}</span>
                         </div>
                         
                         {/* Stats Mini Display */}
                         <div className={`flex gap-3 mt-2 ${side === 'right' ? 'flex-row-reverse' : ''}`}>
                             <div className="bg-black/50 p-2 rounded border border-stone-700 backdrop-blur-sm" title="Skills">
                                <Zap size={16} className="text-amber-500" />
                                <span className="block text-xs text-center font-mono mt-1 text-stone-300">{fighter.skills?.length || 0}</span>
                             </div>
                             <div className="bg-black/50 p-2 rounded border border-stone-700 backdrop-blur-sm" title="Items">
                                <ShieldCheck size={16} className="text-stone-400" />
                                <span className="block text-xs text-center font-mono mt-1 text-stone-300">{fighter.items?.length || 0}</span>
                             </div>
                              <div className="bg-black/50 p-2 rounded border border-stone-700 backdrop-blur-sm" title="Attributes">
                                <Dna size={16} className="text-indigo-400" />
                                <span className="block text-xs text-center font-mono mt-1 text-stone-300">{fighter.attributes?.length || 0}</span>
                             </div>
                         </div>
                    </div>
                </>
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-stone-700">
                    <Skull size={64} className="mb-4 opacity-50" />
                    <p className="font-cinzel text-lg">Vazio</p>
                </div>
            )}
        </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
        <div className="text-center relative py-8">
            <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-amber-900/50 to-transparent"></div>
            <h2 className="text-5xl font-black font-cinzel text-stone-200 relative inline-block px-8 bg-transparent drop-shadow-2xl">
                ARENA DE <span className="text-red-600">SANGUE</span>
            </h2>
            <p className="text-stone-500 mt-4 font-cinzel tracking-widest text-sm uppercase">O destino é decidido no aço e na magia</p>
        </div>

        {/* Setup Arena */}
        <div className="flex flex-col md:flex-row gap-8 items-stretch justify-center">
            {/* Fighter 1 Selection */}
            <div className="w-full md:w-1/3 space-y-4">
                <select 
                    className="w-full bg-stone-900 border-2 border-stone-800 rounded p-3 text-stone-200 focus:border-blue-600 outline-none text-lg font-cinzel"
                    value={fighter1Id}
                    onChange={(e) => setFighter1Id(e.target.value)}
                >
                    <option value="">Selecionar Lutador 1</option>
                    {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <FighterCard fighter={fighter1} side="left" />
            </div>

            {/* VS Center & Controls */}
            <div className="flex flex-col items-center justify-center gap-6 z-10 w-full md:w-1/3">
                 <div className="w-full space-y-2">
                    <label className="text-xs font-bold text-stone-500 uppercase tracking-widest flex items-center gap-2">
                        <PenTool size={12} /> Contexto da Batalha
                    </label>
                    <textarea 
                        value={battleContext}
                        onChange={(e) => setBattleContext(e.target.value)}
                        placeholder="Descreva o local (ex: Ponte em ruínas), clima (ex: Chuva torrencial) ou motivações específicas para esta luta..."
                        className="w-full h-24 bg-stone-950 border border-stone-800 rounded p-3 text-sm text-stone-300 focus:border-red-800 focus:outline-none resize-none font-serif"
                    />
                 </div>

                <div className="text-7xl font-black font-cinzel text-transparent bg-clip-text bg-gradient-to-b from-amber-500 to-red-900 drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] italic transform -skew-x-12 my-2">
                    VS
                </div>

                <button 
                    onClick={handleFight}
                    disabled={loading || !fighter1 || !fighter2}
                    className="w-full group relative bg-red-900 text-red-100 font-bold py-5 rounded-lg shadow-[0_0_30px_rgba(153,27,27,0.4)] hover:shadow-[0_0_50px_rgba(220,38,38,0.6)] transition-all transform hover:scale-105 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed overflow-hidden border border-red-700"
                >
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')] opacity-30"></div>
                    <div className="relative flex items-center justify-center gap-3 text-xl font-cinzel tracking-widest">
                        {loading ? <Loader2 className="animate-spin" /> : <Swords size={28} className="text-red-400 group-hover:text-white transition-colors" />} 
                        {loading ? 'SIMULANDO...' : 'INICIAR COMBATE'}
                    </div>
                </button>
            </div>

            {/* Fighter 2 Selection */}
            <div className="w-full md:w-1/3 space-y-4">
                 <select 
                    className="w-full bg-stone-900 border-2 border-stone-800 rounded p-3 text-stone-200 focus:border-red-600 outline-none text-lg font-cinzel text-right"
                    value={fighter2Id}
                    onChange={(e) => setFighter2Id(e.target.value)}
                >
                    <option value="">Selecionar Lutador 2</option>
                    {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <FighterCard fighter={fighter2} side="right" />
            </div>
        </div>

        {/* Battle Log */}
        {(battleLog || loading) && (
            <div className="animate-fade-in max-w-4xl mx-auto bg-stone-900/90 border-2 border-amber-900/30 rounded-sm p-10 shadow-2xl relative min-h-[300px] mt-12">
                 {/* Parchment styling */}
                 <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-amber-700/50 to-transparent"></div>
                 <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-amber-700/50 to-transparent"></div>

                 {loading ? (
                     <div className="flex flex-col items-center justify-center h-full py-12 space-y-6">
                         <div className="relative">
                            <Swords size={80} className="text-stone-800 animate-pulse" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Loader2 size={40} className="text-red-600 animate-spin" />
                            </div>
                         </div>
                         <div className="text-center space-y-2">
                             <p className="text-amber-500 font-cinzel text-xl animate-pulse">Os dados estão rolando...</p>
                             <p className="text-stone-500 text-sm font-serif italic">Calculando vantagens raciais, equipamentos e o terreno.</p>
                         </div>
                     </div>
                 ) : (
                     <div className="relative">
                        <div className="flex items-center gap-3 mb-8 text-amber-500 border-b border-stone-800 pb-4">
                            <Trophy size={28} className="text-yellow-600" />
                            <h3 className="text-2xl font-cinzel font-bold tracking-wide text-stone-200">Crônicas do Combate</h3>
                        </div>
                        <SimpleMarkdown text={battleLog} />
                        
                        <div className="mt-8 pt-6 border-t border-stone-800 text-center">
                             <p className="text-stone-600 text-xs uppercase tracking-widest">Relatório gerado pelo Mestre de Jogo IA</p>
                        </div>
                     </div>
                 )}
            </div>
        )}
    </div>
  );
};

export default BattleView;
