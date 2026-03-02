import { motion, AnimatePresence } from 'framer-motion';
import { useVoice } from '@/contexts/VoiceContext';
import { Home, Briefcase, FileText, User, ArrowLeft, VolumeX, Sparkles, MessageCircle, Mic, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { useLocation } from 'react-router-dom';

const VisualCommandCenter = () => {
    const { isVoiceMode, triggerCommand, isSpeaking, setIsAwake, isFocusMode, setIsFocusMode } = useVoice();
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();

    // Features specifically for non-verbal users to trigger AI actions
    const commands = [
        { icon: Home, label: 'Home', intent: 'go home', color: 'bg-blue-600' },
        { icon: Briefcase, label: 'Jobs', intent: 'browse jobs', color: 'bg-purple-600' },
        { icon: FileText, label: 'Read Page', intent: 'read page content', color: 'bg-orange-600' },
        { icon: User, label: 'Profile', intent: 'open profile', color: 'bg-emerald-600' },
        { icon: ArrowLeft, label: 'Back', intent: 'go back', color: 'bg-slate-600' },
    ];

    // Context aware commands
    const isJobPage = location.pathname.startsWith('/jobs/');
    const isJobsList = location.pathname === '/jobs';

    if (!isVoiceMode) return null;

    return (
        <div className="fixed bottom-24 right-6 z-[60] flex flex-col items-end gap-3 pointer-events-none">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="pointer-events-auto mb-2 flex flex-col gap-2 p-3 rounded-2xl bg-card/60 backdrop-blur-2xl border border-primary/20 shadow-2xl min-w-[180px]"
                    >
                        <div className="px-2 py-1 mb-1">
                            <h3 className="text-[10px] font-bold uppercase tracking-wider text-primary/70 flex items-center gap-1.5">
                                <Sparkles className="h-3 w-3" /> Quick AI Actions
                            </h3>
                        </div>

                        {commands.map((cmd) => (
                            <button
                                key={cmd.intent}
                                onClick={() => {
                                    triggerCommand(cmd.intent);
                                    setIsOpen(false);
                                }}
                                className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-primary/10 text-foreground transition-all group border border-transparent hover:border-primary/20"
                            >
                                <div className={`p-1.5 rounded-lg ${cmd.color} text-white shadow-sm group-hover:scale-110 transition-transform`}>
                                    <cmd.icon className="h-4 w-4" />
                                </div>
                                <span className="text-sm font-medium">{cmd.label}</span>
                            </button>
                        ))}

                        {isJobPage && (
                            <motion.button
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                onClick={() => {
                                    triggerCommand('apply');
                                    setIsOpen(false);
                                }}
                                className="flex items-center gap-3 w-full p-2.5 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                            >
                                <div className="p-1.5 rounded-lg bg-white/20">
                                    <Sparkles className="h-4 w-4" />
                                </div>
                                <span className="text-sm font-bold">Apply Now</span>
                            </motion.button>
                        )}

                        {isSpeaking && (
                            <button
                                onClick={() => triggerCommand('stop')}
                                className="flex items-center gap-3 w-full p-2.5 rounded-xl bg-destructive text-white shadow-lg hover:scale-[1.02] transition-all"
                            >
                                <div className="p-1.5 rounded-lg bg-white/20">
                                    <VolumeX className="h-4 w-4" />
                                </div>
                                <span className="text-sm font-bold uppercase tracking-wider">Stop Audio</span>
                            </button>
                        )}

                        <button
                            onClick={() => triggerCommand('focus mode')}
                            className={`flex items-center gap-3 w-full p-2.5 rounded-xl transition-all border shadow-sm mt-1
                                ${isFocusMode
                                    ? 'bg-yellow-400 text-black border-yellow-500 font-black'
                                    : 'bg-slate-800 text-white border-slate-700 hover:bg-slate-700'}
                            `}
                        >
                            <div className={`p-1.5 rounded-lg ${isFocusMode ? 'bg-black text-yellow-400' : 'bg-white/10'}`}>
                                <Sparkles className="h-4 w-4" />
                            </div>
                            <div className="flex flex-col items-start leading-tight">
                                <span className="text-sm font-bold uppercase tracking-wider">{isFocusMode ? 'Normal mode' : 'Focus mode'}</span>
                                <span className="text-[9px] opacity-70">High Contrast & Large Text</span>
                            </div>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                layout
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                    setIsOpen(!isOpen);
                    if (!isOpen) setIsAwake(true);
                }}
                className={`pointer-events-auto h-14 w-14 rounded-full flex items-center justify-center shadow-2xl transition-all border-2
                    ${isOpen ? 'bg-background border-primary text-primary' : 'bg-primary border-primary/20 text-primary-foreground'}
                `}
                aria-label="AAC Accessibility Menu"
            >
                {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}

                {!isOpen && (
                    <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="absolute inset-0 rounded-full bg-primary -z-10"
                    />
                )}
            </motion.button>
        </div>
    );
};

export default VisualCommandCenter;
