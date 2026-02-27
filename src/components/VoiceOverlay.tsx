import { useVoice } from '@/contexts/VoiceContext';
import { Mic } from 'lucide-react';

const VoiceOverlay = () => {
  const { isListening, isSpeaking, isPrompting } = useVoice();

  if (!isListening && !isSpeaking && !isPrompting) return null;

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-background/60 backdrop-blur-md transition-all duration-500 ${isPrompting ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      <div className="flex flex-col items-center gap-4">
        {isPrompting ? (
          <div className="animate-in fade-in zoom-in duration-500 flex flex-col items-center gap-8 max-w-md p-8 rounded-3xl bg-card/80 border shadow-2xl backdrop-blur-xl">
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
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className={`rounded-full bg-primary p-6 shadow-xl ${isListening ? 'voice-pulse' : 'animate-pulse shadow-primary/20'}`}>
              <Mic className="h-10 w-10 text-primary-foreground" />
            </div>
            <p className="text-lg font-heading font-semibold text-foreground px-6 py-2 rounded-full bg-background/80 border backdrop-blur-sm shadow-lg">
              {isListening ? 'Listening...' : 'Speaking...'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceOverlay;
