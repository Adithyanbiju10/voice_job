import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import annyang from 'annyang';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface VoiceContextType {
  isVoiceMode: boolean;
  setIsVoiceMode: (v: boolean) => void;
  speak: (text: string) => Promise<void>;
  listen: () => Promise<string>;
  readPageContent: () => void;
  isListening: boolean;
  isSpeaking: boolean;
  isPrompting: boolean;
  isAwake: boolean;
  setIsAwake: (v: boolean) => void;
  lastHeard: string;
  triggerCommand: (text: string) => void;
  playCue: (type: 'wake' | 'success' | 'error' | 'click') => void;
  isFocusMode: boolean;
  setIsFocusMode: (v: boolean) => void;
}

const VoiceContext = createContext<VoiceContextType | null>(null);

export const useVoice = () => {
  const ctx = useContext(VoiceContext);
  if (!ctx) throw new Error('useVoice must be inside VoiceProvider');
  return ctx;
};

export const VoiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isVoiceMode, setIsVoiceMode] = useState(false);

  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPrompting, setIsPrompting] = useState(false);
  const [isAwake, setIsAwake] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [lastHeard, setLastHeard] = useState("");
  const awakeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const speakingRef = useRef(false);
  const speakCounterRef = useRef(0);
  const isFirstVoiceActivationRef = useRef(false); // tracks first Enter-press activation
  const isVoiceModeRef = useRef(isVoiceMode);
  const manualRecognitionRef = useRef<any>(null);

  useEffect(() => {
    isVoiceModeRef.current = isVoiceMode;
  }, [isVoiceMode]);

  const location = useLocation();
  const navigate = useNavigate();

  // Auditory Cues for Blind Users
  const playCue = useCallback((type: 'wake' | 'success' | 'error' | 'click') => {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === 'wake') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'success') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(660, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'error') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    }
  }, []);

  const speak = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) { resolve(); return; }

      const annyangLib = annyang as any;
      if (annyangLib && isVoiceModeRef.current) {
        annyangLib.abort(); // Hard stop listening when we start speaking
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95; // Slightly faster but clearer
      utterance.pitch = 1;

      // Anti-garbage collection hack for Chrome
      (window as any)._currentVoiceUtterance = utterance;

      setIsSpeaking(true);
      speakingRef.current = true;
      speakCounterRef.current += 1;
      const currentId = speakCounterRef.current;

      const finishSpeaking = () => {
        // 800ms silence buffer so the mic doesn't pick up TTS tail audio
        setTimeout(() => {
          // If another utterance has superseded this one, let that one handle it.
          if (speakCounterRef.current !== currentId) {
            return resolve();
          }

          setIsSpeaking(false);
          speakingRef.current = false;
          // Only restart annyang if we are still in voice mode
          if (annyangLib && isVoiceModeRef.current) {
            annyangLib.start({ autoRestart: true, continuous: false });
          }
          resolve();
        }, 800);
      };

      utterance.onend = finishSpeaking;
      utterance.onerror = finishSpeaking;

      window.speechSynthesis.speak(utterance);
    });
  }, []);

  const resetAwakeTimer = useCallback(() => {
    if (awakeTimerRef.current) clearTimeout(awakeTimerRef.current);
    awakeTimerRef.current = setTimeout(() => {
      setIsAwake(false);
      console.log('Assistant going to sleep');
    }, 45000);
  }, []);

  const wakeUp = useCallback(() => {
    setIsAwake(true);
    playCue('wake');
    speak('Yes? I am listening.');
    resetAwakeTimer();
  }, [playCue, speak, resetAwakeTimer]);

  const listen = useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) { reject('Speech recognition not supported'); return; }

      if (manualRecognitionRef.current) {
        manualRecognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      manualRecognitionRef.current = recognition;
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

  // ANNYANG Activation & Life Cycle
  useEffect(() => {
    const annyangLib = annyang as any;
    if (isVoiceMode && annyangLib) {
      console.log('Starting annyang');
      annyangLib.setLanguage('en-US');
      annyangLib.debug(true);
      // Auto restart ensures it keeps listening even after it finishes processing a command
      annyangLib.start({ autoRestart: true, continuous: false });

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
      });

    } else if (annyangLib) {
      console.log('Stopping annyang');
      annyangLib.abort();
      if (manualRecognitionRef.current) {
        manualRecognitionRef.current.abort();
        manualRecognitionRef.current = null;
      }
      setIsListening(false);
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    return () => { if (annyangLib) annyangLib.abort(); };
  }, [isVoiceMode]);

  // UNIVERSAL INTENT ENGINE
  const processUniversalCommand = useCallback((text: string) => {
    setLastHeard(text);
    const input = text.toLowerCase().trim();
    console.log('Processing universal command:', input);

    // Helper to check if input contains any of the keywords
    const matches = (keywords: string[]) => keywords.some(k => input.includes(k));

    // 0. Voice Typing & Form Filling
    if (matches(['type', 'enter text', 'my name is', 'my email is', 'company is', 'write'])) {
      const fieldText = input
        .replace('type', '')
        .replace('enter text', '')
        .replace('my name is', '')
        .replace('my email is', '')
        .replace('company is', '')
        .replace('write', '')
        .trim();

      if (fieldText) {
        const activeEl = document.activeElement as HTMLInputElement | HTMLTextAreaElement;
        if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
          activeEl.value = fieldText;
          activeEl.dispatchEvent(new Event('input', { bubbles: true }));
          speak(`Typed ${fieldText}.`);
          return true;
        }
      }
    }

    // 1. Navigation Intents
    if (matches(['home', 'main page', 'index', 'landing', 'start over'])) {
      speak('Heading back to the home page.');
      navigate('/');
      return true;
    }
    if (matches(['jobs', 'careers', 'work', 'vacancies', 'opportunities', 'find a job', 'browse'])) {
      speak('Opening the jobs section for you.');
      navigate('/jobs');
      return true;
    }
    if (matches(['profile', 'my account', 'settings', 'personal info', 'dashboard'])) {
      speak('Navigating to your profile.');
      navigate('/profile');
      return true;
    }
    if (matches(['messages', 'communications', 'inbox']) || (matches(['chat']) && !matches(['voice chat']))) {
      speak('Opening your messages.');
      navigate('/messages');
      return true;
    }
    if (matches(['sign in', 'login', 'log in', 'access my account'])) {
      navigate('/auth?mode=login');
      return true;
    }
    if (matches(['sign up', 'register', 'create account', 'join', 'signup'])) {
      navigate('/auth?mode=signup');
      return true;
    }


    if (matches(['focus mode', 'high contrast', 'simplified', 'low vision', 'zoom', 'normal mode', 'standard mode', 'standard display', 'exit focus mode', 'reset view'])) {
      // If the user explicitly asks for 'normal' or 'standard', we force it to false.
      // Otherwise, we toggle it (for 'focus mode' command).
      const isExplicitNormal = matches(['normal', 'standard', 'reset', 'exit']);
      const newState = isExplicitNormal ? false : !isFocusMode;

      if (isExplicitNormal && !isFocusMode) {
        speak('You are already in standard display mode.');
        return true;
      }

      setIsFocusMode(newState);
      speak(newState ? 'Activating high contrast focus mode. Fonts enlarged.' : 'Returning to standard display mode.');
      playCue('success');
      return true;
    }

    // 2. Action Intents
    if (matches(['read', 'what is on', 'page content', 'explain', 'tell me about'])) {
      speak('Sure, let me read the page for you.');
      readPageContent();
      return true;
    }
    if (matches(['stop', 'be quiet', 'cancel', 'shut up', 'silence', 'enough'])) {
      window.speechSynthesis.cancel();
      speak('Stopping all audio.');
      return true;
    }
    if (matches(['go to sleep', 'goodbye', 'bye', 'standard mode', 'later', 'sleep'])) {
      setIsAwake(false);
      speak('I will be here if you need me. Just say "Hey Ability" to wake me up.');
      return true;
    }
    if (matches(['help', 'what can you do', 'commands', 'instructions', 'how to use'])) {
      speak('I can help you navigate. You can say go to jobs, read the page, open my profile, or sign out. I understand natural speech, so just tell me what you need.');
      return true;
    }
    if (matches(['back', 'previous', 'go back', 'return'])) {
      speak('Going back.');
      navigate(-1);
      return true;
    }
    if (matches(['post a job', 'create a job', 'new job posting', 'add a job'])) {
      if (user?.role === 'employer') {
        speak('Opening the job creation form.');
        window.dispatchEvent(new CustomEvent('voice-command', { detail: 'open-post-job' }));
      } else {
        speak('I am sorry, but only employers are allowed to post jobs on this platform.');
      }
      return true;
    }



    // 4. Page Specific Actions (Context Aware)
    const path = location.pathname;

    // A. JOBS PAGE LOGIC
    if (path === '/jobs') {
      if (matches(['next', 'more', 'another one', 'skip'])) {
        speak('Reading the next job listing.');
        // We'll need a way to trigger 'next' in Jobs.tsx. 
        // For now, we dispatch a custom event.
        window.dispatchEvent(new CustomEvent('voice-command', { detail: 'next' }));
        return true;
      }
      if (matches(['search for', 'find'])) {
        const query = input.replace('search for', '').replace('find', '').trim();
        if (query) {
          window.dispatchEvent(new CustomEvent('voice-search', { detail: query }));
          speak(`Searching for ${query}`);
          return true;
        }
      }
    }

    // B. PROFILE PAGE LOGIC
    if (path === '/profile') {
      if (matches(['sign out', 'logout', 'log out', 'goodbye'])) {
        window.dispatchEvent(new CustomEvent('voice-command', { detail: 'logout' }));
        return true;
      }
      if (matches(['application', 'status', 'my jobs'])) {
        speak('Checking your application status.');
        window.dispatchEvent(new CustomEvent('voice-command', { detail: 'applications' }));
        return true;
      }
      if (matches(['postings', 'applicants', 'my hires'])) {
        speak('Opening your employer dashboard.');
        window.dispatchEvent(new CustomEvent('voice-command', { detail: 'postings' }));
        return true;
      }

    }

    // C. AUTH PAGE LOGIC
    if (path.startsWith('/auth')) {
      // Powerful phonetic matching for diverse accents
      if (matches(['seeker', 'job seeker', 'looking for work', 'find a job', 'i want to work', 'applicant', 'searching for jobs', 'shaker', 'seaker', 'see car'])) {
        speak('Setting your role to job seeker. You can now tell me your name or focus on the name field for me to type.');
        window.dispatchEvent(new CustomEvent('voice-command', { detail: 'select-seeker' }));
        return true;
      }
      if (matches(['employer', 'hiring', 'company', 'i am an employer', 'we are hiring', 'post a job', 'recruiter', 'imployer'])) {
        speak('Setting your role to employer. You can now tell me your company name.');
        window.dispatchEvent(new CustomEvent('voice-command', { detail: 'select-employer' }));
        return true;
      }
      if (matches(['visually impaired', 'blind', 'accessibility', 'vision', 'can\'t see', 'no vision'])) {
        speak('Activating accessibility mode. Setting your role as Job Seeker.');
        window.dispatchEvent(new CustomEvent('voice-command', { detail: 'select-blind' }));
        return true;
      }

      if (matches(['yes', 'yeah', 'yup', 'i am', 'correct', 'definitely', 'yes i am', 'sure', 'affirmative'])) {
        window.dispatchEvent(new CustomEvent('voice-command', { detail: 'select-blind' }));
        return true;
      }

      if (matches(['no', 'nah', 'not really', 'i am not', 'negative', 'nope', 'never'])) {
        speak('Understood. Are you a job seeker or an employer?');
        return true;
      }

    }


    // D. JOB DETAIL LOGIC
    if (path.startsWith('/jobs/')) {
      if (matches(['apply', 'this job', 'send application', 'interest', 'get this'])) {
        speak('Opening the application process for this position.');
        window.dispatchEvent(new CustomEvent('voice-command', { detail: 'apply' }));
        return true;
      }
    }

    // E. MESSAGES PAGE LOGIC
    if (path === '/messages') {
      if (input.startsWith('select ')) {
        const name = input.substring(7).trim();
        window.dispatchEvent(new CustomEvent('voice-command', { detail: { action: 'select', name } }));
        return true;
      }
      if (matches(['read my message', 'what did i type', 'what is my message', 'read what i wrote'])) {
        window.dispatchEvent(new CustomEvent('voice-command', { detail: { action: 'read-my-message' } }));
        return true;
      }
      if (matches(['clear message', 'delete message', 'start over', 'erase message'])) {
        window.dispatchEvent(new CustomEvent('voice-command', { detail: { action: 'clear-message' } }));
        return true;
      }
      if (matches(['send message', 'send'])) {
        window.dispatchEvent(new CustomEvent('voice-command', { detail: { action: 'send' } }));
        return true;
      }
      if (matches(['read messages', 'read', 'read history'])) {
        window.dispatchEvent(new CustomEvent('voice-command', { detail: { action: 'read' } }));
        return true;
      }
      if (input.length > 2) {
        window.dispatchEvent(new CustomEvent('voice-command', { detail: { action: 'try-select', name: input } }));
        return true;
      }
    }

    // 5. Fallback Logic (Helpful Nudges)
    if (input.length > 2) {
      const handled = true; // Mark as handled by fallback
      resetAwakeTimer();

      const path = location.pathname;
      if (path === '/') {
        speak(`I didn't quite get that. You can say "search for jobs" or "about" to learn more.`);
      } else if (path === '/jobs') {
        speak(`I'm not sure. You can say "read first job" or "find tech jobs".`);
      } else {
        speak(`I'm still learning! You can say "go home" or "help".`);
      }
      return true;
    }
    return false;
  }, [navigate, speak, readPageContent, location.pathname, playCue]);

  // Ref to hold the latest processing logic without triggering useEffect re-runs
  const processRef = useRef(processUniversalCommand);
  const isAwakeRef = useRef(isAwake);

  useEffect(() => {
    processRef.current = processUniversalCommand;
  }, [processUniversalCommand]);

  useEffect(() => {
    isAwakeRef.current = isAwake;
  }, [isAwake]);

  // Unified Annyang Lifecycle
  useEffect(() => {
    const annyangLib = annyang as any;
    if (!annyangLib) return;

    if (isVoiceMode) {
      console.log('Voice Mode Active: Initializing Annyang');
      annyangLib.setLanguage('en-US');
      annyangLib.debug(true);

      const wakeCommands = {
        'hey ability': wakeUp,
        'hey assistant': wakeUp,
        'hey google': wakeUp,
        'wake up': wakeUp,
        'ability': wakeUp
      };

      const universalCommand = {
        '*text': (text: string) => {
          if (speakingRef.current) return;
          window.dispatchEvent(new CustomEvent('voice-input', { detail: text.toLowerCase().trim() }));

          if (isAwakeRef.current) {
            const handled = processRef.current(text);
            if (handled) resetAwakeTimer();
          } else {
            const lower = text.toLowerCase();
            if (lower.includes('hey ability') || lower.includes('wake up') || lower.includes('ability')) {
              wakeUp();
            }
          }
        }
      };

      annyangLib.removeCommands();
      annyangLib.addCommands(wakeCommands);
      annyangLib.addCommands(universalCommand);

      annyangLib.start({ autoRestart: true, continuous: false });

      return () => {
        annyangLib.abort();
        if (awakeTimerRef.current) clearTimeout(awakeTimerRef.current);
      };
    } else {
      annyangLib.abort();
    }
  }, [isVoiceMode, speak]); // Only re-run when mode flips

  // Manual Wake Listeners & Shortcuts
  useEffect(() => {
    if (!isVoiceMode) return;

    const handleAction = (e?: Event) => {
      if (!isAwake) {
        wakeUp();
      }
      resetAwakeTimer();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt + A to Wake
      if (e.altKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        handleAction();
        speak("I'm awake. How can I help you?");
      }
    };

    window.addEventListener('mousedown', handleAction);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleAction);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVoiceMode, isAwake, playCue, speak]);

  // Apply Focus Mode globally
  useEffect(() => {
    if (isFocusMode) {
      document.documentElement.classList.add('focus-mode');
    } else {
      document.documentElement.classList.remove('focus-mode');
    }
  }, [isFocusMode]);

  // Page Transition Audio Summary
  useEffect(() => {
    if (!isVoiceMode) return;

    playCue('success');

    // If this is the very first voice activation (user just pressed Enter),
    // speak the welcome + wake-word message instead of the page heading.
    if (isFirstVoiceActivationRef.current) {
      isFirstVoiceActivationRef.current = false;
      setTimeout(() => {
        speak('Welcome to Ability Jobs. Please say Hey Ability to wake the voice assistant.');
      }, 300);
      return;
    }

    const pageName = location.pathname === '/' ? 'Home' : location.pathname.substring(1).charAt(0).toUpperCase() + location.pathname.substring(2);

    // Brief delay to allow page render
    setTimeout(() => {
      const main = document.querySelector('main');
      const headings = main?.querySelectorAll('h1, h2');
      const primaryHeading = headings?.[0]?.textContent || pageName;
      speak(`Navigated to ${primaryHeading} page.`);
    }, 500);
  }, [location.pathname, isVoiceMode, speak, playCue]);
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

    // Ensure annyang is NOT running while the initial prompt plays
    const annyangLib = annyang as any;
    if (annyangLib) {
      annyangLib.abort();
    }

    const playPrompt = () => {
      if (hasPromptedRef.current || isVoiceMode) return;
      if (window.speechSynthesis.speaking) return;

      // Stop annyang again right before speaking, in case something restarted it
      if (annyangLib) {
        annyangLib.abort();
      }

      const utterance = new SpeechSynthesisUtterance(
        'Welcome to Ability jobs. Voice assistance is available for visually impaired users. If you want to enable voice assistance, please press the Enter key now. To continue without voice assistance, click anywhere.'
      );
      utterance.rate = 0.85;

      utterance.onstart = () => {
        // Clear the aggressive retry once audio starts
        if (promptIntervalRef.current) {
          clearInterval(promptIntervalRef.current);
          promptIntervalRef.current = null;
        }
        // Make absolutely sure annyang stays off while prompt is playing
        if (annyangLib) {
          annyangLib.abort();
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

          // Flag so the Page Transition effect speaks the welcome message instead of page heading
          isFirstVoiceActivationRef.current = true;
          setIsVoiceMode(true);
          const annyangLib = annyang as any;
          if (annyangLib) {
            annyangLib.start({ autoRestart: true, continuous: true });
          }
          cleanup();
        } else if (e.key !== 'Tab') {
          dismissPrompt();
        }
      } else if (e.type === 'mousedown' || e instanceof MouseEvent || e instanceof PointerEvent) {
        dismissPrompt();
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
      isListening, isSpeaking, isPrompting, isAwake, setIsAwake, lastHeard,
      triggerCommand: (text: string) => {
        setIsAwake(true);
        processUniversalCommand(text);
      },
      playCue,
      isFocusMode,
      setIsFocusMode
    }}>
      {children}
    </VoiceContext.Provider>
  );
};
