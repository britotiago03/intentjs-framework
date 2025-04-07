// src/utils/voiceInput.ts

// Define Speech Recognition API interfaces
interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
    error?: string;
}

interface SpeechRecognitionResultList {
    [index: number]: SpeechRecognitionResult;
    length: number;
}

interface SpeechRecognitionResult {
    [index: number]: SpeechRecognitionAlternative;
    isFinal: boolean;
    length: number;
}

interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onend: ((event: Event) => void) | null;
    onerror: ((event: SpeechRecognitionEvent) => void) | null;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onstart: ((event: Event) => void) | null;
    start(): void;
    stop(): void;
}

export type VoiceInputOptions = {
    language?: string;
    continuous?: boolean;
    interimResults?: boolean;
    onInterimResult?: (text: string) => void;
    onError?: (error: Error) => void;
};

export type VoiceInputStatus = 'inactive' | 'listening' | 'processing' | 'error';

export class VoiceInputHandler {
    private recognition: SpeechRecognition | null = null;
    private status: VoiceInputStatus = 'inactive';
    private finalResult: string = '';
    private readonly options: VoiceInputOptions;

    constructor(options: VoiceInputOptions = {}) {
        this.options = {
            language: 'en-US',
            continuous: false,
            interimResults: true,
            ...options
        };

        this.initRecognition();
    }

    private initRecognition(): void {
        // Check if browser supports speech recognition
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            this.status = 'error';
            if (this.options.onError) {
                this.options.onError(new Error('Speech recognition not supported in this browser'));
            }
            return;
        }

        // Initialize speech recognition
        const SpeechRecognitionImpl = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognitionImpl();

        // Configure recognition
        if (this.recognition) {
            this.recognition.lang = this.options.language || 'en-US';
            this.recognition.continuous = this.options.continuous || false;
            this.recognition.interimResults = this.options.interimResults || true;

            // Set up event handlers
            this.recognition.onstart = () => {
                this.status = 'listening';
                this.finalResult = '';
            };

            this.recognition.onresult = (event: SpeechRecognitionEvent) => {
                let interim = '';
                let final = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    if (event.results[i].isFinal) {
                        final += event.results[i][0].transcript;
                    } else {
                        interim += event.results[i][0].transcript;
                    }
                }

                // Instead of storing interim in a class property, only use it for the callback
                if (this.options.onInterimResult && interim) {
                    this.options.onInterimResult(interim);
                }

                if (final) {
                    this.finalResult = final;
                }
            };

            this.recognition.onerror = (event: SpeechRecognitionEvent) => {
                this.status = 'error';
                if (this.options.onError) {
                    this.options.onError(new Error(`Speech recognition error: ${event.error || 'Unknown error'}`));
                }
            };

            this.recognition.onend = () => {
                this.status = 'inactive';
            };
        }
    }

    /**
     * Start listening for voice input
     * @returns Promise that resolves with the recognized text
     */
    public listen(): Promise<string> {
        return new Promise((resolve, reject) => {
            if (!this.recognition) {
                reject(new Error('Speech recognition is not supported or not initialized'));
                return;
            }

            // Reset previous results
            this.finalResult = '';

            // Set up recognition end handler for this specific listen operation
            const originalOnEnd = this.recognition.onend;

            this.recognition.onend = (event: Event) => {
                // Restore original handler
                if (this.recognition) {
                    this.recognition.onend = originalOnEnd;
                }

                // Always call original handler if it exists
                if (originalOnEnd && this.recognition) {
                    originalOnEnd.call(this.recognition, event);
                }

                // Resolve with final result
                this.status = 'inactive';
                resolve(this.finalResult.trim());
            };

            // Start listening
            try {
                this.recognition.start();
                this.status = 'listening';
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Stop listening and return any recognized text
     * @returns The final recognized text
     */
    public stop(): string {
        if (this.recognition && this.status === 'listening') {
            this.recognition.stop();
        }
        return this.finalResult;
    }

    /**
     * Get current status of voice input
     * @returns The current status of the voice input
     */
    public getStatus(): VoiceInputStatus {
        return this.status;
    }

    /**
     * Change recognition language
     * @param language The language code to set, e.g., 'en-US', 'fr-FR'
     */
    public setLanguage(language: string): void {
        this.options.language = language;
        if (this.recognition) {
            this.recognition.lang = language;
        }
    }
}

// Add type definition for the Speech Recognition API
declare global {
    interface Window {
        SpeechRecognition: {
            new(): SpeechRecognition;
        };
        webkitSpeechRecognition: {
            new(): SpeechRecognition;
        };
    }
}