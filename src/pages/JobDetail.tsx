import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, MapPin, Clock, IndianRupee, Accessibility, Briefcase, Loader2 } from 'lucide-react';
import ApplyDialog from '@/components/ApplyDialog';
import { useVoice } from '@/contexts/VoiceContext';
import { useAuth } from '@/contexts/AuthContext';
import { MOCK_JOBS } from '@/data/mockJobs';
import { getLocalJobs } from '@/utils/localJobs';
import type { Tables } from '@/integrations/supabase/types';
import annyang from 'annyang';

import { CheckCircle } from 'lucide-react';

const JobDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<Tables<'jobs'> | null>(null);
  const [loading, setLoading] = useState(true);
  const [applyOpen, setApplyOpen] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [existingApplication, setExistingApplication] = useState<any>(null);
  const hasReadDetailsRef = useRef(false);
  const { isVoiceMode, speak, listen, isAwake } = useVoice();
  const { user, registeredUsers } = useAuth();

  const isVerifiedEmployer = registeredUsers.some(
    (u: any) => u.role === 'employer' && u.name === job?.company && u.isVerified === true
  );

  useEffect(() => {
    const fetch = async () => {
      if (!id) return;

      // Try to fetch from Supabase first
      const { data } = await supabase.from('jobs').select('*').eq('id', id).single();

      if (data) {
        setJob(data);
      } else {
        // Check local storage fallback first (for newly created jobs)
        const local = getLocalJobs();
        const localJob = local.find(j => j.id === id);

        if (localJob) {
          setJob(localJob);
        } else {
          // Fallback to mock jobs
          const mockJob = MOCK_JOBS.find(j => j.id === id);
          setJob(mockJob || null);
        }
      }

      // Check if the current user has already applied
      if (user?.role === 'seeker') {
        const apps = JSON.parse(localStorage.getItem('user_applications') || '[]');
        const existing = apps.find((app: any) => app.jobId === id && app.applicantEmail === user.email);
        if (existing) {
          setAlreadyApplied(true);
          setExistingApplication(existing);
        }
      }

      setLoading(false);
    };
    fetch();
  }, [id, user]);

  useEffect(() => {
    if (isVoiceMode && isAwake && job) {
      // Dynamically check if already applied to handle state updates from dialog
      let isAppliedNow = alreadyApplied;
      let currentApp = existingApplication;
      if (!isAppliedNow && user?.role === 'seeker') {
        const apps = JSON.parse(localStorage.getItem('user_applications') || '[]');
        const existing = apps.find((app: any) => app.jobId === job.id && app.applicantEmail === user.email);
        if (existing) {
          isAppliedNow = true;
          currentApp = existing;
          setAlreadyApplied(true);
          setExistingApplication(existing);
        }
      }

      const handleApply = () => {
        if (!user) {
          speak('You need to sign in to apply. Opening the login prompt.');
          setApplyOpen(true);
        } else if (user.role === 'seeker') {
          if (isAppliedNow && currentApp) {
            const appliedDate = new Date(currentApp.appliedAt).toLocaleDateString('en-US', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            });
            const statusMsg =
              currentApp.status === 'Accepted'
                ? 'Congratulations! It has been accepted.'
                : currentApp.status === 'Rejected'
                  ? 'Unfortunately, it was rejected.'
                  : 'It is currently pending review.';
            speak(`You have already applied for ${job.title} on ${appliedDate}. ${statusMsg} You cannot apply again.`);
          } else {
            speak('Opening the application form.');
            setApplyOpen(true);
          }
        } else {
          speak('Only job seekers can apply for jobs.');
        }
      };

      const handleCommand = (e: any) => {
        if (e.detail === 'apply') {
          handleApply();
        }
      };

      window.addEventListener('voice-command', handleCommand);

      const readJobDetails = async () => {
        if (hasReadDetailsRef.current) {
          if (isAppliedNow) {
            await speak(`You have already applied for this role. What can I do for you? Do you want to browse more jobs or go to home?`);
          } else {
            await speak(`You are viewing ${job.title}. What can I do for you? Say 'apply' to submit your application, or say 'go back' to browse more jobs.`);
          }
          return;
        }

        hasReadDetailsRef.current = true;
        await speak("Job selected.");
        await new Promise(r => setTimeout(r, 600)); // Distinct pause
        await speak(`${job.title} at ${job.company}. Located in ${job.location}.`);

        let accessibilityInfo = "";
        if (job.accessibility_features && job.accessibility_features.length > 0) {
          accessibilityInfo = `This workplace includes accessibility features such as: ${job.accessibility_features.join(', ')}. `;
        }

        let requirementsInfo = "";
        if (job.requirements && job.requirements.length > 0) {
          requirementsInfo = `Requirements for this position include: ${job.requirements.join(', ')}. `;
        }

        if (isAppliedNow && currentApp) {
          const appliedDate = new Date(currentApp.appliedAt).toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
          });
          const statusMsg =
            currentApp.status === 'Accepted'
              ? 'Congratulations! Your application has been accepted.'
              : currentApp.status === 'Rejected'
                ? 'Unfortunately, your application was rejected.'
                : 'Your application is currently pending review.';
          await speak(
            `Description: ${job.description}. ${requirementsInfo}${accessibilityInfo}` +
            `Note: You have already applied for this job on ${appliedDate}. ${statusMsg} What can I do for you? Do you want to browse more jobs or go to home?`
          );
        } else {
          await speak(`Description: ${job.description}. ${requirementsInfo}${accessibilityInfo} Say 'apply' at any time to start your application.`);
        }
      };

      readJobDetails();

      return () => {
        window.removeEventListener('voice-command', handleCommand);
      };
    }
  }, [isVoiceMode, isAwake, job, user, alreadyApplied, existingApplication]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container py-20 text-center">
        <p className="text-lg text-muted-foreground">Job not found.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/jobs">Back to Jobs</Link>
        </Button>
      </div>
    );
  }

  return (
    <main className="container py-8 md:py-12 max-w-3xl">
      <Link to="/jobs" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Jobs
      </Link>

      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <Badge variant="secondary">{job.category}</Badge>
          <Badge variant="outline">{job.job_type}</Badge>
        </div>
        <h1 className="font-heading text-3xl font-bold">{job.title}</h1>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-lg text-muted-foreground">{job.company}</p>
          {isVerifiedEmployer && (
            <Badge className="bg-success/15 text-success border-success/30 border gap-1 text-[10px] px-2 h-5">
              <CheckCircle className="h-2.5 w-2.5" /> Verified Employer
            </Badge>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-8">
        <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-primary/70" />{job.location}</span>
        {job.salary_range && <span className="flex items-center gap-1.5"><IndianRupee className="h-4 w-4 text-success/70" />{job.salary_range}</span>}
        <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-accent/70" />{new Date(job.posted_at).toLocaleDateString()}</span>
      </div>

      {(!user || user.role === 'seeker') && (
        alreadyApplied && existingApplication ? (
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2 px-5 py-3 rounded-xl bg-success/10 border border-success/30 text-success font-semibold text-sm w-full sm:w-auto">
              <CheckCircle className="h-5 w-5 flex-shrink-0" />
              Already Applied
            </div>
            <span className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider ${existingApplication.status === 'Accepted' ? 'bg-success/20 text-success' :
              existingApplication.status === 'Rejected' ? 'bg-destructive/20 text-destructive' :
                'bg-primary/10 text-primary'
              }`}>
              Status: {existingApplication.status}
            </span>
            <span className="text-xs text-muted-foreground">
              Applied on {new Date(existingApplication.appliedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        ) : (
          <Button size="lg" className="mb-8 w-full sm:w-auto text-base px-8 shadow-lg shadow-primary/20" onClick={() => setApplyOpen(true)}>
            <Briefcase className="mr-2 h-4 w-4" /> Apply Now
          </Button>
        )
      )}

      {user?.role === 'employer' && (
        <div className="mb-8 p-4 bg-muted/30 border border-border rounded-lg text-sm text-center">
          <p>You are viewing this job as an employer. Only job seekers can apply for jobs.</p>
        </div>
      )}

      <Card className="mb-6">
        <CardContent className="p-6">
          <h2 className="font-heading text-lg font-semibold mb-3">Description</h2>
          <p className="text-muted-foreground leading-relaxed">{job.description}</p>
        </CardContent>
      </Card>

      {job.requirements && job.requirements.length > 0 && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="font-heading text-lg font-semibold mb-3">Requirements</h2>
            <ul className="space-y-2">
              {job.requirements.map((r) => (
                <li key={r} className="flex items-start gap-2 text-muted-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                  {r}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {job.accessibility_features && job.accessibility_features.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h2 className="font-heading text-lg font-semibold mb-3 flex items-center gap-2">
              <Accessibility className="h-5 w-5 text-success" /> Accessibility Features
            </h2>
            <div className="flex flex-wrap gap-2">
              {job.accessibility_features.map((f) => (
                <span key={f} className="inline-flex items-center gap-1 rounded-full bg-success/10 px-3 py-1 text-sm font-medium text-success">
                  {f}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <ApplyDialog open={applyOpen} onOpenChange={setApplyOpen} jobId={job.id} jobTitle={job.title} employerName={job.company} />
    </main>
  );
};

export default JobDetail;
