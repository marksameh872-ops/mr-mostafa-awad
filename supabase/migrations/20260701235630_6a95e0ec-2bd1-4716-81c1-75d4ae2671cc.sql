
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

-- Levels
CREATE TABLE public.levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number int NOT NULL UNIQUE,
  title text NOT NULL,
  description text DEFAULT '',
  question_count int NOT NULL DEFAULT 7,
  pass_percentage int NOT NULL DEFAULT 50,
  is_published boolean NOT NULL DEFAULT false,
  position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.levels TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.levels TO authenticated;
GRANT ALL ON public.levels TO service_role;
ALTER TABLE public.levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read published levels" ON public.levels FOR SELECT TO anon, authenticated USING (is_published = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage levels" ON public.levels FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Questions (correct_answer & explanation NEVER exposed to anon; served via server fn)
CREATE TABLE public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id uuid NOT NULL REFERENCES public.levels(id) ON DELETE CASCADE,
  order_index int NOT NULL DEFAULT 0,
  type text NOT NULL DEFAULT 'mcq',
  prompt text NOT NULL,
  choices jsonb NOT NULL DEFAULT '[]'::jsonb,
  correct_answer text NOT NULL,
  explanation text DEFAULT '',
  grammar_note text DEFAULT '',
  difficulty text DEFAULT 'easy',
  media_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.questions TO authenticated;
GRANT ALL ON public.questions TO service_role;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
-- Only admins can read raw questions (with answers). Public quiz endpoint uses service role via server fn to serve sanitized questions.
CREATE POLICY "Admins manage questions" ON public.questions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Attempts (anonymous student attempts)
CREATE TABLE public.attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name text NOT NULL DEFAULT 'Anonymous',
  level_id uuid NOT NULL REFERENCES public.levels(id) ON DELETE CASCADE,
  score int NOT NULL,
  total int NOT NULL,
  passed boolean NOT NULL,
  answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.attempts TO anon, authenticated;
GRANT SELECT ON public.attempts TO authenticated;
GRANT ALL ON public.attempts TO service_role;
ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert attempts" ON public.attempts FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins view attempts" ON public.attempts FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Seed Level 1
INSERT INTO public.levels (number, title, description, question_count, is_published, position)
VALUES (1, 'Present Simple', 'Master the basics of the present simple tense', 7, true, 1);

INSERT INTO public.questions (level_id, order_index, type, prompt, choices, correct_answer, explanation, grammar_note, difficulty)
SELECT id, o, 'mcq', p, c::jsonb, ans, ex, gn, 'easy' FROM public.levels, (VALUES
  (1, 'She ___ to school every day.', '["go","goes","going","went"]', 'goes', 'Third-person singular subjects (he/she/it) take the -s form in present simple.', 'he/she/it + verb-s', 'easy'),
  (2, 'They ___ football on weekends.', '["plays","play","playing","played"]', 'play', 'Plural subjects use the base form of the verb.', 'they/we/you + base verb', 'easy'),
  (3, 'I ___ coffee in the morning.', '["drinks","drink","drinking","drunk"]', 'drink', 'First-person singular "I" uses the base form.', 'I + base verb', 'easy'),
  (4, '___ he live in London?', '["Do","Does","Is","Are"]', 'Does', 'Use "Does" for he/she/it in yes/no questions.', 'Does + he/she/it + base verb', 'easy'),
  (5, 'We ___ not like spicy food.', '["does","do","are","is"]', 'do', 'Use "do not / don''t" with I/you/we/they.', 'we/they + do not + base verb', 'easy'),
  (6, 'The sun ___ in the east.', '["rise","rises","rising","rose"]', 'rises', 'General truths use present simple; "sun" is third-person singular.', 'facts & routines → present simple', 'easy'),
  (7, 'What time ___ the store open?', '["do","does","is","are"]', 'does', '"The store" is third-person singular, so use "does".', 'wh-question: does + subject + base verb', 'easy')
) AS q(o, p, c, ans, ex, gn, d)
WHERE number = 1;
