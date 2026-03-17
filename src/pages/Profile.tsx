import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, LogOut, Mail, UserRound, Briefcase, Bookmark, FileText, Building, Building2, Users, MapPin, Clock, Check, X, ExternalLink, Trash2, Download, Sparkles, CheckCircle, Files } from 'lucide-react';
import { jsPDF } from 'jspdf';

import { getLocalJobs } from '@/utils/localJobs';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useVoice } from '@/contexts/VoiceContext';
import { supabase } from '@/integrations/supabase/client';

const LOCAL_JOBS_KEY = 'ability_jobs_local_listings';

const Profile = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { isVoiceMode, speak, isAwake, setIsCapturingVoice, isCapturingVoice, skipGlobalNextRef } = useVoice();
    const [applicants, setApplicants] = useState<any[]>([]);
    const [applications, setApplications] = useState<any[]>([]);
    const [myPostings, setMyPostings] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState("account");
    const [dictationStep, setDictationStep] = useState<'none' | 'experience' | 'skills' | 'education' | 'confirm-experience' | 'confirm-skills' | 'confirm-education'>('none');
    const [pendingText, setPendingText] = useState('');
    const [voiceResumeData, setVoiceResumeData] = useState({ experience: '', skills: '', education: '' });
    const [showResumeBuilder, setShowResumeBuilder] = useState(false);
    const [isRefining, setIsRefining] = useState(false);
    const hasAnnouncedRef = useRef(false);
    const experienceRef = useRef<HTMLDivElement>(null);
    const skillsRef = useRef<HTMLDivElement>(null);
    const educationRef = useRef<HTMLDivElement>(null);

    const refreshData = () => {
        const storedApps = localStorage.getItem('user_applications');
        if (storedApps && user) {
            const allApps = JSON.parse(storedApps);
            const filteredApps = allApps.filter((app: any) => app.applicantEmail === user.email);
            setApplications(filteredApps);
        }

        const allApps = localStorage.getItem('all_applications');
        if (allApps && user?.role === 'employer') {
            const parsed = JSON.parse(allApps);
            const filtered = parsed.filter((app: any) => app.employerName === user.name);
            setApplicants(filtered);
        }

        if (user?.role === 'employer') {
            const local = getLocalJobs();
            // Show jobs where either company matches name OR employer_email matches email
            const filteredLocal = local.filter(j => j.company === user.name || j.employer_email === user.email);
            
            // Also fetch from Supabase
            const fetchCloudJobs = async () => {
                try {
                    const { data, error } = await supabase
                        .from('jobs')
                        .select('*')
                        .eq('employer_email', user.email);
                    
                    if (!error && data) {
                        // Deduplicate: only add local jobs that aren't already in the cloud
                        const combined = [...data];
                        filteredLocal.forEach(localJob => {
                            const isDuplicate = data.some(cloudJob => 
                                cloudJob.title === localJob.title && 
                                cloudJob.company === localJob.company
                            );
                            if (!isDuplicate) combined.push(localJob);
                        });
                        setMyPostings(combined);
                    } else {
                        setMyPostings(filteredLocal);
                    }
                } catch (e) {
                    setMyPostings(filteredLocal);
                }
            };
            fetchCloudJobs();
        }
    };

    useEffect(() => {
        refreshData();
        if (user) {
            const savedResume = localStorage.getItem(`ability_voice_resume_${user.email}`);
            if (savedResume) {
                setVoiceResumeData(JSON.parse(savedResume));
            }
        }
    }, [user]);

    const startDictation = () => {
        setIsCapturingVoice(true);
        setDictationStep('experience');
        setShowResumeBuilder(true);
        speak("Voice resume builder activated. Tell me the key points of your work experience, and I will use AI to make it sound professional.");
        setTimeout(() => {
            experienceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
    };

    // Helper to simulate AI polishing of resume text
    const polishWithAI = (text: string, section: string) => {
        setIsRefining(true);
        // Map of keywords to professional phrases
        const enhancements: Record<string, string[]> = {
            'experience': [
                "Strategically managed key responsibilities with a focus on efficiency and excellence. ",
                "Demonstrated strong leadership and problem-solving abilities in a professional environment. ",
                "Contributed to team success through dedication and high-quality performance. "
            ],
            'skills': [
                "Proficient in a diverse range of technical and interpersonal competencies. ",
                "Highly adaptable with a proven track record of mastering new tools and technologies. ",
                "Expertly applies specialized skills to achieve project goals and organizational objectives. "
            ],
            'education': [
                "Strong academic foundation with a commitment to continuous learning and professional growth. ",
                "Successfully completed rigorous training and coursework in relevant fields of study. ",
                "Maintains a high standard of academic excellence and knowledge application. "
            ]
        };

        const randomEnhancement = enhancements[section][Math.floor(Math.random() * enhancements[section].length)];

        // Simulate "AI thinking" time
        return new Promise<string>((resolve) => {
            setTimeout(() => {
                setIsRefining(false);
                resolve(`${randomEnhancement}Specifically: ${text}`);
            }, 1500);
        });
    };

    const handleVoiceInput = (text: string) => {
        const input = text.toLowerCase().trim();

        // Prevent dictation input from being processed when we are in a confirmation step
        if (dictationStep.startsWith('confirm-')) return;

        if (dictationStep === 'experience' || dictationStep === 'skills' || dictationStep === 'education') {
            setPendingText(text);
            // Visual update
            setVoiceResumeData(prev => ({ ...prev, [dictationStep]: text }));

            const currentStep = dictationStep;
            setDictationStep(`confirm-${currentStep}` as any);

            speak(`I heard: ${text}. Is this correct? Say "yes" to save it, or "remove" to try again.`);
        }
    };

    useEffect(() => {
        return () => setIsCapturingVoice(false);
    }, []);

    useEffect(() => {
        if (isVoiceMode && isAwake && user && !hasAnnouncedRef.current) {
            hasAnnouncedRef.current = true;
            
            const profileWelcome = user.role === 'seeker'
                ? "You are now on your profile. Here you can chat with employers and access learning resources, or say 'voice resume' to build your audio CV."
                : "You are now on your company profile. You can message applicants and review resources, or manage your job postings here.";
            
            setTimeout(() => {
                if (skipGlobalNextRef) skipGlobalNextRef.current = true;
                speak(profileWelcome);
            }, 1200);
        }
    }, [isVoiceMode, isAwake, user, speak]);

    useEffect(() => {
        if (isVoiceMode && user) {
            const handleCommand = async (e: any) => {
                const cmd = e.detail;
                // Only allow dictation-related commands if asleep, or wake commands
                if (!isAwake && !isCapturingVoice && !cmd.includes('resume')) return;
                if (cmd === 'logout') {
                    await handleLogout();
                } else if (cmd === 'voice resume' || cmd === 'create resume') {
                    if (user.role === 'seeker') {
                        startDictation();
                    }
                } else if (dictationStep.startsWith('confirm-') && (cmd === 'remove' || cmd === 'remove it' || cmd === 'clear' || cmd === 'delete')) {
                    const originalStep = dictationStep.replace('confirm-', '') as any;
                    setDictationStep(originalStep);
                    setVoiceResumeData(prev => ({ ...prev, [originalStep]: '' }));
                    speak(`Deleted. Please tell me your ${originalStep} again.`);
                } else if (cmd === 'applications') {
                    if (user.role === 'seeker') {
                        setActiveTab("applications");
                        if (applications.length === 0) {
                            speak("You haven't applied to any jobs yet.");
                        } else {
                            let message = `You have ${applications.length} application${applications.length > 1 ? 's' : ''}. `;
                            applications.forEach((app: any, index: number) => {
                                const date = new Date(app.appliedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                                message += `Application ${index + 1}: ${app.jobTitle}, status is ${app.status}, applied on ${date}. `;
                            });
                            speak(message);
                        }
                    }
                } else if (cmd === 'postings') {
                    if (user.role === 'employer') {
                        setActiveTab("postings");
                        if (myPostings.length === 0) {
                            speak("You have no active job postings.");
                        } else {
                            let message = `You have ${myPostings.length} job posting${myPostings.length > 1 ? 's' : ''}. `;
                            myPostings.forEach((job: any, index: number) => {
                                message += `Posting ${index + 1}: ${job.title}, located in ${job.location}. `;
                            });
                            speak(message);
                        }
                    }
                } else if (cmd === 'applicants') {
                    if (user.role === 'employer') {
                        setActiveTab("applicants");
                        if (applicants.length === 0) {
                            speak("You have no applicants to review.");
                        } else {
                            let message = `You have ${applicants.length} applicant${applicants.length > 1 ? 's' : ''}. `;
                            applicants.forEach((app: any, index: number) => {
                                message += `Applicant ${index + 1}: ${app.applicantName}, applied for ${app.jobTitle}, status is ${app.status}. `;
                            });
                            speak(message);
                        }
                    }
                }
            };

            const handleConfirmation = async (e: any) => {
                if (dictationStep.startsWith('confirm-') && !isRefining) {
                    const conf = e.detail;
                    if (conf === 'yes') {
                        const originalStep = dictationStep.replace('confirm-', '') as any;
                        const rawText = voiceResumeData[originalStep as keyof typeof voiceResumeData];

                        speak(`Great! Polishing your ${originalStep} with AI...`);
                        const polished = await polishWithAI(rawText, originalStep);

                        setVoiceResumeData(prev => ({ ...prev, [originalStep]: polished }));

                        if (dictationStep === 'confirm-experience') {
                            setDictationStep('skills');
                            speak("Experience polished. Now, tell me your key skills.");
                            setTimeout(() => skillsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
                        } else if (dictationStep === 'confirm-skills') {
                            setDictationStep('education');
                            speak("Skills enhanced. Finally, tell me about your educational background.");
                            setTimeout(() => educationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
                        } else if (dictationStep === 'confirm-education') {
                            setDictationStep('none');
                            if (user) {
                                localStorage.setItem(`ability_voice_resume_${user.email}`, JSON.stringify({
                                    ...voiceResumeData,
                                    education: polished
                                }));
                            }
                            setIsCapturingVoice(false);
                            speak("Congratulations! Your AI-enhanced voice resume is now complete and saved to your profile.");
                            toast.success("AI-Enhanced Voice resume saved!");
                        }
                    } else if (conf === 'no') {
                        const originalStep = dictationStep.replace('confirm-', '') as any;
                        setDictationStep(originalStep);
                        setVoiceResumeData(prev => ({ ...prev, [originalStep]: '' }));
                        speak(`Okay, let's try again. Please tell me your ${originalStep}.`);
                    }
                }
            };

            const handleRawInput = (e: any) => {
                if (dictationStep !== 'none') {
                    handleVoiceInput(e.detail);
                }
            };

            window.addEventListener('voice-command', handleCommand);
            window.addEventListener('voice-confirmation', handleConfirmation);
            window.addEventListener('voice-input', handleRawInput);

            if (user.role === 'seeker') {
                // Welcome removed from here to separate effect
            }

            return () => {
                window.removeEventListener('voice-command', handleCommand);
                window.removeEventListener('voice-confirmation', handleConfirmation);
                window.removeEventListener('voice-input', handleRawInput);
            };
        }
    }, [isVoiceMode, isAwake, user, applications, applicants, myPostings, dictationStep, voiceResumeData, isRefining, isCapturingVoice]);

    const handleUpdateStatus = (appId: string, newStatus: 'Accepted' | 'Rejected') => {
        const allApps = JSON.parse(localStorage.getItem('all_applications') || '[]');
        const updatedAll = allApps.map((app: any) =>
            app.id === appId ? { ...app, status: newStatus } : app
        );
        localStorage.setItem('all_applications', JSON.stringify(updatedAll));

        const userApps = JSON.parse(localStorage.getItem('user_applications') || '[]');
        const updatedUser = userApps.map((app: any) =>
            app.id === appId ? { ...app, status: newStatus } : app
        );
        localStorage.setItem('user_applications', JSON.stringify(updatedUser));

        toast.success(`Application ${newStatus.toLowerCase()}`);
        refreshData();
    };

    if (!user) {
        return <Navigate to="/auth" replace />;
    }

    const handleLogout = async () => {
        if (isVoiceMode) {
            await speak("Successfully logged out.");
        }
        logout();
        navigate('/');
    };

    const handleDeletePosting = async (jobId: string) => {
        // 1. Handle Local Storage deletion
        if (jobId.startsWith('local-')) {
            const local = getLocalJobs();
            const updated = local.filter(j => j.id !== jobId);
            localStorage.setItem(LOCAL_JOBS_KEY, JSON.stringify(updated));
            toast.success("Local job posting removed");
        } else {
            // 2. Handle Supabase deletion
            try {
                const { error } = await supabase
                    .from('jobs')
                    .delete()
                    .eq('id', jobId);

                if (error) throw error;
                toast.success("Job posting deleted from database");
            } catch (error) {
                console.error("Failed to delete from database:", error);
                toast.error("Could not delete from database. Please try again.");
                return; // Don't refresh if it failed
            }
        }
        
        refreshData();
    };

    const handleDeleteAllPostings = async () => {
        // 1. Clear Local Storage postings for this company
        const local = getLocalJobs();
        const remaining = local.filter(j => j.company !== user?.name && j.employer_email !== user?.email);
        localStorage.setItem(LOCAL_JOBS_KEY, JSON.stringify(remaining));

        // 2. Clear Supabase postings for this employer
        if (user?.email) {
            try {
                const { error } = await supabase
                    .from('jobs')
                    .delete()
                    .eq('employer_email', user.email);

                if (error) throw error;
                toast.success("All your postings have been deleted from local storage and database");
            } catch (error) {
                console.error("Failed to delete all from database:", error);
                toast.warning("Local storage cleared, but database deletion failed.");
            }
        } else {
            toast.success("All your local postings have been deleted");
        }
        
        refreshData();
    };

    const handleDownloadPDF = () => {
        if (!user) return;

        const doc = new jsPDF();
        let yPos = 20;
        const margin = 15;
        const lineHeight = 7;
        const maxWidth = 180;

        doc.setFontSize(22);
        doc.text(`${user.name}'s AI-Enhanced Resume`, margin, yPos);
        yPos += 10;

        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.text(`Email: ${user.email}`, margin, yPos);
        yPos += 15;

        doc.setTextColor(0);
        doc.setFontSize(16);
        doc.text('Experience', margin, yPos);
        yPos += lineHeight;
        doc.setFontSize(10);
        const experienceLines = doc.splitTextToSize(voiceResumeData.experience || 'Not provided', maxWidth);
        doc.text(experienceLines, margin, yPos);
        yPos += experienceLines.length * lineHeight + 5;

        doc.setFontSize(16);
        doc.text('Skills', margin, yPos);
        yPos += lineHeight;
        doc.setFontSize(10);
        const skillsLines = doc.splitTextToSize(voiceResumeData.skills || 'Not provided', maxWidth);
        doc.text(skillsLines, margin, yPos);
        yPos += skillsLines.length * lineHeight + 5;

        doc.setFontSize(16);
        doc.text('Education', margin, yPos);
        yPos += lineHeight;
        doc.setFontSize(10);
        const educationLines = doc.splitTextToSize(voiceResumeData.education || 'Not provided', maxWidth);
        doc.text(educationLines, margin, yPos);
        yPos += educationLines.length * lineHeight + 5;

        doc.save(`${user.name.replace(/\s/g, '_')}_AI_Resume.pdf`);
        toast.success("Resume downloaded as PDF!");
    };

    return (
        <div className="container max-w-4xl py-12 md:py-24 animate-fade-in">
            <div className="flex flex-col items-center mb-10 gap-4 text-center">
                <div className="inline-flex items-center justify-center p-4 rounded-full bg-primary/10 text-primary mb-2 shadow-sm">
                    {user.role === 'employer' ? <Building2 className="h-12 w-12" /> : <UserRound className="h-12 w-12" />}
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        {user.role === 'employer' ? 'Company Profile' : 'Your Profile'}
                    </h1>
                    <p className="text-muted-foreground w-full max-w-[500px] mt-2">
                        Manage your account details and {user.role === 'employer' ? 'job postings' : 'job preferences'}.
                    </p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className={`grid w-full ${user.role === 'seeker' ? 'grid-cols-2' : 'grid-cols-3'} mb-8 bg-muted/50 p-1 rounded-xl border border-border/50 h-auto`}>
                    <TabsTrigger value="account" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm py-3">
                        <User className="w-4 h-4 mr-2 hidden sm:block" /> Account
                    </TabsTrigger>
                    {user.role === 'seeker' ? (
                        <>
                            <TabsTrigger value="applications" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm py-3">
                                <FileText className="w-4 h-4 mr-2 hidden sm:block" /> Applications
                            </TabsTrigger>
                        </>
                    ) : (
                        <>
                            <TabsTrigger value="postings" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm py-3">
                                <Briefcase className="w-4 h-4 mr-2 hidden sm:block" /> My Postings
                            </TabsTrigger>
                            <TabsTrigger value="applicants" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm py-3">
                                <Users className="w-4 h-4 mr-2 hidden sm:block" /> Applicants
                            </TabsTrigger>
                        </>
                    )}
                </TabsList>

                <TabsContent value="account" className="mt-0 space-y-6">
                    <Card className="border-border/50 shadow-lg bg-card/60 backdrop-blur-sm">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Account Details</CardTitle>
                                <CardDescription>Information associated with your account</CardDescription>
                            </div>
                            {user.role === 'seeker' && (
                                <Button
                                    variant="outline"
                                    onClick={startDictation}
                                    className="gap-2 border-primary/20 hover:bg-primary/5 text-primary"
                                >
                                    <Sparkles className="h-4 w-4" />
                                    {voiceResumeData.experience ? 'Update Voice Resume' : 'Create Voice Resume'}
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex flex-col space-y-4">
                                <div className="flex items-center gap-4 p-4 rounded-lg bg-secondary/30 border border-border/50">
                                    <div className="bg-background p-2 rounded-full hidden sm:block shadow-sm">
                                        <User className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">
                                            {user.role === 'employer' ? 'Company Name' : 'Full Name'}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-base font-semibold">{user.name}</p>
                                            {user.role === 'employer' && user.isVerified && (
                                                <Badge className="bg-success/15 text-success border-success/30 border gap-1 text-[10px] px-2 h-5">
                                                    <CheckCircle className="h-2.5 w-2.5" /> Verified
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-4 rounded-lg bg-secondary/30 border border-border/50">
                                    <div className="bg-background p-2 rounded-full hidden sm:block shadow-sm">
                                        <Mail className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Email Address</p>
                                        <p className="text-base font-semibold">{user.email}</p>
                                    </div>
                                </div>

                                {user.role === 'seeker' && (voiceResumeData.experience || showResumeBuilder) && (
                                    <div className="mt-4 p-6 rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                                        <div className="flex items-center justify-between border-b border-primary/10 pb-3">
                                            <h3 className="font-heading font-bold text-primary flex items-center gap-2 text-lg">
                                                <Sparkles className="h-5 w-5 animate-pulse text-amber-500" /> AI-Enhanced Resume
                                            </h3>
                                            <div className="flex gap-2">
                                                {dictationStep === 'none' && voiceResumeData.experience && (
                                                    <Button variant="outline" size="sm" onClick={handleDownloadPDF} className="h-7 text-[10px] gap-1 bg-white hover:bg-white/80 border-primary/20 text-primary">
                                                        <Download className="h-3 w-3" /> PDF CV
                                                    </Button>
                                                )}
                                                {isRefining && (
                                                    <Badge variant="outline" className="bg-amber-100/50 text-amber-600 border-amber-200 animate-pulse">
                                                        AI Polishing...
                                                    </Badge>
                                                )}
                                                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                                                    {dictationStep === 'none' ? 'Ready to use' : 'In Progress'}
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="grid gap-4">
                                            <div
                                                ref={experienceRef}
                                                className={`p-4 rounded-xl transition-all relative overflow-hidden ${dictationStep === 'experience' || dictationStep === 'confirm-experience' ? 'bg-primary/20 ring-2 ring-primary/40 scale-[1.02]' : 'bg-background/40'}`}
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Experience</p>
                                                    {voiceResumeData.experience.includes('Specifically:') && (
                                                        <Badge className="h-4 text-[8px] bg-amber-500/10 text-amber-600 border-amber-200">AI Enhanced</Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm leading-relaxed italic">
                                                    {voiceResumeData.experience || (dictationStep === 'experience' ? 'Listening...' : 'Not provided')}
                                                </p>
                                            </div>
                                            <div
                                                ref={skillsRef}
                                                className={`p-4 rounded-xl transition-all relative overflow-hidden ${dictationStep === 'skills' || dictationStep === 'confirm-skills' ? 'bg-primary/20 ring-2 ring-primary/40 scale-[1.02]' : 'bg-background/40'}`}
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Skills</p>
                                                    {voiceResumeData.skills.includes('Specifically:') && (
                                                        <Badge className="h-4 text-[8px] bg-amber-500/10 text-amber-600 border-amber-200">AI Enhanced</Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm leading-relaxed italic">
                                                    {voiceResumeData.skills || (dictationStep === 'skills' ? 'Listening...' : 'Not provided')}
                                                </p>
                                            </div>
                                            <div
                                                ref={educationRef}
                                                className={`p-4 rounded-xl transition-all relative overflow-hidden ${dictationStep === 'education' || dictationStep === 'confirm-education' ? 'bg-primary/20 ring-2 ring-primary/40 scale-[1.02]' : 'bg-background/40'}`}
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Education</p>
                                                    {voiceResumeData.education.includes('Specifically:') && (
                                                        <Badge className="h-4 text-[8px] bg-amber-500/10 text-amber-600 border-amber-200">AI Enhanced</Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm leading-relaxed italic">
                                                    {voiceResumeData.education || (dictationStep === 'education' ? 'Listening...' : 'Not provided')}
                                                </p>
                                            </div>
                                        </div>

                                        {dictationStep === 'none' && (
                                            <p className="text-[11px] text-center text-muted-foreground bg-primary/5 py-2 rounded-lg border border-primary/10">
                                                This voice profile is now available for your applications.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end pt-6 border-t border-border/50">
                            <Button variant="destructive" onClick={handleLogout} className="gap-2 shadow-md hover:shadow-lg transition-all">
                                <LogOut className="h-4 w-4" />
                                Sign Out
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {user.role === 'seeker' && (
                    <TabsContent value="applications" className="mt-0">
                        <Card className="border-border/50 shadow-lg bg-card/60 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle>My Applications</CardTitle>
                                <CardDescription>Track the status of roles you have applied for</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {applications.length > 0 ? (
                                    <div className="space-y-4">
                                        {applications.map((app) => (
                                            <div key={app.id} className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-secondary/20 group hover:border-primary/30 transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                                        <Briefcase className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-foreground">{app.jobTitle}</h4>
                                                        <p className="text-sm text-muted-foreground">Applied on {new Date(app.appliedAt).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${app.status === 'Accepted' ? 'bg-success/20 text-success' :
                                                        app.status === 'Rejected' ? 'bg-destructive/20 text-destructive' :
                                                            'bg-primary/10 text-primary'
                                                        }`}>
                                                        {app.status}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-border/60 rounded-xl bg-muted/20">
                                        <FileText className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                                        <h3 className="text-lg font-medium">You haven't applied to any jobs</h3>
                                        <p className="text-muted-foreground mt-2 max-w-sm">
                                            Your submitted applications will be tracked here so you can monitor their status.
                                        </p>
                                        <Button className="mt-6" onClick={() => navigate('/jobs')}>Find Your Next Role</Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}

                {user.role === 'employer' && (
                    <>
                        <TabsContent value="postings" className="mt-0">
                            <Card className="border-border/50 shadow-lg bg-card/60 backdrop-blur-sm">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                    <div>
                                        <CardTitle>My Postings</CardTitle>
                                        <CardDescription>Manage all the jobs your company has listed</CardDescription>
                                    </div>
                                    {myPostings.length > 0 && (
                                        <Button variant="ghost" size="sm" onClick={handleDeleteAllPostings} className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-2">
                                            <Trash2 className="h-4 w-4" /> Delete All
                                        </Button>
                                    )}
                                </CardHeader>
                                <CardContent>
                                    {myPostings.length > 0 ? (
                                        <div className="grid gap-4">
                                            {myPostings.map((job) => (
                                                <div key={job.id} className="p-4 rounded-xl border border-border/50 bg-secondary/20 hover:border-primary/30 transition-all group">
                                                    <div className="flex justify-between items-start gap-4">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Badge variant="secondary" className="text-[10px] uppercase font-bold">{job.category}</Badge>
                                                                <Badge variant="outline" className="text-[10px] uppercase font-bold">{job.job_type}</Badge>
                                                            </div>
                                                            <h4 className="font-bold text-lg mb-1">{job.title}</h4>
                                                            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                                                                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {job.location}</span>
                                                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(job.posted_at).toLocaleDateString()}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10"
                                                                onClick={() => handleDeletePosting(job.id)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-border/60 rounded-xl bg-muted/20">
                                            <Briefcase className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                                            <h3 className="text-lg font-medium">No active job postings</h3>
                                            <Button className="mt-6 gap-2" onClick={() => navigate('/jobs')}><Briefcase className="h-4 w-4" /> Create New Job</Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="applicants" className="mt-0">
                            <Card className="border-border/50 shadow-lg bg-card/60 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle>Manage Applicants</CardTitle>
                                    <CardDescription>Review and manage incoming applications</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {applicants.length > 0 ? (
                                        <div className="space-y-4">
                                            {applicants.map((app) => (
                                                <div key={app.id} className="p-4 rounded-xl border border-border/50 bg-secondary/20 hover:border-primary/30 transition-all">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                                <User className="h-5 w-5" />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-foreground">{app.applicantName}</h4>
                                                                <p className="text-sm text-muted-foreground">{app.applicantEmail}</p>
                                                            </div>
                                                        </div>
                                                        <Badge variant="secondary" className="bg-primary/10 text-primary border-none">
                                                            {app.status}
                                                        </Badge>
                                                    </div>
                                                    <div className="mt-4 pt-4 border-t border-border/50 space-y-3">
                                                        {/* Applied for + CV row */}
                                                        <div className="flex flex-wrap justify-between items-center gap-4">
                                                            <div>
                                                                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Applied for</p>
                                                                <p className="text-sm font-semibold">{app.jobTitle}</p>
                                                            </div>
                                                            {/* View CV button */}
                                                            {app.resume_data ? (
                                                                 <button
                                                                    onClick={() => {
                                                                        try {
                                                                            if (app.resume_data.startsWith('data:application/pdf')) {
                                                                                // Extract base64 part, ignoring any potential headers like filename=...
                                                                                const base64Content = app.resume_data.split(',')[1];
                                                                                const binaryString = window.atob(base64Content);
                                                                                const bytes = new Uint8Array(binaryString.length);
                                                                                for (let i = 0; i < binaryString.length; i++) {
                                                                                    bytes[i] = binaryString.charCodeAt(i);
                                                                                }
                                                                                const blob = new Blob([bytes], { type: 'application/pdf' });
                                                                                const blobUrl = URL.createObjectURL(blob);
                                                                                window.open(blobUrl, '_blank');
                                                                            } else {
                                                                                const w = window.open();
                                                                                if (w) {
                                                                                    w.document.write(`<html><head><title>${app.resume_filename || 'Resume'}</title></head><body style="margin:0;overflow:hidden;"><iframe src="${app.resume_data}" width="100%" height="100%" style="border:none;"></iframe></body></html>`);
                                                                                    w.document.close();
                                                                                }
                                                                            }
                                                                        } catch (err) {
                                                                            console.error('Error opening CV:', err);
                                                                            // Final fallback
                                                                            const w = window.open();
                                                                            if (w) w.location.href = app.resume_data;
                                                                        }
                                                                    }}
                                                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-sm font-medium transition-colors"
                                                                >
                                                                    <FileText className="h-4 w-4" />
                                                                    View CV
                                                                    {app.resume_filename && (
                                                                        <span className="text-[10px] text-muted-foreground hidden sm:inline">({app.resume_filename})</span>
                                                                    )}
                                                                </button>
                                                            ) : app.resume_url && !app.resume_url.includes('example.com') ? (
                                                                <a
                                                                    href={app.resume_url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-sm font-medium transition-colors"
                                                                >
                                                                    <ExternalLink className="h-4 w-4" />
                                                                    View CV
                                                                </a>
                                                            ) : (
                                                                <span className="text-xs text-muted-foreground italic">No CV available</span>
                                                            )}
                                                        </div>
                                                        {/* Cover letter / pitch */}
                                                        {app.coverLetter && (
                                                            <div className="p-3 rounded-lg bg-muted/30 border border-border/40">
                                                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Applicant's Pitch</p>
                                                                <p className="text-sm text-foreground leading-relaxed">{app.coverLetter}</p>
                                                            </div>
                                                        )}
                                                        <div className="flex gap-2 pt-1">
                                                            {app.status === 'Pending' ? (
                                                                <>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="text-success hover:text-success hover:bg-success/10 gap-1"
                                                                        onClick={() => handleUpdateStatus(app.id, 'Accepted')}
                                                                    >
                                                                        <Check className="h-4 w-4" /> Accept
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1"
                                                                        onClick={() => handleUpdateStatus(app.id, 'Rejected')}
                                                                    >
                                                                        <X className="h-4 w-4" /> Reject
                                                                    </Button>
                                                                </>
                                                            ) : (
                                                                <Badge className={app.status === 'Accepted' ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}>
                                                                    {app.status}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-border/60 rounded-xl bg-muted/20">
                                            <Users className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                                            <h3 className="text-lg font-medium">No applicants to review</h3>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </>
                )}
            </Tabs>
        </div >
    );
};

export default Profile;
