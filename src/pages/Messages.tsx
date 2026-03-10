import { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, Star, UserCircle, Briefcase, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useVoice } from '@/contexts/VoiceContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

// Make sure annyang is imported to fix any type issues if they exist
import annyang from 'annyang';

interface Contact {
    id: string; // conversationId
    name: string;
    role: string;
    unread: number;
    jobTitle?: string;
    otherUserEmail?: string;
    otherUserName?: string;
}

interface ChatMessage {
    id: string;
    conversationId: string;
    senderRole: 'seeker' | 'employer';
    senderName: string;
    text: string;
    time: string;
    timestamp: number;
}

const LOCAL_MESSAGES_KEY = 'ability_jobs_messages';
const ALL_APPS_KEY = 'all_applications';

const Messages = () => {
    const { user } = useAuth();
    const { isVoiceMode, speak } = useVoice();
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [activeContact, setActiveContact] = useState<Contact | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [isListening, setIsListening] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initialize Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = SpeechRecognition ? new SpeechRecognition() : null;

    if (recognition) {
        recognition.continuous = false;
        recognition.interimResults = false;
    }

    const loadContacts = () => {
        if (!user) return;
        const allApps = JSON.parse(localStorage.getItem(ALL_APPS_KEY) || '[]');
        const contactMap = new Map<string, Contact>();

        if (user.role === 'seeker') {
            const myApps = allApps.filter((app: any) => app.applicantEmail === user.email);
            myApps.forEach((app: any) => {
                const conversationId = `${app.employerName}_${user.email}`;
                if (!contactMap.has(conversationId)) {
                    contactMap.set(conversationId, {
                        id: conversationId,
                        name: app.employerName,
                        role: 'employer',
                        unread: 0,
                        jobTitle: app.jobTitle,
                        otherUserName: app.employerName,
                    });
                }
            });
        } else if (user.role === 'employer') {
            const myApps = allApps.filter((app: any) => app.employerName === user.name);
            myApps.forEach((app: any) => {
                const conversationId = `${user.name}_${app.applicantEmail}`;
                if (!contactMap.has(conversationId)) {
                    contactMap.set(conversationId, {
                        id: conversationId,
                        name: app.applicantName,
                        role: 'seeker',
                        unread: 0,
                        jobTitle: app.jobTitle,
                        otherUserEmail: app.applicantEmail,
                        otherUserName: app.applicantName,
                    });
                }
            });
        } else if (user.role === 'admin') {
            // Admin sees all unique conversations on the platform
            allApps.forEach((app: any) => {
                const conversationId = `${app.employerName}_${app.applicantEmail}`;
                if (!contactMap.has(conversationId)) {
                    contactMap.set(conversationId, {
                        id: conversationId,
                        name: `${app.applicantName} ↔ ${app.employerName}`,
                        role: 'seeker', // Meta-role
                        unread: 0,
                        jobTitle: app.jobTitle,
                        otherUserName: app.applicantName,
                    });
                }
            });
        }

        const loadedContacts = Array.from(contactMap.values());
        setContacts(loadedContacts);

        if (loadedContacts.length > 0 && !activeContact) {
            setActiveContact(loadedContacts[0]);
        }
    };

    const loadMessages = () => {
        const stored = localStorage.getItem(LOCAL_MESSAGES_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setMessages(parsed);
            } catch (e) {
                console.error("Failed to parse messages");
            }
        }
    };

    useEffect(() => {
        loadContacts();
        loadMessages();

        const handleStorage = (e: StorageEvent) => {
            if (e.key === LOCAL_MESSAGES_KEY) {
                loadMessages();
            }
            if (e.key === ALL_APPS_KEY) {
                loadContacts();
            }
        };

        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, [user]);

    useEffect(() => {
        if (activeContact) {
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    }, [messages, activeContact]);

    useEffect(() => {
        if (isVoiceMode && activeContact) {
            const currentMessages = messages.filter(m => m.conversationId === activeContact.id);
            if (currentMessages.length > 0) {
                const lastMsg = currentMessages[currentMessages.length - 1];
                if (lastMsg.senderName !== user?.name) {
                    speak(`New message from ${lastMsg.senderName}: ${lastMsg.text}`);
                }
            }
        }
    }, [messages.length]);

    const handleSend = () => {
        if (!inputText.trim() || !activeContact || !user) return;

        const newMessage: ChatMessage = {
            id: Date.now().toString(),
            conversationId: activeContact.id,
            senderRole: user.role === 'seeker' ? 'seeker' : 'employer',
            senderName: user.name,
            text: inputText.trim(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp: Date.now()
        };

        const updatedMessages = [...messages, newMessage];
        setMessages(updatedMessages);
        localStorage.setItem(LOCAL_MESSAGES_KEY, JSON.stringify(updatedMessages));
        setInputText('');
    };

    const toggleDictation = async () => {
        if (!recognition) {
            toast.error("Speech recognition is not supported in this browser.");
            return;
        }

        const annyangLib = annyang as any;

        if (isListening) {
            recognition.stop();
            setIsListening(false);
            if (isVoiceMode) await speak("Stopped listening.");
        } else {
            if (isVoiceMode) {
                await speak("Typing message.");
            }

            if (annyangLib) {
                annyangLib.abort();
            }

            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                const prevText = stateRef.current.inputText;
                const newText = (prevText ? prevText + ' ' : '') + transcript;

                setInputText(newText);
                setIsListening(false);

                if (isVoiceMode) {
                    speak(`Your message is: ${newText}. Press Enter or say send to send it.`);
                } else if (annyangLib) {
                    annyangLib.start({ autoRestart: true, continuous: false });
                }
            };

            recognition.onerror = (event: any) => {
                setIsListening(false);
                if (isVoiceMode) {
                    speak("Error with dictation.");
                } else if (annyangLib) {
                    annyangLib.start({ autoRestart: true, continuous: false });
                }
                toast.error("Microphone error: " + event.error);
            };

            recognition.onend = () => {
                setIsListening(false);
                if (annyangLib && !window.speechSynthesis.speaking) {
                    try {
                        annyangLib.start({ autoRestart: true, continuous: false });
                    } catch (e) { }
                }
            };

            setTimeout(() => {
                try {
                    recognition.start();
                    setIsListening(true);
                } catch (e) {
                    setIsListening(false);
                    if (annyangLib) annyangLib.start({ autoRestart: true, continuous: false });
                }
            }, 600);
        }
    };

    // Voice Engine Integration for Messages
    const stateRef = useRef({ contacts, activeContact, messages, inputText });
    const toggleDictationRef = useRef(toggleDictation);
    const handleSendRef = useRef(handleSend);

    useEffect(() => {
        stateRef.current = { contacts, activeContact, messages, inputText };
        toggleDictationRef.current = toggleDictation;
        handleSendRef.current = handleSend;
    }, [contacts, activeContact, messages, inputText, toggleDictation, handleSend]);

    useEffect(() => {
        if (!isVoiceMode) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === ' ') {
                e.preventDefault();
                toggleDictationRef.current();
            } else if (e.key === 'Enter') {
                if (stateRef.current.inputText.trim() && stateRef.current.activeContact) {
                    e.preventDefault();
                    const textToSend = stateRef.current.inputText.trim();
                    handleSendRef.current();
                    speak(`Message sent: ${textToSend}`);
                }
            } else if (e.key === 'Backspace') {
                if (stateRef.current.inputText.length > 0) {
                    speak("deleted");
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isVoiceMode, speak]);

    useEffect(() => {
        if (!isVoiceMode) return;

        const handleVoiceCommand = (e: any) => {
            const detail = e.detail;
            if (!detail || typeof detail !== 'object') return;

            if (detail.action === 'select' || detail.action === 'try-select') {
                const name = detail.name as string;
                if (!name) return;

                const lowerName = name.toLowerCase();

                const matches = stateRef.current.contacts.filter(c => {
                    const cName = c.name.toLowerCase();
                    const cRole = (c.jobTitle || '').toLowerCase();
                    return cName.includes(lowerName) ||
                        lowerName.includes(cName) ||
                        (cRole && (cRole.includes(lowerName) || lowerName.includes(cRole)));
                });

                let matched = null;
                if (matches.length === 1) {
                    matched = matches[0];
                } else if (matches.length > 1) {
                    matched = matches.find(c => {
                        const cName = c.name.toLowerCase();
                        const cRole = (c.jobTitle || '').toLowerCase();
                        return lowerName.includes(cName) && cRole && lowerName.includes(cRole);
                    });
                    if (!matched) matched = matches[0]; // fallback to first match
                }

                if (matched) {
                    setActiveContact(matched);
                    speak(`Selected chat with ${matched.name}${matched.jobTitle ? ` for the ${matched.jobTitle} role` : ''}. Press Control and Space together to start dictating, or say read messages to hear history.`);
                } else {
                    speak(`Could not find a conversation matching ${name}.`);
                }
            } else if (detail.action === 'read-my-message') {
                if (stateRef.current.inputText.trim()) {
                    speak(`Your message is: ${stateRef.current.inputText.trim()}`);
                } else {
                    speak("You haven't typed a message yet.");
                }
            } else if (detail.action === 'clear-message') {
                setInputText('');
                speak("Message cleared.");
            } else if (detail.action === 'send') {
                if (!stateRef.current.inputText.trim()) {
                    speak("You haven't typed a message yet. Press Control and Space to start.");
                } else {
                    const textToSend = stateRef.current.inputText.trim();
                    handleSendRef.current();
                    speak(`Message sent: ${textToSend}`);
                }
            } else if (detail.action === 'read') {
                const { activeContact: ac, messages: msgs } = stateRef.current;
                if (!ac) {
                    speak("Please select a conversation first.");
                    return;
                }
                const activeMsgs = msgs.filter(m => m.conversationId === ac.id).sort((a, b) => a.timestamp - b.timestamp);
                if (activeMsgs.length === 0) {
                    speak("No messages in this chat yet.");
                } else {
                    let text = `Reading last messages with ${ac.name}. `;
                    const recent = activeMsgs.slice(-3); // Read last 3 messages
                    recent.forEach(m => {
                        text += `${m.senderName} said at ${m.time}: ${m.text}. `;
                    });
                    speak(text);
                }
            }
        };

        // Announce contacts exactly once when Voice Mode is awake (using a small timeout to let page load)
        const timeout = setTimeout(() => {
            const { contacts: currentContacts } = stateRef.current;
            if (currentContacts.length > 0) {
                const names = currentContacts.map(c => c.jobTitle ? `${c.name} for the ${c.jobTitle} role` : c.name).join(', ');
                speak(`You are in messages. You have conversations with: ${names}. Say select followed by a name or role to open a chat.`);
            } else {
                speak(`You have no messages yet.`);
            }
        }, 1000);

        window.addEventListener('voice-command', handleVoiceCommand);

        return () => {
            clearTimeout(timeout);
            window.removeEventListener('voice-command', handleVoiceCommand);
        };
    }, [isVoiceMode, speak]);

    const activeMessages = activeContact
        ? messages.filter(m => m.conversationId === activeContact.id).sort((a, b) => a.timestamp - b.timestamp)
        : [];

    return (
        <main className="container py-8 md:py-12">
            <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h1 className="font-heading text-4xl md:text-5xl font-extrabold mb-3 tracking-tight flex items-center gap-4">
                    <MessageSquare className="h-10 w-10 text-primary" />
                    Communications
                </h1>
                <p className="text-muted-foreground text-lg">
                    {user?.role === 'admin'
                        ? 'Monitoring all platform communication for quality and safety.'
                        : `Real-time chat with ${user?.role === 'employer' ? 'applicants' : 'employers'}, schedule interviews, and discuss roles.`}
                </p>
            </div>

            <div className="flex flex-col md:flex-row gap-6 h-[600px] animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>

                {/* Sidebar */}
                <div className="w-full md:w-1/3 flex flex-col gap-4 border rounded-xl bg-card overflow-hidden h-[300px] md:h-full">
                    <div className="p-4 border-b bg-muted/20">
                        <h2 className="font-bold text-lg">Conversations</h2>
                    </div>
                    <ScrollArea className="flex-1">
                        <div className="flex flex-col">
                            {contacts.length === 0 ? (
                                <div className="p-6 text-center text-muted-foreground flex flex-col items-center gap-3">
                                    <MessageSquare className="h-8 w-8 opacity-20" />
                                    <p>No conversations yet.</p>
                                    <p className="text-xs">{user?.role === 'seeker' ? "Apply to jobs to start chatting with employers." : "Wait for seekers to apply to your jobs."}</p>
                                </div>
                            ) : (
                                contacts.map(contact => (
                                    <button
                                        key={contact.id}
                                        onClick={() => setActiveContact(contact)}
                                        className={`flex items-center gap-3 p-4 text-left border-b transition-colors hover:bg-secondary/50
                                            ${activeContact?.id === contact.id ? 'bg-secondary border-l-4 border-l-primary' : ''}
                                        `}
                                    >
                                        <UserCircle className="h-10 w-10 text-muted-foreground" />
                                        <div className="flex-1 overflow-hidden">
                                            <h3 className="font-medium truncate">{contact.name}</h3>
                                            <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                                                <Briefcase className="h-3 w-3 flex-shrink-0" /> {contact.jobTitle || 'Application'}
                                            </p>
                                        </div>
                                        {contact.unread > 0 && (
                                            <Badge variant="default" className="w-5 h-5 flex items-center justify-center p-0 rounded-full">
                                                {contact.unread}
                                            </Badge>
                                        )}
                                    </button>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </div>

                {/* Chat Area */}
                <div className="flex-1 flex flex-col border rounded-xl bg-card overflow-hidden relative">
                    {activeContact ? (
                        <>
                            <div className="p-4 border-b bg-muted/20 flex justify-between items-center z-10">
                                <div className="flex items-center gap-3">
                                    <UserCircle className="h-10 w-10 text-primary" />
                                    <div>
                                        <h2 className="font-bold">{activeContact.name}</h2>
                                        {activeContact.role === 'employer' && (
                                            <div className="flex items-center gap-1 text-xs font-medium text-success">
                                                <Star className="h-3 w-3 fill-success" /> Endorsed Employer
                                            </div>
                                        )}
                                        {activeContact.jobTitle && (
                                            <div className="text-xs text-muted-foreground mt-0.5">
                                                {activeContact.jobTitle}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <ScrollArea className="flex-1 p-4 bg-background/50">
                                <div className="flex flex-col gap-4 pb-4">
                                    {activeMessages.length === 0 ? (
                                        <div className="flex justify-center items-center h-full min-h-[200px] text-muted-foreground text-sm italic">
                                            No messages yet. Start the conversation!
                                        </div>
                                    ) : (
                                        activeMessages.map(msg => {
                                            const isMe = msg.senderName === user?.name;
                                            return (
                                                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                    {!isMe && (
                                                        <div className="mr-2 mt-1">
                                                            <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">
                                                                {msg.senderName.charAt(0).toUpperCase()}
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${isMe
                                                        ? 'bg-primary text-primary-foreground rounded-tr-sm'
                                                        : 'bg-muted rounded-tl-sm border border-border/50'
                                                        }`}>
                                                        <p className="text-sm whitespace-pre-wrap word-break">{msg.text}</p>
                                                        <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                                            {msg.time}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>
                            </ScrollArea>

                            {user?.role !== 'admin' && (
                                <div className="p-4 border-t bg-card z-10">
                                    <form
                                        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                                        className="flex items-center gap-2"
                                    >
                                        <Button
                                            id="mic-button"
                                            type="button"
                                            size="icon"
                                            variant="outline"
                                            className={`rounded-full shadow-sm transition-colors ${isListening ? 'bg-destructive/10 border-destructive text-destructive' : ''}`}
                                            onClick={toggleDictation}
                                            title="Dictate message"
                                        >
                                            <Mic className={`h-4 w-4 ${isListening ? 'animate-pulse' : ''}`} />
                                        </Button>
                                        <Input
                                            value={inputText}
                                            onChange={(e) => setInputText(e.target.value)}
                                            placeholder={isListening ? "Listening..." : "Type your message..."}
                                            className="flex-1 rounded-full border-primary/20 focus-visible:ring-primary/50"
                                            onFocus={() => isVoiceMode && speak("Type your message here. Press Enter to send, or use Control and Space to start dictating.")}
                                        />
                                        <Button type="submit" size="icon" className="rounded-full shadow-md hover:scale-105 transition-transform" disabled={!inputText.trim()}>
                                            <Send className="h-4 w-4" />
                                        </Button>
                                    </form>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-muted-foreground flex-col gap-4">
                            <MessageSquare className="h-16 w-16 opacity-10" />
                            <p>Select a conversation to start chatting.</p>
                        </div>
                    )}
                </div>

            </div>
        </main>
    );
};

export default Messages;

