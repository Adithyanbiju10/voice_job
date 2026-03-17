import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
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
  const { isVoiceMode, speak, listen, isAwake } = useVoice();
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

  const filtered = useMemo(() => jobs.filter(j => {
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
  }), [jobs, search, category, isVoiceMode, disabilityFilter]);

  const activeFilterId = isVoiceMode ? 'blind' : disabilityFilter;

  const navigate = useNavigate();

  // Holds jobs waiting for disambiguation (user said a title matched by multiple companies)
  const [pendingMatches, setPendingMatches] = useState<typeof filtered>([]);
  const [activeJobIndex, setActiveJobIndex] = useState(-1);

  useEffect(() => {
    setActiveJobIndex(-1);
  }, [search, category, disabilityFilter]);

  const hasAnnouncedRef = useRef(false);

  useEffect(() => {
    let isAborted = false;

    const handleCommand = (e: any) => {
      if (e.detail === 'stop') {
        isAborted = true;
        window.speechSynthesis.cancel();
      }
    };

    const handleSearch = (e: any) => {
      setSearch(e.detail);
    };

    // Smart voice input handler — handles both title selection and disambiguation
    const handleVoiceInput = async (e: any) => {
      const text = e.detail.toLowerCase().trim();

      // ── DISAMBIGUATION MODE: user is picking from a numbered list ──
      // Check if there are pending matches waiting for a choice
      const currentPending = (window as any).__pendingVoiceMatches as typeof filtered | undefined;
      if (currentPending && currentPending.length > 0) {
        // Try to match by number ("one", "1", "two", "2", etc.)
        const numberWords: Record<string, number> = {
          'one': 1, 'first': 1, '1': 1,
          'two': 2, 'second': 2, '2': 2,
          'three': 3, 'third': 3, '3': 3,
          'four': 4, 'fourth': 4, '4': 4,
          'five': 5, 'fifth': 5, '5': 5,
          'six': 6, '6': 6, 'seven': 7, '7': 7,
          'eight': 8, '8': 8, 'nine': 9, '9': 9, 'ten': 10, '10': 10,
        };

        let chosenJob: (typeof filtered)[0] | undefined;

        // Match by spoken number
        for (const [word, num] of Object.entries(numberWords)) {
          if (text.includes(word)) {
            const idx = num - 1;
            if (idx >= 0 && idx < currentPending.length) {
              chosenJob = currentPending[idx];
              break;
            }
          }
        }

        // Match by company name if no number found
        if (!chosenJob) {
          chosenJob = currentPending.find(j =>
            text.includes(j.company.toLowerCase()) ||
            j.company.toLowerCase().includes(text)
          );
        }

        if (chosenJob) {
          (window as any).__pendingVoiceMatches = null;
          speak(`Opening ${chosenJob.title}`).then(() => navigate(`/jobs/${chosenJob.id}`));
          return;
        } else {
          speak('Sorry, I did not catch that. Please say a number or the company name to choose a job.');
          return;
        }
      }

      // ── NORMAL MODE: user says a job title ──
      const matches = filtered.filter(j =>
        text.includes(j.title.toLowerCase()) ||
        j.title.toLowerCase().split(' ').some(word => word.length > 3 && text.includes(word))
      );

      if (matches.length === 0) return; // Not a job title — let universal command handler deal with it

      // ── PRIORITY CHECK: title + company name spoken together → open directly ──
      // e.g. "Software Engineer at TechCorp" or "TechCorp Software Engineer"
      const exactMatch = matches.find(j =>
        text.includes(j.company.toLowerCase()) ||
        j.company.toLowerCase().split(' ').some(word => word.length > 2 && text.includes(word))
      );

      if (exactMatch) {
        // User named both the title and the company — open it without asking
        isAborted = true;
        speak(`Opening ${exactMatch.title} at ${exactMatch.company}`).then(() => navigate(`/jobs/${exactMatch.id}`));
        return;
      }

      if (matches.length === 1) {
        // Only one match — open it immediately
        isAborted = true;
        speak(`Opening ${matches[0].title}`).then(() => navigate(`/jobs/${matches[0].id}`));
      } else {
        // Multiple companies share this title — announce and ask user to choose
        isAborted = true;
        window.speechSynthesis.cancel();
        (window as any).__pendingVoiceMatches = matches;

        let announcement = `I found ${matches.length} jobs with that title from different companies. `;
        matches.forEach((job, idx) => {
          announcement += `Option ${idx + 1}: ${job.title} at ${job.company}. `;
        });
        announcement += 'Please say a number or the company name to open the one you want.';

        speak(announcement);
      }
    };

    const handleFilterCommand = (e: any) => {
      const text = e.detail.toLowerCase();
      const found = disabilityTypes.find(d =>
        text.includes(d.label.toLowerCase()) ||
        (d.id !== 'all' && text.includes(d.id))
      );
      if (found) {
        setDisabilityFilter(found.id);
        speak(`Filtering for ${found.label} accessibility.`);
      }
    };

    const handleNavigation = (e: any) => {
      const direction = e.detail;
      if (direction === 'next') {
        setActiveJobIndex(prev => {
          const nextIdx = prev + 1;
          if (nextIdx < filtered.length) {
            return nextIdx;
          }
          speak("You have reached the end of the list.");
          return prev;
        });
      } else if (direction === 'back') {
        setActiveJobIndex(prev => {
          const backIdx = prev - 1;
          if (backIdx >= 0) {
            return backIdx;
          }
          speak("You are at the beginning of the list.");
          return prev;
        });
      } else if (direction === 'select') {
        if (activeJobIndex >= 0 && activeJobIndex < filtered.length) {
          const job = filtered[activeJobIndex];
          speak("Job selected. Redirecting...").then(() => navigate(`/jobs/${job.id}`));
        } else {
          speak("Please select a job first by saying next or back.");
        }
      }
    };

    if (isVoiceMode && isAwake && !loading) {
      // Clear any leftover pending matches when the page re-activates
      (window as any).__pendingVoiceMatches = null;

      window.addEventListener('voice-command', handleCommand);
      window.addEventListener('voice-search', handleSearch);
      window.addEventListener('voice-input', handleVoiceInput);
      window.addEventListener('voice-navigation', handleNavigation);
      window.addEventListener('voice-input', handleFilterCommand);

      if (filtered.length > 0 && activeJobIndex === -1 && !hasAnnouncedRef.current) {
        hasAnnouncedRef.current = true;
        setTimeout(() => {
          const intro = isVoiceMode
            ? `Navigating to browse jobs. All the jobs listed here are for visually impaired users. You have ${filtered.length} matches. `
            : `Navigating to browse jobs. You have ${filtered.length} number of jobs. `;
          speak(`${intro}Say "next" to start browsing.`);
        }, 1000);
      }
    }

    return () => {
      isAborted = true;
      (window as any).__pendingVoiceMatches = null;
      window.removeEventListener('voice-command', handleCommand);
      window.removeEventListener('voice-search', handleSearch);
      window.removeEventListener('voice-input', handleVoiceInput);
      window.removeEventListener('voice-navigation', handleNavigation);
    };
  }, [isVoiceMode, isAwake, loading, filtered, activeJobIndex, navigate, speak]);

  useEffect(() => {
    if (isVoiceMode && isAwake && activeJobIndex >= 0 && activeJobIndex < filtered.length) {
      const job = filtered[activeJobIndex];
      speak(`${job.title} at ${job.company}. Please say select to open the job.`);
    }
  }, [activeJobIndex, isVoiceMode, isAwake, filtered, speak]);


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
                ${activeFilterId === id
                  ? `${color} ring-2 ring-offset-2 ring-offset-background ring-primary/50 shadow-md scale-105`
                  : 'border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              aria-label={`Filter by ${label}`}
              aria-pressed={activeFilterId === id}
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
              <JobCard key={job.id} job={job} index={i} isActive={activeJobIndex === i} />
            ))}
          </div>
        </>
      )}
    </main>
  );
};

export default Jobs;
