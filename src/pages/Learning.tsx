import { useState, useEffect, useRef, useMemo } from 'react';
import { BookOpen, MonitorPlay, FileText, ExternalLink, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useVoice } from '@/contexts/VoiceContext';


const MOCK_RESOURCES = [
    {
        id: '1',
        title: 'Web Development Basics',
        url: 'https://www.freecodecamp.org/learn/2022/responsive-web-design/',
        description: 'Learn HTML and CSS from scratch with free, accessible coding challenges.',
        format: 'course',
        skill_id: '1',
        category: 'Coding'
    },
    {
        id: '2',
        title: 'JavaScript for Beginners',
        url: 'https://www.youtube.com/watch?v=PkZNo7MFNFg',
        description: 'Comprehensive introduction to the most popular programming language.',
        format: 'video',
        skill_id: '2',
        category: 'Coding'
    },
    {
        id: '3',
        title: 'Accessible Coding: Tools & Tips',
        url: 'https://www.youtube.com/watch?v=S37FmN1A-g0',
        description: 'Best practices for writing code using screen readers and voice control.',
        format: 'video',
        skill_id: '3',
        category: 'Coding'
    },
    {
        id: '4',
        title: 'Modern Resume Building',
        url: 'https://www.youtube.com/watch?v=uG2aEh5xBJE',
        description: 'Step-by-step guide to creating a professional resume that passes ATS filters.',
        format: 'video',
        skill_id: '4',
        category: 'Career'
    },
    {
        id: '5',
        title: 'Interview Skills Workshop',
        url: 'https://www.youtube.com/watch?v=Vz5_n8Xp4vU',
        description: 'Mastering the interview process and disclosing disability confidently.',
        format: 'video',
        skill_id: '5',
        category: 'Career'
    },
    {
        id: '6',
        title: 'LinkedIn Optimization',
        url: 'https://www.youtube.com/watch?v=Yp1R_o086j8',
        description: 'Build a strong online presence to attract recruiters and network effectively.',
        format: 'video',
        skill_id: '6',
        category: 'Career'
    },
    {
        id: '7',
        title: 'NVDA Screen Reader Basics',
        url: 'https://www.youtube.com/watch?v=Jao3s_CwdRU',
        description: 'Official beginner guide by Chrome Developers on navigating Windows and Web with NVDA.',
        format: 'video',
        skill_id: '7',
        category: 'Vision'
    },
    {
        id: '8',
        title: 'ASL in the Workplace',
        url: 'https://www.youtube.com/watch?v=S016Y4gL6Uo',
        description: 'Common signs for office communication and professional meetings.',
        format: 'video',
        skill_id: '8',
        category: 'Hearing'
    },
    {
        id: '9',
        title: 'Voice Control on Windows',
        url: 'https://support.microsoft.com/en-us/windows/use-voice-access-to-control-your-pc-sign-in-to-windows-872f9be2-4404-4861-9c60-a2468f7d9953',
        description: 'Master navigating your entire computer using only your voice for motor accessibility.',
        format: 'article',
        skill_id: '9',
        category: 'Motor'
    },
    {
        id: '10',
        title: 'JAN: Employee Rights Guide',
        url: 'https://askjan.org/publications/individuals/Employee-Guide.cfm',
        description: 'Your legal guide to workplace accommodations and your rights under the ADA.',
        format: 'article',
        skill_id: '10',
        category: 'Rights'
    }
];

