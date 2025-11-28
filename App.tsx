
import React, { useState } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Character, Location, ViewState, StoryPage } from './types';
import CharactersView from './components/CharactersView';
import WorldView from './components/WorldView';
import SimulatorView from './components/SimulatorView';
import BattleView from './components/BattleView';
import LoreView from './components/LoreView';
import StoryView from './components/StoryView';
import DashboardView from './components/DashboardView';
import SystemLog from './components/SystemLog';
import { Scroll, Users, Map, MessageCircle, Sword, Swords, Book, Feather } from 'lucide-react';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewState>('dashboard');
  // LocalStorage persistence happens here automatically via the hook
  const [characters, setCharacters] = useLocalStorage<Character[]>('rpg-characters', []);
  const [locations, setLocations] = useLocalStorage<Location[]>('rpg-locations', []);
  const [worldLore, setWorldLore] = useLocalStorage<string>('rpg-world-lore', '');
  const [storyPages, setStoryPages] = useLocalStorage<StoryPage[]>('rpg-story-book', [{ id: 'init', title: 'Capítulo I: O Início', content: '' }]);

  const handleAddToLore = (summary: string) => {
    const timestamp = new Date().toLocaleDateString('pt-BR');
    const newEntry = `\n\n--- REGISTRO ADICIONADO DOS CONTOS (${timestamp}) ---\n${summary}`;
    setWorldLore(prev => prev ? prev + newEntry : newEntry);
  };

  // Dynamic styles based on active view to maximize writing space
  const mainContainerClass = activeView === 'story' 
    ? "ml-20 md:ml-64 p-2 md:p-4 min-h-screen transition-all duration-300 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-stone-800 via-stone-950 to-black"
    : "ml-20 md:ml-64 p-6 md:p-10 min-h-screen transition-all duration-300 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-stone-800 via-stone-950 to-black";

  const contentWrapperClass = activeView === 'story'
    ? "mx-auto w-full max-w-[1800px]"
    : "max-w-7xl mx-auto";

  return (
    <div className="min-h-screen text-stone-200 font-sans selection:bg-amber-900/50">
      <SystemLog />
      
      {/* Sidebar Navigation */}
      <nav className="fixed left-0 top-0 h-full w-20 md:w-64 bg-stone-900 border-r-2 border-amber-900/30 flex flex-col z-50 shadow-[4px_0_24px_rgba(0,0,0,0.5)]">
        <div className="p-6 border-b-2 border-amber-900/20 flex items-center gap-3 bg-stone-950/30">
          <div className="bg-gradient-to-br from-amber-600 to-amber-800 p-2.5 rounded-lg shadow-inner border border-amber-400/30">
            <Sword size={24} className="text-stone-900 fill-stone-900" />
          </div>
          <div className="hidden md:block">
            <span className="font-cinzel text-xl font-bold tracking-wider text-amber-500 block leading-none">
              World
            </span>
            <span className="font-cinzel text-sm text-stone-500 font-bold tracking-[0.2em] block">
              FORGE
            </span>
          </div>
        </div>

        <div className="flex-1 py-8 space-y-3 px-3 overflow-y-auto custom-scrollbar">
          <NavButton 
            active={activeView === 'dashboard'} 
            onClick={() => setActiveView('dashboard')}
            icon={<Scroll size={20} />}
            label="Início"
          />
          <div className="h-px bg-gradient-to-r from-transparent via-amber-900/30 to-transparent my-3 mx-4" />
          <NavButton 
            active={activeView === 'characters'} 
            onClick={() => setActiveView('characters')}
            icon={<Users size={20} />}
            label="Personagens"
            accentColor="amber"
          />
          <NavButton 
            active={activeView === 'world'} 
            onClick={() => setActiveView('world')}
            icon={<Map size={20} />}
            label="Mapas & Locais"
            accentColor="emerald"
          />
          <NavButton 
            active={activeView === 'story'} 
            onClick={() => setActiveView('story')}
            icon={<Feather size={20} />}
            label="Livro de Contos"
            accentColor="white"
          />
          <NavButton 
            active={activeView === 'lore'} 
            onClick={() => setActiveView('lore')}
            icon={<Book size={20} />}
            label="Crônicas (Lore)"
            accentColor="blue"
          />
          <NavButton 
            active={activeView === 'simulator'} 
            onClick={() => setActiveView('simulator')}
            icon={<MessageCircle size={20} />}
            label="Oráculo (Chat)"
            accentColor="violet"
          />
          <NavButton 
            active={activeView === 'battle'} 
            onClick={() => setActiveView('battle')}
            icon={<Swords size={20} />}
            label="Arena de Sangue"
            accentColor="red"
          />
        </div>

        <div className="p-4 border-t border-stone-800 bg-stone-950/30">
          <p className="text-[10px] text-stone-600 text-center font-mono hidden md:block uppercase tracking-widest">
            Sistema v1.5 • Salvo Localmente
          </p>
        </div>
      </nav>

      {/* Main Content */}
      <main className={mainContainerClass}>
        <div className={contentWrapperClass}>
          {/* 
            IMPLEMENTAÇÃO KEEP-ALIVE:
            Renderizamos todas as views, mas escondemos as inativas com CSS.
            Isso preserva o estado dos formulários (rascunhos) ao navegar.
          */}
          
          <div className={activeView === 'dashboard' ? 'block' : 'hidden'}>
            <DashboardView 
              setActiveView={setActiveView} 
              stats={{
                  chars: characters.length,
                  locs: locations.length,
                  pages: storyPages.length
              }}
            />
          </div>

          <div className={activeView === 'characters' ? 'block' : 'hidden'}>
            <CharactersView 
              characters={characters} 
              setCharacters={setCharacters} 
              worldLore={worldLore}
            />
          </div>

          <div className={activeView === 'world' ? 'block' : 'hidden'}>
            <WorldView locations={locations} setLocations={setLocations} />
          </div>

          <div className={activeView === 'lore' ? 'block' : 'hidden'}>
            <LoreView lore={worldLore} setLore={setWorldLore} />
          </div>

          <div className={activeView === 'story' ? 'block' : 'hidden'}>
            <StoryView pages={storyPages} setPages={setStoryPages} onAddToLore={handleAddToLore} worldLore={worldLore} />
          </div>

          <div className={activeView === 'simulator' ? 'block' : 'hidden'}>
            <SimulatorView characters={characters} worldLore={worldLore} />
          </div>

          <div className={activeView === 'battle' ? 'block' : 'hidden'}>
            <BattleView characters={characters} worldLore={worldLore} />
          </div>

        </div>
      </main>
    </div>
  );
};

