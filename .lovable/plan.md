# Mr English — Full MVP Plan

A premium, Apple-inspired English learning web app for **Mr. Mostafa Awad**, with an AI-powered quiz system, a hidden teacher dashboard, and a student progress tracker.

---

## 1. Stack & Infrastructure

- **Frontend:** TanStack Start (React 19) + Tailwind v4 + Framer Motion + shadcn/ui.
- **Backend:** Lovable Cloud (Postgres + Auth + Storage) via `createServerFn`.
- **AI:** Lovable AI Gateway (`google/gemini-3-flash-preview`) for explanations, question generation, and student tutor.
- **Auth:** Email/password for the teacher account only. Students play anonymously with a display name (progress stored in localStorage + optional cloud sync via anonymous session).
- **Language:** English UI (LTR). Only the intro title `مستر انجليزي` renders in Arabic calligraphy.

---

## 2. Database Schema (Lovable Cloud)

```text
levels            id, number (unique), title, description, question_count,
                  pass_percentage (default 50), is_published, position, created_at
questions         id, level_id, order_index, type (mcq|tf|fill|image|audio),
                  prompt, choices (jsonb), correct_answer, explanation,
                  grammar_note, difficulty, media_url
attempts          id, student_name, level_id, score, total, passed,
                  answers (jsonb: [{qid, chosen, correct, explanation}]), created_at
user_roles        id, user_id, role (enum: admin) — security-definer has_role()
profiles          id (auth.users), display_name (teacher only)
```

- RLS: `levels` and `questions` publicly readable **only when `is_published = true`** (and questions never expose `correct_answer`/`explanation` via the public policy — served through a server fn during grading). Admin (teacher) full CRUD via `has_role(auth.uid(), 'admin')`.
- Seed migration inserts Level 1 "Present Simple" with 7 questions so the app works on first load.

---

## 3. Route Map

```text
/                       Intro animation → homepage (logo, name, socials, level grid)
/levels/$number         Quiz screen (fetches published level, renders one question at a time)
/levels/$number/result  Animated result screen
/progress               Student dashboard (localStorage-backed)
/admin                  Hidden login (reached by Shift+Alt+A shortcut anywhere, or direct URL)
/_authenticated/dashboard          Teacher overview + stats
/_authenticated/dashboard/levels   Create / reorder / publish / delete levels
/_authenticated/dashboard/levels/$id  Question editor with AI assistant
/_authenticated/dashboard/students Attempts + weak-topic analytics
```

`_authenticated/route.tsx` gates the dashboard subtree; a child `beforeLoad` also verifies `has_role('admin')`.

---

## 4. Key Features

**Intro animation** — full-screen white/dark canvas, `مستر انجليزي` fades in, scales, glows, drifts up, then dissolves into the homepage (~2s, skippable, shown once per session).

**Homepage** — logo placeholder, name block, 5 platform-colored social buttons (YouTube red, Facebook blue, Instagram gradient, TikTok black, Telegram blue) with ripple/hover, then a responsive grid of 30 level cards. Unpublished levels render blurred with a lock icon and the teacher-publish message.

**Quiz flow** — floating card, progress bar, optional timer, 4 answer choices with smooth selection animation. On answer submit, a server fn grades against the DB (correct answer never leaves the server) and returns the stored explanation. If the stored explanation is empty, the server fn asks Lovable AI to generate a teacher-style explanation (why correct/why wrong, grammar rule, example) and caches it back to the row.

**Result screen** — score, percentage, star rating, pass/fail with animation. Passing marks the next level as reachable for that student (localStorage). Failing shows retry / review mistakes / home. If the next level isn't published, show the "not published yet" message.

**Student progress** — `/progress` reads localStorage: completed levels, current level, average score, weakest grammar topics (aggregated from wrong answers), achievements.

**Hidden admin access** — global `keydown` listener: `Shift+Alt+A` navigates to `/admin`. `/admin` renders the login form; on success (teacher role verified) redirects to `/dashboard`.

**Teacher dashboard** — full CRUD for levels (create, edit, reorder via drag handle, duplicate, publish/hide, delete, set pass %). Question editor supports MCQ, True/False, Fill-in-the-blank, Image, Audio; optional image/audio upload to Cloud Storage; per-question explanation, grammar note, difficulty.

**AI assistant (teacher)** — buttons in the editor: *Generate 5 questions from a topic*, *Improve wording*, *Generate explanation*, *Generate distractors*, *Adjust difficulty*. All via a single `aiTeacherAssist` server fn using structured output.

**AI tutor (student)** — floating chat button on the result screen: streams grammar help scoped to the mistakes just made.

---

## 5. Security

- RLS on every table; `user_roles` + `has_role()` security-definer pattern.
- Correct answers and explanations fetched only via server fn during grading — never sent to the client with the question payload.
- Zod validation on every server fn input.
- Teacher password is Supabase-managed (bcrypt); optional HIBP check enabled.
- Rate limiting is not available on this backend — noted, not implemented.

---

## 6. Design System

- Tokens in `src/styles.css`: white, soft-blue (`oklch(0.92 0.04 240)`), deep-navy (`oklch(0.22 0.06 260)`), premium-gray, accent-blue (`oklch(0.62 0.19 250)`), soft-green, soft-red. Full dark mode with system detection.
- Typography: **Instrument Serif** (display) + **Inter** (body), plus **Amiri** for the Arabic intro title — loaded via `<link>` in `__root.tsx` head.
- Glassmorphism cards (`backdrop-blur`, translucent surfaces), soft neumorphic shadows, generous spacing, Framer Motion page/card transitions, spring-based micro-interactions.

---

## 7. Build Order

1. Enable Lovable Cloud + provision `LOVABLE_API_KEY`.
2. Migration: schema, RLS, `has_role`, seed Level 1.
3. Design tokens, fonts, theme provider (light/dark/system).
4. Intro animation + homepage (logo, name, social buttons, level grid with lock states).
5. Quiz screen + server-side grading + AI-generated explanations (cached).
6. Result screen + student progress page (localStorage).
7. Shift+Alt+A shortcut + `/admin` login + `_authenticated` layout.
8. Teacher dashboard: level CRUD, reorder, publish, question editor.
9. AI teacher assistant (structured output) + AI student tutor (streaming).
10. Responsive polish (mobile/tablet/desktop), SEO metadata per route, accessibility pass.

**First-turn setup for the teacher:** on first app load with no teacher account, `/admin` shows a one-time "Create teacher account" form that provisions the admin user (email + password) and grants the `admin` role. From then on it's a normal login.
