
import { GoogleGenAI } from "@google/genai";
import { Character } from '../types';

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const formatCharacterForPrompt = (c: Character) => {
  const attributesString = c.attributes.map(attr => `${attr.key}: ${attr.value}`).join(', ');
  const itemsString = c.items && c.items.length > 0 ? c.items.join(', ') : 'Nenhum';
  const skillsString = c.skills && c.skills.length > 0 ? c.skills.join(', ') : 'Nenhuma';

  return `
    Nome: ${c.name}
    Raça: ${c.race || 'Desconhecida'}
    Altura: ${c.height || 'Desconhecida'}
    Descrição: ${c.description}
    Atributos: ${attributesString}
    Equipamento/Itens: ${itemsString}
    Habilidades/Magias: ${skillsString}
  `;
};

export const simulateCharacterResponse = async (
  character: Character,
  sceneDescription: string,
  worldLore: string
): Promise<string> => {
  if (!apiKey) {
    return "Erro: Chave de API não configurada (process.env.API_KEY).";
  }

  try {
    const systemInstruction = `
      Você está interpretando um personagem de RPG.
      
      CONTEXTO DO MUNDO / HISTÓRIA UNIVERSAL:
      ${worldLore || "Nenhum contexto histórico fornecido."}

      SEU PERSONAGEM:
      ${formatCharacterForPrompt(character)}
      Personalidade/Voz: ${character.voiceNotes}

      Instruções:
      1. Responda APENAS como o personagem, em primeira pessoa.
      2. Reaja à cena descrita pelo usuário com base em sua personalidade, raça, atributos e no contexto do mundo fornecido.
      3. Não quebre o personagem.
      4. Seja conciso, mas descritivo.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Cena/Situação: ${sceneDescription}`,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.9,
        topK: 40,
      },
    });

    return response.text || "O personagem permaneceu em silêncio (sem resposta gerada).";
  } catch (error) {
    console.error("Erro na API Gemini:", error);
    return "Erro ao conectar com a mente do personagem. Tente novamente.";
  }
};

export const simulateBattle = async (
  char1: Character,
  char2: Character,
  battleContext: string,
  worldLore: string
): Promise<string> => {
  if (!apiKey) {
    return "Erro: Chave de API não configurada.";
  }

  try {
    const prompt = `
      Atue como um Mestre de RPG experiente e narrador de combate. Simule uma batalha hipotética entre estes dois personagens.

      CONTEXTO DO MUNDO (LORE):
      ${worldLore || "Genérico/Sem contexto específico."}

      CENÁRIO DA BATALHA E CIRCUNSTÂNCIAS:
      ${battleContext || "Uma arena neutra, plana e sem obstáculos."}

      LUTADOR 1:
      ${formatCharacterForPrompt(char1)}

      LUTADOR 2:
      ${formatCharacterForPrompt(char2)}

      Instruções para a Simulação:
      1. Analise os atributos, raça, equipamentos e habilidades de ambos.
      2. Leve em consideração o CENÁRIO (terreno, clima, situação) descrito acima. Isso deve influenciar a luta.
      3. Descreva a batalha de forma narrativa e emocionante (3 a 5 parágrafos).
      4. Use os itens e magias listados explicitamente.
      5. No final, declare um vencedor claro e explique o porquê taticamente.
      
      Estruture a resposta com Markdown, usando títulos para "Análise", "O Combate" e "Veredito".
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 1, // High creativity for battle narration
      },
    });

    return response.text || "A poeira baixou, mas não foi possível determinar o resultado da batalha.";
  } catch (error) {
    console.error("Erro na API Gemini (Battle):", error);
    return "Erro ao simular a batalha.";
  }
};

export const summarizeStoryForLore = async (
  storyText: string,
  currentLore: string
): Promise<string> => {
  if (!apiKey) return "Erro: API Key ausente.";

  try {
    const prompt = `
      Atue como um Escriba Real e Historiador Mágico.
      
      Sua tarefa é ler a narrativa bruta de um livro de contos e extrair os Fatos Históricos importantes para adicionar ao "Registro Akáshico" (Lore do Mundo).

      LORE ATUAL DO MUNDO:
      ${currentLore || "Ainda não há registros."}

      NOVA NARRATIVA (LIVRO DE CONTOS):
      ${storyText}

      INSTRUÇÕES:
      1. Identifique eventos chave, personagens introduzidos, locais visitados e mudanças no mundo.
      2. Escreva um resumo conciso e formal, em tom de registro histórico/enciclopédico (Terceira pessoa).
      3. O objetivo é que este texto sirva de contexto para futuras simulações de IA.
      4. NÃO repita informações que já pareçam óbvias no Lore Atual, foque no que há de NOVO nesta narrativa.
      5. Se a narrativa for apenas diálogos irrelevantes, retorne um resumo muito breve ou diga que nada de histórico ocorreu.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.7,
      },
    });

    return response.text || "Não foi possível transcrever os eventos.";
  } catch (error) {
    console.error("Erro na API Gemini (Summarize):", error);
    return "Erro ao resumir a história.";
  }
};
