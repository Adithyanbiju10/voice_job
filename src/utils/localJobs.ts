import { Tables } from "@/integrations/supabase/types";

const LOCAL_JOBS_KEY = 'ability_jobs_local_listings';

export const getLocalJobs = (): Tables<'jobs'>[] => {
    const stored = localStorage.getItem(LOCAL_JOBS_KEY);
    if (!stored) return [];
    try {
        return JSON.parse(stored);
    } catch (e) {
        console.error("Failed to parse local jobs", e);
        return [];
    }
};

export const saveLocalJob = (job: Omit<Tables<'jobs'>, 'id' | 'posted_at' | 'is_active'>) => {
    const localJobs = getLocalJobs();
    const newJob: Tables<'jobs'> = {
        ...job,
        id: `local-${Date.now()}`,
        posted_at: new Date().toISOString(),
        is_active: true,
        requirements: job.requirements || []
    };

    const updatedJobs = [newJob, ...localJobs];
    localStorage.setItem(LOCAL_JOBS_KEY, JSON.stringify(updatedJobs));
    return newJob;
};
