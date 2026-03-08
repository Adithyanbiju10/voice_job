import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Briefcase, User, Building, ArrowRight, Loader2, Eye, EarOff, Accessibility, MessageCircleOff, Brain, HandMetal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useVoice } from "@/contexts/VoiceContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

import annyang from 'annyang';

const Auth = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [role, setRole] = useState<"seeker" | "employer">("seeker");
    const [disability, setDisability] = useState<string>("none");
    const lastPromptedTab = useRef<string | null>(null);
    const [searchParams] = useSearchParams();
    const mode = searchParams.get('mode');
    const [activeTab, setActiveTab] = useState(mode === "signup" ? "signup" : "login");
    const { isVoiceMode, speak, isAwake, setIsAwake } = useVoice();

    const { login, signup } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [signupName, setSignupName] = useState("");
    const [signupEmail, setSignupEmail] = useState("");
    const [signupPassword, setSignupPassword] = useState("");

    const nameRef = useRef<HTMLInputElement>(null);
    const signupEmailRef = useRef<HTMLInputElement>(null);
    const signupPasswordRef = useRef<HTMLInputElement>(null);
    const loginEmailRef = useRef<HTMLInputElement>(null);
    const loginPasswordRef = useRef<HTMLInputElement>(null);
    const justSignedUp = useRef(false);

    const focusWithPulse = (ref: React.RefObject<HTMLInputElement>) => {
        if (ref.current) {
            ref.current.focus();
            ref.current.classList.add('voice-focus-pulse');
            setTimeout(() => ref.current?.classList.remove('voice-focus-pulse'), 1000);
        }
    };

    // Speaks each character aloud for visually impaired users.
    const speakCharacter = (e: React.KeyboardEvent) => {
        if (!isVoiceMode) return;

        const key = e.key;

        // Ignore modifier-only keys and function keys
        if (key.length > 1 && key !== 'Backspace' && key !== 'Space' && key !== 'Enter') return;

        if (key === 'Backspace') {
            speak('deleted');
            return;
        }
        if (key === 'Enter') return; // handled separately

        // Map special characters to spoken names
        const specialMap: Record<string, string> = {
            ' ': 'space',
            '@': 'at sign',
            '.': 'dot',
            ',': 'comma',
            '-': 'dash',
            '_': 'underscore',
            '+': 'plus',
            '=': 'equals',
            '!': 'exclamation mark',
            '?': 'question mark',
            '#': 'hash',
            '$': 'dollar',
            '%': 'percent',
            '^': 'caret',
            '&': 'ampersand',
            '*': 'asterisk',
            '(': 'open parenthesis',
            ')': 'close parenthesis',
            '/': 'slash',
            '\\': 'backslash',
            ':': 'colon',
            ';': 'semicolon',
            "'": 'apostrophe',
            '"': 'quote',
        };

        const toSpeak = specialMap[key] ?? key;
        speak(toSpeak);
    };

    useEffect(() => {
        if (activeTab === "login") {
            setTimeout(() => focusWithPulse(loginEmailRef), 400);
        }
    }, [activeTab]);

    useEffect(() => {
        if (mode === "signup" || mode === "login") {
            setActiveTab(mode);
        }
    }, [mode]);

    useEffect(() => {
        if (isVoiceMode && isAwake) {
            const handleCommand = (e: any) => {
                const cmd = e.detail;
                if (cmd === 'select-seeker') {
                    setActiveTab("signup");
                    setRole("seeker");
                    speak("Setting your role as job seeker. You can now tell me your name or focus on the name field to begin your profile.");
                    setTimeout(() => focusWithPulse(nameRef), 500);
                } else if (cmd === 'select-employer') {
                    setActiveTab("signup");
                    setRole("employer");
                    speak("Setting your role as employer. Please tell me your company name or focus on the company name field to start hiring.");
                    setTimeout(() => focusWithPulse(nameRef), 500);
                } else if (cmd === 'select-blind') {
                    setActiveTab("signup");
                    setDisability('blind');
                    setRole('seeker');
                    speak("Confirmed. I have enabled accessibility mode. Please tell me your full name.");
                    setTimeout(() => {
                        nameRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        focusWithPulse(nameRef);
                    }, 1000);
                }


            };

            window.addEventListener('voice-command', handleCommand);

            if (lastPromptedTab.current !== activeTab) {
                if (activeTab === "login") {
                    // Tell the user to enter their email and focus the field automatically
                    setTimeout(() => {
                        speak("Welcome back. Please enter your email address to sign in. If you want to create a new account, say sign up.");
                        setIsAwake(true);
                        setTimeout(() => focusWithPulse(loginEmailRef), 600);
                    }, 800);
                } else {
                    setTimeout(() => {
                        speak("Welcome to our platform. Before we begin, are you visually impaired? Please say yes or no.");
                        setIsAwake(true);
                    }, 800);
                }

                lastPromptedTab.current = activeTab;
            }



            return () => window.removeEventListener('voice-command', handleCommand);
        }
    }, [isVoiceMode, isAwake, activeTab]);

    const handleSignupNameEnter = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && isVoiceMode) {
            e.preventDefault();
            focusWithPulse(signupEmailRef);
            speak("Name entered. Now, please type your email address and press Enter.");
        }
    };

    const handleSignupEmailEnter = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            focusWithPulse(signupPasswordRef);
            if (isVoiceMode) speak("Email entered. Finally, type a password and press Enter to complete sign up.");
        }
    };

    const handleSignupPasswordEnter = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSignup(e as any);
        }
    };

    const handleLoginEmailEnter = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            focusWithPulse(loginPasswordRef);
            if (isVoiceMode) speak("Email entered. Now type your password and press Enter to sign in.");
        }
    };

    const handleLoginPasswordEnter = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleLogin(e as any);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const email = loginEmail.trim();
        const password = loginPassword;

        setTimeout(() => {
            const success = login(email, password);

            if (success) {
                setIsLoading(false);
                // Detect if admin just logged in
                const stored = localStorage.getItem('ability_jobs_user');
                const loggedInUser = stored ? JSON.parse(stored) : null;
                const isAdmin = loggedInUser?.role === 'admin';
                toast({
                    title: isAdmin ? "Welcome, Admin!" : "Welcome back!",
                    description: isAdmin ? "Redirecting to admin dashboard." : "You have successfully signed in.",
                });
                if (isVoiceMode) {
                    speak(isAdmin ? `Welcome Admin. Redirecting to admin dashboard.` : `Welcome back! Redirecting to home page.`);
                }
                navigate(isAdmin ? "/admin" : "/");
            } else {
                setIsLoading(false);
                // Distinguish between unknown email and wrong password
                const allUsers: any[] = JSON.parse(localStorage.getItem('ability_jobs_registered_users') || '[]');
                const emailExists = allUsers.some((u: any) => u.email.toLowerCase() === email.toLowerCase());
                if (emailExists) {
                    toast({
                        title: "Incorrect password",
                        description: "The password you entered is wrong. Please try again.",
                        variant: "destructive"
                    });
                    if (isVoiceMode) speak("The password you entered is incorrect. Please try again.");
                } else {
                    toast({
                        title: "Account not found",
                        description: "No account with that email exists. Please sign up first.",
                        variant: "destructive"
                    });
                    if (isVoiceMode) speak("I couldn't find an account with that email. Would you like to sign up instead?");
                }
            }
        }, 1000);
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const name = signupName.trim() || (role === 'seeker' ? 'New Seeker' : 'New Employer');
        const email = signupEmail.trim();
        const password = signupPassword;

        setTimeout(() => {
            setIsLoading(false);
            if (!email) {
                toast({ title: "Email required", variant: "destructive" });
                return;
            }
            if (!password) {
                toast({ title: "Password required", description: "Please enter a password to create your account.", variant: "destructive" });
                if (isVoiceMode) speak("Please enter a password to create your account.");
                return;
            }
            signup({ name, email, role, disability }, password);
            toast({
                title: "Account created!",
                description: `Welcome to AbilityJobs, ${name}!`,
            });
            if (isVoiceMode) {
                speak(`Account created successfully! Welcome ${name}. Taking you to your profile.`);
            }
            navigate("/profile");
        }, 1200);
    };

    return (
        <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
            <div className="absolute top-1/4 left-1/4 -translate-y-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] opacity-60 pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-accent/20 rounded-full blur-[80px] opacity-40 pointer-events-none" />

            <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="flex flex-col items-center mb-8 text-center">
                    <Link to="/" className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground mb-6 shadow-lg shadow-primary/20 transition-transform hover:scale-105">
                        <Briefcase className="h-6 w-6" />
                    </Link>
                    <h1 className="font-heading text-3xl font-bold tracking-tight mb-2">Welcome to AbilityJobs</h1>
                    <p className="text-muted-foreground">Sign in to your account or create a new one</p>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-8 bg-muted/50 p-1 rounded-full border border-border/50">
                        <TabsTrigger
                            value="login"
                            onFocus={() => isVoiceMode && speak("Sign In tab. Use this if you already have an account.")}
                            className="rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm"
                        >
                            Sign In
                        </TabsTrigger>
                        <TabsTrigger
                            value="signup"
                            onFocus={() => isVoiceMode && speak("Sign Up tab. Use this to create a new account.")}
                            className="rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm"
                        >
                            Sign Up
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="login" className="mt-0">
                        <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-xl">
                            <CardHeader>
                                <CardTitle>Sign In</CardTitle>
                                <CardDescription>Enter your email below to login to your account</CardDescription>
                            </CardHeader>
                            <form onSubmit={handleLogin}>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="m@example.com"
                                            required
                                            value={loginEmail}
                                            onChange={(e) => setLoginEmail(e.target.value)}
                                            className="bg-background/50 h-11"
                                            ref={loginEmailRef}
                                            onKeyDown={(e) => { speakCharacter(e); handleLoginEmailEnter(e); }}
                                            onFocus={() => isVoiceMode && speak('Email field. Type your email address. Each character will be read aloud.')}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="password">Password</Label>
                                            <a href="#" className="text-sm font-medium text-primary hover:underline">Forgot password?</a>
                                        </div>
                                        <Input
                                            id="password"
                                            type="password"
                                            required
                                            value={loginPassword}
                                            onChange={(e) => setLoginPassword(e.target.value)}
                                            className="bg-background/50 h-11"
                                            ref={loginPasswordRef}
                                            onKeyDown={(e) => { speakCharacter(e); handleLoginPasswordEnter(e); }}
                                            onFocus={() => isVoiceMode && speak('Password field. Each character you type will be read aloud.')}
                                        />
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button className="w-full h-11 shadow-md shadow-primary/20" type="submit" disabled={isLoading}>
                                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Sign In'}
                                    </Button>
                                </CardFooter>
                            </form>
                        </Card>
                    </TabsContent>

                    <TabsContent value="signup" className="mt-0">
                        <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-xl">
                            <CardHeader>
                                <CardTitle>Create an account</CardTitle>
                                <CardDescription>Choose your role and enter your details to get started</CardDescription>
                            </CardHeader>
                            <form onSubmit={handleSignup}>
                                <CardContent className="space-y-6">
                                    <div className="space-y-4">
                                        <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Disability Type (Optional)</Label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                { id: 'none', label: 'None', icon: Accessibility },
                                                { id: 'blind', label: 'Visual', icon: Eye },
                                                { id: 'deaf', label: 'Hearing', icon: EarOff },
                                                { id: 'physical', label: 'Physical', icon: HandMetal },
                                                { id: 'speech', label: 'Speech', icon: MessageCircleOff },
                                                { id: 'cognitive', label: 'Cognitive', icon: Brain },
                                            ].map((type) => (
                                                <button
                                                    key={type.id}
                                                    type="button"
                                                    onFocus={() => isVoiceMode && speak(`Disability type: ${type.label}. ${disability === type.id ? 'Currently selected.' : 'Choice available.'}`)}
                                                    onClick={() => {
                                                        setDisability(type.id);
                                                        if (type.id === 'blind') {
                                                            setRole("seeker");
                                                            if (isVoiceMode) speak("Visually impaired selected. Automatically setting role to Job Seeker.");
                                                        }
                                                    }}
                                                    className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${disability === type.id
                                                        ? "border-primary bg-primary/10 text-primary shadow-sm"
                                                        : "border-border/50 bg-background/50 text-muted-foreground hover:border-primary/30"
                                                        }`}
                                                >
                                                    <type.icon className="h-4 w-4 mb-1" />
                                                    <span className="text-[10px] font-medium">{type.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Account Role</Label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <button
                                                type="button"
                                                onFocus={() => isVoiceMode && speak(`Role: Job Seeker. ${role === 'seeker' ? 'Currently selected.' : 'Select this if you are looking for work.'}`)}
                                                onClick={() => setRole("seeker")}
                                                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${role === "seeker"
                                                    ? "border-primary bg-primary/5 text-primary"
                                                    : "border-border/50 bg-background/50 text-muted-foreground hover:border-primary/30"
                                                    }`}
                                            >
                                                <User className="h-6 w-6 mb-2" />
                                                <span className="font-medium text-sm">Job Seeker</span>
                                            </button>
                                            <button
                                                type="button"
                                                disabled={disability !== 'none'}
                                                onFocus={() => isVoiceMode && speak(`Role: Employer. ${role === 'employer' ? 'Currently selected.' : 'Select this if you want to post jobs and hire.'}`)}
                                                onClick={() => setRole("employer")}
                                                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${role === "employer"
                                                    ? "border-accent bg-accent/5 text-accent-foreground"
                                                    : "border-border/50 bg-background/50 text-muted-foreground hover:border-accent/30"
                                                    } ${disability !== 'none' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                <Building className="h-6 w-6 mb-2" />
                                                <span className="font-medium text-sm">Employer</span>
                                            </button>

                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="signup-name">{role === "seeker" ? "Full Name" : "Company Name"}</Label>
                                            <Input
                                                id="signup-name"
                                                placeholder={role === "seeker" ? "John Doe" : "Acme Corp"}
                                                required
                                                value={signupName}
                                                onFocus={() => isVoiceMode && speak(`${role === "seeker" ? "Full name" : "Company name"} field. Each character you type will be read aloud.`)}
                                                onChange={(e) => setSignupName(e.target.value)}
                                                className="bg-background/50 h-11"
                                                ref={nameRef}
                                                onKeyDown={(e) => { speakCharacter(e); handleSignupNameEnter(e); }}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="signup-email">Email</Label>
                                            <Input
                                                id="signup-email"
                                                type="email"
                                                placeholder="m@example.com"
                                                required
                                                value={signupEmail}
                                                onFocus={() => isVoiceMode && speak('Email field. Each character you type will be read aloud.')}
                                                onChange={(e) => setSignupEmail(e.target.value)}
                                                className="bg-background/50 h-11"
                                                ref={signupEmailRef}
                                                onKeyDown={(e) => { speakCharacter(e); handleSignupEmailEnter(e); }}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="signup-password">Password</Label>
                                            <Input
                                                id="signup-password"
                                                type="password"
                                                required
                                                value={signupPassword}
                                                onFocus={() => isVoiceMode && speak('Password field. Each character you type will be read aloud.')}
                                                onChange={(e) => setSignupPassword(e.target.value)}
                                                className="bg-background/50 h-11"
                                                ref={signupPasswordRef}
                                                onKeyDown={(e) => { speakCharacter(e); handleSignupPasswordEnter(e); }}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button className="w-full h-11 shadow-md shadow-primary/20" type="submit" disabled={isLoading}>
                                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Create Account'}
                                        {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
                                    </Button>
                                </CardFooter>
                            </form>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </main>
    );
};

export default Auth;
