
import { GoogleGenAI } from "@google/genai";
import { Character, Item, Skill } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const formatCharacterForPrompt = (c: Character) => {
  const attributesString = c.attributes.map(attr => `${attr.key}: ${attr.value}`).join(', ');
  
  // Handle migration from string[] to Item[]
  let itemsString = 'Nenhum';
  if (c.items && c.items.length > 0) {
    if (typeof c.items[0] === 'string') {
        itemsString = c.items.join(', ');
    } else {
        itemsString = (c.items as Item[]).map(i => `${i.name} (x${i.quantity}) - ${i.description}`).join('; ');
    }
  }

  // Handle migration from string[] to Skill[]
  let skillsString = 'Nenhuma';
  if (c.skills && c.skills.length > 0) {
      if (typeof c.skills[0] === 'string') {
          skillsString = c.skills.join(', ');
      } else {
          skillsString = (c.skills as Skill[]).map(s => `${s.name} [${s.cost}]: ${s.description}`).join('; ');
      }
  }

  return `
    Nome: ${c.name}
    Raça: ${c.race || 'Desconhecida'}
    Altura: ${c.height || 'Desconhecida'}
    Dinheiro/Riqueza: ${c.money || '0 PO'}
    Descrição: ${c.description}
    Atributos: ${attributesString}
    Equipamento/Inventário: ${itemsString}
    Habilidades/Magias: ${skillsString}
  `;
};

export const simulateCharacterResponse = async (
  character: Character,
  sceneDescription: string,
  worldLore: string
): Promise<string> => {
  if (!process.env.API_KEY) {
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
  if (!process.env.API_KEY) {
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
  if (!process.env.API_KEY) return "Erro: API Key ausente.";

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

export const updateCharacterBackstory = async (
  character: Character,
  worldLore: string,
  otherCharactersContext: string
): Promise<string> => {
  if (!process.env.API_KEY) {
     return "Erro: Chave de API não configurada.";
  }

  try {
    const prompt = `
      Atue como um Editor de Fantasia e Mestre de Lore.
      
      Sua tarefa é reescrever e enriquecer a história (background) de um personagem para que ela se encaixe perfeitamente no LORE DO MUNDO fornecido.

      LORE DO MUNDO:
      ${worldLore || "Lore genérico de fantasia medieval."}

      OUTROS PERSONAGENS IMPORTANTES (Contexto):
      ${otherCharactersContext || "Nenhum outro personagem relevante no momento."}

      PERSONAGEM ALVO (Rascunho atual):
      Nome: ${character.name}
      Raça: ${character.race}
      Descrição Atual: ${character.description}
      Personalidade: ${character.voiceNotes}

      INSTRUÇÕES:
      1. Reescreva a "Descrição" do personagem.
      2. Integre elementos do Lore do Mundo (cidades, eventos, divindades) na história dele.
      3. Se houver conexões lógicas com os outros personagens listados, sugira-as sutilmente.
      4. Mantenha a essência original do personagem, mas dê profundidade.
      5. Retorne APENAS o novo texto da descrição/história (3 a 5 parágrafos).
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.8,
      },
    });

    return response.text || "Não foi possível gerar uma nova história.";
  } catch (error) {
    console.error("Erro na API Gemini (Backstory):", error);
    return "Erro ao conectar com a IA.";
  }
};