// Subcomponent for Navigation Buttons
interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  accentColor?: 'amber' | 'emerald' | 'violet' | 'red' | 'blue' | 'white';
}

const NavButton: React.FC<NavButtonProps> = ({ active, onClick, icon, label, accentColor = 'amber' }) => {
  const activeClasses = {
    amber: 'text-amber-500 bg-amber-950/30 border-amber-900/50',
    emerald: 'text-emerald-500 bg-emerald-950/30 border-emerald-900/50',
    violet: 'text-violet-500 bg-violet-950/30 border-violet-900/50',
    red: 'text-red-500 bg-red-950/30 border-red-900/50',
    blue: 'text-blue-500 bg-blue-950/30 border-blue-900/50',
    white: 'text-stone-200 bg-stone-700/50 border-stone-500/50',
  };

  const activeStyle = activeClasses[accentColor];

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-300 group border
        ${active 
          ? `${activeStyle} shadow-lg` 
          : 'text-stone-500 border-transparent hover:bg-stone-800 hover:text-stone-300 hover:border-stone-700'
        }`}
    >
      <span className={`transition-colors duration-300 ${active ? '' : 'text-stone-600 group-hover:text-stone-400'}`}>
        {icon}
      </span>
      <span className={`font-cinzel font-semibold tracking-wide hidden md:block ${active ? 'text-stone-200' : ''}`}>
        {label}
      </span>
      {active && <div className={`ml-auto w-1.5 h-1.5 rounded-full hidden md:block shadow-[0_0_8px_currentColor]`} />}
    </button>
  );
};

export default App;
