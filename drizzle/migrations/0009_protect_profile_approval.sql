CREATE OR REPLACE FUNCTION public.guard_profile_approval()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.approved IS DISTINCT FROM OLD.approved
     AND auth.uid() IS NOT NULL
     AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can change approval';
  END IF;
  IF NEW.id IS DISTINCT FROM OLD.id AND auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'Profile id cannot change';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS guard_profile_approval ON public.profiles;
CREATE TRIGGER guard_profile_approval BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.guard_profile_approval();
CREATE OR REPLACE FUNCTION public.guard_profile_insert_approval()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.approved := false;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS guard_profile_insert_approval ON public.profiles;
CREATE TRIGGER guard_profile_insert_approval BEFORE INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.guard_profile_insert_approval();