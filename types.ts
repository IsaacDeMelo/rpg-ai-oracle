
export interface Attribute {
  key: string;
  value: string;
}

export interface Character {
  id: string;
  name: string;
  race: string;
  height: string;
  description: string;
  imageUrl: string;
  attributes: Attribute[];
  items: string[];
  skills: string[]; // Spells, abilities, techniques
  voiceNotes: string; // Instructions for how the AI should speak
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