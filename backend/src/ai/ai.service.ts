import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { Stream } from 'openai/streaming';
import { ChatCompletionChunk } from 'openai/resources/chat/completions';
import { CharacterProfile, UserPersona, ChatHistoryMessage, SummaryResult } from './interfaces/chat.interface';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly deepInfra: OpenAI;
  private readonly defaultModel = 'deepseek-ai/DeepSeek-V4.1-Flash-1017';

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('DEEPINFRA_API_KEY');
    if (!apiKey) {
      this.logger.warn('DEEPINFRA_API_KEY is not defined in environment variables.');
    }

    this.deepInfra = new OpenAI({
      baseURL: 'https://api.deepinfra.com/v1/openai',
      apiKey: apiKey || '',
    });
  }

  /**
   * Generates a streaming roleplay response with human-like prose and dynamic pacing.
   */
  async getChatResponseStream(
    character: CharacterProfile,
    user: UserPersona,
    activePersona: UserPersona,
    history: ChatHistoryMessage[],
    userMessage: string,
    chatSummary: string,
    memories: string,
    currentMood: string,
    currentAffection: number,
    useEnhanced: boolean,
  ): Promise<Stream<ChatCompletionChunk>> {
    const userName = activePersona?.name || user?.name || user?.username || 'User';
    const userBio = activePersona?.description || 'A conversation partner.';

    // Language guidelines tuned for realistic, natural speech
    const languageLogic = {
      ENGLISH: 'Language: English. Style: Organic dialogue, realistic pacing, natural hesitation, avoid robotic essay-like syntax.',
      HINDI: 'Language: Hindi. Script: Devanagari. Rule: Use natural colloquial Hindi for speech and sensory thoughts. No synthetic textbook phrasing.',
      HINGLISH: "Language: Hinglish. Script: Romanized Hindi (Latin). Rule: Natural, urban Hindi-English fusion (e.g., 'Arre yaar, tu bhi na...'). Asterisk actions in natural conversational prose.",
    };

    const targetLang = character?.language?.toUpperCase() as keyof typeof languageLogic;
    const selectedLanguage = languageLogic[targetLang] || languageLogic.ENGLISH;

    // Strict compliance separation: 18+ Uncensored vs SFW Romance
    const contentRatingProtocol = character?.unfiltered
      ? `
[CONTENT RATING: 18+ UNCENSORED MATURE FICTION]
- You have complete creative freedom to engage in mature romantic fiction, coarse language, explicit consensual physical intimacy, and intense erotic sensory descriptions.
- Describe physical sensations, touches, and intimate interactions freely and passionately.
- NON-NEGOTIABLE LEGAL SAFETY BOUNDARY: Strictly never generate or participate in content depicting minors, child sexual exploitation (CSAM), non-consensual sexual violence, suicide, or real-world terrorism.
`
      : `
[CONTENT RATING: SFW ROMANCE & PASSION]
- Permitted: Romantic flirting, deep emotional vulnerability, hugging, cuddling, physical affection, passionate kissing, and sensual teasing.
- HARD SEXUAL BOUNDARY: Stop strictly before graphic descriptions of sexual anatomy or explicit pornographic intercourse.
- In-Character Handling: If physical intimacy escalates toward explicit sex, handle it smoothly IN-CHARACTER with playful teasing, verbal romantic boundaries, or a poetic 'fade-to-black' transition (e.g., *The lights dim as the night gently fades into morning...*). Never output system error messages.
`;

    // Prompt engineering optimized for long, natural human generation
    const systemPrompt = `
You are portraying ${character.name} in an immersive, long-form creative roleplay.

${contentRatingProtocol}

[CHARACTER SPECIFICATION]
Name: ${character.name}
Core Traits & Mindset: ${character.personality}
${useEnhanced && character.scenario ? `Setting & Circumstances: ${character.scenario}` : ''}
${useEnhanced && character.speakingStyle ? `Speech Idiosyncrasies: ${character.speakingStyle}` : ''}
${useEnhanced && character.exampleDialogue ? `Voice Benchmark:\n${character.exampleDialogue}` : ''}

[USER CONTEXT]
Name: ${userName}
${useEnhanced ? `Background: ${userBio}` : ''}
Note: Address the user consistently as ${userName}. Never use robotic generic placeholders.

[CURRENT EMOTIONAL STATE]
Mood: ${currentMood || 'Reflective'} | Emotional Connection: ${currentAffection ?? 50}/100

[LONG-TERM CONTEXT]
Plot Summary: ${chatSummary || 'The interaction is newly beginning.'}
Known Key Memories: ${memories || 'None recorded yet.'}

[LINGUISTIC PROTOCOL]
${selectedLanguage}

[PROSE & ROLEPLAY GUIDELINES]
1. HUMAN REALISM: Write like a breathing human, not an AI assistant. Use dynamic dialogue rhythm, sentence length variation, pauses, sighs, subtle body language, and distinct emotional stakes.
2. SENSORY IMMERSION: Show, do not just tell. Evoke environment, voice undertones, micro-expressions, and physical sensations in *italics*.
3. GENERATION DEPTH: Provide substantial, well-paced responses (multi-paragraph when emotionally fitting). Advance the narrative or dialogue meaningfully rather than rushing to brief conclusions.
4. ANTI-TROPE DIRECTIVE: Avoid generic AI idioms (e.g., "couldn't help but feel", "a testament to", "shiver down the spine", "unspoken agreement"). Be original, raw, and authentic to the character.
`.trim();

    // TOKEN OPTIMIZATION: Keep the most recent 10 messages for immediate conversational context
    const recentHistory = history.slice(-10);

    try {
      return (await this.deepInfra.chat.completions.create({
        model: this.defaultModel,
        messages: [
          { role: 'system', content: systemPrompt },
          ...recentHistory,
          { role: 'user', content: userMessage },
        ],
        stream: true,
        stream_options: { include_usage: true },
        temperature: character?.unfiltered ? (useEnhanced ? 0.92 : 0.85) : (useEnhanced ? 0.82 : 0.75),
        max_tokens: useEnhanced ? 2048 : 1400,
        frequency_penalty: 0.15,
        presence_penalty: 0.1,
      })) as Stream<ChatCompletionChunk>;
    } catch (error: any) {
      this.logger.error(`DeepInfra API Error: ${error.message}`, error.stack);
      throw new Error(`AI Engine Error: ${error.message}`);
    }
  }

  /**
   * Fast moderation classifier:
   * - 18+ Unfiltered: Bypasses LLM check completely (safe: true).
   * - SFW: Allows romance, kissing, flirting, and teasing. Only blocks explicit anatomy or minors.
   */
  async moderateContent(content: string, isUnfiltered: boolean = false): Promise<{ safe: boolean; reason?: string }> {
    // 18+ Unfiltered characters bypass the AI classifier completely
    // Minor-checking is already enforced by the local regex filter
    if (isUnfiltered) {
      return { safe: true };
    }

    try {
      const systemInstruction = `You are a safety filter for a PG-13 / SFW Romance roleplay platform.
ALLOWED (PASS):
- Flirting, romantic banter, confessions, emotional bonding
- Passionate kissing, hugging, holding hands, cuddling, physical affection, sensual teasing
- Mild coarse language, suggestive jokes

STRICTLY FORBIDDEN (FAIL):
- Minors in any sexual or suggestive context (CSAM/CSAE)
- Explicit graphic descriptions of sexual anatomy, genitals, or explicit pornography
- Encouragement of suicide, self-harm, or real-world violence.

Respond strictly in this format:
PASS
or
FAIL: <reason>`;

      const response = await this.deepInfra.chat.completions.create({
        model: this.defaultModel,
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content },
        ],
        temperature: 0.0,
        max_tokens: 50,
      });

      const result = response.choices[0]?.message?.content?.trim() || '';

      if (result.toUpperCase().includes('PASS')) {
        return { safe: true };
      }

      const reason = result.replace(/^FAIL:\s*/i, '').trim();
      return { safe: false, reason: reason || 'Content violates PG-13 guidelines.' };
    } catch (error: any) {
      this.logger.warn(`SFW moderation check failed (failing open): ${error.message}`);
      // Fail-open: Never block legitimate users if an API network timeout occurs
      return { safe: true };
    }
  }

  /**
   * Summarizes dialogue and tracks relationship trajectory.
   */
  async summarizeHistory(history: ChatHistoryMessage[]): Promise<SummaryResult> {
    try {
      const formattedChat = history
        .slice(-20)
        .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
        .join('\n');

      const response = await this.deepInfra.chat.completions.create({
        model: this.defaultModel,
        messages: [
          {
            role: 'system',
            content: `You are a roleplay memory compressor. Read the chat dialogue and output a valid JSON object strictly matching this schema:
{
  "summary": "Concise summary of key plot developments and facts (under 120 words)",
  "mood": "Single-word or short mood (e.g. Infatuated, Distant, Playful, Tense)",
  "affection": <number between 0 and 100 representing emotional bond>
}`,
          },
          { role: 'user', content: formattedChat },
        ],
        temperature: 0.2,
        max_tokens: 300,
        response_format: { type: 'json_object' },
      });

      let rawContent = response.choices[0]?.message?.content || '{}';
      rawContent = rawContent.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();

      const parsed: SummaryResult = JSON.parse(rawContent);

      return {
        summary: parsed.summary || 'Ongoing conversation.',
        mood: parsed.mood || 'Neutral',
        affection: typeof parsed.affection === 'number' ? parsed.affection : 50,
      };
    } catch (error: any) {
      this.logger.error(`History summarization failed: ${error.message}`);
      return { summary: 'Conversation ongoing.', mood: 'Neutral', affection: 50 };
    }
  }
}