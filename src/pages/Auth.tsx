import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Briefcase, User, Building, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useVoice } from "@/contexts/VoiceContext";
import { useAuth } from "@/contexts/AuthContext";

const Auth = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [role, setRole] = useState<"seeker" | "employer">("seeker");
    const { isVoiceMode, speak } = useVoice();
    const { login } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (isVoiceMode) {
            speak("Authentication page. You can sign in or create an account as a Job Seeker or an Employer.");
        }
    }, [isVoiceMode]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Get form data
        const form = e.target as HTMLFormElement;
        const emailInput = form.querySelector('input[type="email"]') as HTMLInputElement;
        const nameInput = form.querySelector('#signup-name') as HTMLInputElement;

        const email = emailInput?.value || 'user@example.com';
        const name = nameInput?.value || email.split('@')[0];

        // Simulate API call
        setTimeout(() => {
            login({
                name,
                email,
                role
            });
            setIsLoading(false);
            navigate("/");
        }, 1500);
    };

    return (
        <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
            {/* Background decoration */}
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

                <Tabs defaultValue="login" className="w-full">
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
                            <form onSubmit={handleSubmit}>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input id="email" type="email" placeholder="m@example.com" required className="bg-background/50 h-11" />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="password">Password</Label>
                                            <a href="#" className="text-sm font-medium text-primary hover:underline">Forgot password?</a>
                                        </div>
                                        <Input id="password" type="password" required className="bg-background/50 h-11" />
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
                            <form onSubmit={handleSubmit}>
                                <CardContent className="space-y-6">
                                    {/* Role Selection */}
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
                                            <Input id="signup-name" placeholder={role === "seeker" ? "John Doe" : "Acme Corp"} required className="bg-background/50 h-11" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="signup-email">Email</Label>
                                            <Input id="signup-email" type="email" placeholder="m@example.com" required className="bg-background/50 h-11" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="signup-password">Password</Label>
                                            <Input id="signup-password" type="password" required className="bg-background/50 h-11" />
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
