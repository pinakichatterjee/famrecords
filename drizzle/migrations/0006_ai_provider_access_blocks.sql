CREATE TABLE public.ai_provider_access_blocks (user_id uuid PRIMARY KEY, reason text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT ON public.ai_provider_access_blocks TO authenticated;
GRANT ALL ON public.ai_provider_access_blocks TO service_role;
ALTER TABLE public.ai_provider_access_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own AI block read" ON public.ai_provider_access_blocks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own AI block insert" ON public.ai_provider_access_blocks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);