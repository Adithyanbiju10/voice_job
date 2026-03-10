import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useVoice } from '@/contexts/VoiceContext';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Briefcase } from 'lucide-react';
import { getLocalJobs } from '@/utils/localJobs';
import { supabase } from '@/integrations/supabase/client';

/**
 * LoginNotifier — runs silently in the background.
 *
 * On every seeker login it:
 *  1. Checks application status changes → toast + voice
 *  2. Checks for NEW jobs posted since last visit → toast + voice
 *
 * For BLIND seekers (disability === 'blind') voice fires automatically
 * even if voice mode is not manually enabled.
 */

const SEEN_KEY = 'ability_jobs_seen_statuses';   // { email: { appId: status } }
const LAST_VISIT_KEY = 'ability_jobs_last_visit';     // { email: ISOString }

const LoginNotifier = () => {
    const { user } = useAuth();
    const { isVoiceMode, speak } = useVoice();
    const prevEmailRef = useRef<string | null>(null);

    useEffect(() => {
        if (!user || user.role !== 'seeker') {
            prevEmailRef.current = user?.email ?? null;
            return;
        }

        const isJustLoggedIn = prevEmailRef.current !== user.email;
        prevEmailRef.current = user.email;
        if (!isJustLoggedIn) return;

        const isBlind = user.disability === 'blind';
        const shouldSpeak = isVoiceMode;

        // Capture last visit time BEFORE updating it
        const visits: Record<string, string> = JSON.parse(localStorage.getItem(LAST_VISIT_KEY) || '{}');
        const lastVisitISO = visits[user.email] || null;

        // Record current visit time immediately
        visits[user.email] = new Date().toISOString();
        localStorage.setItem(LAST_VISIT_KEY, JSON.stringify(visits));

        // Give the "Navigated to Home page" announcement time to finish (approx 3.5s)
        const timer = setTimeout(async () => {
            // Run checks sequentially to prevent voice overlap
            await checkApplicationUpdates({ userName: user.name, userEmail: user.email, shouldSpeak, isBlind, speak });
            await checkNewJobs({ userName: user.name, userEmail: user.email, lastVisitISO, shouldSpeak, isBlind, speak });
        }, 4000);

        return () => clearTimeout(timer);
    }, [user, isVoiceMode, speak]);

    return null;
};

// ─── Application status changes ──────────────────────────────────────────────

interface AppNotifyOptions {
    userName: string;
    userEmail: string;
    shouldSpeak: boolean;
    isBlind: boolean;
    speak: (text: string) => Promise<void> | void;
}

async function checkApplicationUpdates({ userName, userEmail, shouldSpeak, isBlind, speak }: AppNotifyOptions) {
    const allApps: any[] = JSON.parse(localStorage.getItem('user_applications') || '[]');
    const myApps = allApps.filter(a => a.applicantEmail === userEmail);

    const allSeen: Record<string, Record<string, string>> = JSON.parse(localStorage.getItem(SEEN_KEY) || '{}');
    const seenForUser: Record<string, string> = allSeen[userEmail] || {};
    const newSeen: Record<string, string> = { ...seenForUser };

    const notifications: Array<{ app: any; isAccepted: boolean }> = [];
    let pendingCount = 0;

    for (const app of myApps) {
        if (app.status === 'Pending') pendingCount++;
        if (seenForUser[app.id] !== app.status) {
            if (app.status === 'Accepted' || app.status === 'Rejected') {
                notifications.push({ app, isAccepted: app.status === 'Accepted' });
            }
        }
        newSeen[app.id] = app.status;
    }

    allSeen[userEmail] = newSeen;
    localStorage.setItem(SEEN_KEY, JSON.stringify(allSeen));

    // Visual toasts
    notifications.forEach(({ app, isAccepted }, index) => {
        setTimeout(() => {
            isAccepted
                ? toast.success('Application Accepted! 🎉', {
                    description: `Your application for "${app.jobTitle}" has been accepted by ${app.employerName}.`,
                    duration: 9000,
                    icon: <CheckCircle className="h-5 w-5 text-success" />,
                })
                : toast.error('Application Update', {
                    description: `Your application for "${app.jobTitle}" at ${app.employerName} was not selected this time.`,
                    duration: 9000,
                    icon: <XCircle className="h-5 w-5 text-destructive" />,
                });
        }, index * 700);
    });

    if (!shouldSpeak) return;

    const toastDelay = notifications.length * 700 + 800;
    await pause(toastDelay);

    const firstName = userName.split(' ')[0];

    if (notifications.length === 0) {
        if (isBlind) {
            if (myApps.length === 0) {
                await speakLine(speak, `You have no applications yet. Browse jobs and apply to get started.`);
            } else if (pendingCount > 0) {
                await speakLine(speak, `You have ${pendingCount} application${pendingCount > 1 ? 's' : ''} pending review. No new updates since your last visit.`);
            } else {
                await speakLine(speak, `All your applications have been reviewed. No new updates.`);
            }
        }
        return;
    }

    await speakLine(speak, `Here are your updates, ${firstName}. You have ${notifications.length} new application update${notifications.length > 1 ? 's' : ''}.`);
    await pause(500);

    for (let i = 0; i < notifications.length; i++) {
        const { app, isAccepted } = notifications[i];
        await pause(400);
        isAccepted
            ? await speakLine(speak, `Update ${i + 1}: Congratulations! Your application for ${app.jobTitle} at ${app.employerName} has been accepted. You can view the details in your profile under the Applications tab.`)
            : await speakLine(speak, `Update ${i + 1}: Your application for ${app.jobTitle} at ${app.employerName} was not selected this time. Don't be discouraged — keep exploring other opportunities.`);
        await pause(700);
    }

    if (pendingCount > 0) {
        await speakLine(speak, `You still have ${pendingCount} application${pendingCount > 1 ? 's' : ''} pending. Say "applications" on your profile page to hear their full details.`);
    }
}

