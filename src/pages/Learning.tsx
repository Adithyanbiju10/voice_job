import { useState, useEffect } from 'react';
import { BookOpen, MonitorPlay, FileText, ExternalLink, GraduationCap, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useVoice } from '@/contexts/VoiceContext';

const MOCK_SKILLS = [
    { id: '1', name: 'Screen Reader Proficiency' },
    { id: '2', name: 'Accessibility Testing' },
    { id: '3', name: 'Customer Service' }
];

const MOCK_RESOURCES = [
    { id: '1', title: 'Advanced NVDA Navigation', url: '#', description: 'Learn advanced shortcut keys for NVDA screen reader.', format: 'video', skill_id: '1' },
    { id: '2', title: 'WCAG 2.1 Basics', url: '#', description: 'Understanding the core principles of web accessibility.', format: 'course', skill_id: '2' },
    { id: '3', title: 'Inclusive Customer Support', url: '#', description: 'Best practices for handling diverse customer needs.', format: 'article', skill_id: '3' }
];

const Learning = () => {
    const { user } = useAuth();
    const { isVoiceMode, speak } = useVoice();
    const [userSkills, setUserSkills] = useState<string[]>(['Customer Service']);

    useEffect(() => {
        if (isVoiceMode) {
            speak("Welcome to the Learning and Skill Support Module. Here you can find resources to build your skills for accessible jobs.");
        }
    }, [isVoiceMode, speak]);

    const toggleSkill = (skillName: string) => {
        setUserSkills(prev =>
            prev.includes(skillName)
                ? prev.filter(s => s !== skillName)
                : [...prev, skillName]
        );
    };

    const getFormatIcon = (format: string) => {
        switch (format) {
            case 'video': return <MonitorPlay className="w-4 h-4" />;
            case 'course': return <BookOpen className="w-4 h-4" />;
            default: return <FileText className="w-4 h-4" />;
        }
    };

    return (
        <main className="container py-8 md:py-12">
            <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h1 className="font-heading text-4xl md:text-5xl font-extrabold mb-3 tracking-tight flex items-center gap-4">
                    <GraduationCap className="h-10 w-10 text-primary" />
                    Learning & Skills
                </h1>
                <p className="text-muted-foreground text-lg">
                    Bridge the gap between your current experience and your dream job. Explore courses and track your skills to improve your employability.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 border rounded-xl p-6 bg-card/50 backdrop-blur-sm shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
                    <h2 className="text-xl font-bold mb-4 font-heading">Your Skills Profile</h2>
                    <p className="text-sm text-muted-foreground mb-6">
                        Click on skills you possess. We'll recommend resources for the ones you haven't mastered yet.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {MOCK_SKILLS.map(skill => {
                            const hasSkill = userSkills.includes(skill.name);
                            return (
                                <Badge
                                    key={skill.id}
                                    variant={hasSkill ? "default" : "outline"}
                                    className="cursor-pointer text-sm py-1.5 px-3 transition-all hover:scale-105"
                                    onClick={() => toggleSkill(skill.name)}
                                >
                                    {hasSkill && <CheckCircle className="w-3 h-3 mr-1" />}
                                    {skill.name}
                                </Badge>
                            );
                        })}
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
                    <h2 className="text-2xl font-bold font-heading mb-4">Recommended Resources</h2>
                    {MOCK_RESOURCES.map(resource => (
                        <Card key={resource.id} className="transition-all hover:shadow-md border-border/50">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start gap-4">
                                    <div>
                                        <CardTitle className="text-lg font-bold">{resource.title}</CardTitle>
                                        <CardDescription className="mt-1">{resource.description}</CardDescription>
                                    </div>
                                    <Badge variant="secondary" className="capitalize flex items-center gap-1">
                                        {getFormatIcon(resource.format)}
                                        <span className="ml-1">{resource.format}</span>
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardFooter className="pt-4 flex justify-between items-center bg-muted/20 border-t mt-4 rounded-b-xl">
                                <p className="text-xs text-muted-foreground font-medium">
                                    Related skill: {MOCK_SKILLS.find(s => s.id === resource.skill_id)?.name}
                                </p>
                                <Button variant="outline" size="sm" className="gap-2">
                                    <ExternalLink className="h-4 w-4" />
                                    Access Resource
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        </main>
    );
};

export default Learning;
