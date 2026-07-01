import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { GraduationCap, Moon, Sun, User } from "lucide-react";
import { IntroAnimation } from "@/components/IntroAnimation";
import { SocialButtons } from "@/components/SocialButtons";
import { LevelCard, type Level } from "@/components/LevelCard";
import { listLevels } from "@/lib/quiz.functions";
import { getProgress, isLevelReachable } from "@/lib/progress";

export const Route = createFileRoute("/")({
  component: Home,
});

function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };
  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="grid place-items-center h-10 w-10 rounded-full glass shadow-soft hover:scale-105 transition"
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

function Home() {
  const [introDone, setIntroDone] = useState(false);
  const [progress, setProgress] = useState(() => getProgress());

  useEffect(() => {
    // Skip intro if seen this session
    if (sessionStorage.getItem("intro_seen")) setIntroDone(true);
  }, []);

  useEffect(() => {
    if (introDone) sessionStorage.setItem("intro_seen", "1");
  }, [introDone]);

  useEffect(() => { setProgress(getProgress()); }, [introDone]);

  const { data: dbLevels } = useQuery({
    queryKey: ["levels"],
    queryFn: () => listLevels(),
  });

  // Ensure we always render 30 slots
  const levels: Level[] = Array.from({ length: 30 }, (_, i) => {
    const n = i + 1;
    const found = dbLevels?.find((l) => l.number === n);
    return found ?? {
      id: `placeholder-${n}`,
      number: n,
      title: `Level ${n}`,
      description: "",
      question_count: 7,
      is_published: false,
    };
  });

  return (
    <div className="min-h-screen">
      {!introDone && <IntroAnimation onDone={() => setIntroDone(true)} />}

      <div className="fixed top-4 right-4 z-40 flex gap-2">
        <Link to="/progress" className="grid place-items-center h-10 w-10 rounded-full glass shadow-soft hover:scale-105 transition" aria-label="Your progress">
          <User className="h-4 w-4" />
        </Link>
        <ThemeToggle />
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden pt-24 pb-16 md:pt-32 md:pb-24">
        <div
          className="absolute inset-x-0 top-0 h-[500px] -z-10 opacity-60 dark:opacity-40"
          style={{ background: "radial-gradient(ellipse at center top, var(--soft-blue), transparent 60%)" }}
        />
        <div className="mx-auto max-w-4xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto grid place-items-center h-24 w-24 rounded-3xl glass shadow-soft"
          >
            <GraduationCap className="h-11 w-11 text-primary" strokeWidth={1.5} />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.6 }}
            className="mt-6 font-display text-5xl md:text-7xl leading-[1.05]"
          >
            Mr English
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-2 text-lg md:text-xl text-muted-foreground"
          >
            Mr. Mostafa Awad
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.6 }}
            className="mt-6 mx-auto max-w-lg text-sm md:text-base text-muted-foreground"
          >
            A premium English journey. Thirty levels, one grammar rule at a time, with an AI tutor at your side.
          </motion.p>
        </div>
      </section>

      {/* Socials */}
      <section className="mx-auto max-w-5xl px-6 pb-16">
        <div className="text-center mb-6">
          <div className="text-xs tracking-[0.3em] uppercase text-muted-foreground">Follow along</div>
        </div>
        <SocialButtons />
      </section>

      {/* Levels */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display text-4xl md:text-5xl">Levels</h2>
            <p className="text-muted-foreground mt-1">30 levels · unlock as you master each one.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {levels.map((lvl, i) => (
            <LevelCard
              key={lvl.number}
              level={lvl}
              reachable={isLevelReachable(lvl.number)}
              completed={!!progress.completed[lvl.number]?.passed}
              stars={progress.completed[lvl.number]?.stars ?? 0}
              index={i}
            />
          ))}
        </div>
      </section>

      <footer className="border-t py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Mr English · Mr. Mostafa Awad
      </footer>
    </div>
  );
}
