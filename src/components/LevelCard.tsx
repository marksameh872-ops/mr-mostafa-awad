import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Lock, Star, CheckCircle2 } from "lucide-react";

export type Level = {
  id: string;
  number: number;
  title: string;
  description: string | null;
  question_count: number;
  is_published: boolean;
};

export function LevelCard({
  level,
  reachable,
  completed,
  stars,
  index,
}: {
  level: Level;
  reachable: boolean;
  completed: boolean;
  stars: number; // 0..3
  index: number;
}) {
  const locked = !level.is_published || !reachable;

  const body = (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: (index % 12) * 0.03, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileHover={!locked ? { y: -4, scale: 1.015 } : undefined}
      className={`glass relative overflow-hidden rounded-3xl p-5 shadow-soft transition ${locked ? "opacity-70" : "hover:shadow-glow cursor-pointer"}`}
    >
      <div className="flex items-start justify-between">
        <div className="text-xs font-medium tracking-wider text-muted-foreground">LEVEL {String(level.number).padStart(2, "0")}</div>
        {completed && <CheckCircle2 className="h-5 w-5 text-[color:var(--success)]" />}
      </div>
      <h3 className="mt-3 text-2xl font-display leading-tight">{level.title}</h3>
      <p className="mt-1 text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
        {level.is_published ? (level.description || `${level.question_count} questions`) : "This level will be available after your teacher publishes it."}
      </p>
      <div className="mt-4 flex items-center justify-between">
        <div className="text-xs text-muted-foreground">{level.question_count} questions · ~{Math.max(2, Math.ceil(level.question_count * 0.7))} min</div>
        <div className="flex gap-0.5">
          {[0, 1, 2].map((i) => (
            <Star key={i} className={`h-4 w-4 ${i < stars ? "fill-primary text-primary" : "text-muted-foreground/30"}`} />
          ))}
        </div>
      </div>

      {locked && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-md">
          <div className="grid place-items-center h-12 w-12 rounded-full bg-foreground/10">
            <Lock className="h-5 w-5" />
          </div>
        </div>
      )}
    </motion.div>
  );

  if (locked) return body;
  return (
    <Link to="/levels/$number" params={{ number: String(level.number) }}>
      {body}
    </Link>
  );
}
