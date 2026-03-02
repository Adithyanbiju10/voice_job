import { useEffect, useState } from 'react';
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

const JobDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<Tables<'jobs'> | null>(null);
  const [loading, setLoading] = useState(true);
  const [applyOpen, setApplyOpen] = useState(false);
  const { isVoiceMode, speak, listen, isAwake } = useVoice();
  const { user } = useAuth();

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

      setLoading(false);
    };
    fetch();
  }, [id]);

  useEffect(() => {
    if (isVoiceMode && isAwake && job) {
      const handleApply = () => {
        if (!user) {
          speak('You need to sign in to apply. Opening the login prompt.');
          setApplyOpen(true);
        } else if (user.role === 'seeker') {
          speak('Opening the application form.');
          setApplyOpen(true);
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
        await speak(`Job selected: ${job.title} at ${job.company}. Located in ${job.location}.`);

        let accessibilityInfo = "";
        if (job.accessibility_features && job.accessibility_features.length > 0) {
          accessibilityInfo = `This workplace includes accessibility features such as: ${job.accessibility_features.join(', ')}. `;
        }

        await speak(`Description: ${job.description}. ${accessibilityInfo} Say 'apply' at any time to start your application.`);
      };

      readJobDetails();

      return () => {
        window.removeEventListener('voice-command', handleCommand);
        window.speechSynthesis.cancel();
      };
    }
  }, [isVoiceMode, isAwake, job, user]);

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
        <p className="text-lg text-muted-foreground mt-1">{job.company}</p>
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-8">
        <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-primary/70" />{job.location}</span>
        {job.salary_range && <span className="flex items-center gap-1.5"><IndianRupee className="h-4 w-4 text-success/70" />{job.salary_range}</span>}
        <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-accent/70" />{new Date(job.posted_at).toLocaleDateString()}</span>
      </div>

      {(!user || user.role === 'seeker') && (
        <Button size="lg" className="mb-8 w-full sm:w-auto text-base px-8 shadow-lg shadow-primary/20" onClick={() => setApplyOpen(true)}>
          <Briefcase className="mr-2 h-4 w-4" /> Apply Now
        </Button>
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
