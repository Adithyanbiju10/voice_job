
-- Allow anyone to insert jobs for this demo/preview
CREATE POLICY "Anyone can insert jobs" ON public.jobs FOR INSERT WITH CHECK (true);

-- Allow anyone to update jobs (optional, but useful for active state)
CREATE POLICY "Anyone can update jobs" ON public.jobs FOR UPDATE USING (true);
