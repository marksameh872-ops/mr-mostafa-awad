import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckCircle2, XCircle, Sparkles, Loader2 } from "lucide-react";
import { getLevelQuiz, gradeAnswer, recordAttempt } from "@/lib/quiz.functions";
import { recordLevelResult, isLevelReachable, getProgress } from "@/lib/progress";

export const Route = createFileRoute("/levels/$number")({
  component: QuizPage,
});

type GradeResult = {
  correct: boolean;
  correctAnswer: string;
  explanation: string;
  grammar: string;
};

function QuizPage() {
  const { number } = Route.useParams();
  const levelNum = parseInt(number, 10);
  const navigate = useNavigate();

  const reachable = isLevelReachable(levelNum);

  const { data, isLoading } = useQuery({
    queryKey: ["quiz", levelNum],
    queryFn: () => getLevelQuiz({ data: { number: levelNum } }),
    enabled: reachable,
  });

  const [idx, setIdx] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [grading, setGrading] = useState(false);
  const [grade, setGrade] = useState<GradeResult | null>(null);
  const [answers, setAnswers] = useState<Array<{ questionId: string; chosen: string; correct: boolean }>>([]);

  const total = data?.questions.length ?? 0;
  const current = data?.questions[idx];
  const progressPct = total > 0 ? (idx / total) * 100 : 0;

  if (!reachable) {
    return (
      <Centered>
        <h1 className="font-display text-3xl mb-2">Level locked</h1>
        <p className="text-muted-foreground mb-6">Complete the previous level first.</p>
        <Link to="/" className="rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium">Back home</Link>
      </Centered>
    );
  }

  if (isLoading) {
    return (
      <Centered>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </Centered>
    );
  }

  if (!data?.level) {
    return (
      <Centered>
        <h1 className="font-display text-3xl mb-2">Level not available</h1>
        <p className="text-muted-foreground mb-6">This level has not been published by Mr. Mostafa Awad yet. Please check back later.</p>
        <Link to="/" className="rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium">Back home</Link>
      </Centered>
    );
  }

  const onSubmit = async () => {
    if (!chosen || !current) return;
    setGrading(true);
    try {
      const g = await gradeAnswer({ data: { questionId: current.id, chosen } });
      setGrade(g);
      setAnswers((a) => [...a, { questionId: current.id, chosen, correct: g.correct }]);
    } catch (e) {
      console.error(e);
      alert("Grading failed. Try again.");
    } finally {
      setGrading(false);
    }
  };

  const onNext = async () => {
    if (idx + 1 < total) {
      setIdx(idx + 1);
      setChosen(null);
      setGrade(null);
      return;
    }
    // finished
    const score = answers.filter((a) => a.correct).length;
    const passPct = data.level.pass_percentage ?? 50;
    const passed = (score / total) * 100 > passPct;
    const rec = recordLevelResult(levelNum, score, total, passed);
    try {
      const p = getProgress();
      await recordAttempt({
        data: {
          levelId: data.level.id,
          studentName: p.studentName || "Anonymous",
          score, total, passed,
          answers,
        },
      });
    } catch (e) { console.error(e); }
    navigate({ to: "/levels/$number/result", params: { number }, search: { score, total, passed: passed ? 1 : 0, stars: rec.stars } });
  };

  return (
    <div className="min-h-screen py-10 px-4">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
          <div className="text-xs tracking-widest text-muted-foreground uppercase">Level {levelNum} · {data.level.title}</div>
        </div>

        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden mb-8">
          <motion.div
            className="h-full bg-primary"
            initial={false}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>

        <AnimatePresence mode="wait">
          {current && (
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="glass rounded-3xl shadow-soft p-8"
            >
              <div className="text-xs text-muted-foreground mb-2">Question {idx + 1} of {total}</div>
              <h2 className="font-display text-3xl leading-tight mb-6">{current.prompt}</h2>

              <div className="space-y-3">
                {current.choices.map((c) => {
                  const isSel = chosen === c;
                  const showRight = grade && c === grade.correctAnswer;
                  const showWrong = grade && isSel && !grade.correct;
                  return (
                    <button
                      key={c}
                      disabled={!!grade}
                      onClick={() => setChosen(c)}
                      className={`w-full text-left rounded-2xl border px-5 py-4 transition
                        ${isSel && !grade ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-accent/40"}
                        ${showRight ? "!border-[color:var(--success)] !bg-[color:var(--success)]/10" : ""}
                        ${showWrong ? "!border-destructive !bg-destructive/10" : ""}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{c}</span>
                        {showRight && <CheckCircle2 className="h-5 w-5 text-[color:var(--success)]" />}
                        {showWrong && <XCircle className="h-5 w-5 text-destructive" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              <AnimatePresence>
                {grade && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-6 overflow-hidden"
                  >
                    <div className={`rounded-2xl p-5 ${grade.correct ? "bg-[color:var(--success)]/10 border border-[color:var(--success)]/30" : "bg-destructive/10 border border-destructive/30"}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <div className="text-sm font-semibold">{grade.correct ? "Nicely done." : "Not quite — here's why."}</div>
                      </div>
                      <p className="text-sm leading-relaxed whitespace-pre-line text-foreground/90">{grade.explanation || "Great effort — keep going!"}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-6 flex justify-end">
                {!grade ? (
                  <button
                    disabled={!chosen || grading}
                    onClick={onSubmit}
                    className="rounded-full bg-primary text-primary-foreground px-6 py-3 text-sm font-medium disabled:opacity-40 hover:opacity-90 transition inline-flex items-center gap-2"
                  >
                    {grading && <Loader2 className="h-4 w-4 animate-spin" />} Submit
                  </button>
                ) : (
                  <button
                    onClick={onNext}
                    className="rounded-full bg-primary text-primary-foreground px-6 py-3 text-sm font-medium hover:opacity-90 transition"
                  >
                    {idx + 1 < total ? "Next question" : "Finish"}
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid place-items-center px-6 text-center">
      <div>{children}</div>
    </div>
  );
}
