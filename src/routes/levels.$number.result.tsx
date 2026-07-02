import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Star, RotateCcw, ArrowRight, Home } from "lucide-react";
import { z } from "zod";

const searchSchema = z.object({
  score: z.number().int().min(0),
  total: z.number().int().min(1),
  passed: z.number().int().min(0).max(1),
  stars: z.number().int().min(0).max(3),
});

export const Route = createFileRoute("/levels/$number/result")({
  validateSearch: (s) => searchSchema.parse(s),
  component: ResultPage,
});

function ResultPage() {
  const { number } = Route.useParams();
  const { score, total, passed, stars } = Route.useSearch();
  const pct = Math.round((score / total) * 100);
  const didPass = passed === 1;
  const nextNumber = String(parseInt(number, 10) + 1);

  return (
    <div className="min-h-screen grid place-items-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-lg glass rounded-3xl shadow-soft p-8 text-center"
      >
        <div className="text-xs tracking-widest uppercase text-muted-foreground">Level {number}</div>
        <h1 className={`mt-2 font-display text-5xl ${didPass ? "text-foreground" : "text-destructive"}`}>
          {didPass ? "Well done." : "So close."}
        </h1>

        <div className="mt-6 flex justify-center gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3 + i * 0.15, type: "spring", stiffness: 260, damping: 18 }}
            >
              <Star className={`h-10 w-10 ${i < stars ? "fill-primary text-primary" : "text-muted-foreground/25"}`} />
            </motion.div>
          ))}
        </div>

        <div className="mt-6 flex justify-center gap-8">
          <div>
            <div className="text-4xl font-display">{score}<span className="text-muted-foreground text-xl">/{total}</span></div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">Score</div>
          </div>
          <div>
            <div className="text-4xl font-display">{pct}%</div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">Accuracy</div>
          </div>
        </div>

        {!didPass && (
          <p className="mt-6 text-sm text-muted-foreground">
            You need more than 50% to pass this level. Review and try again — you've got this.
          </p>
        )}

        <div className="mt-8 flex flex-wrap gap-2 justify-center">
          <Link to="/levels/$number" params={{ number }} className="rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium inline-flex items-center gap-2 hover:opacity-90 transition">
            <RotateCcw className="h-4 w-4" /> Retry
          </Link>
          {didPass && (
            <Link to="/levels/$number" params={{ number: nextNumber }} className="rounded-full border px-5 py-2.5 text-sm font-medium inline-flex items-center gap-2 hover:bg-accent transition">
              Next level <ArrowRight className="h-4 w-4" />
            </Link>
          )}
          <Link to="/" className="rounded-full border px-5 py-2.5 text-sm font-medium inline-flex items-center gap-2 hover:bg-accent transition">
            <Home className="h-4 w-4" /> Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
