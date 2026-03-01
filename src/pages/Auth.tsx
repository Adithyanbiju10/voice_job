import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Briefcase, User, Building, ArrowRight, Loader2 } from "lucide-react";
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
    const [activeTab, setActiveTab] = useState("login");
    const { isVoiceMode, speak } = useVoice();
    const { login } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    const nameRef = useRef<HTMLInputElement>(null);
    const signupEmailRef = useRef<HTMLInputElement>(null);
    const signupPasswordRef = useRef<HTMLInputElement>(null);
    const loginEmailRef = useRef<HTMLInputElement>(null);
    const loginPasswordRef = useRef<HTMLInputElement>(null);

    const focusWithPulse = (ref: React.RefObject<HTMLInputElement>) => {
        if (ref.current) {
            ref.current.focus();
            ref.current.classList.add('voice-focus-pulse');
            setTimeout(() => ref.current?.classList.remove('voice-focus-pulse'), 1000);
        }
    };

    useEffect(() => {
        if (isVoiceMode) {
            const initialPrompt = activeTab === "login"
                ? "Sign in page. Please choose your email field to start, or say 'go to sign up' to create an account."
                : "You are in sign up. First, are you a job seeker or an employer? Say 'select job seeker' or 'select employer'.";
            speak(initialPrompt);

            // Auto focus for better UX
            if (activeTab === "login") {
                setTimeout(() => focusWithPulse(loginEmailRef), 1000);
            }

            // Commands
            const annyangLib = annyang as any;
            if (annyangLib) {
                const commands = {
                    'select job seeker': () => {
                        setRole("seeker");
                        speak("Job seeker selected. Now, please focus on the Name field to enter your details.");
                        setTimeout(() => focusWithPulse(nameRef), 500);
                    },
                    'select seeker': () => {
                        setRole("seeker");
                        speak("Job seeker selected. Now, please focus on the Name field to enter your details.");
                        setTimeout(() => focusWithPulse(nameRef), 500);
                    },
                    'select employer': () => {
                        setRole("employer");
                        speak("Employer selected. Now, please focus on the Company Name field to enter your details.");
                        setTimeout(() => focusWithPulse(nameRef), 500);
                    },
                    'choose seeker': () => {
                        setRole("seeker");
                        speak("Job seeker selected.");
                        setTimeout(() => focusWithPulse(nameRef), 500);
                    },
                    'choose employer': () => {
                        setRole("employer");
                        speak("Employer selected.");
                        setTimeout(() => focusWithPulse(nameRef), 500);
                    },
                    'go to sign up': () => {
                        setActiveTab("signup");
                        speak("You are in sign up. Are you a job seeker or an employer?");
                    },
                    'go to sign in': () => {
                        setActiveTab("login");
                        speak("Switched to sign in.");
                        setTimeout(() => focusWithPulse(loginEmailRef), 400);
                    },
                    'sign up': () => {
                        setActiveTab("signup");
                        speak("You are in sign up.");
                    },
                    'sign in': () => {
                        setActiveTab("login");
                        speak("Switched to sign in.");
                        setTimeout(() => focusWithPulse(loginEmailRef), 400);
                    },
                    'log in': () => {
                        setActiveTab("login");
                        speak("Switched to sign in.");
                        setTimeout(() => focusWithPulse(loginEmailRef), 400);
                    },
                    'email': () => {
                        if (activeTab === 'login') focusWithPulse(loginEmailRef);
                        else focusWithPulse(signupEmailRef);
                        speak("Email field ready.");
                    },
                    'username': () => {
                        if (activeTab === 'login') focusWithPulse(loginEmailRef);
                        else focusWithPulse(nameRef);
                        speak("Field ready.");
                    },
                    'user name': () => {
                        if (activeTab === 'login') focusWithPulse(loginEmailRef);
                        else focusWithPulse(nameRef);
                        speak("Field ready.");
                    },
                    'mail': () => {
                        if (activeTab === 'login') focusWithPulse(loginEmailRef);
                        else focusWithPulse(signupEmailRef);
                        speak("Email field ready.");
                    },
                    'password': () => {
                        if (activeTab === 'login') focusWithPulse(loginPasswordRef);
                        else focusWithPulse(signupPasswordRef);
                        speak("Password field ready.");
                    },
                    'pass': () => {
                        if (activeTab === 'login') focusWithPulse(loginPasswordRef);
                        else focusWithPulse(signupPasswordRef);
                        speak("Password ready.");
                    },
                    'secret': () => {
                        if (activeTab === 'login') focusWithPulse(loginPasswordRef);
                        else focusWithPulse(signupPasswordRef);
                        speak("Password ready.");
                    },
                    'type password': () => {
                        if (activeTab === 'login') focusWithPulse(loginPasswordRef);
                        else focusWithPulse(signupPasswordRef);
                        speak("Password field ready.");
                    }
                };
                annyangLib.addCommands(commands);
                return () => {
                    if (annyangLib.removeCommands) {
                        annyangLib.removeCommands(Object.keys(commands));
                    }
                };
            }
        }
    }, [isVoiceMode, activeTab]);

    const handleSignupNameEnter = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && isVoiceMode) {
            e.preventDefault();
            focusWithPulse(signupEmailRef);
            speak("Name entered. Now, please type your email address and press Enter.");
        }
    };

    const handleSignupEmailEnter = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && isVoiceMode) {
            e.preventDefault();
            focusWithPulse(signupPasswordRef);
            speak("Email entered. Finally, type a password and press Enter to complete sign up.");
        }
    };

    const handleLoginEmailEnter = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && isVoiceMode) {
            e.preventDefault();
            focusWithPulse(loginPasswordRef);
            speak("Email entered. Now type your password and press Enter to sign in.");
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const form = e.target as HTMLFormElement;
        const emailInput = form.querySelector('input[type="email"]') as HTMLInputElement;
        const email = emailInput?.value || 'user@example.com';
        const name = email.split('@')[0];

        setTimeout(() => {
            login({ name, email, role });
            setIsLoading(false);
            toast({
                title: "Welcome back!",
                description: "You have successfully signed in.",
            });
            if (isVoiceMode) {
                speak("Sign in successful! Redirecting to home page.");
            }
            navigate("/");
        }, 1200);
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        setTimeout(() => {
            setIsLoading(false);
            toast({
                title: "Account created!",
                description: "Please sign in with your credentials to continue.",
            });
            setActiveTab("login");
            if (isVoiceMode) {
                speak("Sign up successful! Now please sign in with your account.");
            }
        }, 1200);
    };

    return (
        <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
            <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] opacity-60 pointer-events-none" />
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
                        <TabsTrigger value="login" className="rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm">Sign In</TabsTrigger>
                        <TabsTrigger value="signup" className="rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm">Sign Up</TabsTrigger>
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
                                            className="bg-background/50 h-11"
                                            ref={loginEmailRef}
                                            onKeyDown={handleLoginEmailEnter}
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
                                            className="bg-background/50 h-11"
                                            ref={loginPasswordRef}
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
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            type="button"
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
                                            onClick={() => setRole("employer")}
                                            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${role === "employer"
                                                ? "border-accent bg-accent/5 text-accent-foreground"
                                                : "border-border/50 bg-background/50 text-muted-foreground hover:border-accent/30"
                                                }`}
                                        >
                                            <Building className="h-6 w-6 mb-2" />
                                            <span className="font-medium text-sm">Employer</span>
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="signup-name">{role === "seeker" ? "Full Name" : "Company Name"}</Label>
                                            <Input
                                                id="signup-name"
                                                placeholder={role === "seeker" ? "John Doe" : "Acme Corp"}
                                                required
                                                className="bg-background/50 h-11"
                                                ref={nameRef}
                                                onKeyDown={handleSignupNameEnter}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="signup-email">Email</Label>
                                            <Input
                                                id="signup-email"
                                                type="email"
                                                placeholder="m@example.com"
                                                required
                                                className="bg-background/50 h-11"
                                                ref={signupEmailRef}
                                                onKeyDown={handleSignupEmailEnter}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="signup-password">Password</Label>
                                            <Input
                                                id="signup-password"
                                                type="password"
                                                required
                                                className="bg-background/50 h-11"
                                                ref={signupPasswordRef}
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