const Learning = () => {
    const { user } = useAuth();
    const { isVoiceMode, speak, setIsAwake } = useVoice();
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const currentResourceRef = useRef<any>(null);
    const stopReadingRef = useRef(false);
    const isReturningFromOpenRef = useRef(false);

    const getFormatIcon = (format: string) => {
        switch (format) {
            case 'video': return <MonitorPlay className="w-4 h-4" />;
            case 'course': return <BookOpen className="w-4 h-4" />;
            default: return <FileText className="w-4 h-4" />;
        }
    };

    const categories = useMemo(() => ['All', ...new Set(MOCK_RESOURCES.map(r => r.category))], []);
    const filteredResources = useMemo(() => selectedCategory === 'All'
        ? MOCK_RESOURCES
        : MOCK_RESOURCES.filter(r => r.category === selectedCategory), [selectedCategory]);

    const [currentIndex, setCurrentIndex] = useState(-1);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (isVoiceMode) {
            const startInduction = async () => {
                window.speechSynthesis.cancel();
                setIsAwake(true);
                stopReadingRef.current = false;
                await speak("Learning Center. Say select or yes to open. You can also say next or back.");
                setCurrentIndex(0);
            };
            startInduction();
        }
        return () => {
            stopReadingRef.current = true;
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [isVoiceMode, setIsAwake, speak]);

    useEffect(() => {
        if (isVoiceMode && currentIndex >= 0 && currentIndex < filteredResources.length) {
            const resource = filteredResources[currentIndex];
            currentResourceRef.current = resource;

            const readResource = async () => {
                if (stopReadingRef.current) return;

                // Cancel any ongoing speech before starting the new one
                window.speechSynthesis.cancel();

                // Small delay to ensure synthesis state is cleared
                await new Promise(r => setTimeout(r, 100));

                await speak(`${resource.title}.`);
                setIsAwake(true);

                // Clear previous timer if any
                if (timerRef.current) clearTimeout(timerRef.current);

                // Set timer for auto-advancing to next resource
                // Increased to 6 seconds to give user more time to react
                timerRef.current = setTimeout(() => {
                    if (!stopReadingRef.current) {
                        setCurrentIndex(prev => prev + 1);
                    }
                }, 6000);
            };

            readResource();
        } else if (currentIndex >= filteredResources.length && filteredResources.length > 0) {
            speak("That was the last resource.");
            setCurrentIndex(-1);
        }
    }, [currentIndex, isVoiceMode, filteredResources, setIsAwake, speak]);

    useEffect(() => {
        const handleNavigation = (e: any) => {
            if (!isVoiceMode) return;
            const direction = e.detail;

            if (direction === 'next') {
                if (timerRef.current) clearTimeout(timerRef.current);
                setCurrentIndex(prev => prev + 1);
            } else if (direction === 'back') {
                if (timerRef.current) clearTimeout(timerRef.current);
                setCurrentIndex(prev => Math.max(0, prev - 1));
            }
        };

        const handleVoiceConfirmation = (e: any) => {
            if (!isVoiceMode) return;
            const type = e.detail; // 'yes' or 'no' from the voice-confirmation event

            if (type === 'yes') {
                if (currentResourceRef.current) {
                    stopReadingRef.current = true;
                    isReturningFromOpenRef.current = true;
                    if (timerRef.current) clearTimeout(timerRef.current);

                    const url = currentResourceRef.current.url;
                    const win = window.open(url, '_blank', 'noopener,noreferrer');

                    window.speechSynthesis.cancel();
                    speak(`Opening ${currentResourceRef.current.title}`);

                    if (!win || win.closed || typeof win.closed === 'undefined') {
                        const link = document.createElement('a');
                        link.href = url;
                        link.target = '_blank';
                        link.rel = 'noopener noreferrer';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    }
                }
            } else if (type === 'no') {
                if (timerRef.current) clearTimeout(timerRef.current);
                setCurrentIndex(prev => prev + 1);
            }
        };

        window.addEventListener('voice-navigation', handleNavigation);
        window.addEventListener('voice-confirmation', handleVoiceConfirmation);

        const handleFocus = () => {
            if (isVoiceMode && isReturningFromOpenRef.current) {
                isReturningFromOpenRef.current = false;
                stopReadingRef.current = false;
                window.speechSynthesis.cancel();
                speak("Welcome back. Continuing with the next resource.");
                // Delay slightly to allow the greeting to finish
                setTimeout(() => {
                    setCurrentIndex(prev => prev + 1);
                }, 2000);
            }
        };
        window.addEventListener('focus', handleFocus);

        return () => {
            window.removeEventListener('voice-navigation', handleNavigation);
            window.removeEventListener('voice-confirmation', handleVoiceConfirmation);
            window.removeEventListener('focus', handleFocus);
        };
    }, [isVoiceMode, speak]);

    useEffect(() => {
        const handleVoiceOpen = (e: any) => {
            const query = e.detail?.toLowerCase();
            if (!query) return;

            const resource = MOCK_RESOURCES.find(r =>
                r.title.toLowerCase().includes(query)
            );

            if (resource) {
                stopReadingRef.current = true;
                isReturningFromOpenRef.current = true;

                // Update currentIndex to the index of the resource found (if in filtered list)
                const resIdx = filteredResources.findIndex(r => r.id === resource.id);
                if (resIdx !== -1) {
                    setCurrentIndex(resIdx);
                }

                const url = resource.url;

                // Priority 1: Open immediately
                const win = window.open(url, '_blank', 'noopener,noreferrer');

                // Priority 2: Feedback
                window.speechSynthesis.cancel();
                speak(`Opening ${resource.title}`);

                // Fallback: If blocked
                if (!win || win.closed || typeof win.closed === 'undefined') {
                    const link = document.createElement('a');
                    link.href = url;
                    link.target = '_blank';
                    link.rel = 'noopener noreferrer';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
            } else {
                speak(`I couldn't find a resource titled ${query}. Try saying the title as it appears on the screen.`);
            }
        };

        window.addEventListener('voice-open-resource', handleVoiceOpen);
        return () => window.removeEventListener('voice-open-resource', handleVoiceOpen);
    }, [speak]);

    return (
        <main className="container py-8 md:py-12">
            <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="font-heading text-4xl md:text-5xl font-extrabold mb-3 tracking-tight flex items-center gap-4">
                            <GraduationCap className="h-10 w-10 text-primary" />
                            Learning Center
                        </h1>
                        <p className="text-muted-foreground text-lg max-w-2xl">
                            Empowering you with the skills to excel in any workplace. Access curated accessibility guides and workshops.
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                    {categories.map(cat => (
                        <Badge
                            key={cat}
                            variant={selectedCategory === cat ? "default" : "outline"}
                            className={`cursor-pointer px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${selectedCategory === cat ? 'shadow-md scale-105' : 'hover:bg-muted font-normal'
                                }`}
                            onClick={() => {
                                setSelectedCategory(cat);
                                if (isVoiceMode) speak(`Showing ${cat} resources.`);
                            }}
                        >
                            {cat}
                        </Badge>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredResources.map(resource => (
                        <Card key={resource.id} className="group transition-all hover:shadow-lg border-border/50 flex flex-col h-full bg-card/40 overflow-hidden">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start gap-3 mb-2">
                                    <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10 text-[10px] uppercase tracking-wider font-bold">
                                        {resource.category}
                                    </Badge>
                                    <div className="text-muted-foreground opacity-60 group-hover:opacity-100 transition-opacity">
                                        {getFormatIcon(resource.format)}
                                    </div>
                                </div>
                                <CardTitle className="text-xl font-bold leading-tight group-hover:text-primary transition-colors">{resource.title}</CardTitle>
                                <CardDescription className="text-sm pt-2 line-clamp-2">{resource.description}</CardDescription>
                            </CardHeader>
                            <div className="mt-auto">
                                <CardFooter className="pt-4 flex justify-end items-center bg-muted/30 border-t p-4">
                                    <Button
                                        asChild
                                        className="gap-2 rounded-full shadow-sm hover:translate-x-1 transition-transform"
                                        size="sm"
                                        onClick={() => {
                                            if (isVoiceMode) speak(`Opening resource: ${resource.title}`);
                                        }}
                                    >
                                        <a
                                            href={resource.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            title={`Open ${resource.title}`}
                                        >
                                            {resource.format === 'video' ? 'Watch Video' : 'Access Now'}
                                            <ExternalLink className="h-3 w-3" />
                                        </a>
                                    </Button>
                                </CardFooter>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </main>
    );
};

export default Learning;
