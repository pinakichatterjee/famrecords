CREATE TABLE public.invite_signup_attribution (
 user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
 source text NOT NULL CHECK (source IN ('whatsapp','email','facebook','instagram','linkedin')),
 campaign text NOT NULL CHECK (campaign IN ('family_invite','parent_care','visit_pack')),
 content text NOT NULL CHECK (content IN ('personal_invite','invite_1','invite_2')),
 notice_version text NOT NULL CHECK (notice_version = 'famrecords-invite-v1'),
 consent_at timestamptz NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, DELETE ON public.invite_signup_attribution TO authenticated;
GRANT ALL ON public.invite_signup_attribution TO service_role;
ALTER TABLE public.invite_signup_attribution ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners may remove invite attribution" ON public.invite_signup_attribution FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owners may read own invite attribution" ON public.invite_signup_attribution FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE FUNCTION public.capture_invite_signup() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE a jsonb; decided timestamptz;
BEGIN
 a := NEW.raw_user_meta_data->'invite_attribution';
 IF a IS NULL OR a->>'notice' IS DISTINCT FROM 'famrecords-invite-v1' OR a->>'source' NOT IN ('whatsapp','email','facebook','instagram','linkedin') OR a->>'campaign' NOT IN ('family_invite','parent_care','visit_pack') OR a->>'content' NOT IN ('personal_invite','invite_1','invite_2') THEN RETURN NEW; END IF;
 IF a->>'source' IS NULL OR a->>'campaign' IS NULL OR a->>'content' IS NULL OR a->>'consentAt' IS NULL THEN RETURN NEW; END IF;
 BEGIN decided := (a->>'consentAt')::timestamptz; EXCEPTION WHEN OTHERS THEN RETURN NEW; END;
 IF decided > now() OR decided < now() - interval '24 hours' THEN RETURN NEW; END IF;
 INSERT INTO public.invite_signup_attribution (user_id,source,campaign,content,notice_version,consent_at) VALUES (NEW.id,a->>'source',a->>'campaign',a->>'content',a->>'notice',decided) ON CONFLICT DO NOTHING;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.capture_invite_signup() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER zz_capture_invite_signup AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.capture_invite_signup();
CREATE FUNCTION public.invite_signup_totals() RETURNS TABLE(source text,campaign text,content text,signups bigint) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admins only'; END IF;
 RETURN QUERY SELECT a.source,a.campaign,a.content,count(*) FROM public.invite_signup_attribution a GROUP BY a.source,a.campaign,a.content ORDER BY count(*) DESC;
END $$;
REVOKE ALL ON FUNCTION public.invite_signup_totals() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.invite_signup_totals() TO authenticated;
COMMENT ON TABLE public.invite_signup_attribution IS 'Optional first-party invite attribution captured once at account creation. No medical data, URLs, device identifiers or advertising exports. Campaign labels are self-reported, not verified advertising attribution.';