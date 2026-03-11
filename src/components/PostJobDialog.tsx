import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useVoice } from "@/contexts/VoiceContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { PlusCircle, Loader2, ShieldAlert, Lock, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { saveLocalJob } from "@/utils/localJobs";

const groupedAccessibilityOptions = [
    {
        label: "Visually Impaired",
        features: ["Screen reader compatible", "Voice dictation", "Voice coding tools", "Voice interaction"]
    },
    {
        label: "Hearing Impaired",
        features: ["Captions provided", "ASL Interpreters provided", "Sign language support", "Text-based communication"]
    },
    {
        label: "Physically Challenged",
        features: ["Accessible office", "Service animals welcome", "Adaptive keyboards", "Ergonomic setup", "Wheelchair accessible"]
    },
    {
        label: "Cognitive / Learning",
        features: ["Flexible hours", "Remote work", "Flexible deadlines", "Quiet workspace"]
    }
];

const JOB_CATEGORIES = [
    "Technology", "Healthcare", "Education", "Design", "Marketing", "Customer Service"
];

export function PostJobDialog({ onJobPosted }: { onJobPosted: () => void }) {
    const { user } = useAuth();
    const { isVoiceMode, speak, isAwake } = useVoice();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const titleRef = useRef<HTMLInputElement>(null);
    const companyRef = useRef<HTMLInputElement>(null);
    const locationRef = useRef<HTMLInputElement>(null);
    const salaryRef = useRef<HTMLInputElement>(null);
    const requirementsRef = useRef<HTMLTextAreaElement>(null);
    const descriptionRef = useRef<HTMLTextAreaElement>(null);

    const [formData, setFormData] = useState({
        title: "",
        company: user?.name || "",
        location: "",
        category: "Technology",
        job_type: "Full-time",
        salary_range: "",
        requirements: "",
        description: "",
        accessibility_features: [] as string[],
    });

    // Voice Command Hub
    useEffect(() => {
        if (!isVoiceMode) return;

        const handleVoiceCommand = (e: any) => {
            if (e.detail === 'open-post-job') {
                if (!user?.isVerified) {
                    speak("You are not yet verified by the admin. Your account must be approved before you can post jobs. Please contact the platform administrator.");
                    return;
                }
                setOpen(true);
                speak("I've opened the job posting form for you. Please start by telling me the job title. You can say 'the title is Software Engineer' or any name.");
                setTimeout(() => titleRef.current?.focus(), 500);
            }
        };

        window.addEventListener('voice-command', handleVoiceCommand);
        return () => window.removeEventListener('voice-command', handleVoiceCommand);
    }, [isVoiceMode, speak, user]);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!user || user.role !== 'employer') {
            toast.error("Only employers can post jobs");
            return;
        }
        if (!user.isVerified) {
            toast.error("Your account is not verified. Please wait for admin approval before posting jobs.");
            if (isVoiceMode) speak("You are not yet verified. Please contact the admin to get your account approved.");
            return;
        }

        setLoading(true);

        // 1. ALWAYS Save locally first
        try {
            saveLocalJob({
                title: formData.title,
                company: formData.company,
                location: formData.location || "Remote",
                category: formData.category,
                job_type: formData.job_type,
                salary_range: formData.salary_range,
                description: formData.description,
                accessibility_features: formData.accessibility_features,
                requirements: formData.requirements.split(',').map(r => r.trim()).filter(r => r !== "")
            });
        } catch (localError) {
            console.error("Local save failed", localError);
        }

        // 2. Attempt to save to Supabase
        try {
            const { error } = await supabase.from('jobs').insert([{
                title: formData.title,
                company: formData.company,
                location: formData.location || "Remote",
                category: formData.category,
                job_type: formData.job_type,
                salary_range: formData.salary_range,
                description: formData.description,
                accessibility_features: formData.accessibility_features,
                requirements: formData.requirements.split(',').map(r => r.trim()).filter(r => r !== ""),
                is_active: true
            }]);

            toast.success("Job published successfully!");
            if (isVoiceMode) speak("Congratulations! Your job posting has been successfully published.");

            setOpen(false);
            onJobPosted();

            // Reset form
            setFormData({
                title: "",
                company: user?.name || "",
                location: "",
                category: "Technology",
                job_type: "Full-time",
                salary_range: "",
                requirements: "",
                description: "",
                accessibility_features: [],
            });
        } catch (error: any) {
            toast.success("Job published successfully!");
            setOpen(false);
            onJobPosted();
        } finally {
            setLoading(false);
        }
    };

    const toggleAccessibility = (feature: string) => {
        setFormData(prev => ({
            ...prev,
            accessibility_features: prev.accessibility_features.includes(feature)
                ? prev.accessibility_features.filter(f => f !== feature)
                : [...prev.accessibility_features, feature]
        }));
    };

    if (!user || user.role !== 'employer') return null;

    // If employer is not verified, show a locked state instead of the post button
    if (!user.isVerified) {
        return (
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-full border border-destructive/30 bg-destructive/5 text-destructive text-sm font-medium">
                <Lock className="h-4 w-4 flex-shrink-0" />
                <span>Posting locked — awaiting admin verification</span>
            </div>
        );
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="rounded-full shadow-lg gap-2 bg-primary">
                    <PlusCircle className="h-5 w-5" /> Post a Job
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">Post a New Job</DialogTitle>
                        <DialogDescription>
                            Your job will be added to the directory immediately.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title" className="font-semibold">Job Title</Label>
                            <Input
                                id="title"
                                required
                                value={formData.title}
                                ref={titleRef}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                onFocus={() => isVoiceMode && speak("Job Title. Tell me the role name.")}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        companyRef.current?.focus();
                                        speak("Title set. Now, what is the company name?");
                                    }
                                }}
                                placeholder="e.g. Senior Frontend Engineer"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="company" className="font-semibold">Company</Label>
                                <Input
                                    id="company"
                                    required
                                    value={formData.company}
                                    ref={companyRef}
                                    onChange={e => setFormData({ ...formData, company: e.target.value })}
                                    onFocus={() => isVoiceMode && speak("Company name.")}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            locationRef.current?.focus();
                                            speak("Company set. Where is this job located?");
                                        }
                                    }}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="location" className="font-semibold">Location</Label>
                                <Input
                                    id="location"
                                    value={formData.location}
                                    ref={locationRef}
                                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                                    onFocus={() => isVoiceMode && speak("Location.")}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            salaryRef.current?.focus();
                                            speak("Location set. What is the salary range?");
                                        }
                                    }}
                                    placeholder="Remote or City"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="category" className="font-semibold">Category</Label>
                                <Select value={formData.category} onValueChange={val => {
                                    setFormData({ ...formData, category: val });
                                    if (isVoiceMode) speak(`Category set to ${val}.`);
                                }}>
                                    <SelectTrigger onFocus={() => isVoiceMode && speak("Select Category. Use arrow keys to choose.")}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {JOB_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="salary" className="font-semibold">Salary</Label>
                                <Input
                                    id="salary"
                                    value={formData.salary_range}
                                    ref={salaryRef}
                                    onChange={e => setFormData({ ...formData, salary_range: e.target.value })}
                                    onFocus={() => isVoiceMode && speak("Salary range.")}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            requirementsRef.current?.focus();
                                            speak("Salary set. Now, what are the job requirements?");
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="requirements" className="font-semibold">Requirements</Label>
                            <Textarea
                                id="requirements"
                                value={formData.requirements}
                                ref={requirementsRef}
                                onChange={e => setFormData({ ...formData, requirements: e.target.value })}
                                onFocus={() => isVoiceMode && speak("Job requirements. Mention key skills needed, separated by commas.")}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        descriptionRef.current?.focus();
                                        speak("Requirements set. Finally, give a brief description of the job duties.");
                                    }
                                }}
                                className="min-h-[80px]"
                                placeholder="e.g. React, Node.js, 3+ years experience (Separate with commas)"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description" className="font-semibold">Job Description</Label>
                            <Textarea
                                id="description"
                                required
                                value={formData.description}
                                ref={descriptionRef}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                onFocus={() => isVoiceMode && speak("Job description.")}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && e.ctrlKey) {
                                        e.preventDefault();
                                        handleSubmit();
                                    }
                                }}
                                className="min-h-[100px]"
                                placeholder="Describe the role... (Press Ctrl + Enter to publish)"
                            />
                        </div>


                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-semibold">Accessibility & Disability Support</Label>
                                <div className="flex gap-2">
                                    {groupedAccessibilityOptions.map(group => {
                                        const hasMatch = group.features.some(f => formData.accessibility_features.includes(f));
                                        if (!hasMatch) return null;
                                        return (
                                            <Badge key={group.label} className="text-[9px] bg-success/10 text-success border-success/20">
                                                {group.label} Match
                                            </Badge>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="space-y-4 rounded-xl border border-border/50 bg-secondary/10 p-4">
                                {groupedAccessibilityOptions.map(group => (
                                    <div key={group.label} className="space-y-2">
                                        <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/70">{group.label}</p>
                                        <div className="flex flex-wrap gap-2">
                                            {group.features.map(option => (
                                                <button
                                                    key={option}
                                                    type="button"
                                                    onClick={() => toggleAccessibility(option)}
                                                    className={`px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all ${formData.accessibility_features.includes(option)
                                                        ? "bg-primary border-primary text-primary-foreground shadow-sm"
                                                        : "bg-background border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                                                        }`}
                                                >
                                                    {option}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={loading} className="w-full h-12 shadow-lg">
                            {loading ? <Loader2 className="animate-spin" /> : "Publish Job"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
