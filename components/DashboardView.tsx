import React from 'react';
import { Users, Map, Book, MessageCircle, Swords, Feather, ChevronRight, Crown, Star } from 'lucide-react';
import { ViewState } from '../types';

interface DashboardViewProps {
  setActiveView: (view: ViewState) => void;
  stats: {
    chars: number;
    locs: number;
    pages: number;
  }
}

const DashboardView: React.FC<DashboardViewProps> = ({ setActiveView, stats }) => {
  
  const FeatureCard = ({ icon, title, desc, action, view, color }: { icon: React.ReactNode, title: string, desc: string, action: string, view: ViewState, color: string }) => (
    <div 
        onClick={() => setActiveView(view)}
        className="group relative bg-stone-900/50 border border-stone-800 hover:border-amber-700/50 p-6 rounded-lg cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl overflow-hidden"
    >
        <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-500 ${color}`}>
            {React.cloneElement(icon as React.ReactElement<any>, { size: 100 })}
        </div>
        
        <div className={`${color} mb-4 transform group-hover:scale-110 transition-transform duration-300 inline-block`}>
            {icon}
        </div>
        
        <h3 className="text-xl font-bold font-cinzel text-stone-200 mb-2 group-hover:text-amber-500 transition-colors">{title}</h3>
        <p className="text-stone-500 text-sm leading-relaxed mb-6 font-serif h-12">{desc}</p>
        
        <div className="flex items-center text-xs font-bold uppercase tracking-widest text-stone-600 group-hover:text-stone-300 transition-colors">
            {action} <ChevronRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
        </div>
    </div>
  );

  return (
    <div className="animate-fade-in space-y-16 pb-12">
        {/* Hero Section */}
        <div className="relative py-16 md:py-24 text-center overflow-hidden rounded-2xl border border-stone-800 bg-stone-900 shadow-2xl">
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/dark-matter.png')" }}></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-600/10 blur-[100px] rounded-full pointer-events-none"></div>

            <div className="relative z-10 space-y-6 px-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-900/20 border border-amber-800/50 text-amber-500 text-xs font-bold uppercase tracking-widest mb-4">
                    <Star size={12} className="fill-amber-500" /> v1.5 System Online
                </div>
                
                <h1 className="text-5xl md:text-7xl font-black font-cinzel text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-400 to-amber-800 drop-shadow-sm tracking-tight">
                    RPG WORLD FORGE
                </h1>
                
                <p className="max-w-2xl mx-auto text-lg md:text-xl text-stone-400 font-cinzel leading-relaxed">
                    A forja definitiva para Mestres e Escritores. <br/>
                    <span className="text-stone-500 font-serif italic text-base">Crie almas, desenhe mapas, narre lendas e simule o destino com Inteligência Artificial.</span>
                </p>

                <div className="flex justify-center gap-4 pt-6">
                    <button 
                        onClick={() => setActiveView('characters')}
                        className="bg-amber-700 hover:bg-amber-600 text-white px-8 py-3 rounded shadow-lg shadow-amber-900/20 font-cinzel font-bold tracking-wide transition-all hover:scale-105 flex items-center gap-2"
                    >
                        <Users size={20} /> Começar Criação
                    </button>
                    <button 
                        onClick={() => setActiveView('lore')}
                        className="bg-stone-800 hover:bg-stone-700 text-stone-300 px-8 py-3 rounded shadow-lg border border-stone-700 font-cinzel font-bold tracking-wide transition-all hover:scale-105 flex items-center gap-2"
                    >
                        <Book size={20} /> Ver Crônicas
                    </button>
                </div>
            </div>
            
            {/* Stats Bar */}
            <div className="absolute bottom-0 left-0 w-full bg-stone-900/80 border-t border-stone-800 py-4 flex justify-center gap-8 md:gap-16 text-stone-500 text-xs font-mono uppercase tracking-widest backdrop-blur-sm">
                <div className="flex flex-col items-center">
                    <span className="text-lg font-bold text-stone-300">{stats.chars}</span>
                    <span>Personagens</span>
                </div>
                <div className="flex flex-col items-center">
                    <span className="text-lg font-bold text-stone-300">{stats.locs}</span>
                    <span>Locais</span>
                </div>
                <div className="flex flex-col items-center">
                    <span className="text-lg font-bold text-stone-300">{stats.pages}</span>
                    <span>Páginas Escritas</span>
                </div>
            </div>
        </div>

        {/* Features Grid */}
        <div className="space-y-6">
            <div className="flex items-center gap-4 mb-8">
                <div className="h-px flex-1 bg-stone-800"></div>
                <h2 className="text-2xl font-cinzel text-stone-400 font-bold tracking-wider">Módulos da Forja</h2>
                <div className="h-px flex-1 bg-stone-800"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <FeatureCard 
                    icon={<Users />}
                    title="Galeria de Heróis"
                    desc="Crie fichas detalhadas com raça, atributos e inventário. Defina a personalidade para a IA."
                    action="Gerenciar Almas"
                    view="characters"
                    color="text-amber-500"
                />
                <FeatureCard 
                    icon={<Map />}
                    title="Atlas Mundial"
                    desc="Mapeie geografia, cidades e masmorras. Guarde segredos que apenas o Mestre pode ver."
                    action="Abrir Mapas"
                    view="world"
                    color="text-emerald-500"
                />
                 <FeatureCard 
                    icon={<Feather />}
                    title="Livro de Contos"
                    desc="Um editor imersivo paginado para escrever suas cenas. Transcreva-as magicamente para o Lore."
                    action="Escrever História"
                    view="story"
                    color="text-stone-200"
                />
                 <FeatureCard 
                    icon={<Swords />}
                    title="Arena de Sangue"
                    desc="Coloque dois personagens para lutar. A IA narra o combate turno a turno baseado nos atributos."
                    action="Iniciar Combate"
                    view="battle"
                    color="text-red-500"
                />
                 <FeatureCard 
                    icon={<MessageCircle />}
                    title="Oráculo Mágico"
                    desc="Converse diretamente com seus personagens. Teste diálogos e reações em tempo real."
                    action="Invocar Chat"
                    view="simulator"
                    color="text-violet-500"
                />
                 <FeatureCard 
                    icon={<Book />}
                    title="Registro Akáshico"
                    desc="O banco de dados central da história (Lore). Tudo aqui serve de contexto para as IAs."
                    action="Ler Crônicas"
                    view="lore"
                    color="text-blue-500"
                />
            </div>
        </div>
        
        <footer className="text-center text-stone-600 text-xs font-mono py-8 opacity-50">
            RPG WORLD FORGE &copy; {new Date().getFullYear()} • Powered by Gemini AI • React 19
        </footer>
    </div>
  );
};

export default DashboardView;