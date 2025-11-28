
export interface Attribute {
  key: string;
  value: string;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  quantity: number;
  imageUrl: string;
  isEquipped?: boolean;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  cost: string; // Mana, Cooldown, Stamina
  imageUrl: string;
  type: 'passive' | 'active' | 'spell';
}

export interface Relationship {
  targetId: string;
  type: string; // Ex: "Irmão", "Rival", "Amante"
  affinity: number; // -100 a 100 ou 0 a 100
  notes?: string;
}

export interface Character {
  id: string;
  name: string;
  race: string;
  height: string;
  description: string;
  imageUrl: string;
  money: string; // Gold, Coins, Credits
  attributes: Attribute[];
  items: Item[] | string[]; // Union type for backward compatibility during migration
  skills: Skill[] | string[]; // Union type for backward compatibility during migration
  relationships?: Relationship[];
  voiceNotes: string; 
}

export interface Location {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  notes: string;
}

export interface StoryPage {
  id: string;
  title: string;
  content: string;
}

export type ViewState = 'dashboard' | 'characters' | 'world' | 'simulator' | 'battle' | 'lore' | 'story';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}