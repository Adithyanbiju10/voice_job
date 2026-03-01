import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import annyang from 'annyang';

interface VoiceContextType {
  isVoiceMode: boolean;
  setIsVoiceMode: (v: boolean) => void;
  speak: (text: string) => Promise<void>;
  listen: () => Promise<string>;
  readPageContent: () => void;
  isListening: boolean;
  isSpeaking: boolean;
  isPrompting: boolean;
}

const VoiceContext = createContext<VoiceContextType | null>(null);

export const useVoice = () => {
  const ctx = useContext(VoiceContext);
  if (!ctx) throw new Error('useVoice must be inside VoiceProvider');
  return ctx;
};

export const VoiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPrompting, setIsPrompting] = useState(false);

  // Fallback listen for search queries
  const listen = useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) { reject('Speech recognition not supported'); return; }
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      setIsListening(true);
      recognition.onresult = (event: any) => {
        setIsListening(false);
        resolve(event.results[0][0].transcript);
      };
      recognition.onerror = () => { setIsListening(false); resolve(''); };
      recognition.onend = () => { setIsListening(false); };
      recognition.start();
    });
  }, []);

  const speak = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) { resolve(); return; }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      setIsSpeaking(true);

      utterance.onend = () => { setIsSpeaking(false); resolve(); };
      utterance.onerror = () => { setIsSpeaking(false); resolve(); };

      window.speechSynthesis.speak(utterance);
    });
  }, []);

  const readPageContent = useCallback(() => {
    const mainContent = document.querySelector('main');
    if (!mainContent) {
      speak("I couldn't find the main content on this page.");
      return;
    }
    const elements = mainContent.querySelectorAll('h1, h2, h3, p, li, span.card-title');
    let textToRead = "";
    elements.forEach(el => {
      if (el.textContent && el.textContent.trim().length > 0) {
        textToRead += el.textContent.trim() + ". ";
      }
    });

    if (textToRead) {
      speak("Reading page content: " + textToRead);
    } else {
      speak("There is no readable content on this page.");
    }
  }, [speak]);

  // ANNYANG Activation
  useEffect(() => {
    const annyangLib = annyang as any;
    if (isVoiceMode && annyangLib) {
      console.log('Starting annyang');
      annyangLib.setLanguage('en-US');
      annyangLib.debug(true);
      annyangLib.start({ autoRestart: true, continuous: true });

      // Update listening state based on annyang events
      annyangLib.addCallback('start', () => {
        console.log('Voice recognition started');
        setIsListening(true);
      });
      annyangLib.addCallback('soundstart', () => {
        console.log('Sound detected');
        setIsListening(true);
      });
      annyangLib.addCallback('result', () => {
        console.log('Speech result received');
        setIsListening(true);
      });
      annyangLib.addCallback('end', () => {
        console.log('Voice recognition ended');
        if (!isVoiceMode) {
          setIsListening(false);
        }
      });

      // Handle errors
      annyangLib.addCallback('error', (err: any) => {
        console.error('Annyang error:', err);
        if (err.error === 'no-speech') {
          // This is normal if the user is quiet, don't show as error to user
        }
      });

    } else if (annyangLib) {
      console.log('Stopping annyang');
      annyangLib.abort();
      setIsListening(false);
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    return () => { if (annyangLib) annyangLib.abort(); };
  }, [isVoiceMode]);

  // VOICE GUIDANCE: Auto-read on focus
  useEffect(() => {
    if (!isVoiceMode) return;
    const handleFocus = (e: FocusEvent) => {
      const el = e.target as HTMLElement;
      if (!el) return;
      let textToRead = "";
      if (el.tagName === 'SECTION' || el.getAttribute('role') === 'region') {
        const heading = el.querySelector('h1, h2, h3');
        textToRead = `Entering section: ${heading?.textContent || el.getAttribute('aria-label') || 'unnamed section'}`;
      } else if (el.tagName === 'BUTTON' || el.tagName === 'A' || el.getAttribute('role') === 'button') {
        textToRead = `Button: ${el.innerText.split('\n')[0] || el.getAttribute('aria-label') || 'unlabeled button'}`;
      } else if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') {
        const label = document.querySelector(`label[for="${el.id}"]`) || el.closest('label');
        textToRead = `Input field: ${label?.textContent || el.getAttribute('placeholder') || el.getAttribute('aria-label') || 'unlabeled input'}`;
      }
      if (textToRead) speak(textToRead);
    };
    window.addEventListener('focusin', handleFocus);
    return () => window.removeEventListener('focusin', handleFocus);
  }, [isVoiceMode, speak]);

  // ACCESSIBILITY PROMPT LOGIC
  const hasPromptedRef = useRef(false);
  const promptIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const dismissalTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isVoiceMode || hasPromptedRef.current) return;

    // Show the overlay immediately
    setIsPrompting(true);

    const playPrompt = () => {
      if (hasPromptedRef.current || isVoiceMode) return;
      if (window.speechSynthesis.speaking) return;

      const utterance = new SpeechSynthesisUtterance(
        'Welcome to Ability jobs. Voice assistance is available for visually impaired users. If you want to enable voice assistance, please press the Enter key now. To continue without voice assistance, please wait.'
      );
      utterance.rate = 0.85;

      utterance.onstart = () => {
        // Clear the aggressive retry once audio starts
        if (promptIntervalRef.current) {
          clearInterval(promptIntervalRef.current);
          promptIntervalRef.current = null;
        }
      };

      utterance.onend = () => {
        // Start dismissal timer after audio finishes
        dismissalTimerRef.current = setTimeout(dismissPrompt, 8000);
      };

      window.speechSynthesis.speak(utterance);
    };

    const tryPlaying = () => {
      // Browsers often need a user gesture. Showing the overlay with pointer-events:auto
      // means the user will likely click it, which unblocks the next attempt in the interval.
      if (window.speechSynthesis.getVoices().length > 0) {
        playPrompt();
      }
    };

    const dismissPrompt = () => {
      if (isVoiceMode) return;
      hasPromptedRef.current = true;
      setIsPrompting(false);
      window.speechSynthesis.cancel();
      if (promptIntervalRef.current) clearInterval(promptIntervalRef.current);
      if (dismissalTimerRef.current) clearTimeout(dismissalTimerRef.current);
      cleanup();
    };

    const handleInteraction = (e: Event) => {
      if (isVoiceMode) return;

      if (e instanceof KeyboardEvent) {
        if (e.key === 'Enter') {
          e.preventDefault();
          hasPromptedRef.current = true;
          setIsPrompting(false);
          window.speechSynthesis.cancel();
          if (promptIntervalRef.current) clearInterval(promptIntervalRef.current);
          if (dismissalTimerRef.current) clearTimeout(dismissalTimerRef.current);

          setIsVoiceMode(true);
          const annyangLib = annyang as any;
          if (annyangLib) {
            annyangLib.start({ autoRestart: true, continuous: true });
          }
          speak('Voice mode enabled. I will now guide you through the website.');
          cleanup();
        } else if (e.key !== 'Tab') {
          dismissPrompt();
        }
      } else if (e instanceof MouseEvent) {
        // If clicking during the prompt, it serves as the "User Gesture" needed by browsers
        // The NEXT interval tick will now succeed if it was blocked before.
        // If they click outside the card or just generally, we might want to dismiss 
        // BUT if they click the overlay to unblock, we shouldn't dismiss immediately.
        // For now, let's keep it simple: any click dismisses UNLESS we are still waiting for audio.
        if (window.speechSynthesis.speaking) {
          dismissPrompt();
        }
      }
    };

    const cleanup = () => {
      window.removeEventListener('keydown', handleInteraction, true);
      window.removeEventListener('mousedown', handleInteraction, true);
    };

    // Retry every 3 seconds until audio starts
    promptIntervalRef.current = setInterval(tryPlaying, 3000);
    tryPlaying();

    // Also listen for voice list changes as some browsers need this
    window.speechSynthesis.onvoiceschanged = tryPlaying;

    window.addEventListener('keydown', handleInteraction, true);
    window.addEventListener('mousedown', handleInteraction, true);

    return () => {
      cleanup();
      if (promptIntervalRef.current) clearInterval(promptIntervalRef.current);
      if (dismissalTimerRef.current) clearTimeout(dismissalTimerRef.current);
    };
  }, [isVoiceMode, speak]);

  return (
    <VoiceContext.Provider value={{
      isVoiceMode, setIsVoiceMode, speak, listen, readPageContent,
      isListening, isSpeaking, isPrompting
    }}>
      {children}
    </VoiceContext.Provider>
  );
};
