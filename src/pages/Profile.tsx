import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, LogOut, Mail, UserRound, Briefcase, Bookmark, FileText, Building, Building2, Users, MapPin, Clock, Check, X, ExternalLink, Trash2 } from 'lucide-react';
import { getLocalJobs } from '@/utils/localJobs';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useVoice } from '@/contexts/VoiceContext';
import annyang from 'annyang';

const LOCAL_JOBS_KEY = 'ability_jobs_local_listings';

const Profile = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { isVoiceMode, speak, listen } = useVoice();
    const [applications, setApplications] = useState<any[]>([]);
    const [myPostings, setMyPostings] = useState<any[]>([]);
    const [applicants, setApplicants] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState("account");

    const refreshData = () => {
        const storedApps = localStorage.getItem('user_applications');
        if (storedApps && user) {
            const allApps = JSON.parse(storedApps);
            // Filter applications to only show those belonging to the current user
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
            const filtered = local.filter(j => j.company === user.name);
            setMyPostings(filtered);
        }
    };

    useEffect(() => {
        refreshData();
    }, [user]);

    useEffect(() => {
        if (isVoiceMode && user) {
            const initialPrompt = `Welcome to your profile, ${user.name}. You are logged in ${user.role === 'employer' ? 'as an employer' : 'as a job seeker'}. Would you like to sign out? Just say "sign out". Or, to see your application status, say "application".`;

            // Only speak the full intro if we are on the account tab and just loaded or returned
            if (activeTab === 'account') {
                speak(initialPrompt);
            }

            const commands = {
                'sign out': () => {
                    speak("Signing you out now. Goodbye!");
                    handleLogout();
                },
                'application': async () => {
                    if (user.role === 'seeker') {
                        setActiveTab("applications");
                        if (applications.length === 0) {
                            speak("You haven't applied to any jobs yet. Returning to account settings.");
                        } else {
                            speak(`Opening your applications. You have ${applications.length} applications. I will read them one by one.`);
                            for (const app of applications) {
                                let statusMsg = `Application for ${app.jobTitle} is currently ${app.status}.`;
                                if (app.status === 'Accepted') statusMsg = `Congratulations! Your application for ${app.jobTitle} has been accepted.`;
                                if (app.status === 'Rejected') statusMsg = `Sorry, your application for ${app.jobTitle} was not selected this time.`;
                                await speak(statusMsg);
                            }
                        }
                        // Come back to sign out side after reading (or if zero)
                        setTimeout(() => {
                            setActiveTab("account");
                            speak("Finished reading applications. You are back in your account settings. Would you like to sign out?");
                        }, 1000);
                    } else {
                        speak("As an employer, you can check your job postings or applicants. Say 'postings' or 'applicants' to manage them.");
                    }
                },
                'account': () => {
                    setActiveTab("account");
                    speak("Switched to account details.");
                },
                'profile': () => { // Added 'profile' as an alias for 'account'
                    setActiveTab("account");
                    speak("Switched to account details.");
                },
                'postings': () => {
                    if (user.role === 'employer') {
                        setActiveTab("postings");
                        speak(`Showing your ${myPostings.length} job postings.`);
                    } else {
                        speak("This command is only for employers.");
                    }
                },
                'applicants': () => {
                    if (user.role === 'employer') {
                        setActiveTab("applicants");
                        speak(`Showing ${applicants.length} applicants for your jobs.`);
                    } else {
                        speak("This command is only for employers.");
                    }
                },
                'home': () => {
                    speak("Going back to the home page.");
                    navigate('/');
                }
            };

            const annyangLib = annyang as any;
            if (annyangLib) {
                annyangLib.addCommands(commands);
                return () => annyangLib.removeCommands(Object.keys(commands));
            }
        }
    }, [isVoiceMode, user, applications, applicants, myPostings, activeTab]);

    const handleUpdateStatus = (appId: string, newStatus: 'Accepted' | 'Rejected') => {
        // Update in all_applications (global list)
        const allApps = JSON.parse(localStorage.getItem('all_applications') || '[]');
        const updatedAll = allApps.map((app: any) =>
            app.id === appId ? { ...app, status: newStatus } : app
        );
        localStorage.setItem('all_applications', JSON.stringify(updatedAll));

        // Update in user_applications (in case the current browser user is the applicant)
        const userApps = JSON.parse(localStorage.getItem('user_applications') || '[]');
        const updatedUser = userApps.map((app: any) =>
            app.id === appId ? { ...app, status: newStatus } : app
        );
        localStorage.setItem('user_applications', JSON.stringify(updatedUser));

        toast.success(`Application ${newStatus.toLowerCase()}`);
        refreshData();
    };

    // If user is not authenticated, redirect to login
    if (!user) {
        return <Navigate to="/auth" replace />;
    }

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const handleDeletePosting = (jobId: string) => {
        const local = getLocalJobs();
        const updated = local.filter(j => j.id !== jobId);
        localStorage.setItem(LOCAL_JOBS_KEY, JSON.stringify(updated));
        toast.success("Job posting removed");
        refreshData();
    };

    const handleDeleteAllPostings = () => {
        const local = getLocalJobs();
        const remaining = local.filter(j => j.company !== user?.name);
        localStorage.setItem(LOCAL_JOBS_KEY, JSON.stringify(remaining));
        toast.success("All your postings have been deleted");
        refreshData();
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

                {/* Always Present: Account Details */}
                <TabsContent value="account" className="mt-0 space-y-6">
                    <Card className="border-border/50 shadow-lg bg-card/60 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle>Account Details</CardTitle>
                            <CardDescription>
                                Information associated with your account
                            </CardDescription>
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
                                        <p className="text-base font-semibold">{user.name}</p>
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

                {/* Seeker Specific Tabs */}
                {user.role === 'seeker' && (
                    <>
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
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
                                                            <div className="h-1 w-1 rounded-full bg-muted-foreground" />
                                                        </Button>
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
                    </>
                )}

                {/* Employer Specific Tabs */}
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
                                                            <Button variant="outline" size="sm" asChild className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Link to={`/jobs/${job.id}`}>Manage</Link>
                                                            </Button>
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
                                            <p className="text-muted-foreground mt-2 max-w-sm">
                                                Create a new job posting to start receiving applications from talented candidates.
                                            </p>
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
                                                    <div className="mt-4 pt-4 border-t border-border/50 flex flex-wrap justify-between items-center gap-4">
                                                        <div>
                                                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Applied for</p>
                                                            <p className="text-sm font-semibold">{app.jobTitle}</p>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            {app.resume_url && (
                                                                <Button variant="outline" size="sm" className="gap-2" onClick={() => window.open(app.resume_url, '_blank')}>
                                                                    <ExternalLink className="h-4 w-4" /> View CV
                                                                </Button>
                                                            )}
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
                                                    {app.coverLetter && (
                                                        <div className="mt-3 p-3 bg-muted/30 rounded-lg text-sm text-foreground/80 border border-border/50">
                                                            <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Applicant's Pitch:</p>
                                                            "{app.coverLetter}"
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-border/60 rounded-xl bg-muted/20">
                                            <Users className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                                            <h3 className="text-lg font-medium">No applicants to review</h3>
                                            <p className="text-muted-foreground mt-2 max-w-sm">
                                                Once your job postings receive applications, candidates will appear here for you to review.
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </>
                )}
            </Tabs>
        </div>
    );
};

export default Profile;
