CREATE TABLE public.subscriptions (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free','premium')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','pending','cancelled','halted','expired')),
  billing_period text CHECK (billing_period IN ('monthly','yearly','manual')),
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  provider text,
  provider_subscription_id text UNIQUE,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own subscription read" ON public.subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admins read subscriptions" ON public.subscriptions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.ai_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('report_reader','visit_summary')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ai_usage_user_kind_time ON public.ai_usage (user_id, kind, created_at);
GRANT ALL ON public.ai_usage TO service_role;
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.current_plan(_user_id uuid) RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE WHEN EXISTS (
    SELECT 1 FROM public.subscriptions s WHERE s.user_id = _user_id AND s.plan = 'premium'
      AND s.status IN ('active','cancelled') AND (s.current_period_end IS NULL OR s.current_period_end > now())
  ) THEN 'premium' ELSE 'free' END
$$;

CREATE OR REPLACE FUNCTION public.ai_usage_this_month(_kind text) RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT count(*)::int FROM public.ai_usage WHERE user_id = auth.uid() AND kind = _kind AND created_at >= date_trunc('month', now())
$$;
GRANT EXECUTE ON FUNCTION public.ai_usage_this_month(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.enforce_plan_limits() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p text; n int; lim int;
BEGIN
  IF TG_TABLE_NAME = 'family_members' THEN
    p := public.current_plan(NEW.user_id);
    SELECT count(*) INTO n FROM public.family_members WHERE user_id = NEW.user_id;
    lim := CASE WHEN p = 'premium' THEN 6 ELSE 2 END;
    IF n >= lim THEN RAISE EXCEPTION 'PLAN_LIMIT: Your % plan allows up to % family members.', p, lim; END IF;
  ELSE
    p := public.current_plan(NEW.created_by);
    SELECT count(*) INTO n FROM public.medical_records WHERE created_by = NEW.created_by;
    lim := CASE WHEN p = 'premium' THEN 300 ELSE 25 END;
    IF n >= lim THEN RAISE EXCEPTION 'PLAN_LIMIT: Your % plan allows up to % records.', p, lim; END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER family_members_plan_limit BEFORE INSERT ON public.family_members FOR EACH ROW EXECUTE FUNCTION public.enforce_plan_limits();
CREATE TRIGGER medical_records_plan_limit BEFORE INSERT ON public.medical_records FOR EACH ROW EXECUTE FUNCTION public.enforce_plan_limits();

CREATE TABLE public.visit_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  family_member_id uuid NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  source_record_ids uuid[] NOT NULL,
  language text NOT NULL CHECK (language IN ('en','bn')),
  notes jsonb NOT NULL DEFAULT '{}'::jsonb,
  content jsonb NOT NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX visit_summaries_user ON public.visit_summaries (user_id, created_at DESC);
GRANT SELECT, UPDATE, DELETE ON public.visit_summaries TO authenticated;
GRANT ALL ON public.visit_summaries TO service_role;
ALTER TABLE public.visit_summaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "approved own summaries read" ON public.visit_summaries FOR SELECT TO authenticated USING (auth.uid() = user_id AND public.is_approved(auth.uid()));
CREATE POLICY "approved own summaries edit" ON public.visit_summaries FOR UPDATE TO authenticated USING (auth.uid() = user_id AND public.is_approved(auth.uid())) WITH CHECK (auth.uid() = user_id AND public.is_approved(auth.uid()));
CREATE POLICY "approved own summaries delete" ON public.visit_summaries FOR DELETE TO authenticated USING (auth.uid() = user_id AND public.is_approved(auth.uid()));

CREATE OR REPLACE FUNCTION public.guard_visit_summary() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF coalesce(auth.role(), '') <> 'service_role' THEN
    IF NEW.user_id <> OLD.user_id OR NEW.family_member_id <> OLD.family_member_id OR NEW.source_record_ids <> OLD.source_record_ids OR NEW.language <> OLD.language OR NEW.created_at <> OLD.created_at THEN
      RAISE EXCEPTION 'Only summary content and review can change';
    END IF;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
CREATE TRIGGER visit_summaries_guard BEFORE UPDATE ON public.visit_summaries FOR EACH ROW EXECUTE FUNCTION public.guard_visit_summary();

CREATE OR REPLACE FUNCTION public.delete_summaries_for_record() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM public.visit_summaries WHERE OLD.id = ANY(source_record_ids);
  RETURN OLD;
END $$;
CREATE TRIGGER medical_records_delete_summaries AFTER DELETE ON public.medical_records FOR EACH ROW EXECUTE FUNCTION public.delete_summaries_for_record();