import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { NormalizeTextResponse, AiImportPreview, AiImportResponse } from '@local-market/shared';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly openai: OpenAI;

  constructor(private readonly config: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.config.get('OPENAI_API_KEY', ''),
    });
  }

  /**
   * Normalize text input — handles Urdu, Hindi, Roman Urdu, misspellings
   * "allu" → "Potato", "آلو" → "Potato", "tamatar" → "Tomato"
   */
  async normalizeText(text: string): Promise<NormalizeTextResponse> {
    if (!this.config.get('OPENAI_API_KEY')) {
      return this.fallbackNormalize(text);
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `You are a multilingual product name normalizer for a village marketplace in Pakistan/India.
Your job: Given any product name (in English, Urdu, Hindi, Roman Urdu, or with misspellings), return the clean English canonical name.

Respond ONLY with valid JSON in this exact format:
{
  "normalized": "Potato",
  "language": "roman_urdu",
  "confidence": 0.95,
  "suggestions": ["Potato", "Sweet Potato"]
}

Rules:
- normalized: clean English name, title case
- language: one of "en", "ur", "hi", "roman_urdu", "unknown"
- confidence: 0.0 to 1.0
- suggestions: 1-3 possible alternatives`,
          },
          {
            role: 'user',
            content: `Normalize this product name: "${text}"`,
          },
        ],
      });

      const raw = response.choices[0]?.message?.content ?? '{}';
      const parsed = JSON.parse(raw);

      return {
        original: text,
        normalized: parsed.normalized ?? text,
        language: parsed.language ?? 'unknown',
        confidence: parsed.confidence ?? 0.5,
        suggestions: parsed.suggestions ?? [],
      };
    } catch (err) {
      this.logger.warn(`AI normalize failed for "${text}": ${(err as Error).message}`);
      return this.fallbackNormalize(text);
    }
  }

  /**
   * Import inventory from free-form text
   * "1kg tomatoes 50rs, 2kg onions 80rs, potatoes 30rs per kg"
   */
  async importFromText(text: string): Promise<AiImportResponse> {
    if (!this.config.get('OPENAI_API_KEY')) {
      return { items: [], rawText: text };
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `You are an inventory parser for a village marketplace.
Extract product items from the user's text (may be in English, Urdu, Hindi, or Roman Urdu).

Return JSON:
{
  "items": [
    {
      "rawInput": "original text fragment",
      "suggestedName": "Clean English Name",
      "suggestedCategory": "Vegetables",
      "price": 50,
      "unit": "kg",
      "confidence": 0.9
    }
  ]
}

If price/unit not found, omit those fields.`,
          },
          { role: 'user', content: text },
        ],
      });

      const raw = response.choices[0]?.message?.content ?? '{}';
      const parsed = JSON.parse(raw);

      return {
        items: (parsed.items ?? []) as AiImportPreview[],
        rawText: text,
      };
    } catch (err) {
      this.logger.warn(`AI text import failed: ${(err as Error).message}`);
      return { items: [], rawText: text };
    }
  }

  /**
   * Import inventory from an image URL using GPT-4 Vision
   */
  async importFromImage(imageUrl: string): Promise<AiImportResponse> {
    if (!this.config.get('OPENAI_API_KEY')) {
      return { items: [] };
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `You are analyzing a marketplace/shop image to extract product inventory.
Extract all visible products with their prices if visible.

Return JSON:
{
  "items": [
    {
      "rawInput": "item as seen",
      "suggestedName": "Clean English Name",
      "suggestedCategory": "Category",
      "price": 50,
      "unit": "kg",
      "confidence": 0.85
    }
  ]
}`,
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Extract all products from this shop/marketplace image:' },
              { type: 'image_url', image_url: { url: imageUrl } },
            ],
          },
        ],
      });

      const raw = response.choices[0]?.message?.content ?? '{}';
      const parsed = JSON.parse(raw);

      return { items: (parsed.items ?? []) as AiImportPreview[] };
    } catch (err) {
      this.logger.warn(`AI image import failed: ${(err as Error).message}`);
      return { items: [] };
    }
  }

  /**
   * Transcribe voice note and extract inventory using Whisper + GPT
   */
  async importFromVoice(audioUrl: string): Promise<AiImportResponse> {
    if (!this.config.get('OPENAI_API_KEY')) {
      return { items: [] };
    }

    try {
      // Step 1: Download audio and transcribe via Whisper
      const audioResponse = await fetch(audioUrl);
      const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
      const audioFile = new File([audioBuffer], 'audio.mp3', { type: 'audio/mpeg' });

      const transcription = await this.openai.audio.transcriptions.create({
        model: 'whisper-1',
        file: audioFile,
        language: 'ur', // Urdu by default, auto-detected
      });

      const transcribedText = transcription.text;
      this.logger.log(`Voice transcription: "${transcribedText}"`);

      // Step 2: Parse inventory from transcribed text
      const importResult = await this.importFromText(transcribedText);
      return { ...importResult, rawText: transcribedText };
    } catch (err) {
      this.logger.warn(`AI voice import failed: ${(err as Error).message}`);
      return { items: [] };
    }
  }

  // ── Fallback (no API key) ─────────────────────────────────────────────────

  private fallbackNormalize(text: string): NormalizeTextResponse {
    // Basic Roman Urdu / common transliteration map
    const commonMap: Record<string, string> = {
      allu: 'Potato',
      aloo: 'Potato',
      آلو: 'Potato',
      tamatar: 'Tomato',
      tomato: 'Tomato',
      pyaz: 'Onion',
      پیاز: 'Onion',
      lehsan: 'Garlic',
      لہسن: 'Garlic',
      adrak: 'Ginger',
      ادرک: 'Ginger',
      mirch: 'Chili',
      مرچ: 'Chili',
      dhaniya: 'Coriander',
      گوشت: 'Meat',
      gosht: 'Meat',
      murgh: 'Chicken',
      مرغی: 'Chicken',
    };

    const key = text.toLowerCase().trim();
    const normalized = commonMap[key] ?? this.toTitleCase(text.trim());

    return {
      original: text,
      normalized,
      language: this.detectScript(text),
      confidence: commonMap[key] ? 0.9 : 0.4,
      suggestions: [normalized],
    };
  }

  private toTitleCase(str: string): string {
    return str.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
  }

  private detectScript(text: string): string {
    if (/[\u0600-\u06FF]/.test(text)) return 'ur';
    if (/[\u0900-\u097F]/.test(text)) return 'hi';
    return 'en';
  }
}
