import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Loader2, Eye, EarOff, Accessibility, MessageCircleOff, Brain, HandMetal } from 'lucide-react';
import JobCard from '@/components/JobCard';
import { useVoice } from '@/contexts/VoiceContext';
import { useAuth } from '@/contexts/AuthContext';
import { PostJobDialog } from '@/components/PostJobDialog';
import { MOCK_JOBS } from '@/data/mockJobs';
import { getLocalJobs } from '@/utils/localJobs';
import type { Tables } from '@/integrations/supabase/types';
import annyang from 'annyang';
import { Link, useNavigate } from 'react-router-dom';

const disabilityTypes = [
  { id: 'all', label: 'All', icon: Accessibility, color: 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/20' },
  {
    id: 'blind', label: 'Visually Impaired', icon: Eye, color: 'bg-accent/10 text-accent-foreground border-accent/30 hover:bg-accent/20',
    features: ['Screen reader compatible', 'Voice dictation', 'Voice coding tools', 'Voice-to-text', 'Voice input support'],
  },
  {
    id: 'deaf', label: 'Hearing Impaired', icon: EarOff, color: 'bg-success/10 text-success border-success/30 hover:bg-success/20',
    features: ['Flexible hours', 'Remote work', 'Hybrid work', 'Adaptive tools provided', 'ASL Interpreters provided', 'Captions provided']
  },
  {
    id: 'physical', label: 'Physically Challenged', icon: HandMetal, color: 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/20',
    features: ['Accessible office', 'Standing desk', 'Ergonomic setup', 'Adjustable workspace', 'Adaptive keyboards', 'Remote work', 'Hybrid work', 'Service animals welcome', 'Braille display support']
  },
  {
    id: 'speech', label: 'Speech Impaired', icon: MessageCircleOff, color: 'bg-accent/10 text-accent-foreground border-accent/30 hover:bg-accent/20',
    features: ['Voice-to-text', 'Adaptive tools provided', 'Remote work', 'Flexible hours', 'Text-based communication']
  },
  {
    id: 'cognitive', label: 'Cognitive / Learning', icon: Brain, color: 'bg-success/10 text-success border-success/30 hover:bg-success/20',
    features: ['Flexible deadlines', 'Flexible schedule', 'Mental health days', 'Flexible hours', 'Adaptive input devices', 'Quiet workspace']
  },
];

const Jobs = () => {
  const [jobs, setJobs] = useState<Tables<'jobs'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [disabilityFilter, setDisabilityFilter] = useState('all');
  const { isVoiceMode, speak, listen } = useVoice();
  const { user } = useAuth();

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    const local = getLocalJobs();
    try {
      const { data, error } = await supabase.from('jobs').select('*').eq('is_active', true).order('posted_at', { ascending: false });
      if (error) throw error;
      setJobs([...local, ...MOCK_JOBS, ...(data || [])]);
    } catch (e) {
      setJobs([...local, ...MOCK_JOBS]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const categories = ['all', ...Array.from(new Set(jobs.map(j => j.category)))];

  const handleVoiceSearch = async () => {
    const query = await listen();
    if (query) setSearch(query);
  };

  const filtered = jobs.filter(j => {
    const matchSearch = !search || j.title.toLowerCase().includes(search.toLowerCase()) || j.company.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'all' || j.category === category;

    // Force blind filter if in voice mode
    const effectiveDisabilityFilter = isVoiceMode ? 'blind' : disabilityFilter;
    const selectedDisability = disabilityTypes.find(d => d.id === effectiveDisabilityFilter);
    const matchDisability = effectiveDisabilityFilter === 'all' || (
      selectedDisability?.features &&
      j.accessibility_features &&
      j.accessibility_features.some(f => selectedDisability.features!.includes(f))
    );
    return matchSearch && matchCat && matchDisability;
  });

  const navigate = useNavigate();

  useEffect(() => {
    let isAborted = false;

    if (isVoiceMode && !loading && filtered.length > 0) {
      const readJobs = async () => {
        await speak(`I have found ${filtered.length} jobs for visually impaired candidates. I will read them one by one. Say the name of a job to view details, or say "next" for the next one.`);

        if (isAborted) return;

        const commands: Record<string, () => void> = {
          'next': () => {
            // Let the loop continue or skip to next
          }
        };

        // Add each job title as a command
        filtered.forEach(job => {
          commands[job.title.toLowerCase()] = () => {
            isAborted = true; // Stop the loop
            window.speechSynthesis.cancel(); // Stop talking immediately
            speak(`Opening details for ${job.title}`);
            navigate(`/jobs/${job.id}`);
          };
        });

        const annyangLib = annyang as any;
        if (annyangLib) {
          annyangLib.addCommands(commands);
        }

        for (let i = 0; i < filtered.length; i++) {
          if (isAborted) break;
          const job = filtered[i];
          await speak(`Job ${i + 1}: ${job.title} at ${job.company}.`);

          // Wait a bit between jobs for user to respond
          for (let j = 0; j < 30; j++) { // 3 seconds total
            if (isAborted) break;
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      };

      readJobs();

      return () => {
        isAborted = true;
        window.speechSynthesis.cancel();
        const annyangLib = annyang as any;
        if (annyangLib) {
          filtered.forEach(job => {
            annyangLib.removeCommands(job.title.toLowerCase());
          });
          annyangLib.removeCommands('next');
        }
      };
    } else if (isVoiceMode && !loading && filtered.length === 0) {
      speak("I couldn't find any jobs matching the visually impaired filter at the moment.");
    }
  }, [isVoiceMode, loading, filtered.length, navigate]);

  return (
    <main className="container py-8 md:py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <h1 className="font-heading text-4xl md:text-5xl font-extrabold mb-3 tracking-tight">Browse Jobs</h1>
          <p className="text-muted-foreground">Find accessible job opportunities from inclusive employers.</p>
        </div>
        {user?.role === 'employer' && (
          <PostJobDialog onJobPosted={fetchJobs} />
        )}
      </div>

      {/* Disability type filter */}
      <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
        <p className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">What type of accessibility do you need?</p>
        <div className="flex flex-wrap gap-3">
          {disabilityTypes.map(({ id, label, icon: Icon, color }) => (
            <button
              key={id}
              onClick={() => setDisabilityFilter(id)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all
                ${disabilityFilter === id
                  ? `${color} ring-2 ring-offset-2 ring-offset-background ring-primary/50 shadow-md scale-105`
                  : 'border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              aria-label={`Filter by ${label}`}
              aria-pressed={disabilityFilter === id}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Search & category filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search jobs or companies..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-12 h-14 rounded-full border-border/50 bg-card/50 backdrop-blur-sm focus-visible:ring-primary/30 transition-shadow hover:shadow-md"
            aria-label="Search jobs"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full sm:w-56 h-14 rounded-full border-border/50 bg-card/50 backdrop-blur-sm focus:ring-primary/30 transition-shadow hover:shadow-md" aria-label="Filter by category">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(c => (
              <SelectItem key={c} value={c}>{c === 'all' ? 'All Categories' : c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Jobs list */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Accessibility className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">No jobs found for this filter. Try adjusting your search.</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-4">{filtered.length} job{filtered.length !== 1 ? 's' : ''} found</p>
          <div className="grid gap-4">
            {filtered.map((job, i) => (
              <JobCard key={job.id} job={job} index={i} />
            ))}
          </div>
        </>
      )}
    </main>
  );
};

export default Jobs;
