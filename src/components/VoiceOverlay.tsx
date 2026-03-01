import { useVoice } from '@/contexts/VoiceContext';
import { Mic } from 'lucide-react';

const VoiceOverlay = () => {
  const { isListening, isSpeaking, isPrompting } = useVoice();

  if (!isListening && !isSpeaking && !isPrompting) return null;

  // Initial Accessibility Prompt - Keep centered but more transparent
  if (isPrompting) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all duration-500 pointer-events-auto">
        <div className="animate-in fade-in zoom-in duration-500 flex flex-col items-center gap-8 max-w-md p-8 rounded-3xl bg-card/90 border border-primary/20 shadow-2xl backdrop-blur-xl">
          <div className="rounded-full bg-primary/20 p-8 voice-pulse border border-primary/20">
            <Mic className="h-16 w-16 text-primary" />
          </div>
          <div className="text-center">
            <h2 className="text-3xl font-heading font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">Ability Jobs Accessibility</h2>
            <p className="text-xl text-foreground font-medium leading-relaxed">
              Voice assistance is available.<br />
              Press <span className="inline-block px-3 py-1 bg-primary text-primary-foreground rounded-lg shadow-md animate-pulse">Enter</span> now to enable full voice guidance.
            </p>
            <p className="mt-6 text-sm text-muted-foreground italic">
              To continue without voice assistance, please wait or click anywhere.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Active Voice Mode - Floating Widget in Bottom Right
  return (
    <div className="fixed bottom-6 right-6 z-[100] pointer-events-none">
      <div className="flex flex-col items-end gap-3 pointer-events-auto">
        <div className={`flex items-center gap-4 pl-5 pr-2 py-2 rounded-full border backdrop-blur-md shadow-lg transition-all duration-500 transform
          ${isListening ? 'bg-primary/5 border-primary/20 scale-100' : 'bg-background/20 border-border/20 scale-95 opacity-80'}
        `}>
          <div className="flex flex-col items-start leading-tight">
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary/70">Assistant</p>
            <p className="text-xs font-heading font-semibold text-foreground/80">
              {isListening ? (
                <span className="flex items-center gap-1.5">
                  <span className="flex gap-[2px] h-3 items-center">
                    <span className="w-0.5 h-full bg-primary animate-voice-bar-1"></span>
                    <span className="w-0.5 h-2/3 bg-primary animate-voice-bar-2"></span>
                    <span className="w-0.5 h-full bg-primary animate-voice-bar-3"></span>
                  </span>
                  Ready to help
                </span>
              ) : isSpeaking ? 'Speaking...' : 'Ready'}
            </p>
          </div>
          <div className={`rounded-full p-2.5 shadow-sm transition-all duration-500
            ${isListening ? 'bg-primary text-primary-foreground shadow-primary/20' : 'bg-secondary/40 text-muted-foreground'}
          `}>
            {isListening ? (
              <div className="relative">
                <Mic className="h-4 w-4" />
                <span className="absolute -inset-1 rounded-full border border-primary/50 animate-ping opacity-20"></span>
              </div>
            ) : <Mic className="h-4 w-4" />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceOverlay;