// ─── New job notifications ────────────────────────────────────────────────────

interface JobNotifyOptions {
    userName: string;
    userEmail: string;
    lastVisitISO: string | null;
    shouldSpeak: boolean;
    isBlind: boolean;
    speak: (text: string) => Promise<void> | void;
}

async function checkNewJobs({ userName, userEmail, lastVisitISO, shouldSpeak, isBlind, speak }: JobNotifyOptions) {
    if (!lastVisitISO) return; // First-ever login — no baseline to compare against

    const lastVisit = new Date(lastVisitISO);

    // Collect jobs from local storage
    const localJobs = getLocalJobs();
    let newJobs = localJobs.filter(j => new Date(j.posted_at) > lastVisit);

    // Also try Supabase
    try {
        const { data } = await supabase
            .from('jobs')
            .select('*')
            .eq('is_active', true)
            .gt('posted_at', lastVisitISO)
            .order('posted_at', { ascending: false });
        if (data && data.length > 0) {
            // Merge, avoid duplicates by id
            const existingIds = new Set(newJobs.map(j => j.id));
            const supabaseNew = data.filter(j => !existingIds.has(j.id));
            newJobs = [...newJobs, ...supabaseNew];
        }
    } catch {
        // Supabase unavailable — use local only
    }

    // ── Visual toasts — same style as application accept/reject toasts ────────
    // Offset so they appear AFTER application toasts finish
    const baseDelay = 1800;
    const toShow = newJobs.slice(0, 5);   // Cap at 5 to avoid overwhelming

    toShow.forEach((job, index) => {
        setTimeout(() => {
            toast(`New Job Available`, {
                description: `${job.title} at ${job.company} — ${job.location} · ${job.job_type}`,
                duration: 9000,
                icon: <Briefcase className="h-5 w-5 text-primary" />,
            });
        }, baseDelay + index * 700);
    });

    if (!shouldSpeak) return;

    // ── Voice announcements — sequential ─────
    await pause(1000); // small buffer before starting job announcements

    const count = newJobs.length;

    if (count === 0) {
        // Always confirm to blind users that the check ran (no new jobs)
        if (isBlind) {
            await speakLine(speak, `No new jobs since your last visit. Check the Jobs page anytime to browse all available listings.`);
        }
        return;
    }

    // Announce the count first
    await speakLine(speak,
        count === 1
            ? `There is 1 new job posted since your last visit.`
            : `There are ${count} new jobs posted since your last visit.`
    );
    await pause(500);

    // Read each job one-by-one with title and company only
    for (let i = 0; i < toShow.length; i++) {
        const job = toShow[i];
        await pause(400);
        await speakLine(speak, `Job ${i + 1}: ${job.title} at ${job.company}.`);
        await pause(700);
    }

    // Closing guidance
    if (count > 5) {
        await speakLine(speak, `And ${count - 5} more new listing${count - 5 > 1 ? 's' : ''}. Go to the Jobs page to explore all of them.`);
    } else {
        await speakLine(speak, `Say "browse jobs" to visit the Jobs page and apply.`);
    }
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function speakLine(speak: (text: string) => Promise<void> | void, text: string): Promise<void> {
    return Promise.resolve(speak(text));
}

function pause(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export default LoginNotifier;
