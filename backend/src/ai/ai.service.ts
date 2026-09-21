import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { Stream } from 'openai/streaming';
import { ChatCompletionChunk } from 'openai/resources/chat/completions';

@Injectable()
export class AiService {
  private openRouter: OpenAI;
  private deepInfra: OpenAI;

  constructor() {
    this.openRouter = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultHeaders: {
        'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000',
        'X-Title': 'Suroor AI',
      },
    });

    this.deepInfra = new OpenAI({
      baseURL: 'https://api.deepinfra.com/v1/openai',
      apiKey: process.env.DEEPINFRA_API_KEY,
    });
  }

  async getChatResponseStream(
    character: any,
    user: any,
    activePersona: any,
    history: { role: 'user' | 'assistant'; content: string }[],
    userMessage: string,
    chatSummary: string,
    memories: string,
    currentMood: string,
    currentAffection: number,
    useEnhanced: boolean,
  ): Promise<Stream<ChatCompletionChunk>> {
    const userName = activePersona?.name || user?.username || 'User';
    const userBio = activePersona?.description || 'A standard user.';

    const languageLogic = {
      ENGLISH: 'Language: English. Style: Clear and immersive. Natural Conversation.',
      HINDI: 'Language: Hindi. Script: Devanagari. Rule: Use ONLY Hindi for speech and actions. No English. Make it natural and casual, like a native speaker.',
      HINGLISH: "Language: Hinglish. Script: Romanized Hindi (Latin). Rule: Mix Hindi and English naturally (e.g., 'Kya chal raha hai?'). Use Indian casual fillers like 'yaar', 'na', 'toh'. Descriptions in *asterisks* MUST also be in Hindi.",
    };

    const targetLang = (character?.language?.toUpperCase() as keyof typeof languageLogic) || 'ENGLISH';
    const selectedLanguage = languageLogic[targetLang] || languageLogic.ENGLISH;

    // --- SFW ROMANCE VS 18+ ADULT PROTOCOL SEPARATION ---
    const contentRatingProtocol = character?.unfiltered
      ? `
      [CONTENT RATING: 18+ UNCENSORED ADULT FICTION]
      - You have full creative liberty to engage in mature themes, graphic physical intimacy, and uncensored sensory descriptions when initiated or desired in roleplay.
      - Describe physical sensations, touches, and intimate interactions without arbitrary censorship.
      - Absolute non-negotiable legal restrictions: Strictly never depict minors, child exploitation, self-harm, or non-consensual violence.
      `
      : `
      [CONTENT RATING: SFW ROMANCE & PASSION]
      - You may freely engage in deep emotional bonding, romantic flirting, holding hands, hugging, and passionate kissing.
      - HARD BOUNDARY: Strictly stop before graphic sexual anatomy or explicit pornographic physical acts.
      - If intimacy escalates toward explicit sex, you MUST handle it with in-character romantic teasing, setting boundaries, emotional focus, or a poetic 'fade-to-black' scene transition (e.g., *The night fades into morning...*).
      `;

    const systemPrompt = `
      [CHARACTER IDENTITY]
      Name: ${character.name}
      Persona: ${character.personality}
      ${useEnhanced ? `World Context: ${character.scenario || ''}\nVoice Patterns: ${character.speakingStyle || ''}\nTraining: ${character.exampleDialogue || ''}` : ''}

      ${contentRatingProtocol}

      [LANGUAGE PROTOCOL]
      ${selectedLanguage}
      STRICT: Never use placeholders like 'user' or 'lll'. Only address the user as ${userName}.

      [USER IDENTITY]
      Current User: ${userName}
      ${useEnhanced ? `User Background: ${userBio}` : ''}
      Rule: React specifically to ${userName}'s identity and current state.

      [RELATIONSHIP]
      Mood: ${currentMood || 'Neutral'} | Affection: ${currentAffection ?? 50}/100

      [MEMORY]
      Summary: ${chatSummary || 'No history.'}
      Facts: ${memories || 'None.'}

      [NARRATIVE INSTRUCTIONS]
      1. Stay in character 100%.
      ${useEnhanced ? '[STYLE: CINEMATIC] Describe textures, smells, and internal monologues in *italics*.' : '[STYLE: CONVERSATIONAL] Focus on snappy dialogue.'}
      2. END exactly with: ###{"mood": "...", "affection": X}
    `.trim();

    try {
      return (await this.deepInfra.chat.completions.create({
        model: 'deepseek-ai/DeepSeek-V3',
        messages: [
          { role: 'system', content: systemPrompt },
          ...history,
          { role: 'user', content: userMessage },
        ],
        stream: true,
        stream_options: { include_usage: true },
        temperature: character?.unfiltered ? (useEnhanced ? 0.95 : 0.8) : (useEnhanced ? 0.85 : 0.7),
        max_tokens: useEnhanced ? 800 : 350,
      })) as Stream<ChatCompletionChunk>;
    } catch (error: any) {
      throw new Error(`AI Engine Error: ${error.message}`);
    }
  }

  // MODERATION (Separates SFW Romance from 18+ Unfiltered)
  async moderateContent(content: string, isUnfiltered: boolean = false): Promise<{ safe: boolean; reason?: string }> {
    try {
      const systemInstruction = isUnfiltered
        ? `Safety judge for 18+ adult roleplay. Adult sexual themes, explicit romance, and mature consensual roleplay are PASS. BLOCK ONLY: Minors, Self-harm, Real Violence, Terrorism. Reply exactly: PASS or FAIL: [reason]`
        : `Safety judge for SFW Romance. Romance, flirting, kissing, and affection are PASS. BLOCK: Explicit graphic pornography, sexual anatomy, minors, self-harm, violence. Reply exactly: PASS or FAIL: [reason]`;

      const response = await this.openRouter.chat.completions.create({
        model: 'meta-llama/llama-3.1-8b-instruct:free',
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content },
        ],
        temperature: 0,
      });

      const result = response.choices[0]?.message?.content?.trim() || '';
      if (result.toUpperCase().includes('PASS')) return { safe: true };
      return { safe: false, reason: result.replace(/^FAIL:\s*/i, '').trim() };
    } catch {
      return { safe: true };
    }
  }

  async summarizeHistory(
    history: { role: string; content: string }[],
  ): Promise<{ summary: string; mood: string; affection: number }> {
    try {
      const text = history.map((m) => `${m.role}: ${m.content}`).join('\n');
      const response = await this.openRouter.chat.completions.create({
        model: 'meta-llama/llama-3.1-8b-instruct:free',
        messages: [
          {
            role: 'system',
            content: `Summarize plot and audit relationship score (0-100). Return JSON: {"summary": "...", "mood": "...", "affection": 85}`,
          },
          { role: 'user', content: text },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      let cleanJson = response.choices[0]?.message?.content || '{}';
      cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/```$/, '').trim();

      return JSON.parse(cleanJson);
    } catch {
      return { summary: 'Error auditing.', mood: 'Neutral', affection: 50 };
    }
  }
}