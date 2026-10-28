CREATE TABLE public.health_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 family_member_id uuid NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
 event_type text NOT NULL,
 title text NOT NULL,
 event_date date NOT NULL,
 event_time time,
 provider text,
 notes text,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT health_events_type CHECK (event_type IN ('appointment','health_event')),
 CONSTRAINT health_events_title CHECK (length(trim(title)) BETWEEN 1 AND 200),
 CONSTRAINT health_events_notes CHECK (notes IS NULL OR length(notes) <= 5000)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.health_events TO authenticated;
GRANT ALL ON public.health_events TO service_role;
ALTER TABLE public.health_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "approved own events" ON public.health_events FOR ALL TO authenticated
 USING (auth.uid() = user_id AND public.is_approved(auth.uid()))
 WITH CHECK (auth.uid() = user_id AND public.is_approved(auth.uid()) AND EXISTS (SELECT 1 FROM public.family_members m WHERE m.id = family_member_id AND m.user_id = auth.uid()));
CREATE INDEX health_events_member_date_idx ON public.health_events(family_member_id, event_date DESC);
CREATE FUNCTION public.validate_health_event_owner() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM public.family_members m WHERE m.id = NEW.family_member_id AND m.user_id = NEW.user_id) THEN
  RAISE EXCEPTION 'Family member must belong to the event owner';
 END IF;
 NEW.updated_at := now();
 RETURN NEW;
END;
$$;
CREATE TRIGGER validate_health_event_owner BEFORE INSERT OR UPDATE ON public.health_events FOR EACH ROW EXECUTE FUNCTION public.validate_health_event_owner();
CREATE FUNCTION public.validate_medical_record_relationship() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM public.family_members m WHERE m.id = NEW.family_member_id AND m.user_id = NEW.created_by) THEN
  RAISE EXCEPTION 'Family member must belong to the record owner';
 END IF;
 IF split_part(NEW.document, '/', 1) <> NEW.created_by::text THEN
  RAISE EXCEPTION 'Document must belong to the record owner';
 END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER validate_medical_record_relationship BEFORE INSERT OR UPDATE OF family_member_id, created_by, document ON public.medical_records FOR EACH ROW EXECUTE FUNCTION public.validate_medical_record_relationship();