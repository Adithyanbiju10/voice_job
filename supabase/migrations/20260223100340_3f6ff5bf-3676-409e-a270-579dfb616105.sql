
-- Jobs table
CREATE TABLE public.jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT NOT NULL,
  job_type TEXT NOT NULL DEFAULT 'Full-time',
  salary_range TEXT,
  description TEXT NOT NULL,
  requirements TEXT[],
  accessibility_features TEXT[],
  category TEXT NOT NULL DEFAULT 'General',
  posted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Applications table
CREATE TABLE public.applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  applicant_name TEXT NOT NULL,
  applicant_email TEXT NOT NULL,
  resume_url TEXT,
  cover_letter TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Jobs are publicly readable
CREATE POLICY "Jobs are publicly readable" ON public.jobs FOR SELECT USING (true);

-- Applications are publicly insertable (no auth required for v1)
CREATE POLICY "Anyone can apply" ON public.applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Applications readable by email" ON public.applications FOR SELECT USING (true);

-- Create storage bucket for resumes
INSERT INTO storage.buckets (id, name, public) VALUES ('resumes', 'resumes', true);

CREATE POLICY "Anyone can upload resumes" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'resumes');
CREATE POLICY "Resumes are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'resumes');

-- Insert dummy jobs
INSERT INTO public.jobs (title, company, location, job_type, salary_range, description, requirements, accessibility_features, category) VALUES
('Customer Support Specialist', 'AccessTech Inc.', 'Remote', 'Full-time', '$35,000 - $45,000', 'Join our inclusive customer support team helping users navigate our accessible technology products. We provide full screen reader compatibility and adaptive tools.', ARRAY['Excellent communication skills', 'Patience and empathy', 'Basic computer knowledge'], ARRAY['Screen reader compatible', 'Flexible hours', 'Remote work'], 'Customer Service'),
('Data Entry Clerk', 'IncluWork Solutions', 'New York, NY', 'Part-time', '$18 - $22/hr', 'Accurate data entry position with adaptive keyboard support and voice-to-text options available. Quiet workspace with adjustable lighting.', ARRAY['Attention to detail', 'Typing proficiency', 'Basic Excel knowledge'], ARRAY['Adaptive keyboards', 'Voice-to-text', 'Adjustable workspace'], 'Administrative'),
('Software Developer', 'EqualCode Labs', 'San Francisco, CA', 'Full-time', '$80,000 - $120,000', 'Build accessible web applications that make a difference. Our development environment is fully accessible with screen readers and voice coding support.', ARRAY['JavaScript/TypeScript', 'React or Vue.js', 'Understanding of WCAG guidelines'], ARRAY['Screen reader IDE support', 'Voice coding tools', 'Flexible schedule'], 'Technology'),
('Graphic Designer', 'Creative Access Studio', 'Remote', 'Contract', '$40 - $60/hr', 'Create beautiful, accessible designs for our diverse client base. We use adaptive design tools and provide any accommodations needed.', ARRAY['Adobe Creative Suite', 'UI/UX design experience', 'Portfolio required'], ARRAY['Adaptive input devices', 'Flexible deadlines', 'Remote work'], 'Design'),
('Content Writer', 'VoiceFirst Media', 'Chicago, IL', 'Full-time', '$45,000 - $55,000', 'Write compelling content for our accessible media platform. Voice dictation and alternative input methods fully supported.', ARRAY['Strong writing skills', 'SEO knowledge', 'Research ability'], ARRAY['Voice dictation', 'Ergonomic setup', 'Hybrid work'], 'Content'),
('HR Coordinator', 'Diverse Talent Co.', 'Austin, TX', 'Full-time', '$42,000 - $52,000', 'Help build diverse and inclusive teams. Coordinate hiring processes with accessibility at the forefront.', ARRAY['HR experience', 'Strong organizational skills', 'Knowledge of ADA compliance'], ARRAY['Accessible office', 'Standing desk', 'Service animals welcome'], 'Human Resources'),
('Accounting Assistant', 'NumbersForAll LLC', 'Remote', 'Full-time', '$38,000 - $48,000', 'Assist with bookkeeping and accounting tasks using accessible financial software with screen reader support.', ARRAY['Basic accounting knowledge', 'QuickBooks experience', 'Attention to detail'], ARRAY['Screen reader compatible software', 'Remote work', 'Flexible hours'], 'Finance'),
('Social Media Manager', 'InclusiveVoice Agency', 'Los Angeles, CA', 'Full-time', '$50,000 - $65,000', 'Manage social media presence for brands committed to accessibility and inclusion. Create content that resonates with diverse audiences.', ARRAY['Social media expertise', 'Content creation', 'Analytics skills'], ARRAY['Adaptive tools provided', 'Hybrid work', 'Mental health days'], 'Marketing'),
('Senior Accessibility Consultant', 'Visionary Access', 'Remote', 'Full-time', '$95,000 - $140,000', 'Help global brands build more inclusive digital products. We provide state-of-the-art screen reader technology and voice-controlled workstations for all employees.', ARRAY['Deep understanding of WCAG 2.1 guidelines', 'Experience with screen reader testing', 'Strong advocacy for inclusive design'], ARRAY['Screen reader compatible', 'Voice coding tools', 'Remote work', 'Screen reader IDE support'], 'Consulting'),
('Remote UX Researcher', 'Silent Design Lab', 'Remote', 'Part-time', '$50 - $80/hr', 'Conduct user research studies with a focus on hearing-impaired users. Communication is primarily text-based, and we use real-time captioning for all meetings.', ARRAY['Experience in qualitative user research', 'Familiarity with Figma and research tools', 'Excellent written communication'], ARRAY['Remote work', 'Flexible hours', 'Hybrid work', 'Adaptive tools provided'], 'Design'),
('Data Analyst', 'Focus Analytics', 'Chicago, IL', 'Full-time', '$75,000 - $105,000', 'Analyze complex datasets in a low-distraction, neurodiverse-friendly environment. We offer adjustable lighting, noise-canceling headphones, and flexible deadlines.', ARRAY['Proficiency in SQL and Python', 'Ability to communicate data insights clearly', 'Detail-oriented mindset'], ARRAY['Flexible deadlines', 'Mental health days', 'Adjustable workspace', 'Flexible hours'], 'Technology'),
('Administrative Assistant', 'Inclusive Legal Group', 'Austin, TX', 'Full-time', '$45,000 - $55,000', 'Provide administrative support in a fully accessible office. We have automatic doors, adjustable-height desks, and service-animal friendly policies.', ARRAY['Strong organizational skills', 'Proficiency in office software', 'Client relations experience'], ARRAY['Accessible office', 'Standing desk', 'Service animals welcome', 'Ergonomic setup'], 'Administrative'),
('Creative Content Strategist', 'VoiceFirst Marketing', 'Remote', 'Contract', '$60,000 - $80', 'Develop content strategies for brands in the voice technology space. We fully support voice-to-text input and alternative typing methods.', ARRAY['3+ years in content strategy', 'Portfolio of published work', 'Experience with SEO and analytics'], ARRAY['Voice-to-text', 'Voice dictation', 'Remote work', 'Flexible schedule'], 'Marketing'),
('Inside Sales Representative', 'Global Outreach', 'Remote', 'Full-time', '$45,000 + Commission', 'Connect with clients worldwide from the comfort of your home. We provide specialized ergonomic equipment and voice-dialing software for all sales staff.', ARRAY['Proven sales experience', 'Strong phone presence', 'Goal-oriented mindset'], ARRAY['Remote work', 'Ergonomic setup', 'Voice dictation', 'Flexible hours'], 'Sales'),
('Senior Frontend Developer', 'AccessWeb Systems', 'San Francisco, CA', 'Full-time', '$130,000 - $160,000', 'Lead the development of accessible web interfaces. Our dev stack is optimized for screen reader usage, and we provide Braille displays upon request.', ARRAY['Expertise in React and Next.js', 'Strong knowledge of ARIA and accessibility standards', 'Experience with Git and CLI tools'], ARRAY['Screen reader compatible', 'Screen reader IDE support', 'Voice coding tools', 'Braille display support'], 'Technology'),
('Financial Planning Assistant', 'Steady Path Finance', 'Remote', 'Part-time', '$30 - $45/hr', 'Support our planners with data organization and reporting. We offer a low-stress environment with flexible deadlines and clear, written instructions for all tasks.', ARRAY['Basic understanding of financial concepts', 'High attention to detail', 'Proficiency in Excel'], ARRAY['Flexible deadlines', 'Mental health days', 'Flexible hours', 'Remote work'], 'Finance'),
('Employee Relations Manager', 'Inclusive Culture Partners', 'Hybrid (New York, NY)', 'Full-time', '$90,000 - $115,000', 'Manage internal communications and employee wellbeing. We provide ASL interpreters for all major meetings and text-to-speech tools for office use.', ARRAY['5+ years in HR or Employee Relations', 'Strong conflict resolution skills', 'Commitment to diversity and inclusion'], ARRAY['Hybrid work', 'ASL Interpreters provided', 'Adaptive tools provided', 'Text-to-speech software'], 'Human Resources'),
('Technical Copywriter', 'Drafting Tech', 'Remote', 'Full-time', '$70,000 - $90,000', 'Translate complex technical concepts into clear documentation. Communication is 100% text-based (Slack/Email), making this a perfect role for speech-impaired professionals.', ARRAY['Ability to understand complex software systems', 'Excellent writing and editing skills', 'Experience with Markdown and GitHub'], ARRAY['Remote work', 'Voice-to-text', 'Flexible hours', 'Text-based communication'], 'Content'),
('Junior UI Designer', 'Vibrant Pixels', 'Remote', 'Full-time', '$55,000 - $75,000', 'Create engaging user interfaces for mobile apps. We use specialized design software with high-contrast modes and support for alternative input devices.', ARRAY['Strong visual design skills', 'Proficiency in Figma or Sketch', 'Understanding of color theory'], ARRAY['Adaptive input devices', 'Adjustable workspace', 'Flexible schedule', 'Remote work'], 'Design'),
('Legal Research Assistant', 'Advocacy Law Firm', 'Chicago, IL', 'Part-time', '$25 - $35/hr', 'Assist with legal research in our fully ADA-compliant office. We offer quiet study zones and ergonomic workstations designed for maximum comfort.', ARRAY['Current law student or paralegal certificate', 'Strong research skills', 'Professional writing ability'], ARRAY['Accessible office', 'Standing desk', 'Ergonomic setup', 'Quiet workspace'], 'Administrative'),
('Project Coordinator', 'Clear Vision Projects', 'Remote', 'Full-time', '$65,000 - $85,000', 'Coordinate project timelines and deliverables. We prioritize neurodiversity and offer clear milestones, minimal meeting days, and flexible working blocks.', ARRAY['Strong organizational skills', 'Experience with project management software', 'Ability to work independently'], ARRAY['Flexible deadlines', 'Mental health days', 'Remote work', 'Flexible hours'], 'Technology'),
('Customer Success Manager', 'Supportive SaaS', 'Remote', 'Full-time', '$75,000 - $100,000', 'Ensure our customers get the most out of our platform. We provide comprehensive captioning for all video calls and support for screen readers throughout our toolset.', ARRAY['Experience in SaaS customer success', 'Empathy and problem-solving skills', 'Excellent communication'], ARRAY['Remote work', 'Screen reader compatible', 'Captions provided', 'Flexible schedule'], 'Customer Service'),
('Lead Operations Analyst', 'Inclusion Hub', 'Remote', 'Full-time', '$110,000 - $140,000', 'Optimize internal operations for an accessibility-first company. We support all forms of assistive technology and encourage a results-oriented work culture.', ARRAY['Strong analytical and data skills', 'Experience in ops or management consulting', 'Passion for accessible technology'], ARRAY['Remote work', 'Flexible hours', 'Adaptive tools provided', 'Voice dictation'], 'Administrative');
