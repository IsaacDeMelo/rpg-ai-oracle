
import React, { useState, useRef } from 'react';
import { Character, Attribute } from '../types';
import { Trash2, Plus, Save, User, Swords, X, Shield, Zap, Scroll, Download, Upload, Sparkles } from 'lucide-react';
import { updateCharacterBackstory } from '../services/geminiService';

interface CharactersViewProps {
  characters: Character[];
  setCharacters: (chars: Character[]) => void;
  worldLore?: string;
}

const CharactersView: React.FC<CharactersViewProps> = ({ characters, setCharacters, worldLore }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Sync State
  const [isSyncing, setIsSyncing] = useState(false); // For Edit Form
  const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set()); // For Quick Actions

  // Form State
  const [name, setName] = useState('');
  const [race, setRace] = useState('');
  const [height, setHeight] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [voiceNotes, setVoiceNotes] = useState('');
  const [attributes, setAttributes] = useState<Attribute[]>([{ key: 'Força', value: '10' }]);
  const [items, setItems] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);

  // Temporary inputs
  const [tempItem, setTempItem] = useState('');
  const [tempSkill, setTempSkill] = useState('');

  const resetForm = () => {
    setName('');
    setRace('');
    setHeight('');
    setDescription('');
    setImageUrl('');
    setVoiceNotes('');
    setAttributes([{ key: 'Força', value: '10' }]);
    setItems([]);
    setSkills([]);
    setTempItem('');
    setTempSkill('');
    setEditingId(null);
    setIsEditing(false);
  };

  const handleEdit = (char: Character) => {
    setName(char.name);
    setRace(char.race || '');
    setHeight(char.height || '');
    setDescription(char.description);
    setImageUrl(char.imageUrl);
    setVoiceNotes(char.voiceNotes);
    setAttributes(char.attributes);
    setItems(char.items || []);
    setSkills(char.skills || []);
    setEditingId(char.id);
    setIsEditing(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja banir este personagem para o oblívio?')) {
      setCharacters(characters.filter(c => c.id !== id));
    }
  };

  const handleSave = () => {
    const newChar: Character = {
      id: editingId || crypto.randomUUID(),
      name,
      race,
      height,
      description,
      imageUrl: imageUrl || 'https://picsum.photos/200/300',
      voiceNotes,
      attributes: attributes.filter(a => a.key.trim() !== ''),
      items: items.filter(i => i.trim() !== ''),
      skills: skills.filter(s => s.trim() !== '')
    };

    if (editingId) {
      setCharacters(characters.map(c => c.id === editingId ? newChar : c));
    } else {
      setCharacters([...characters, newChar]);
    }
    resetForm();
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(characters, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "personagens_rpg.json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const parsed = JSON.parse(content);
          
          if (Array.isArray(parsed)) {
            // Basic validation check
            const hasValidStructure = parsed.every(c => c.name && c.id);
            
            if (!hasValidStructure) {
               alert("O arquivo não parece conter uma lista válida de personagens do RPG World Forge.");
               return;
            }

            if (window.confirm(`Encontrados ${parsed.length} personagens. Deseja ADICIONAR à lista atual? \n(Clique em 'Cancelar' para SUBSTITUIR a lista atual)`)) {
                // Append
                // Remove duplicates based on ID to avoid issues
                const existingIds = new Set(characters.map(c => c.id));
                const newChars = parsed.filter((c: Character) => !existingIds.has(c.id));
                setCharacters([...characters, ...newChars]);
                alert(`${newChars.length} novos personagens importados.`);
            } else {
                // Replace
                if(window.confirm("Tem certeza? Todos os personagens atuais serão perdidos.")) {
                    setCharacters(parsed);
                }
            }
          } else {
            alert("O formato do JSON deve ser uma lista (array).");
          }
        } catch (err) {
          console.error(err);
          alert("Erro ao ler o arquivo JSON.");
        }
      };
      reader.readAsText(file);
    }
    // Reset input
    event.target.value = '';
  };

  const handleSyncLore = async () => {
    if (!worldLore || worldLore.length < 20) {
        alert("As Crônicas do Mundo estão vazias. Escreva ou importe o Lore primeiro.");
        return;
    }
    if (!name) return;

    setIsSyncing(true);
    // Gather context of other characters (names/races only to save tokens)
    const others = characters
        .filter(c => c.id !== editingId)
        .map(c => `${c.name} (${c.race})`)
        .join(', ');

    const currentData: Character = {
        id: 'temp', name, race, height, description, imageUrl, voiceNotes, 
        attributes, items, skills
    };

    const result = await updateCharacterBackstory(currentData, worldLore, others);
    
    if (result) {
         if (window.confirm("A IA gerou uma nova interpretação baseada no Lore. Deseja substituir a Descrição e Personalidade?")) {
            setDescription(result);
            // alert("História atualizada com sucesso!"); Handled by system log override
         }
    }
    setIsSyncing(false);
  };

  const handleQuickSync = async (char: Character) => {
      if (!worldLore || worldLore.length < 20) {
          alert("Lore vazio! Preencha as Crônicas do Mundo primeiro.");
          return;
      }
      if (syncingIds.has(char.id)) return;

      if (!window.confirm(`Deseja que a IA reescreva a história de "${char.name}" para se adequar às Crônicas do Mundo atuais?`)) return;

      setSyncingIds(prev => new Set(prev).add(char.id));

      const others = characters
        .filter(c => c.id !== char.id)
        .map(c => `${c.name} (${c.race})`)
        .join(', ');
      
      try {
          const newDesc = await updateCharacterBackstory(char, worldLore, others);
          if (newDesc && !newDesc.startsWith('Erro')) {
              setCharacters(characters.map(c => c.id === char.id ? { ...c, description: newDesc } : c));
          }
      } catch (e) {
          console.error(e);
      } finally {
          setSyncingIds(prev => {
              const next = new Set(prev);
              next.delete(char.id);
              return next;
          });
      }
  };

  // List Handlers
  const addItem = () => { if(tempItem.trim()) { setItems([...items, tempItem]); setTempItem(''); }};
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));
  
  const addSkill = () => { if(tempSkill.trim()) { setSkills([...skills, tempSkill]); setTempSkill(''); }};
  const removeSkill = (idx: number) => setSkills(skills.filter((_, i) => i !== idx));

  const addAttribute = () => setAttributes([...attributes, { key: '', value: '' }]);
  const updateAttribute = (index: number, field: 'key' | 'value', val: string) => {
    const newAttrs = [...attributes];
    newAttrs[index][field] = val;
    setAttributes(newAttrs);
  };
  const removeAttribute = (index: number) => setAttributes(attributes.filter((_, i) => i !== index));

  if (isEditing) {
    return (
      <div className="bg-stone-900 p-8 rounded-sm shadow-2xl border-2 border-stone-700 relative animate-fade-in bg-opacity-95">
         {/* Decorative Corner */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-amber-600" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-amber-600" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-amber-600" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-amber-600" />

        <div className="flex justify-between items-center mb-8 pb-4 border-b border-stone-800">
          <h2 className="text-3xl font-bold text-amber-500 font-cinzel tracking-wider flex items-center gap-2">
            <Scroll className="text-stone-500"/>
            {editingId ? 'Editar Lenda' : 'Novo Personagem'}
          </h2>
          <div className="flex items-center gap-4">
              {worldLore && (
                  <button 
                    onClick={handleSyncLore}
                    disabled={isSyncing || !name}
                    className="flex items-center gap-2 text-xs font-bold text-violet-400 hover:text-violet-300 border border-violet-900/50 bg-violet-900/20 px-3 py-2 rounded transition disabled:opacity-50"
                    title="Reescrever história com base no Lore do Mundo"
                  >
                      <Sparkles size={14} className={isSyncing ? "animate-spin" : ""} />
                      {isSyncing ? "Sincronizando..." : "Harmonizar com Lore"}
                  </button>
              )}
              <button onClick={resetForm} className="text-stone-500 hover:text-amber-500 transition">
                <X size={28} />
              </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="block text-xs uppercase tracking-widest text-stone-500 mb-1 font-bold">Nome do Herói</label>
                <input 
                  type="text" value={name} onChange={e => setName(e.target.value)}
                  className="w-full rpg-input text-xl font-cinzel text-amber-100 p-2"
                  placeholder="Ex: Aragorn II"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-stone-500 mb-1 font-bold">Raça / Ancestralidade</label>
                <input 
                  type="text" value={race} onChange={e => setRace(e.target.value)}
                  className="w-full rpg-input text-stone-300 p-2"
                  placeholder="Ex: Humano (Dúnedain)"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-stone-500 mb-1 font-bold">Altura / Porte</label>
                <input 
                  type="text" value={height} onChange={e => setHeight(e.target.value)}
                  className="w-full rpg-input text-stone-300 p-2"
                  placeholder="Ex: 1.98m"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-stone-500 mb-1 font-bold">Retrato (URL)</label>
              <input 
                type="text" value={imageUrl} onChange={e => setImageUrl(e.target.value)}
                className="w-full rpg-input text-stone-400 p-2 text-sm font-mono"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-stone-500 mb-1 font-bold">História & Aparência</label>
              <textarea 
                value={description} onChange={e => setDescription(e.target.value)}
                className="w-full bg-stone-950/50 border border-stone-800 rounded p-3 text-stone-300 h-28 focus:border-amber-700 focus:outline-none resize-none"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-stone-500 mb-1 font-bold flex items-center gap-2">
                 <User size={14} /> Personalidade (Prompt IA)
              </label>
              <textarea 
                value={voiceNotes} onChange={e => setVoiceNotes(e.target.value)}
                className="w-full bg-stone-950/50 border border-stone-800 rounded p-3 text-stone-300 h-24 focus:border-amber-700 focus:outline-none resize-none"
                placeholder="Descreva como o personagem fala, seus maneirismos e medos..."
              />
            </div>
          </div>

          <div className="space-y-6">
            {/* Attributes */}
            <div className="bg-stone-950/40 p-5 rounded border border-stone-800">
              <div className="flex justify-between items-center mb-4 border-b border-stone-800 pb-2">
                <label className="block text-sm text-amber-500 font-cinzel font-bold">Atributos Principais</label>
                <button onClick={addAttribute} className="text-xs bg-stone-800 hover:bg-stone-700 px-3 py-1 rounded text-stone-300 flex items-center gap-1 border border-stone-700">
                  <Plus size={14} /> Novo
                </button>
              </div>
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                {attributes.map((attr, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input 
                      type="text" value={attr.key} onChange={e => updateAttribute(idx, 'key', e.target.value)}
                      placeholder="Atributo" className="w-1/2 bg-transparent border-b border-stone-700 text-stone-300 p-1 text-sm focus:border-amber-600 focus:outline-none text-right"
                    />
                    <div className="w-2 h-px bg-stone-700"></div>
                    <input 
                      type="text" value={attr.value} onChange={e => updateAttribute(idx, 'value', e.target.value)}
                      placeholder="Valor" className="w-1/2 bg-stone-800/50 border border-stone-700 rounded p-1 text-sm text-amber-400 font-mono text-center focus:border-amber-600 focus:outline-none"
                    />
                    <button onClick={() => removeAttribute(idx)} className="text-stone-600 hover:text-red-500 transition"><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
            </div>

            {/* Items */}
            <div className="bg-stone-950/40 p-5 rounded border border-stone-800">
              <label className="block text-sm text-amber-500 font-cinzel font-bold mb-3 flex items-center gap-2"><Shield size={16}/> Inventário & Equipamento</label>
              <div className="flex gap-2 mb-3">
                <input 
                  type="text" value={tempItem} onChange={e => setTempItem(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addItem()}
                  placeholder="Adicionar item..." className="flex-1 bg-stone-800 border-none rounded p-2 text-sm text-stone-300 placeholder-stone-600"
                />
                <button onClick={addItem} className="bg-stone-700 px-3 rounded text-stone-300 hover:bg-stone-600 hover:text-white transition"><Plus size={16}/></button>
              </div>
              <div className="flex flex-wrap gap-2">
                {items.map((item, idx) => (
                  <span key={idx} className="bg-stone-800 text-stone-300 text-xs px-2 py-1 rounded border border-stone-600 flex items-center gap-2 group">
                    {item} <button onClick={() => removeItem(idx)} className="text-stone-600 group-hover:text-red-400"><X size={12}/></button>
                  </span>
                ))}
              </div>
            </div>

             {/* Skills */}
             <div className="bg-stone-950/40 p-5 rounded border border-stone-800">
              <label className="block text-sm text-violet-400 font-cinzel font-bold mb-3 flex items-center gap-2"><Zap size={16}/> Grimório & Habilidades</label>
              <div className="flex gap-2 mb-3">
                <input 
                  type="text" value={tempSkill} onChange={e => setTempSkill(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addSkill()}
                  placeholder="Adicionar magia/talento..." className="flex-1 bg-stone-800 border-none rounded p-2 text-sm text-stone-300 placeholder-stone-600"
                />
                <button onClick={addSkill} className="bg-violet-900/30 px-3 rounded text-violet-300 hover:bg-violet-800 hover:text-white transition border border-violet-800/30"><Plus size={16}/></button>
              </div>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, idx) => (
                  <span key={idx} className="bg-violet-950/30 text-violet-200 text-xs px-2 py-1 rounded border border-violet-800/50 flex items-center gap-2 group">
                    {skill} <button onClick={() => removeSkill(idx)} className="text-violet-500/50 group-hover:text-red-400"><X size={12}/></button>
                  </span>
                ))}
              </div>
            </div>

          </div>
        </div>

        <div className="mt-8 flex justify-end gap-4 border-t border-stone-800 pt-6">
          <button onClick={resetForm} className="px-6 py-2 rounded font-cinzel text-stone-500 hover:text-stone-300 transition uppercase tracking-wider text-sm">Descartar</button>
          <button 
            onClick={handleSave} disabled={!name}
            className="bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-stone-100 px-8 py-2 rounded shadow-lg flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed font-cinzel font-bold tracking-wide border border-amber-500/30"
          >
            <Save size={18} /> Gravar nos Registros
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-2 border-amber-900/30 pb-4 gap-4">
        <div>
           <h2 className="text-4xl font-black font-cinzel text-stone-100 drop-shadow-sm">Galeria de Heróis</h2>
           <p className="text-stone-500 font-cinzel text-sm mt-1">Gerencie as almas que habitam este mundo</p>
        </div>
        
        <div className="flex gap-3">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImportJSON} 
            className="hidden" 
            accept=".json"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-400 hover:text-stone-200 px-4 py-3 rounded flex items-center gap-2 transition shadow-lg"
            title="Importar JSON"
          >
            <Upload size={18} /> <span className="font-cinzel text-sm hidden md:inline">Importar</span>
          </button>
          
          <button 
            onClick={handleExportJSON}
            className="bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-400 hover:text-stone-200 px-4 py-3 rounded flex items-center gap-2 transition shadow-lg"
            title="Baixar JSON"
          >
            <Download size={18} /> <span className="font-cinzel text-sm hidden md:inline">Exportar</span>
          </button>
          
          <button 
            onClick={() => setIsEditing(true)}
            className="bg-stone-800 hover:bg-stone-700 border border-amber-900/50 text-amber-500 px-5 py-3 rounded flex items-center gap-2 transition shadow-lg hover:shadow-amber-900/20 group"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300"/> <span className="font-cinzel font-bold">Criar Personagem</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {characters.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-24 bg-stone-900/30 rounded-lg border-2 border-dashed border-stone-800">
            <User size={64} className="text-stone-700 mb-6" />
            <p className="text-stone-400 text-xl font-cinzel">Nenhum herói encontrado.</p>
            <p className="text-stone-600 text-sm mt-2">O pergaminho está em branco. Comece a escrever ou importe uma lista.</p>
          </div>
        )}

        {characters.map(char => (
          <div key={char.id} className="bg-stone-900 group relative rounded-sm shadow-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 border border-stone-800 hover:border-amber-600/50">
            {/* Image Container */}
            <div className="h-64 overflow-hidden relative border-b-4 border-amber-900/80">
              <img 
                src={char.imageUrl} alt={char.name} 
                className="w-full h-full object-cover group-hover:scale-110 transition duration-700 filter grayscale-[20%] group-hover:grayscale-0"
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://picsum.photos/400/200?grayscale'; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent opacity-90" />
              
              <div className="absolute bottom-0 left-0 w-full p-4">
                <h3 className="text-2xl font-bold text-stone-100 font-cinzel drop-shadow-md">{char.name}</h3>
                {(char.race || char.height) && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="h-px w-8 bg-amber-500/50 inline-block"></span>
                    <p className="text-amber-500 text-xs font-bold uppercase tracking-widest font-sans">
                      {char.race} {char.height ? `• ${char.height}` : ''}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Card Body */}
            <div className="p-5 space-y-4">
              <p className="text-stone-400 text-sm leading-relaxed line-clamp-3 italic font-serif">
                "{char.description}"
              </p>
              
              <div className="grid grid-cols-2 gap-3 pt-2">
                {char.attributes.slice(0, 4).map((attr, idx) => (
                  <div key={idx} className="bg-black/20 p-2 rounded border border-stone-800 flex justify-between items-center">
                    <span className="text-stone-500 text-[10px] uppercase font-bold tracking-wider">{attr.key.slice(0,8)}</span>
                    <span className="text-amber-100 font-mono font-bold">{attr.value}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-4 text-xs text-stone-500 border-t border-stone-800 pt-3 mt-2">
                <span className="flex items-center gap-1.5"><Shield size={12} className="text-stone-600"/> {char.items?.length || 0} Equip.</span>
                <span className="flex items-center gap-1.5"><Zap size={12} className="text-violet-900"/> {char.skills?.length || 0} Habilidades</span>
              </div>
            </div>

            {/* Actions Overlay */}
            <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
               {worldLore && (
                  <button 
                    onClick={() => handleQuickSync(char)}
                    disabled={syncingIds.has(char.id)}
                    className="p-2 bg-stone-900 text-violet-500 hover:bg-violet-900 hover:text-white rounded shadow-lg border border-violet-900/50 transition"
                    title="Sincronizar com Lore"
                  >
                    <Sparkles size={18} className={syncingIds.has(char.id) ? "animate-spin" : ""} />
                  </button>
               )}
              <button 
                onClick={() => handleEdit(char)}
                className="p-2 bg-stone-900 text-amber-500 hover:bg-amber-600 hover:text-white rounded shadow-lg border border-amber-900/50 transition"
                title="Editar"
              >
                <Swords size={18} />
              </button>
              <button 
                onClick={() => handleDelete(char.id)}
                className="p-2 bg-stone-900 text-stone-500 hover:bg-red-900 hover:text-white rounded shadow-lg border border-stone-700 transition"
                title="Excluir"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CharactersView;
