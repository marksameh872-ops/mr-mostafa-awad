import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Public: get level list (published only for anon, all for admin RLS-controlled)
export const listLevels = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("levels")
    .select("id, number, title, description, question_count, pass_percentage, is_published, position")
    .order("number", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
});

// Public: get sanitized questions for a level (no correct_answer / explanation)
export const getLevelQuiz = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ number: z.number().int().positive() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: level, error: le } = await supabaseAdmin
      .from("levels")
      .select("id, number, title, description, question_count, pass_percentage, is_published")
      .eq("number", data.number)
      .maybeSingle();
    if (le) throw new Error(le.message);
    if (!level || !level.is_published) {
      return { level: null, questions: [] as Array<{ id: string; prompt: string; choices: string[]; type: string; media_url: string | null }> };
    }
    const { data: qs, error: qe } = await supabaseAdmin
      .from("questions")
      .select("id, prompt, choices, type, media_url, order_index")
      .eq("level_id", level.id)
      .order("order_index", { ascending: true })
      .limit(level.question_count);
    if (qe) throw new Error(qe.message);
    return {
      level,
      questions: (qs ?? []).map((q) => ({
        id: q.id,
        prompt: q.prompt,
        choices: (q.choices as string[]) ?? [],
        type: q.type,
        media_url: q.media_url,
      })),
    };
  });

// Public: grade an answer, return correctness + explanation (AI-generated if missing, cached)
export const gradeAnswer = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ questionId: z.string().uuid(), chosen: z.string().max(500) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: q, error } = await supabaseAdmin
      .from("questions")
      .select("id, prompt, choices, correct_answer, explanation, grammar_note")
      .eq("id", data.questionId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!q) throw new Error("Question not found");

    const isCorrect = String(q.correct_answer).trim().toLowerCase() === data.chosen.trim().toLowerCase();
    let explanation = q.explanation ?? "";
    let grammar = q.grammar_note ?? "";

    if (!explanation || explanation.length < 20) {
      try {
        const key = process.env.LOVABLE_API_KEY;
        if (key) {
          const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
          const { generateText } = await import("ai");
          const gateway = createLovableAiGatewayProvider(key);
          const { text } = await generateText({
            model: gateway("google/gemini-3-flash-preview"),
            prompt: `You are a friendly English teacher. Explain this multiple-choice question briefly:
Question: ${q.prompt}
Choices: ${JSON.stringify(q.choices)}
Correct answer: ${q.correct_answer}
Student chose: ${data.chosen}

Reply in 2-3 short paragraphs: (1) Why the correct answer is right, (2) the grammar rule, (3) one example. Warm, encouraging tone.`,
          });
          explanation = text.trim();
          await supabaseAdmin.from("questions").update({ explanation }).eq("id", q.id);
        }
      } catch (e) {
        console.error("AI explanation failed", e);
      }
    }

    return {
      correct: isCorrect,
      correctAnswer: q.correct_answer,
      explanation,
      grammar,
    };
  });

// Public: record an attempt (anonymous)
export const recordAttempt = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      levelId: z.string().uuid(),
      studentName: z.string().min(1).max(80).default("Anonymous"),
      score: z.number().int().min(0),
      total: z.number().int().positive(),
      passed: z.boolean(),
      answers: z.array(z.object({
        questionId: z.string().uuid(),
        chosen: z.string(),
        correct: z.boolean(),
      })),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("attempts").insert({
      level_id: data.levelId,
      student_name: data.studentName,
      score: data.score,
      total: data.total,
      passed: data.passed,
      answers: data.answers,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
