import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, LogOut, Mail, UserRound, Briefcase, Bookmark, FileText, Building, Building2, Users, MapPin, Clock } from 'lucide-react';
import { getLocalJobs } from '@/utils/localJobs';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

const Profile = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [applications, setApplications] = useState<any[]>([]);
    const [myPostings, setMyPostings] = useState<any[]>([]);

    useEffect(() => {
        const storedApps = localStorage.getItem('user_applications');
        if (storedApps) {
            setApplications(JSON.parse(storedApps));
        }

        // Fetch employer postings
        if (user?.role === 'employer') {
            const local = getLocalJobs();
            // Filter by company name for this session/user
            const filtered = local.filter(j => j.company === user.name);
            setMyPostings(filtered);
        }
    }, [user]);

    // If user is not authenticated, redirect to login
    if (!user) {
        return <Navigate to="/auth" replace />;
    }

    const handleLogout = () => {
        logout();
        navigate('/');
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

            <Tabs defaultValue="account" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-8 bg-muted/50 p-1 rounded-xl border border-border/50 h-auto">
                    <TabsTrigger value="account" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm py-3">
                        <User className="w-4 h-4 mr-2 hidden sm:block" /> Account
                    </TabsTrigger>
                    {user.role === 'seeker' ? (
                        <>
                            <TabsTrigger value="saved" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm py-3">
                                <Bookmark className="w-4 h-4 mr-2 hidden sm:block" /> Saved Jobs
                            </TabsTrigger>
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
                        <CardFooter className="flex justify-between pt-6 border-t border-border/50">
                            <Button variant="outline" className="gap-2">
                                Edit Details
                            </Button>
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
                        <TabsContent value="saved" className="mt-0">
                            <Card className="border-border/50 shadow-lg bg-card/60 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle>Saved Jobs</CardTitle>
                                    <CardDescription>Jobs you have bookmarked for later</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-border/60 rounded-xl bg-muted/20">
                                        <Bookmark className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                                        <h3 className="text-lg font-medium">No saved jobs yet</h3>
                                        <p className="text-muted-foreground mt-2 max-w-sm">
                                            When you find a job you like but aren't ready to apply, bookmark it and it will appear here.
                                        </p>
                                        <Button className="mt-6" onClick={() => navigate('/jobs')}>Browse Jobs</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
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
                                <CardHeader>
                                    <CardTitle>My Postings</CardTitle>
                                    <CardDescription>Manage all the jobs your company has listed</CardDescription>
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
                                                        <Button variant="outline" size="sm" asChild className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Link to={`/jobs/${job.id}`}>Manage</Link>
                                                        </Button>
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
                                    <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-border/60 rounded-xl bg-muted/20">
                                        <Users className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                                        <h3 className="text-lg font-medium">No applicants to review</h3>
                                        <p className="text-muted-foreground mt-2 max-w-sm">
                                            Once your job postings receive applications, candidates will appear here for you to review.
                                        </p>
                                    </div>
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
