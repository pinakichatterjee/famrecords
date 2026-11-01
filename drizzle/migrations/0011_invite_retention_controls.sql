CREATE TABLE public.invite_retention_settings (
 id boolean PRIMARY KEY DEFAULT true CHECK (id),
 retention_days integer CHECK (retention_days IN (30,90,180,365)),
 purge_before timestamptz,
 updated_at timestamptz NOT NULL DEFAULT now(),
 updated_by uuid,
 last_cleanup_at timestamptz
);
GRANT SELECT ON public.invite_retention_settings TO authenticated;
GRANT ALL ON public.invite_retention_settings TO service_role;
ALTER TABLE public.invite_retention_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read invite retention" ON public.invite_retention_settings FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE FUNCTION public.set_invite_retention(_days integer) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admins only'; END IF;
 IF _days IS NOT NULL AND _days NOT IN (30,90,180,365) THEN RAISE EXCEPTION 'Invalid retention period'; END IF;
 INSERT INTO public.invite_retention_settings(id,retention_days,updated_by) VALUES(true,_days,auth.uid()) ON CONFLICT(id) DO UPDATE SET retention_days = EXCLUDED.retention_days, updated_at = now(), updated_by = auth.uid();
END $$;
REVOKE ALL ON FUNCTION public.set_invite_retention(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_invite_retention(integer) TO authenticated;
CREATE FUNCTION public.request_invite_purge(_older_than_days integer) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE cutoff timestamptz;
BEGIN
 IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admins only'; END IF;
 IF _older_than_days NOT IN (0,30,90) OR _older_than_days IS NULL THEN RAISE EXCEPTION 'Invalid deletion scope'; END IF;
 cutoff := now() - make_interval(days => _older_than_days);
 INSERT INTO public.invite_retention_settings(id,purge_before,updated_by) VALUES(true,cutoff,auth.uid()) ON CONFLICT(id) DO UPDATE SET purge_before = greatest(public.invite_retention_settings.purge_before, EXCLUDED.purge_before), updated_at = now(), updated_by = auth.uid();
END $$;
REVOKE ALL ON FUNCTION public.request_invite_purge(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_invite_purge(integer) TO authenticated;
CREATE FUNCTION public.invite_cleanup_candidates() RETURNS TABLE(user_id uuid,created_at timestamptz) LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
 SELECT a.user_id,a.created_at FROM public.invite_signup_attribution a CROSS JOIN public.invite_retention_settings s WHERE s.id AND (a.created_at <= s.purge_before OR (s.retention_days IS NOT NULL AND a.created_at <= now() - make_interval(days => s.retention_days))) ORDER BY a.created_at LIMIT 20
$$;
REVOKE ALL ON FUNCTION public.invite_cleanup_candidates() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.invite_cleanup_candidates() TO service_role;
CREATE OR REPLACE FUNCTION public.invite_signup_totals() RETURNS TABLE(source text,campaign text,content text,signups bigint) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admins only'; END IF;
 RETURN QUERY SELECT a.source,a.campaign,a.content,count(*) FROM public.invite_signup_attribution a LEFT JOIN public.invite_retention_settings s ON s.id WHERE (s.purge_before IS NULL OR a.created_at > s.purge_before) AND (s.retention_days IS NULL OR a.created_at > now() - make_interval(days => s.retention_days)) GROUP BY a.source,a.campaign,a.content ORDER BY count(*) DESC;
END $$;
CREATE INDEX invite_attribution_created_at_idx ON public.invite_signup_attribution(created_at);
COMMENT ON TABLE public.invite_retention_settings IS 'Admin-only saved invite attribution retention; null preserves retention until account deletion. Purge cutoff affects existing data only. Cleanup clears auth metadata via Auth Admin API before deleting reporting rows.';