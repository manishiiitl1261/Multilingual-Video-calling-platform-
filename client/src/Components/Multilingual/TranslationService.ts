interface TranslationResult {
  translatedText: string;
  error?: string;
}

/**
 * Service to handle text translation using free translation APIs
 */
class TranslationService {
  // A list of free translation API endpoints that don't require authentication
  private apiEndpoints = [
    "https://api.mymemory.translated.net/get", // Free tier: 5000 chars/day
    "https://api.funtranslations.com/translate/minion.json", // Fallback fun translator
  ];

  private currentEndpointIndex = 0;
  private cache: Record<string, string> = {};

  /**
   * Get the cache key for storing translations
   */
  private getCacheKey(
    text: string,
    sourceLang: string,
    targetLang: string
  ): string {
    return `${sourceLang}:${targetLang}:${text}`;
  }

  /**
   * Translate text from one language to another
   */
  public async translate(
    text: string,
    sourceLang: string,
    targetLang: string
  ): Promise<TranslationResult> {
    // If source and target languages are the same, return the original text
    if (sourceLang === targetLang) {
      return { translatedText: text };
    }

    // Check cache first
    const cacheKey = this.getCacheKey(text, sourceLang, targetLang);
    if (this.cache[cacheKey]) {
      return { translatedText: this.cache[cacheKey] };
    }

    // For very short texts, perform a simple translation to avoid API calls
    if (text.length <= 2) {
      return { translatedText: text };
    }

    try {
      console.log(`Translating from ${sourceLang} to ${targetLang}: "${text}"`);

      // MyMemory API
      const apiUrl = `${this.apiEndpoints[0]}?q=${encodeURIComponent(
        text
      )}&langpair=${sourceLang}|${targetLang}`;

      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`API response was not ok: ${response.status}`);
      }

      const data = await response.json();

      let translatedText = "";

      if (data && data.responseData && data.responseData.translatedText) {
        translatedText = data.responseData.translatedText;

        // Cache the result
        this.cache[cacheKey] = translatedText;
      } else if (data && data.responseStatus && data.responseStatus !== 200) {
        console.warn("Translation warning:", data.responseStatus);

        // Try fallback if available
        if (this.currentEndpointIndex < this.apiEndpoints.length - 1) {
          this.currentEndpointIndex++;
          return this.translate(text, sourceLang, targetLang);
        }
      }

      return {
        translatedText: translatedText,
      };
    } catch (error) {
      console.error("Translation error:", error);

      // Try next endpoint if available
      if (this.currentEndpointIndex < this.apiEndpoints.length - 1) {
        this.currentEndpointIndex++;
        return this.translate(text, sourceLang, targetLang);
      }

      // If all endpoints fail, use fallback
      return this.fallbackTranslate(text, sourceLang, targetLang);
    }
  }

  /**
   * Fallback translation when APIs fail
   * This is a very simple implementation for common phrases
   */
  private async fallbackTranslate(
    text: string,
    sourceLang: string,
    targetLang: string
  ): Promise<TranslationResult> {
    // Simple fallback dictionary for common phrases (just an example)
    const commonPhrases: Record<
      string,
      Record<string, Record<string, string>>
    > = {
      en: {
        hello: {
          es: "hola",
          fr: "bonjour",
          de: "hallo",
          zh: "你好",
          ja: "こんにちは",
          ru: "привет",
          ar: "مرحبا",
          hi: "नमस्ते",
        },
        "thank you": {
          es: "gracias",
          fr: "merci",
          de: "danke",
          zh: "谢谢",
          ja: "ありがとう",
          ru: "спасибо",
          ar: "شكرا",
          hi: "धन्यवाद",
        },
        bye: {
          es: "adiós",
          fr: "au revoir",
          de: "tschüss",
          zh: "再见",
          ja: "さようなら",
          ru: "пока",
          ar: "وداعا",
          hi: "अलविदा",
        },
      },
    };

    // Try to match with common phrases
    const lowerText = text.toLowerCase();

    if (
      commonPhrases[sourceLang] &&
      commonPhrases[sourceLang][lowerText] &&
      commonPhrases[sourceLang][lowerText][targetLang]
    ) {
      return {
        translatedText: commonPhrases[sourceLang][lowerText][targetLang],
      };
    }

    // If no translation is available, return the original text
    return {
      translatedText: text,
      error: "Translation service unavailable",
    };
  }

  /**
   * Clear the translation cache
   */
  public clearCache(): void {
    this.cache = {};
  }
}

export default TranslationService;
