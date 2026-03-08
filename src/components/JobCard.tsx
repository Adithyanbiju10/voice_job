import { Link } from 'react-router-dom';
import { MapPin, Clock, IndianRupee, Accessibility, ArrowRight, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { Tables } from '@/integrations/supabase/types';

interface JobCardProps {
  job: Tables<'jobs'>;
  index?: number;
}

const JobCard = ({ job, index = 0 }: JobCardProps) => {
  // Check if the employer who posted this job is verified
  const isVerifiedEmployer = (() => {
    try {
      const users = JSON.parse(localStorage.getItem('ability_jobs_registered_users') || '[]');
      return users.some((u: any) => u.role === 'employer' && u.name === job.company && u.isVerified === true);
    } catch { return false; }
  })();
  return (
    <Link to={`/jobs/${job.id}`} aria-label={`View ${job.title} at ${job.company}`}>
      <Card className="group cursor-pointer relative overflow-hidden border-border/50 bg-card/60 backdrop-blur-md transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 hover:border-primary/30"
        style={{ animationDelay: `${index * 80}ms` }}
      >
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary to-accent transform scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100" />
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="text-[10px] uppercase tracking-wider bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">{job.category}</Badge>
                <Badge variant="outline" className="text-[10px] uppercase tracking-wider border-accent/30 text-accent-foreground">{job.job_type}</Badge>
                {isVerifiedEmployer && (
                  <Badge className="text-[10px] tracking-wider bg-success/15 text-success border-success/30 border gap-1">
                    <CheckCircle className="h-2.5 w-2.5" /> Verified
                  </Badge>
                )}
              </div>
              <h3 className="font-heading text-xl font-bold text-foreground group-hover:text-primary transition-colors truncate">
                {job.title}
              </h3>
              <p className="text-sm font-medium text-muted-foreground mt-1">{job.company}</p>
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-primary/70" />{job.location}</span>
                {job.salary_range && <span className="flex items-center gap-1"><IndianRupee className="h-3 w-3 text-success/70" />{job.salary_range}</span>}
                <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-accent/70" />{new Date(job.posted_at).toLocaleDateString()}</span>
              </div>
              {job.accessibility_features && job.accessibility_features.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {job.accessibility_features.slice(0, 3).map((f) => (
                    <span key={f} className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
                      <Accessibility className="h-3 w-3" />{f}
                    </span>
                  ))}
                  {job.accessibility_features.length > 3 && (
                    <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                      +{job.accessibility_features.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="hidden sm:flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors flex-shrink-0">
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default JobCard;
