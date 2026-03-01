import { Tables } from '@/integrations/supabase/types';

export const MOCK_JOBS: Tables<'jobs'>[] = [
    {
        id: 'mock-job-1',
        title: 'Senior Accessibility Consultant',
        company: 'Visionary Access',
        location: 'Remote',
        job_type: 'Full-time',
        salary_range: '₹95,000 - ₹1,40,000',
        description: 'Help global brands build more inclusive digital products. We provide state-of-the-art screen reader technology and voice-controlled workstations for all employees.',
        requirements: [
            'Deep understanding of WCAG 2.1 guidelines',
            'Experience with screen reader testing',
            'Strong advocacy for inclusive design'
        ],
        accessibility_features: ['Screen reader compatible', 'Voice coding tools', 'Remote work', 'Screen reader IDE support'],
        category: 'Consulting',
        posted_at: new Date('2026-02-25').toISOString(),
        is_active: true
    },
    {
        id: 'mock-job-2',
        title: 'Remote UX Researcher',
        company: 'Silent Design Lab',
        location: 'Remote',
        job_type: 'Part-time',
        salary_range: '₹500 - ₹800/hr',
        description: 'Conduct user research studies with a focus on hearing-impaired users. Communication is primarily text-based, and we use real-time captioning for all meetings.',
        requirements: [
            'Experience in qualitative user research',
            'Familiarity with Figma and research tools',
            'Excellent written communication'
        ],
        accessibility_features: ['Remote work', 'Flexible hours', 'Hybrid work', 'Adaptive tools provided'],
        category: 'Design',
        posted_at: new Date('2026-02-26').toISOString(),
        is_active: true
    },
    {
        id: 'mock-job-3',
        title: 'Data Analyst',
        company: 'Focus Analytics',
        location: 'Bengaluru, KA',
        job_type: 'Full-time',
        salary_range: '₹8,00,000 - ₹12,00,000',
        description: 'Analyze complex datasets in a low-distraction, neurodiverse-friendly environment. We offer adjustable lighting, noise-canceling headphones, and flexible deadlines.',
        requirements: [
            'Proficiency in SQL and Python',
            'Ability to communicate data insights clearly',
            'Detail-oriented mindset'
        ],
        accessibility_features: ['Flexible deadlines', 'Mental health days', 'Adjustable workspace', 'Flexible hours'],
        category: 'Technology',
        posted_at: new Date('2026-02-24').toISOString(),
        is_active: true
    },
    {
        id: 'mock-job-4',
        title: 'Administrative Assistant',
        company: 'Inclusive Legal Group',
        location: 'Mumbai, MH',
        job_type: 'Full-time',
        salary_range: '₹35,000 - ₹50,000',
        description: 'Provide administrative support in a fully accessible office. We have automatic doors, adjustable-height desks, and service-animal friendly policies.',
        requirements: [
            'Strong organizational skills',
            'Proficiency in office software',
            'Client relations experience'
        ],
        accessibility_features: ['Accessible office', 'Standing desk', 'Service animals welcome', 'Ergonomic setup'],
        category: 'Administrative',
        posted_at: new Date('2026-02-27').toISOString(),
        is_active: true
    },
    {
        id: 'mock-job-5',
        title: 'Creative Content Strategist',
        company: 'VoiceFirst Marketing',
        location: 'Remote',
        job_type: 'Contract',
        salary_range: '₹60,000 - ₹90,000',
        description: 'Develop content strategies for brands in the voice technology space. We fully support voice-to-text input and alternative typing methods.',
        requirements: [
            '3+ years in content strategy',
            'Portfolio of published work',
            'Experience with SEO and analytics'
        ],
        accessibility_features: ['Voice-to-text', 'Voice dictation', 'Remote work', 'Flexible schedule'],
        category: 'Marketing',
        posted_at: new Date('2026-02-26').toISOString(),
        is_active: true
    }
];
