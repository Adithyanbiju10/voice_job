import { Tables } from '@/integrations/supabase/types';

export const MOCK_JOBS: Tables<'jobs'>[] = [
    {
        id: 'mock-job-1',
        title: 'Senior Accessibility Consultant',
        company: 'Visionary Access',
        location: 'Remote',
        job_type: 'Full-time',
        salary_range: '$95,000 - $140,000',
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
        salary_range: '$50 - $80/hr',
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
        location: 'Chicago, IL',
        job_type: 'Full-time',
        salary_range: '$75,000 - $105,000',
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
        location: 'Austin, TX',
        job_type: 'Full-time',
        salary_range: '$45,000 - $55,000',
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
        salary_range: '$60,000 - $80,000',
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
    },
    {
        id: 'mock-job-6',
        title: 'Inside Sales Representative',
        company: 'Global Outreach',
        location: 'Remote',
        job_type: 'Full-time',
        salary_range: '$45,000 + Commission',
        description: 'Connect with clients worldwide from the comfort of your home. We provide specialized ergonomic equipment and voice-dialing software for all sales staff.',
        requirements: [
            'Proven sales experience',
            'Strong phone presence',
            'Goal-oriented mindset'
        ],
        accessibility_features: ['Remote work', 'Ergonomic setup', 'Voice dictation', 'Flexible hours'],
        category: 'Sales',
        posted_at: new Date('2026-02-27').toISOString(),
        is_active: true
    },
    {
        id: 'mock-job-7',
        title: 'Senior Frontend Developer',
        company: 'AccessWeb Systems',
        location: 'San Francisco, CA',
        job_type: 'Full-time',
        salary_range: '$130,000 - $160,000',
        description: 'Lead the development of accessible web interfaces. Our dev stack is optimized for screen reader usage, and we provide Braille displays upon request.',
        requirements: [
            'Expertise in React and Next.js',
            'Strong knowledge of ARIA and accessibility standards',
            'Experience with Git and CLI tools'
        ],
        accessibility_features: ['Screen reader compatible', 'Screen reader IDE support', 'Voice coding tools', 'Braille display support'],
        category: 'Technology',
        posted_at: new Date('2026-02-25').toISOString(),
        is_active: true
    },
    {
        id: 'mock-job-8',
        title: 'Financial Planning Assistant',
        company: 'Steady Path Finance',
        location: 'Remote',
        job_type: 'Part-time',
        salary_range: '$30 - $45/hr',
        description: 'Support our planners with data organization and reporting. We offer a low-stress environment with flexible deadlines and clear, written instructions for all tasks.',
        requirements: [
            'Basic understanding of financial concepts',
            'High attention to detail',
            'Proficiency in Excel'
        ],
        accessibility_features: ['Flexible deadlines', 'Mental health days', 'Flexible hours', 'Remote work'],
        category: 'Finance',
        posted_at: new Date('2026-02-26').toISOString(),
        is_active: true
    },
    {
        id: 'mock-job-9',
        title: 'Employee Relations Manager',
        company: 'Inclusive Culture Partners',
        location: 'Hybrid (New York, NY)',
        job_type: 'Full-time',
        salary_range: '$90,000 - $115,000',
        description: 'Manage internal communications and employee wellbeing. We provide ASL interpreters for all major meetings and text-to-speech tools for office use.',
        requirements: [
            '5+ years in HR or Employee Relations',
            'Strong conflict resolution skills',
            'Commitment to diversity and inclusion'
        ],
        accessibility_features: ['Hybrid work', 'ASL Interpreters provided', 'Adaptive tools provided', 'Text-to-speech software'],
        category: 'Human Resources',
        posted_at: new Date('2026-02-24').toISOString(),
        is_active: true
    },
    {
        id: 'mock-job-10',
        title: 'Technical Copywriter',
        company: 'Drafting Tech',
        location: 'Remote',
        job_type: 'Full-time',
        salary_range: '$70,000 - $90,000',
        description: 'Translate complex technical concepts into clear documentation. Communication is 100% text-based (Slack/Email), making this a perfect role for speech-impaired professionals.',
        requirements: [
            'Ability to understand complex software systems',
            'Excellent writing and editing skills',
            'Experience with Markdown and GitHub'
        ],
        accessibility_features: ['Remote work', 'Voice-to-text', 'Flexible hours', 'Text-based communication'],
        category: 'Content',
        posted_at: new Date('2026-02-27').toISOString(),
        is_active: true
    },
    {
        id: 'mock-job-11',
        title: 'Junior UI Designer',
        company: 'Vibrant Pixels',
        location: 'Remote',
        job_type: 'Full-time',
        salary_range: '$55,000 - $75,000',
        description: 'Create engaging user interfaces for mobile apps. We use specialized design software with high-contrast modes and support for alternative input devices.',
        requirements: [
            'Strong visual design skills',
            'Proficiency in Figma or Sketch',
            'Understanding of color theory'
        ],
        accessibility_features: ['Adaptive input devices', 'Adjustable workspace', 'Flexible schedule', 'Remote work'],
        category: 'Design',
        posted_at: new Date('2026-02-26').toISOString(),
        is_active: true
    },
    {
        id: 'mock-job-12',
        title: 'Legal Research Assistant',
        company: 'Advocacy Law Firm',
        location: 'Chicago, IL',
        job_type: 'Part-time',
        salary_range: '$25 - $35/hr',
        description: 'Assist with legal research in our fully ADA-compliant office. We offer quiet study zones and ergonomic workstations designed for maximum comfort.',
        requirements: [
            'Current law student or paralegal certificate',
            'Strong research skills',
            'Professional writing ability'
        ],
        accessibility_features: ['Accessible office', 'Standing desk', 'Ergonomic setup', 'Quiet workspace'],
        category: 'Administrative',
        posted_at: new Date('2026-02-25').toISOString(),
        is_active: true
    },
    {
        id: 'mock-job-13',
        title: 'Project Coordinator',
        company: 'Clear Vision Projects',
        location: 'Remote',
        job_type: 'Full-time',
        salary_range: '$65,000 - $85,000',
        description: 'Coordinate project timelines and deliverables. We prioritize neurodiversity and offer clear milestones, minimal meeting days, and flexible working blocks.',
        requirements: [
            'Strong organizational skills',
            'Experience with project management software',
            'Ability to work independently'
        ],
        accessibility_features: ['Flexible deadlines', 'Mental health days', 'Remote work', 'Flexible hours'],
        category: 'Technology',
        posted_at: new Date('2026-02-27').toISOString(),
        is_active: true
    },
    {
        id: 'mock-job-14',
        title: 'Customer Success Manager',
        company: 'Supportive SaaS',
        location: 'Remote',
        job_type: 'Full-time',
        salary_range: '$75,000 - $100,000',
        description: 'Ensure our customers get the most out of our platform. We provide comprehensive captioning for all video calls and support for screen readers throughout our toolset.',
        requirements: [
            'Experience in SaaS customer success',
            'Empathy and problem-solving skills',
            'Excellent communication'
        ],
        accessibility_features: ['Remote work', 'Screen reader compatible', 'Captions provided', 'Flexible schedule'],
        category: 'Customer Service',
        posted_at: new Date('2026-02-26').toISOString(),
        is_active: true
    },
    {
        id: 'mock-job-15',
        title: 'Lead Operations Analyst',
        company: 'Inclusion Hub',
        location: 'Remote',
        job_type: 'Full-time',
        salary_range: '$110,000 - $140,000',
        description: 'Optimize internal operations for an accessibility-first company. We support all forms of assistive technology and encourage a results-oriented work culture.',
        requirements: [
            'Strong analytical and data skills',
            'Experience in ops or management consulting',
            'Passion for accessible technology'
        ],
        accessibility_features: ['Remote work', 'Flexible hours', 'Adaptive tools provided', 'Voice dictation'],
        category: 'Administrative',
        posted_at: new Date('2026-02-27').toISOString(),
        is_active: true
    }
];
