
import React, { useState, useRef } from 'react';
import { Character, Attribute, Item, Skill } from '../types';
import { Trash2, Plus, Save, User, Swords, X, Shield, Zap, Scroll, Download, Upload, Sparkles, Coins, Package, Flame, Eye, PenTool } from 'lucide-react';
import { updateCharacterBackstory } from '../services/geminiService';

interface CharactersViewProps {
  characters: Character[];
  setCharacters: (chars: Character[]) => void;
  worldLore?: string;
}

const CharactersView: React.FC<CharactersViewProps> = ({ characters, setCharacters, worldLore }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // View Only State
  const [viewingId, setViewingId] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Sync State
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set());

  // Form State
  const [name, setName] = useState('');
  const [race, setRace] = useState('');
  const [height, setHeight] = useState('');
  const [money, setMoney] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [voiceNotes, setVoiceNotes] = useState('');
  const [attributes, setAttributes] = useState<Attribute[]>([{ key: 'Força', value: '10' }]);
  
  // Complex State
  const [items, setItems] = useState<Item[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);

  // Temp Item Input State
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemImg, setNewItemImg] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');

  // Temp Skill Input State
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCost, setNewSkillCost] = useState('');
  const [newSkillImg, setNewSkillImg] = useState('');
  const [newSkillDesc, setNewSkillDesc] = useState('');

  const resetForm = () => {
    setName('');
    setRace('');
    setHeight('');
    setMoney('');
    setDescription('');
    setImageUrl('');
    setVoiceNotes('');
    setAttributes([{ key: 'Força', value: '10' }]);
    setItems([]);
    setSkills([]);
    
    setNewItemName(''); setNewItemQty(1); setNewItemImg(''); setNewItemDesc('');
    setNewSkillName(''); setNewSkillCost(''); setNewSkillImg(''); setNewSkillDesc('');
    
    setEditingId(null);
    setIsEditing(false);
  };

  const handleEdit = (char: Character) => {
    // Close view mode if open
    setViewingId(null);

    setName(char.name);
    setRace(char.race || '');
    setHeight(char.height || '');
    setMoney(char.money || '');
    setDescription(char.description);
    setImageUrl(char.imageUrl);
    setVoiceNotes(char.voiceNotes);
    setAttributes(char.attributes);
    
    // Migration Logic
    const migratedItems: Item[] = (char.items || []).map(i => {
        if (typeof i === 'string') {
            return { id: crypto.randomUUID(), name: i, quantity: 1, description: '', imageUrl: '' };
        }
        return i;
    });

    const migratedSkills: Skill[] = (char.skills || []).map(s => {
        if (typeof s === 'string') {
            return { id: crypto.randomUUID(), name: s, cost: '', description: '', imageUrl: '', type: 'active' };
        }
        return s;
    });

    setItems(migratedItems);
    setSkills(migratedSkills);
    
    setEditingId(char.id);
    setIsEditing(true);
  };

  const handleView = (id: string) => {
      setViewingId(id);
      setIsEditing(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja banir este personagem para o oblívio?')) {
      setCharacters(characters.filter(c => c.id !== id));
      if (viewingId === id) setViewingId(null);
    }
  };

  const handleSave = () => {
    const newChar: Character = {
      id: editingId || crypto.randomUUID(),
      name,
      race,
      height,
      money,
      description,
      imageUrl: imageUrl || 'https://picsum.photos/200/300',
      voiceNotes,
      attributes: attributes.filter(a => a.key.trim() !== ''),
      items,
      skills
    };

    if (editingId) {
      setCharacters(characters.map(c => c.id === editingId ? newChar : c));
    } else {
      setCharacters([...characters, newChar]);
    }
    resetForm();
  };

  // --- Handlers for Complex Data ---
  const handleAddItem = () => {
    if (!newItemName.trim()) return;
    const item: Item = {
        id: crypto.randomUUID(),
        name: newItemName,
        quantity: newItemQty,
        description: newItemDesc,
        imageUrl: newItemImg
    };
    setItems([...items, item]);
    setNewItemName(''); setNewItemQty(1); setNewItemImg(''); setNewItemDesc('');
  };

  const handleRemoveItem = (id: string) => setItems(items.filter(i => i.id !== id));

  const handleAddSkill = () => {
    if (!newSkillName.trim()) return;
    const skill: Skill = {
        id: crypto.randomUUID(),
        name: newSkillName,
        cost: newSkillCost,
        description: newSkillDesc,
        imageUrl: newSkillImg,
        type: 'active'
    };
    setSkills([...skills, skill]);
    setNewSkillName(''); setNewSkillCost(''); setNewSkillImg(''); setNewSkillDesc('');
  };

  const handleRemoveSkill = (id: string) => setSkills(skills.filter(s => s.id !== id));

  // --- Attributes Helpers ---
  const addAttribute = () => setAttributes([...attributes, { key: '', value: '' }]);
  const updateAttribute = (index: number, field: 'key' | 'value', val: string) => {
    const newAttrs = [...attributes];
    newAttrs[index][field] = val;
    setAttributes(newAttrs);
  };
  const removeAttribute = (index: number) => setAttributes(attributes.filter((_, i) => i !== index));

  // --- Import/Export ---
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(characters, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = "personagens_rpg.json";
    document.body.appendChild(a); a.click(); a.remove();
  };

  const handleImportJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target?.result as string);
          if (Array.isArray(parsed) && window.confirm(`Importar ${parsed.length} personagens?`)) {
             setCharacters([...characters, ...parsed.filter((c:any) => c.name && c.id)]);
          }
        } catch (err) { alert("Erro ao ler JSON."); }
      };
      reader.readAsText(file);
    }
    event.target.value = '';
  };

  const handleSyncLore = async () => {
    if (!worldLore || worldLore.length < 20) { alert("Lore vazio."); return; }
    if (!name) return;
    setIsSyncing(true);
    const others = characters.filter(c => c.id !== editingId).map(c => c.name).join(', ');
    const current: Character = { id: 'temp', name, race, height, money, description, imageUrl, voiceNotes, attributes, items, skills };
    const result = await updateCharacterBackstory(current, worldLore, others);
    if (result && window.confirm("Substituir história atual pela versão da IA?")) setDescription(result);
    setIsSyncing(false);
  };

  const handleQuickSync = async (char: Character) => {
      if (!worldLore || worldLore.length < 20) { alert("Lore vazio!"); return; }
      if (syncingIds.has(char.id) || !window.confirm(`Reescrever história de "${char.name}"?`)) return;
      setSyncingIds(prev => new Set(prev).add(char.id));
      const others = characters.filter(c => c.id !== char.id).map(c => c.name).join(', ');
      try {
          const newDesc = await updateCharacterBackstory(char, worldLore, others);
          if (newDesc) setCharacters(characters.map(c => c.id === char.id ? { ...c, description: newDesc } : c));
      } catch (e) { console.error(e); } 
      finally { setSyncingIds(prev => { const n = new Set(prev); n.delete(char.id); return n; }); }
  };

  // --- VIEW MODE MODAL ---
  const ViewingModal = () => {
      const char = characters.find(c => c.id === viewingId);
      if (!char) return null;

      // Ensure types for rendering
      const viewItems: Item[] = (char.items || []).map(i => typeof i === 'string' ? { id: i, name: i, quantity: 1, description: '', imageUrl: '' } : i);
      const viewSkills: Skill[] = (char.skills || []).map(s => typeof s === 'string' ? { id: s, name: s, cost: '', description: '', imageUrl: '', type: 'active' } : s);

      return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setViewingId(null)}>
              <div className="bg-stone-900 w-full max-w-5xl h-[90vh] rounded-lg border-2 border-stone-600 shadow-2xl flex flex-col md:flex-row overflow-hidden relative" onClick={e => e.stopPropagation()}>
                  
                  <button onClick={() => setViewingId(null)} className="absolute top-4 right-4 z-20 bg-black/50 hover:bg-red-900/80 text-white p-2 rounded-full transition"><X size={24}/></button>

                  {/* Left Column: Image & Basic Stats */}
                  <div className="w-full md:w-1/3 bg-black/40 border-r border-stone-800 flex flex-col">
                      <div className="h-1/2 md:h-2/5 relative">
                          <img src={char.imageUrl} alt={char.name} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-stone-900 to-transparent"></div>
                          <div className="absolute bottom-0 left-0 p-6 w-full">
                               <h2 className="text-4xl font-black font-cinzel text-white drop-shadow-md leading-none mb-1">{char.name}</h2>
                               <div className="flex flex-wrap gap-2 text-sm font-cinzel text-amber-500 font-bold">
                                   <span>{char.race}</span>
                                   {char.height && <span>• {char.height}</span>}
                               </div>
                          </div>
                      </div>
                      
                      <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-6">
                           {char.money && (
                                <div className="bg-amber-900/20 border border-amber-900/50 p-3 rounded flex items-center justify-center gap-3">
                                    <Coins className="text-amber-500" />
                                    <span className="text-xl font-mono text-amber-200">{char.money}</span>
                                </div>
                           )}

                           <div>
                               <h3 className="text-stone-500 font-bold uppercase tracking-widest text-xs mb-3 border-b border-stone-800 pb-1">Atributos</h3>
                               <div className="grid grid-cols-2 gap-3">
                                   {char.attributes.map((attr, i) => (
                                       <div key={i} className="flex justify-between bg-stone-800/50 p-2 rounded">
                                           <span className="text-stone-400 text-xs">{attr.key}</span>
                                           <span className="text-amber-400 font-bold">{attr.value}</span>
                                       </div>
                                   ))}
                               </div>
                           </div>
                           
                           {char.voiceNotes && (
                               <div>
                                   <h3 className="text-stone-500 font-bold uppercase tracking-widest text-xs mb-3 border-b border-stone-800 pb-1">Personalidade (IA)</h3>
                                   <p className="text-stone-400 text-xs italic leading-relaxed">"{char.voiceNotes}"</p>
                               </div>
                           )}

                           <div className="pt-4 mt-auto">
                               <button onClick={() => handleEdit(char)} className="w-full bg-stone-800 hover:bg-stone-700 text-stone-300 py-3 rounded border border-stone-600 flex items-center justify-center gap-2 transition">
                                   <PenTool size={16} /> Editar Ficha
                               </button>
                           </div>
                      </div>
                  </div>

                  {/* Right Column: Lore, Inventory, Skills */}
                  <div className="w-full md:w-2/3 bg-stone-900/95 overflow-y-auto custom-scrollbar p-6 md:p-10 space-y-8">
                      
                      {/* Description */}
                      <section>
                          <h3 className="text-2xl font-cinzel text-stone-300 mb-4 flex items-center gap-2"><Scroll className="text-stone-600"/> História</h3>
                          <div className="prose prose-invert prose-stone max-w-none font-serif leading-relaxed text-stone-300 text-lg">
                              {char.description.split('\n').map((p, i) => <p key={i} className="mb-4">{p}</p>)}
                          </div>
                      </section>

                      {/* Inventory Grid (Read Only) */}
                      {viewItems.length > 0 && (
                          <section>
                              <h3 className="text-2xl font-cinzel text-stone-300 mb-4 flex items-center gap-2 border-t border-stone-800 pt-8">
                                  <Package className="text-amber-700"/> Inventário
                              </h3>
                              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-3">
                                  {viewItems.map((item, idx) => (
                                      <div key={idx} className="aspect-square bg-stone-950 border border-stone-700 rounded relative group overflow-hidden" title={`${item.name}\n${item.description}`}>
                                          {item.imageUrl ? (
                                              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                          ) : (
                                              <div className="w-full h-full flex items-center justify-center text-stone-700"><Shield size={24}/></div>
                                          )}
                                          <span className="absolute bottom-0 right-0 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded-tl font-mono">{item.quantity}</span>
                                          <div className="absolute inset-0 bg-black/90 opacity-0 group-hover:opacity-100 transition flex items-center justify-center p-1 text-center">
                                              <p className="text-[10px] font-bold text-amber-100">{item.name}</p>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </section>
                      )}

                      {/* Skills List (Read Only) */}
                      {viewSkills.length > 0 && (
                          <section>
                              <h3 className="text-2xl font-cinzel text-stone-300 mb-4 flex items-center gap-2 border-t border-stone-800 pt-8">
                                  <Flame className="text-violet-700"/> Habilidades
                              </h3>
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                  {viewSkills.map((skill, idx) => (
                                      <div key={idx} className="flex gap-4 bg-stone-950 p-4 rounded border border-stone-800/50">
                                          <div className="w-14 h-14 bg-black rounded border border-stone-700 overflow-hidden flex-shrink-0">
                                              {skill.imageUrl ? <img src={skill.imageUrl} className="w-full h-full object-cover"/> : <div className="flex items-center justify-center h-full text-violet-900"><Zap/></div>}
                                          </div>
                                          <div>
                                              <div className="flex items-center gap-2 mb-1">
                                                  <h4 className="font-bold text-stone-200">{skill.name}</h4>
                                                  {skill.cost && <span className="text-[10px] bg-violet-900/30 text-violet-300 px-2 rounded border border-violet-900/50">{skill.cost}</span>}
                                              </div>
                                              <p className="text-sm text-stone-500 leading-snug font-serif">{skill.description}</p>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </section>
                      )}
                  </div>
              </div>
          </div>
      );
  };

  if (isEditing) {
    return (
      <div className="bg-stone-900 p-4 md:p-8 rounded-sm shadow-2xl border-2 border-stone-700 relative animate-fade-in bg-opacity-95">
         {/* Decorative Corner */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-amber-600" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-amber-600" />

        <div className="flex justify-between items-center mb-8 pb-4 border-b border-stone-800">
          <h2 className="text-3xl font-bold text-amber-500 font-cinzel tracking-wider flex items-center gap-2">
            <Scroll className="text-stone-500"/>
            {editingId ? 'Editar Lenda' : 'Novo Personagem'}
          </h2>
          <div className="flex items-center gap-4">
              <button onClick={handleSyncLore} disabled={isSyncing || !name} className="flex items-center gap-2 text-xs font-bold text-violet-400 border border-violet-900 bg-violet-900/20 px-3 py-2 rounded transition disabled:opacity-50">
                  <Sparkles size={14} className={isSyncing ? "animate-spin" : ""} /> {isSyncing ? "..." : "Harmonizar com Lore"}
              </button>
              <button onClick={resetForm} className="text-stone-500 hover:text-amber-500 transition"><X size={28} /></button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="col-span-2 md:col-span-2">
                <label className="block text-xs uppercase tracking-widest text-stone-500 mb-1 font-bold">Nome</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full rpg-input text-xl font-cinzel text-amber-100 p-2" placeholder="Ex: Aragorn II" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-stone-500 mb-1 font-bold">Raça</label>
                <input type="text" value={race} onChange={e => setRace(e.target.value)} className="w-full rpg-input text-stone-300 p-2" placeholder="Ex: Humano" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-stone-500 mb-1 font-bold">Dinheiro</label>
                <div className="relative">
                    <input type="text" value={money} onChange={e => setMoney(e.target.value)} className="w-full rpg-input text-amber-300 p-2 pl-7 font-mono" placeholder="100 PO" />
                    <Coins size={14} className="absolute left-1 top-3 text-amber-500" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-stone-500 mb-1 font-bold">Retrato (URL)</label>
              <input type="text" value={imageUrl} onChange={e => setImageUrl(e.target.value)} className="w-full rpg-input text-stone-400 p-2 text-sm font-mono" placeholder="https://..." />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-stone-500 mb-1 font-bold">História</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-stone-950/50 border border-stone-800 rounded p-3 text-stone-300 h-28 focus:border-amber-700 focus:outline-none resize-none" />
            </div>
             <div>
              <label className="block text-xs uppercase tracking-widest text-stone-500 mb-1 font-bold flex items-center gap-2">
                 <User size={14} /> Voz & Personalidade (IA)
              </label>
              <textarea value={voiceNotes} onChange={e => setVoiceNotes(e.target.value)} className="w-full bg-stone-950/50 border border-stone-800 rounded p-3 text-stone-300 h-24 focus:border-amber-700 focus:outline-none resize-none" placeholder="Instruções de atuação..." />
            </div>

             {/* Attributes */}
             <div className="bg-stone-950/40 p-4 rounded border border-stone-800">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm text-amber-500 font-cinzel font-bold">Atributos</label>
                <button onClick={addAttribute} className="text-xs bg-stone-800 hover:bg-stone-700 px-2 py-1 rounded text-stone-300"><Plus size={12}/></button>
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-[150px] overflow-y-auto custom-scrollbar pr-1">
                {attributes.map((attr, idx) => (
                  <div key={idx} className="flex gap-1 items-center bg-black/20 p-1 rounded">
                    <input type="text" value={attr.key} onChange={e => updateAttribute(idx, 'key', e.target.value)} className="w-full bg-transparent text-stone-400 text-xs text-right border-none focus:ring-0 p-0" placeholder="Attr" />
                    <span className="text-stone-600">:</span>
                    <input type="text" value={attr.value} onChange={e => updateAttribute(idx, 'value', e.target.value)} className="w-12 bg-stone-800 text-amber-400 text-xs text-center border-none rounded focus:ring-0 p-0" placeholder="10" />
                    <button onClick={() => removeAttribute(idx)} className="text-stone-600 hover:text-red-500"><X size={12} /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Inventory Grid System */}
            <div className="bg-stone-950/60 p-5 rounded border border-stone-800">
              <label className="text-sm text-amber-500 font-cinzel font-bold mb-3 flex items-center gap-2"><Package size={16}/> Inventário</label>
              
              {/* Add Item Form */}
              <div className="bg-stone-900/80 p-3 rounded mb-4 border border-stone-800 grid grid-cols-12 gap-2 items-end">
                 <div className="col-span-5">
                    <label className="text-[9px] uppercase text-stone-500 block">Nome</label>
                    <input type="text" value={newItemName} onChange={e => setNewItemName(e.target.value)} className="w-full bg-stone-800 border-stone-700 rounded px-2 py-1 text-xs text-white" placeholder="Espada Longa" />
                 </div>
                 <div className="col-span-2">
                    <label className="text-[9px] uppercase text-stone-500 block">Qtd</label>
                    <input type="number" value={newItemQty} onChange={e => setNewItemQty(parseInt(e.target.value))} className="w-full bg-stone-800 border-stone-700 rounded px-2 py-1 text-xs text-white" />
                 </div>
                 <div className="col-span-5">
                    <label className="text-[9px] uppercase text-stone-500 block">Imagem URL (Opcional)</label>
                    <input type="text" value={newItemImg} onChange={e => setNewItemImg(e.target.value)} className="w-full bg-stone-800 border-stone-700 rounded px-2 py-1 text-xs text-stone-400" placeholder="http://..." />
                 </div>
                 <div className="col-span-11">
                     <input type="text" value={newItemDesc} onChange={e => setNewItemDesc(e.target.value)} className="w-full bg-stone-800 border-stone-700 rounded px-2 py-1 text-xs text-stone-400" placeholder="Descrição rápida..." />
                 </div>
                 <div className="col-span-1">
                     <button onClick={handleAddItem} className="w-full h-full bg-emerald-900 hover:bg-emerald-700 text-white rounded flex items-center justify-center transition"><Plus size={16}/></button>
                 </div>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                {items.map((item, idx) => (
                    <div key={item.id} className="aspect-square bg-stone-900 border-2 border-stone-700 rounded relative group hover:border-amber-500 transition-colors cursor-help overflow-hidden" title={item.description || item.name}>
                        {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover p-0.5" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-stone-600">
                                <Shield size={20} />
                            </div>
                        )}
                        <span className="absolute bottom-0 right-0 bg-black/60 text-white text-[10px] px-1 font-mono font-bold min-w-[1.2rem] text-center border-tl rounded-tl">
                            {item.quantity}
                        </span>
                        <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center p-1 text-center pointer-events-none">
                             <p className="text-[9px] text-amber-200 font-bold leading-tight">{item.name}</p>
                        </div>
                        <button onClick={() => handleRemoveItem(item.id)} className="absolute top-0 right-0 bg-red-900/80 text-white p-0.5 opacity-0 group-hover:opacity-100 transition pointer-events-auto hover:bg-red-700 rounded-bl"><X size={10}/></button>
                    </div>
                ))}
                {/* Empty Slots Fillers */}
                {Array.from({ length: Math.max(0, 12 - items.length) }).map((_, i) => (
                    <div key={i} className="aspect-square bg-stone-900/30 border border-stone-800/50 rounded flex items-center justify-center">
                        <div className="w-2 h-2 bg-stone-800 rounded-full opacity-20"></div>
                    </div>
                ))}
              </div>
            </div>

            {/* Skills & Spells List */}
            <div className="bg-stone-950/60 p-5 rounded border border-stone-800">
              <label className="text-sm text-violet-400 font-cinzel font-bold mb-3 flex items-center gap-2"><Flame size={16}/> Habilidades Especiais</label>
              
               {/* Add Skill Form */}
               <div className="bg-stone-900/80 p-3 rounded mb-4 border border-stone-800 grid grid-cols-12 gap-2 items-end">
                 <div className="col-span-4">
                    <label className="text-[9px] uppercase text-stone-500 block">Nome</label>
                    <input type="text" value={newSkillName} onChange={e => setNewSkillName(e.target.value)} className="w-full bg-stone-800 border-stone-700 rounded px-2 py-1 text-xs text-white" placeholder="Bola de Fogo" />
                 </div>
                 <div className="col-span-3">
                    <label className="text-[9px] uppercase text-stone-500 block">Custo/CD</label>
                    <input type="text" value={newSkillCost} onChange={e => setNewSkillCost(e.target.value)} className="w-full bg-stone-800 border-stone-700 rounded px-2 py-1 text-xs text-violet-300" placeholder="10 Mana" />
                 </div>
                 <div className="col-span-5">
                    <label className="text-[9px] uppercase text-stone-500 block">Imagem URL</label>
                    <input type="text" value={newSkillImg} onChange={e => setNewSkillImg(e.target.value)} className="w-full bg-stone-800 border-stone-700 rounded px-2 py-1 text-xs text-stone-400" placeholder="http://..." />
                 </div>
                 <div className="col-span-11">
                     <input type="text" value={newSkillDesc} onChange={e => setNewSkillDesc(e.target.value)} className="w-full bg-stone-800 border-stone-700 rounded px-2 py-1 text-xs text-stone-400" placeholder="Efeitos e detalhes..." />
                 </div>
                 <div className="col-span-1">
                     <button onClick={handleAddSkill} className="w-full h-full bg-violet-900 hover:bg-violet-700 text-white rounded flex items-center justify-center transition"><Plus size={16}/></button>
                 </div>
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                  {skills.map(skill => (
                      <div key={skill.id} className="flex gap-3 bg-stone-900 p-2 rounded border border-stone-800 relative group hover:border-violet-600/50 transition">
                          <div className="w-12 h-12 bg-black rounded border border-stone-700 overflow-hidden flex-shrink-0">
                                {skill.imageUrl ? <img src={skill.imageUrl} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-violet-900"><Zap size={20}/></div>}
                          </div>
                          <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                  <h4 className="text-stone-200 text-sm font-bold truncate">{skill.name}</h4>
                                  <span className="text-[10px] bg-violet-950 text-violet-300 px-1.5 rounded border border-violet-900">{skill.cost}</span>
                              </div>
                              <p className="text-xs text-stone-500 leading-snug line-clamp-2 mt-1 font-serif">{skill.description}</p>
                          </div>
                          <button onClick={() => handleRemoveSkill(skill.id)} className="absolute -top-2 -right-2 bg-stone-800 text-stone-400 rounded-full p-1 opacity-0 group-hover:opacity-100 hover:text-red-500 transition shadow-md border border-stone-600"><X size={12}/></button>
                      </div>
                  ))}
              </div>
            </div>

          </div>
        </div>

        <div className="mt-8 flex justify-end gap-4 border-t border-stone-800 pt-6">
          <button onClick={resetForm} className="px-6 py-2 rounded font-cinzel text-stone-500 hover:text-stone-300 transition uppercase text-sm">Descartar</button>
          <button onClick={handleSave} disabled={!name} className="bg-amber-700 hover:bg-amber-600 text-stone-100 px-8 py-2 rounded shadow-lg flex items-center gap-2 transition disabled:opacity-50 font-cinzel font-bold tracking-wide">
            <Save size={18} /> Gravar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Renders the modal if a character is being viewed */}
      {viewingId && <ViewingModal />}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-2 border-amber-900/30 pb-4 gap-4">
        <div>
           <h2 className="text-4xl font-black font-cinzel text-stone-100 drop-shadow-sm">Galeria de Heróis</h2>
           <p className="text-stone-500 font-cinzel text-sm mt-1">Gerencie as almas que habitam este mundo</p>
        </div>
        
        <div className="flex gap-3">
          <input type="file" ref={fileInputRef} onChange={handleImportJSON} className="hidden" accept=".json" />
          <button onClick={() => fileInputRef.current?.click()} className="bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-400 hover:text-stone-200 px-4 py-3 rounded flex items-center gap-2 transition shadow-lg"><Upload size={18} /> <span className="font-cinzel text-sm hidden md:inline">Importar</span></button>
          <button onClick={handleExportJSON} className="bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-400 hover:text-stone-200 px-4 py-3 rounded flex items-center gap-2 transition shadow-lg"><Download size={18} /> <span className="font-cinzel text-sm hidden md:inline">Exportar</span></button>
          <button onClick={() => setIsEditing(true)} className="bg-stone-800 hover:bg-stone-700 border border-amber-900/50 text-amber-500 px-5 py-3 rounded flex items-center gap-2 transition shadow-lg hover:shadow-amber-900/20 group"><Plus size={20} className="group-hover:rotate-90 transition-transform duration-300"/> <span className="font-cinzel font-bold">Criar</span></button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {characters.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-24 bg-stone-900/30 rounded-lg border-2 border-dashed border-stone-800">
            <User size={64} className="text-stone-700 mb-6" />
            <p className="text-stone-400 text-xl font-cinzel">Nenhum herói encontrado.</p>
          </div>
        )}

        {characters.map(char => (
          <div key={char.id} className="bg-stone-900 group relative rounded-sm shadow-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 border border-stone-800 hover:border-amber-600/50">
            {/* Click to View */}
            <div onClick={() => handleView(char.id)} className="cursor-pointer">
                <div className="h-64 overflow-hidden relative border-b-4 border-amber-900/80">
                <img src={char.imageUrl} alt={char.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-700 filter grayscale-[20%] group-hover:grayscale-0" onError={(e) => { (e.target as HTMLImageElement).src = 'https://picsum.photos/400/200?grayscale'; }} />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent opacity-90" />
                
                {/* View Icon Overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-500 bg-black/20 backdrop-blur-[2px]">
                    <Eye size={48} className="text-white drop-shadow-lg" />
                </div>

                <div className="absolute bottom-0 left-0 w-full p-4">
                    <h3 className="text-2xl font-bold text-stone-100 font-cinzel drop-shadow-md">{char.name}</h3>
                    <div className="flex justify-between items-end">
                        {(char.race || char.height) && (
                        <div className="flex items-center gap-2 mt-1">
                            <span className="h-px w-6 bg-amber-500/50 inline-block"></span>
                            <p className="text-amber-500 text-xs font-bold uppercase tracking-widest font-sans">{char.race}</p>
                        </div>
                        )}
                        {char.money && (
                            <div className="flex items-center gap-1 text-amber-300 bg-black/40 px-2 py-0.5 rounded border border-amber-900/30">
                                <Coins size={10} /> <span className="text-xs font-mono">{char.money}</span>
                            </div>
                        )}
                    </div>
                </div>
                </div>
                
                <div className="p-5 space-y-4">
                <p className="text-stone-400 text-sm leading-relaxed line-clamp-3 italic font-serif">"{char.description}"</p>
                
                <div className="grid grid-cols-2 gap-3 pt-2">
                    {char.attributes.slice(0, 4).map((attr, idx) => (
                    <div key={idx} className="bg-black/20 p-2 rounded border border-stone-800 flex justify-between items-center">
                        <span className="text-stone-500 text-[10px] uppercase font-bold tracking-wider">{attr.key.slice(0,8)}</span>
                        <span className="text-amber-100 font-mono font-bold">{attr.value}</span>
                    </div>
                    ))}
                </div>

                {/* Mini Inventory Preview */}
                {char.items && char.items.length > 0 && typeof char.items[0] !== 'string' && (
                    <div className="flex gap-1 overflow-hidden pt-2 h-10">
                        {(char.items as Item[]).slice(0,6).map((item, i) => (
                            <div key={i} className="aspect-square h-full bg-stone-950 border border-stone-800 rounded flex items-center justify-center relative" title={`${item.name} (x${item.quantity})`}>
                                {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover opacity-70"/> : <div className="w-1 h-1 bg-stone-700 rounded-full"/>}
                            </div>
                        ))}
                    </div>
                )}
                </div>
            </div>

            <div className="flex justify-between items-center pt-2 pb-4 px-5 border-t border-stone-800 bg-stone-950/50">
                  <button onClick={() => handleQuickSync(char)} disabled={syncingIds.has(char.id)} className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-3 py-2 rounded transition border border-transparent ${!worldLore ? 'text-stone-600 cursor-not-allowed' : 'text-violet-400 hover:bg-violet-900/20'}`}>
                    <Sparkles size={14} className={syncingIds.has(char.id) ? "animate-spin" : ""} /> {syncingIds.has(char.id) ? "..." : "Sincronizar"}
                  </button>
                  <div className="flex gap-1">
                    <button onClick={() => handleView(char.id)} className="p-2 text-stone-500 hover:text-stone-200 transition hover:bg-stone-800 rounded" title="Visualizar Ficha"><Eye size={18} /></button>
                    <button onClick={() => handleEdit(char)} className="p-2 text-stone-500 hover:text-amber-500 transition hover:bg-stone-800 rounded" title="Editar"><Swords size={18} /></button>
                    <button onClick={() => handleDelete(char.id)} className="p-2 text-stone-500 hover:text-red-500 transition hover:bg-stone-800 rounded" title="Excluir"><Trash2 size={18} /></button>
                  </div>
              </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CharactersView;
