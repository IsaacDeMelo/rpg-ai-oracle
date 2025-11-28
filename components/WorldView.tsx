
import React, { useState } from 'react';
import { Location } from '../types';
import { Map as MapIcon, Plus, Save, Trash2, X, MapPin, BookOpen, Eye, PenTool, ShieldAlert } from 'lucide-react';

interface WorldViewProps {
  locations: Location[];
  setLocations: (locs: Location[]) => void;
}

const WorldView: React.FC<WorldViewProps> = ({ locations, setLocations }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // View Only State
  const [viewingId, setViewingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setName('');
    setDescription('');
    setImageUrl('');
    setNotes('');
    setEditingId(null);
    setIsEditing(false);
  };

  const handleEdit = (loc: Location) => {
    setViewingId(null); // Close view if open
    setName(loc.name);
    setDescription(loc.description);
    setImageUrl(loc.imageUrl);
    setNotes(loc.notes);
    setEditingId(loc.id);
    setIsEditing(true);
  };
  
  const handleView = (id: string) => {
      setViewingId(id);
      setIsEditing(false);
  }

  const handleDelete = (id: string) => {
    if (window.confirm('A destruição deste local será permanente. Continuar?')) {
      setLocations(locations.filter(l => l.id !== id));
      if (viewingId === id) setViewingId(null);
    }
  };

  const handleSave = () => {
    const newLoc: Location = {
      id: editingId || crypto.randomUUID(),
      name,
      description,
      imageUrl: imageUrl || 'https://picsum.photos/400/300',
      notes
    };

    if (editingId) {
      setLocations(locations.map(l => l.id === editingId ? newLoc : l));
    } else {
      setLocations([...locations, newLoc]);
    }
    resetForm();
  };

  // --- VIEW MODE MODAL ---
  const ViewingModal = () => {
      const loc = locations.find(l => l.id === viewingId);
      if (!loc) return null;

      return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setViewingId(null)}>
              <div className="bg-stone-900 w-full max-w-4xl max-h-[90vh] rounded border-2 border-emerald-900/50 shadow-2xl overflow-y-auto custom-scrollbar relative flex flex-col" onClick={e => e.stopPropagation()}>
                  
                  {/* Close Button */}
                  <button onClick={() => setViewingId(null)} className="absolute top-4 right-4 z-20 bg-black/50 hover:bg-emerald-900 text-white p-2 rounded-full transition"><X size={24}/></button>
                  
                  {/* Hero Image */}
                  <div className="w-full h-80 relative flex-shrink-0">
                      <img src={loc.imageUrl} className="w-full h-full object-cover" alt={loc.name} />
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/40 to-transparent"></div>
                      <div className="absolute bottom-0 left-0 p-8 w-full">
                          <div className="flex items-center gap-3 mb-2 text-emerald-500 font-cinzel font-bold text-sm tracking-widest uppercase">
                              <MapPin size={16}/> Local Conhecido
                          </div>
                          <h1 className="text-5xl md:text-6xl font-black font-cinzel text-white drop-shadow-lg leading-none">{loc.name}</h1>
                      </div>
                  </div>

                  <div className="p-8 md:p-12 space-y-10 flex-1 bg-stone-900">
                      <div className="prose prose-invert prose-stone max-w-none">
                          <p className="text-xl md:text-2xl font-serif text-stone-300 leading-relaxed italic border-l-4 border-emerald-700 pl-6 py-2 bg-gradient-to-r from-emerald-900/10 to-transparent">
                              "{loc.description}"
                          </p>
                      </div>

                      {loc.notes && (
                          <div className="bg-stone-950 p-6 rounded border border-stone-800 relative group overflow-hidden">
                               <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none text-emerald-500">
                                   <ShieldAlert size={100} />
                               </div>
                               <h3 className="text-sm font-bold text-stone-500 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-stone-800 pb-2">
                                   <BookOpen size={16}/> Notas do Mestre (Confidencial)
                               </h3>
                               <p className="font-mono text-stone-400 text-sm leading-relaxed whitespace-pre-wrap">{loc.notes}</p>
                          </div>
                      )}

                      <div className="flex justify-end pt-8 border-t border-stone-800">
                           <button onClick={() => handleEdit(loc)} className="flex items-center gap-2 text-stone-500 hover:text-emerald-500 transition px-4 py-2 rounded hover:bg-stone-800">
                               <PenTool size={16}/> Reescrever Cartografia
                           </button>
                      </div>
                  </div>
              </div>
          </div>
      )
  };

  if (isEditing) {
    return (
      <div className="bg-stone-900 p-8 rounded border-2 border-stone-700 shadow-2xl animate-fade-in relative overflow-hidden">
        {/* Decorative background for form */}
        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
            <MapIcon size={200} />
        </div>

        <div className="flex justify-between items-center mb-6 border-b border-stone-800 pb-4 relative z-10">
          <h2 className="text-3xl font-bold text-emerald-600 font-cinzel flex items-center gap-3">
            <MapPin /> {editingId ? 'Reescrever Geografia' : 'Novo Território'}
          </h2>
          <button onClick={resetForm} className="text-stone-500 hover:text-white transition">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-1">Nome do Local</label>
                <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)}
                className="w-full rpg-input text-xl text-stone-200 p-2 font-cinzel"
                placeholder="Ex: Floresta dos Sussurros"
                />
            </div>
             <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-1">Imagem (URL)</label>
                <input 
                type="text" 
                value={imageUrl} 
                onChange={e => setImageUrl(e.target.value)}
                className="w-full rpg-input text-stone-400 p-2 text-sm"
                placeholder="https://..."
                />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-1">Descrição Pública</label>
            <textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-stone-950/50 border border-stone-800 rounded p-3 text-stone-300 h-28 focus:border-emerald-700 focus:outline-none resize-none font-serif"
              placeholder="O que os viajantes veem e sentem..."
            />
          </div>
          <div className="bg-black/20 p-4 rounded border border-stone-800/50">
            <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-1 flex items-center gap-2">
                <BookOpen size={14}/> Segredos do Mestre (DM Only)
            </label>
            <textarea 
              value={notes} 
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-transparent border-none text-stone-400 h-24 focus:outline-none font-mono text-sm resize-none"
              placeholder="Armadilhas, tesouros ocultos e ganchos de aventura..."
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3 relative z-10">
          <button onClick={resetForm} className="px-4 py-2 rounded text-stone-500 hover:text-stone-300 transition uppercase text-sm font-bold tracking-wide">Cancelar</button>
          <button 
            onClick={handleSave}
            disabled={!name}
            className="bg-emerald-800 hover:bg-emerald-700 text-emerald-100 px-6 py-2 rounded shadow-lg flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed font-cinzel font-bold border border-emerald-600/30"
          >
            <Save size={18} /> Mapear Local
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {viewingId && <ViewingModal />}

      <div className="flex justify-between items-center border-b-2 border-stone-800 pb-4">
        <div>
            <h2 className="text-4xl font-cinzel font-black text-stone-200">Atlas do Mundo</h2>
            <p className="text-stone-500 font-cinzel text-sm mt-1">Lugares conhecidos e terras esquecidas</p>
        </div>
        <button 
          onClick={() => setIsEditing(true)}
          className="bg-emerald-900/40 hover:bg-emerald-900/60 border border-emerald-800 text-emerald-500 px-5 py-3 rounded flex items-center gap-2 transition shadow-lg hover:shadow-emerald-900/20"
        >
          <Plus size={20} /> <span className="font-cinzel font-bold">Novo Local</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {locations.length === 0 && (
          <div className="col-span-full text-center py-24 bg-stone-900/30 rounded border-2 border-dashed border-stone-800">
            <MapIcon size={64} className="mx-auto text-stone-700 mb-4 opacity-50" />
            <p className="text-stone-400 text-xl font-cinzel">Terra Incognita</p>
            <p className="text-stone-600 text-sm mt-2">O mapa está em branco. Comece sua cartografia.</p>
          </div>
        )}

        {locations.map(loc => (
          <div key={loc.id} className="bg-stone-900 rounded overflow-hidden border border-stone-800 shadow-xl hover:shadow-2xl hover:border-emerald-700/50 transition duration-500 group relative cursor-pointer" onClick={() => handleView(loc.id)}>
            <div className="h-72 overflow-hidden relative">
              <img 
                src={loc.imageUrl} 
                alt={loc.name} 
                className="w-full h-full object-cover group-hover:scale-110 transition duration-1000 filter sepia-[20%] group-hover:sepia-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://picsum.photos/400/300?grayscale';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/20 to-transparent" />
              
              {/* View Icon Overlay */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-500 bg-black/20 backdrop-blur-[1px]">
                 <Eye size={48} className="text-white drop-shadow-lg" />
              </div>

              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition duration-300 z-10" onClick={e => e.stopPropagation()}>
                   <button 
                    onClick={() => handleView(loc.id)}
                    className="p-2 bg-stone-900/90 text-stone-200 rounded hover:bg-stone-700 transition shadow-lg"
                    title="Ler Detalhes"
                  >
                    <Eye size={18} />
                  </button>
                   <button 
                    onClick={() => handleEdit(loc)}
                    className="p-2 bg-stone-900/90 text-emerald-500 rounded hover:bg-emerald-700 hover:text-white transition shadow-lg"
                    title="Editar"
                  >
                    <MapPin size={18} />
                  </button>
                  <button 
                    onClick={() => handleDelete(loc.id)}
                    className="p-2 bg-stone-900/90 text-stone-500 rounded hover:bg-red-900 hover:text-white transition shadow-lg"
                    title="Apagar"
                  >
                    <Trash2 size={18} />
                  </button>
              </div>

              <div className="absolute bottom-0 left-0 w-full p-6">
                 <h3 className="text-3xl font-bold text-stone-100 font-cinzel drop-shadow-lg mb-1">{loc.name}</h3>
                 <div className="w-16 h-1 bg-emerald-700 mb-3"></div>
                 <p className="text-stone-300 text-sm leading-relaxed font-serif line-clamp-2 text-shadow-sm">{loc.description}</p>
              </div>
            </div>
            
            {loc.notes && (
                 <div className="bg-stone-950 p-4 border-t border-stone-800">
                    <h4 className="text-stone-600 text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
                        <BookOpen size={10}/> Notas do Mestre
                    </h4>
                    <p className="text-stone-500 text-xs font-mono line-clamp-2 group-hover:line-clamp-none transition-all">{loc.notes}</p>
                 </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorldView;
