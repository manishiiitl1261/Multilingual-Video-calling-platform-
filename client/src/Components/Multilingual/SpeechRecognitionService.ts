interface SpeechRecognitionOptions {
  language: string;
  continuous: boolean;
  interimResults: boolean;
  onResult: (transcript: string, isFinal: boolean) => void;
  onError: (error: any) => void;
}

class SpeechRecognitionService {
  private recognition: SpeechRecognition | null = null;
  private isListening: boolean = false;
  private options: SpeechRecognitionOptions;
  private startAttempts: number = 0;
  private maxStartAttempts: number = 3;
  private initialized: boolean = false;

  constructor(options: SpeechRecognitionOptions) {
    this.options = options;
    // Initialize in next event loop to avoid uninitialized variable errors
    setTimeout(() => this.initialize(), 0);
  }

  private initialize(): void {
    if (this.initialized) return;

    if (typeof window === "undefined") {
      console.error("Window object is not available");
      return;
    }

    if (
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    ) {
      console.error("Speech recognition is not supported in this browser");
      this.options.onError("Speech recognition not supported");
      return;
    }

    try {
      const SpeechRecognitionAPI =
        window.SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognitionAPI();

      this.recognition.lang = this.options.language;
      this.recognition.continuous = this.options.continuous;
      this.recognition.interimResults = this.options.interimResults;

      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        try {
          const transcript = Array.from(event.results)
            .map((result) => result[0].transcript)
            .join("");

          const isFinal = event.results[event.results.length - 1].isFinal;
          this.options.onResult(transcript, isFinal);
        } catch (error) {
          console.error("Error processing speech result:", error);
        }
      };

      this.recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        this.options.onError(event.error);

        // Mark as not listening on error
        this.isListening = false;

        // Restart if error is not fatal and we should still be listening
        if (
          event.error !== "no-speech" &&
          event.error !== "aborted" &&
          this.isListening
        ) {
          setTimeout(() => {
            this.safeStart();
          }, 1000);
        }
      };

      this.recognition.onend = () => {
        // Reset start attempts when recognition ends normally
        this.startAttempts = 0;

        // Only restart if we're still supposed to be listening
        if (this.isListening) {
          setTimeout(() => {
            this.safeStart();
          }, 300);
        }
      };

      this.initialized = true;
    } catch (error) {
      console.error("Error initializing speech recognition:", error);
      this.options.onError("Failed to initialize speech recognition");
    }
  }

  public setLanguage(language: string): void {
    if (!this.initialized) {
      console.warn("Cannot set language before initialization");
      return;
    }

    if (this.recognition) {
      this.options.language = language;
      this.recognition.lang = language;

      // Restart if already listening
      if (this.isListening) {
        this.stop();
        setTimeout(() => {
          this.start();
        }, 300);
      }
    }
  }

  // Safe start method with attempt tracking
  private safeStart(): void {
    if (!this.initialized) {
      console.warn("Cannot start before initialization");
      return;
    }

    if (!this.recognition || !this.isListening) return;

    try {
      this.startAttempts++;
      if (this.startAttempts <= this.maxStartAttempts) {
        this.recognition.start();
        console.log(
          "Speech recognition started (attempt",
          this.startAttempts,
          ")"
        );
      } else {
        console.warn(
          "Too many start attempts, reconnecting speech recognition"
        );
        // Recreate the recognition object
        this.stop();
        this.initialized = false;
        this.initialize();
        setTimeout(() => {
          this.startAttempts = 1;
          if (this.recognition && this.isListening) {
            try {
              this.recognition.start();
            } catch (e) {
              console.error("Failed to restart speech recognition:", e);
            }
          }
        }, 500);
      }
    } catch (error) {
      console.error("Failed to start speech recognition:", error);
      // If we get an "already started" error, mark as listening but don't try to restart
      if (error instanceof DOMException && error.name === "InvalidStateError") {
        console.log("Recognition already started, continuing");
      } else {
        // For other errors, try to recover
        this.isListening = false;
        setTimeout(() => {
          this.start();
        }, 1000);
      }
    }
  }

  public start(): void {
    if (!this.initialized) {
      console.warn("Starting speech recognition after initialization...");
      setTimeout(() => this.start(), 500);
      return;
    }

    if (!this.recognition) {
      console.error("Speech recognition not initialized");
      return;
    }

    // If already listening, don't try to start again
    if (this.isListening) {
      console.log("Speech recognition already running");
      return;
    }

    this.isListening = true;
    this.startAttempts = 0;
    this.safeStart();
  }

  public stop(): void {
    if (!this.initialized) {
      console.warn("Cannot stop before initialization");
      return;
    }

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (error) {
        console.error("Error stopping speech recognition:", error);
      }
      this.isListening = false;
      this.startAttempts = 0;
    }
  }

  public isSupported(): boolean {
    if (typeof window === "undefined") return false;
    return "webkitSpeechRecognition" in window || "SpeechRecognition" in window;
  }
}

export default SpeechRecognitionService;
