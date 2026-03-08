import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { Shield, CheckCircle, XCircle, Building2, Users, AlertTriangle, LogOut } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const Admin = () => {
    const { user, logout, getAllEmployers, verifyEmployer, unverifyEmployer } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };
    const [employers, setEmployers] = useState<any[]>([]);
    const [refresh, setRefresh] = useState(0);

    useEffect(() => {
        setEmployers(getAllEmployers());
    }, [refresh]);

    // Guard: only admin can access this page
    if (!user || user.role !== 'admin') {
        return <Navigate to="/" replace />;
    }

    const handleVerify = (employer: any) => {
        verifyEmployer(employer.id);
        toast.success(`${employer.name} has been verified as a trusted employer.`);
        setRefresh(r => r + 1);
    };

    const handleUnverify = (employer: any) => {
        unverifyEmployer(employer.id);
        toast.warning(`${employer.name}'s verification has been revoked.`);
        setRefresh(r => r + 1);
    };

    const verifiedCount = employers.filter(e => e.isVerified).length;
    const pendingCount = employers.filter(e => !e.isVerified).length;
    const totalJobs = JSON.parse(localStorage.getItem('ability_jobs_local_listings') || '[]').length;

    return (
        <div className="container max-w-5xl py-10 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 mb-10">
                <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                        <Shield className="h-7 w-7 text-primary-foreground" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                        <p className="text-muted-foreground mt-0.5">Manage and verify employers on the platform</p>
                    </div>
                </div>
                <Button
                    variant="destructive"
                    onClick={handleLogout}
                    className="gap-2 shadow-md hover:shadow-lg transition-all flex-shrink-0"
                >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
                <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Building2 className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{employers.length}</p>
                                <p className="text-xs text-muted-foreground">Total Employers</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center">
                                <CheckCircle className="h-5 w-5 text-success" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{verifiedCount}</p>
                                <p className="text-xs text-muted-foreground">Verified</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-border/50 bg-card/60 backdrop-blur-sm col-span-2 md:col-span-1">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                                <AlertTriangle className="h-5 w-5 text-destructive" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{pendingCount}</p>
                                <p className="text-xs text-muted-foreground">Pending Verification</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Employer List */}
            <Card className="border-border/50 shadow-lg bg-card/60 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Employer Accounts
                    </CardTitle>
                    <CardDescription>
                        Verify employers you trust. Verified employers display a trust badge on their job listings.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {employers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-10 text-center border-2 border-dashed border-border/60 rounded-xl bg-muted/20">
                            <Building2 className="h-10 w-10 text-muted-foreground mb-3 opacity-40" />
                            <p className="text-muted-foreground">No employer accounts registered yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {employers.map((employer) => (
                                <div
                                    key={employer.id}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border/50 bg-secondary/20 hover:border-primary/20 transition-all"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`h-11 w-11 rounded-full flex items-center justify-center flex-shrink-0 ${employer.isVerified ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'}`}>
                                            <Building2 className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="font-semibold text-foreground">{employer.name}</h3>
                                                {employer.isVerified ? (
                                                    <Badge className="bg-success/15 text-success border-success/30 border gap-1 text-[10px] px-2">
                                                        <CheckCircle className="h-2.5 w-2.5" />
                                                        Verified
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-muted-foreground border-border/50 text-[10px] px-2">
                                                        Unverified
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground">{employer.email}</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 sm:flex-shrink-0">
                                        {employer.isVerified ? (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5"
                                                onClick={() => handleUnverify(employer)}
                                            >
                                                <XCircle className="h-4 w-4" />
                                                Revoke
                                            </Button>
                                        ) : (
                                            <Button
                                                size="sm"
                                                className="bg-success/90 hover:bg-success text-white gap-1.5 shadow-sm"
                                                onClick={() => handleVerify(employer)}
                                            >
                                                <CheckCircle className="h-4 w-4" />
                                                Verify
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Info box */}
            <div className="mt-6 p-4 rounded-xl border border-primary/20 bg-primary/5 text-sm text-muted-foreground flex items-start gap-3">
                <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                    <strong className="text-foreground">How verification works:</strong> When you verify an employer,
                    a <span className="text-success font-medium">✓ Verified Employer</span> badge appears on all their
                    job listings. Job seekers — especially those using the voice assistant — will be informed when a
                    job is from a trusted, verified employer.
                </div>
            </div>
        </div>
    );
};

export default Admin;
