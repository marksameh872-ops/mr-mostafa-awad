import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getProgress, setStudentName, type Progress } from "@/lib/progress";
import { motion } from "framer-motion";
import { ArrowLeft, Star, Trophy, Target, Flame } from "lucide-react";

export const Route = createFileRoute("/progress")({
  component: ProgressPage,
});

function ProgressPage() {
  const [p, setP] = useState<Progress>({ studentName: "", completed: {}, weakTopics: {} });
  const [name, setName] = useState("");

  useEffect(() => {
    const cur = getProgress();
    setP(cur);
    setName(cur.studentName);
  }, []);

  const completedList = Object.entries(p.completed).map(([n, r]) => ({ number: Number(n), ...r })).sort((a, b) => a.number - b.number);
  const passed = completedList.filter((c) => c.passed);
  const totalStars = completedList.reduce((s, c) => s + c.stars, 0);
  const avgPct = passed.length ? Math.round(passed.reduce((s, c) => s + (c.score / c.total) * 100, 0) / passed.length) : 0;
  const currentLevel = passed.length + 1;

  return (
    <div className="min-h-screen py-10 px-4">
      <div className="mx-auto max-w-3xl">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Home
        </Link>

        <h1 className="font-display text-5xl mb-2">Your progress</h1>
        <p className="text-muted-foreground mb-8">Track your journey through Mr English.</p>

        <div className="glass rounded-3xl shadow-soft p-6 mb-6">
          <label className="text-xs uppercase tracking-widest text-muted-foreground">Display name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setStudentName(name)}
            placeholder="Your name"
            className="mt-2 w-full bg-transparent border-b border-border py-2 text-lg focus:outline-none focus:border-primary"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <Stat icon={<Trophy className="h-5 w-5" />} label="Completed" value={passed.length} />
          <Stat icon={<Flame className="h-5 w-5" />} label="Current level" value={currentLevel} />
          <Stat icon={<Star className="h-5 w-5" />} label="Stars earned" value={totalStars} />
          <Stat icon={<Target className="h-5 w-5" />} label="Avg. accuracy" value={`${avgPct}%`} />
        </div>

        <h2 className="font-display text-2xl mb-4">Completed levels</h2>
        {completedList.length === 0 && (
          <div className="glass rounded-2xl p-6 text-muted-foreground text-sm">
            You haven't finished any levels yet. Start with Level 1 on the home page.
          </div>
        )}
        <div className="space-y-2">
          {completedList.map((c, i) => (
            <motion.div
              key={c.number}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="glass rounded-2xl p-4 flex items-center justify-between"
            >
              <div>
                <div className="text-xs text-muted-foreground">Level {c.number}</div>
                <div className="font-medium">{c.score}/{c.total} · {Math.round((c.score / c.total) * 100)}%</div>
              </div>
              <div className="flex gap-0.5">
                {[0,1,2].map((i) => <Star key={i} className={`h-4 w-4 ${i < c.stars ? "fill-primary text-primary" : "text-muted-foreground/25"}`} />)}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="text-muted-foreground mb-2">{icon}</div>
      <div className="text-2xl font-display">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
