-- The application accesses Supabase through authenticated server routes using
-- the service role. No client-side anon/authenticated table access is needed.
ALTER TABLE public.persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.person_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.traditio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.words ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.current_psalm ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agapes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agape_food_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agape_assignments ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.persons, public.services, public.person_services,
    public.events, public.groups, public.group_members, public.traditio,
    public.words, public.current_psalm, public.agapes,
    public.agape_food_types, public.agape_assignments
FROM anon, authenticated;
