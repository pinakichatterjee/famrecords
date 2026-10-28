CREATE TABLE public.report_extractions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medical_record_id uuid NOT NULL REFERENCES public.medical_records(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','needs_review','reviewed','failed')),
  extraction jsonb,
  corrected jsonb,
  failure_code text,
  attempt_count int NOT NULL DEFAULT 0,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (medical_record_id)
);
GRANT SELECT, UPDATE ON public.report_extractions TO authenticated;
GRANT ALL ON public.report_extractions TO service_role;
ALTER TABLE public.report_extractions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "approved own extractions read" ON public.report_extractions
  FOR SELECT TO authenticated USING (auth.uid() = user_id AND public.is_approved(auth.uid()));
CREATE POLICY "approved own extractions review" ON public.report_extractions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id AND public.is_approved(auth.uid()))
  WITH CHECK (auth.uid() = user_id AND public.is_approved(auth.uid()));

CREATE OR REPLACE FUNCTION public.guard_report_extraction()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.medical_records r WHERE r.id = NEW.medical_record_id AND r.created_by = NEW.user_id) THEN
    RAISE EXCEPTION 'Extraction owner must own the record';
  END IF;
  IF TG_OP = 'UPDATE' AND coalesce(auth.role(), '') <> 'service_role' THEN
    IF NEW.medical_record_id <> OLD.medical_record_id OR NEW.user_id <> OLD.user_id
       OR NEW.extraction IS DISTINCT FROM OLD.extraction OR NEW.attempt_count <> OLD.attempt_count
       OR NEW.failure_code IS DISTINCT FROM OLD.failure_code OR NEW.created_at <> OLD.created_at
       OR OLD.status NOT IN ('needs_review','reviewed') OR NEW.status <> 'reviewed' THEN
      RAISE EXCEPTION 'Only review corrections can be saved';
    END IF;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
CREATE TRIGGER guard_report_extraction BEFORE INSERT OR UPDATE ON public.report_extractions
  FOR EACH ROW EXECUTE FUNCTION public.guard_report_extraction();

CREATE TABLE public.report_extraction_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.report_extraction_attempts TO service_role;
ALTER TABLE public.report_extraction_attempts ENABLE ROW LEVEL SECURITY;
CREATE INDEX report_extraction_attempts_user_time ON public.report_extraction_attempts(user_id, created_at);