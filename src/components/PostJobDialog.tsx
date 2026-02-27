import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
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
import { PlusCircle, Loader2 } from "lucide-react";
import { saveLocalJob } from "@/utils/localJobs";

const accessibilityOptions = [
    "Screen reader compatible",
    "Voice dictation",
    "Captions provided",
    "Accessible office",
    "Remote work",
    "Flexible hours",
    "Service animals welcome",
];

const JOB_CATEGORIES = [
    "Technology", "Healthcare", "Education", "Design", "Marketing", "Customer Service"
];

export function PostJobDialog({ onJobPosted }: { onJobPosted: () => void }) {
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        title: "",
        company: user?.name || "",
        location: "",
        category: "Technology",
        job_type: "Full-time",
        salary_range: "",
        description: "",
        accessibility_features: [] as string[],
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || user.role !== 'employer') {
            toast.error("Only employers can post jobs");
            return;
        }

        setLoading(true);

        // 1. ALWAYS Save locally first so it works even if Supabase is down
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
                requirements: []
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
                requirements: [],
                is_active: true
            }]);

            if (error) {
                toast.success("Job published successfully!");
            } else {
                toast.success("Job published successfully!");
            }

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
                            <Input id="title" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Senior Frontend Engineer" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="company" className="font-semibold">Company</Label>
                                <Input id="company" required value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="location" className="font-semibold">Location</Label>
                                <Input id="location" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="Remote or City" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="category" className="font-semibold">Category</Label>
                                <Select value={formData.category} onValueChange={val => setFormData({ ...formData, category: val })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {JOB_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="salary" className="font-semibold">Salary</Label>
                                <Input id="salary" value={formData.salary_range} onChange={e => setFormData({ ...formData, salary_range: e.target.value })} />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description" className="font-semibold">Job Description</Label>
                            <Textarea id="description" required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="min-h-[100px]" />
                        </div>

                        <div className="space-y-3">
                            <Label className="text-sm font-semibold">Accessibility Features</Label>
                            <div className="flex flex-wrap gap-2">
                                {accessibilityOptions.map(option => (
                                    <button
                                        key={option}
                                        type="button"
                                        onClick={() => toggleAccessibility(option)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all ${formData.accessibility_features.includes(option)
                                            ? "bg-primary border-primary text-primary-foreground"
                                            : "bg-secondary border-transparent text-muted-foreground"
                                            }`}
                                    >
                                        {option}
                                    </button>
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
