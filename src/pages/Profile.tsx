import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, LogOut, Mail, UserRound, Briefcase, Bookmark, FileText, Building, Building2, Users, MapPin, Clock, Check, X, ExternalLink, Trash2, Download } from 'lucide-react';

import { getLocalJobs } from '@/utils/localJobs';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useVoice } from '@/contexts/VoiceContext';

const LOCAL_JOBS_KEY = 'ability_jobs_local_listings';

const Profile = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { isVoiceMode, speak, isAwake } = useVoice();
    const [applications, setApplications] = useState<any[]>([]);
    const [myPostings, setMyPostings] = useState<any[]>([]);
    const [applicants, setApplicants] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState("account");

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
            const filtered = local.filter(j => j.company === user.name);
            setMyPostings(filtered);
        }
    };

    useEffect(() => {
        refreshData();
    }, [user]);

    useEffect(() => {
        if (isVoiceMode && isAwake && user) {
            const handleCommand = async (e: any) => {
                const cmd = e.detail;
                if (cmd === 'logout') {
                    handleLogout();
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

            window.addEventListener('voice-command', handleCommand);
            return () => window.removeEventListener('voice-command', handleCommand);
        }
    }, [isVoiceMode, isAwake, user, applications, applicants, myPostings]);

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

                <TabsContent value="account" className="mt-0 space-y-6">
                    <Card className="border-border/50 shadow-lg bg-card/60 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle>Account Details</CardTitle>
                            <CardDescription>Information associated with your account</CardDescription>
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
                                                                        const w = window.open();
                                                                        if (w) {
                                                                            w.document.write(`<html><head><title>${app.resume_filename || 'Resume'}</title></head><body style="margin:0"><embed src="${app.resume_data}" width="100%" height="100%" /></body></html>`);
                                                                            w.document.close();
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
