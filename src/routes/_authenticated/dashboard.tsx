import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  adminListLevels, adminSaveLevel, adminDeleteLevel,
  adminGetLevel, adminSaveQuestion, adminDeleteQuestion,
  aiGenerateQuestions,
} from "@/lib/admin.functions";
import { motion } from "framer-motion";
import { Plus, Eye, EyeOff, Trash2, Sparkles, Pencil, ChevronLeft, Loader2, X } from "lucide-react";


export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const [editingLevel, setEditingLevel] = useState<string | null>(null);

  const { data: levels, refetch } = useQuery({
    queryKey: ["admin-levels"],
    queryFn: () => adminListLevels(),
  });


  const createLevel = async () => {
    const nextNum = (levels?.reduce((m, l) => Math.max(m, l.number), 0) ?? 0) + 1;
    await adminSaveLevel({
      data: {
        number: nextNum, title: `Level ${nextNum}`, description: "",
        question_count: 7, pass_percentage: 50, is_published: false,
      },
    });
    refetch();
  };

  const togglePublish = async (l: any) => {
    await adminSaveLevel({
      data: {
        id: l.id, number: l.number, title: l.title, description: l.description ?? "",
        question_count: l.question_count, pass_percentage: l.pass_percentage,
        is_published: !l.is_published,
      },
    });
    refetch();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this level? This cannot be undone.")) return;
    await adminDeleteLevel({ data: { id } });
    refetch();
  };

  if (editingLevel) {
    return <LevelEditor levelId={editingLevel} onBack={() => { setEditingLevel(null); refetch(); }} />;
  }

  return (
    <div className="min-h-screen py-10 px-4">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Teacher Dashboard</div>
            <h1 className="font-display text-4xl">Levels</h1>
          </div>
          <div className="flex gap-2">
            <Link to="/" className="rounded-full border px-4 py-2 text-sm hover:bg-accent transition">Preview site</Link>
          </div>

        </div>

        <button onClick={createLevel} className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:opacity-90 transition">
          <Plus className="h-4 w-4" /> New level
        </button>

        <div className="space-y-2">
          {levels?.map((l, i) => (
            <motion.div
              key={l.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className="glass rounded-2xl p-4 flex items-center justify-between gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="text-xs text-muted-foreground">Level {l.number} · {l.question_count} questions · pass {l.pass_percentage}%</div>
                <div className="font-medium truncate">{l.title}</div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => togglePublish(l)} className="rounded-full p-2 hover:bg-accent" title={l.is_published ? "Hide" : "Publish"}>
                  {l.is_published ? <Eye className="h-4 w-4 text-[color:var(--success)]" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                </button>
                <button onClick={() => setEditingLevel(l.id)} className="rounded-full p-2 hover:bg-accent" title="Edit">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => remove(l.id)} className="rounded-full p-2 hover:bg-destructive/10 text-destructive" title="Delete">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LevelEditor({ levelId, onBack }: { levelId: string; onBack: () => void }) {
  const { data, refetch, isLoading } = useQuery({
    queryKey: ["admin-level", levelId],
    queryFn: () => adminGetLevel({ data: { id: levelId } }),
  });

  const [showAI, setShowAI] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiBusy, setAiBusy] = useState(false);

  if (isLoading || !data?.level) return <div className="min-h-screen grid place-items-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  const level = data.level;

  const saveMeta = async (patch: Partial<typeof level>) => {
    const merged = { ...level, ...patch };
    await adminSaveLevel({
      data: {
        id: level.id, number: merged.number, title: merged.title, description: merged.description ?? "",
        question_count: merged.question_count, pass_percentage: merged.pass_percentage, is_published: merged.is_published,
      },
    });
    refetch();
  };

  const addQuestion = async () => {
    await adminSaveQuestion({
      data: {
        level_id: level.id, order_index: data.questions.length, type: "mcq",
        prompt: "New question", choices: ["A", "B", "C", "D"], correct_answer: "A",
        explanation: "", grammar_note: "", difficulty: "easy",
      },
    });
    refetch();
  };

  const removeQ = async (id: string) => {
    if (!confirm("Delete this question?")) return;
    await adminDeleteQuestion({ data: { id } });
    refetch();
  };

  const runAI = async () => {
    if (!aiTopic.trim()) return;
    setAiBusy(true);
    try {
      const { questions } = await aiGenerateQuestions({ data: { topic: aiTopic, count: 7, difficulty: "easy" } });
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        await adminSaveQuestion({
          data: {
            level_id: level.id, order_index: data.questions.length + i, type: "mcq",
            prompt: q.prompt, choices: q.choices, correct_answer: q.correct_answer,
            explanation: q.explanation, grammar_note: q.grammar_note, difficulty: "easy",
          },
        });
      }
      setShowAI(false);
      setAiTopic("");
      refetch();
    } catch (e) {
      alert(e instanceof Error ? e.message : "AI generation failed");
    } finally {
      setAiBusy(false);
    }
  };

  return (
    <div className="min-h-screen py-10 px-4">
      <div className="mx-auto max-w-3xl">
        <button onClick={onBack} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ChevronLeft className="h-4 w-4" /> Back to dashboard
        </button>

        <div className="glass rounded-3xl p-6 mb-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Level number">
              <input type="number" defaultValue={level.number} onBlur={(e) => saveMeta({ number: parseInt(e.target.value, 10) })} className="w-full bg-transparent border-b py-2 focus:outline-none focus:border-primary" />
            </Field>
            <Field label="Pass %">
              <input type="number" defaultValue={level.pass_percentage} onBlur={(e) => saveMeta({ pass_percentage: parseInt(e.target.value, 10) })} className="w-full bg-transparent border-b py-2 focus:outline-none focus:border-primary" />
            </Field>
          </div>
          <Field label="Title">
            <input defaultValue={level.title} onBlur={(e) => saveMeta({ title: e.target.value })} className="w-full bg-transparent border-b py-2 text-lg focus:outline-none focus:border-primary" />
          </Field>
          <Field label="Description">
            <input defaultValue={level.description ?? ""} onBlur={(e) => saveMeta({ description: e.target.value })} className="w-full bg-transparent border-b py-2 focus:outline-none focus:border-primary" />
          </Field>
          <Field label="Questions to show">
            <input type="number" defaultValue={level.question_count} onBlur={(e) => saveMeta({ question_count: parseInt(e.target.value, 10) })} className="w-full bg-transparent border-b py-2 focus:outline-none focus:border-primary" />
          </Field>
          <label className="flex items-center gap-2 mt-2 cursor-pointer">
            <input type="checkbox" checked={level.is_published} onChange={(e) => saveMeta({ is_published: e.target.checked })} />
            <span className="text-sm">Published</span>
          </label>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl">Questions ({data.questions.length})</h2>
          <div className="flex gap-2">
            <button onClick={() => setShowAI(true)} className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm hover:bg-accent">
              <Sparkles className="h-4 w-4 text-primary" /> AI generate
            </button>
            <button onClick={addQuestion} className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm hover:opacity-90">
              <Plus className="h-4 w-4" /> Add
            </button>
          </div>
        </div>

        {showAI && (
          <div className="glass rounded-2xl p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium">Generate questions from a topic</div>
              <button onClick={() => setShowAI(false)}><X className="h-4 w-4" /></button>
            </div>
            <div className="flex gap-2">
              <input value={aiTopic} onChange={(e) => setAiTopic(e.target.value)} placeholder="e.g. Past Simple regular verbs" className="flex-1 rounded-xl border bg-transparent px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              <button onClick={runAI} disabled={aiBusy} className="rounded-xl bg-primary text-primary-foreground px-4 py-2 text-sm inline-flex items-center gap-2 disabled:opacity-50">
                {aiBusy && <Loader2 className="h-4 w-4 animate-spin" />} Generate
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {data.questions.map((q) => (
            <QuestionRow key={q.id} q={q} onSaved={refetch} onDelete={() => removeQ(q.id)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function QuestionRow({ q, onSaved, onDelete }: { q: any; onSaved: () => void; onDelete: () => void }) {
  const [prompt, setPrompt] = useState(q.prompt);
  const [choices, setChoices] = useState<string[]>(q.choices as string[]);
  const [correct, setCorrect] = useState(q.correct_answer);
  const [explanation, setExplanation] = useState(q.explanation ?? "");

  const save = async () => {
    await adminSaveQuestion({
      data: {
        id: q.id, level_id: q.level_id, order_index: q.order_index, type: q.type,
        prompt, choices, correct_answer: correct, explanation,
        grammar_note: q.grammar_note ?? "", difficulty: q.difficulty ?? "easy",
      },
    });
    onSaved();
  };

  return (
    <div className="glass rounded-2xl p-4 space-y-2">
      <div className="flex justify-between items-start gap-2">
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} onBlur={save} rows={2} className="flex-1 bg-transparent border-b py-1 resize-none focus:outline-none focus:border-primary" />
        <button onClick={onDelete} className="p-2 text-destructive hover:bg-destructive/10 rounded-full"><Trash2 className="h-4 w-4" /></button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {choices.map((c, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="radio" checked={correct === c} onChange={() => { setCorrect(c); setTimeout(save, 0); }}
              className="accent-primary"
            />
            <input
              value={c}
              onChange={(e) => {
                const nc = [...choices]; nc[i] = e.target.value; setChoices(nc);
                if (correct === c) setCorrect(e.target.value);
              }}
              onBlur={save}
              className="flex-1 bg-transparent border-b py-1 text-sm focus:outline-none focus:border-primary"
            />
          </div>
        ))}
      </div>
      <textarea
        value={explanation} onChange={(e) => setExplanation(e.target.value)} onBlur={save}
        placeholder="Explanation (optional — AI will fill in if empty)"
        rows={2}
        className="w-full bg-transparent border-b py-1 text-sm text-muted-foreground resize-none focus:outline-none focus:border-primary"
      />
    </div>
  );
}
