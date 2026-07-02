import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function assertAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Forbidden: admin only");
}

// Bootstrap: create the very first admin (only when zero admins exist)
export const bootstrapAdmin = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ email: z.string().email(), password: z.string().min(8).max(128) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "admin");
    if ((count ?? 0) > 0) throw new Error("An admin account already exists. Please sign in.");
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });
    if (error || !created.user) throw new Error(error?.message || "Failed to create admin");
    const { error: re } = await supabaseAdmin.from("user_roles").insert({ user_id: created.user.id, role: "admin" });
    if (re) throw new Error(re.message);
    return { ok: true };
  });

export const hasAdminAccount = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count } = await supabaseAdmin.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "admin");
  return { exists: (count ?? 0) > 0 };
});

export const checkAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", context.userId).eq("role", "admin").maybeSingle();
    return { isAdmin: !!data };
  });

// Admin: list all levels (including unpublished)
export const adminListLevels = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.from("levels").select("*").order("number");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminGetLevel = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: level }, { data: questions }] = await Promise.all([
      supabaseAdmin.from("levels").select("*").eq("id", data.id).maybeSingle(),
      supabaseAdmin.from("questions").select("*").eq("level_id", data.id).order("order_index"),
    ]);
    return { level, questions: questions ?? [] };
  });

export const adminSaveLevel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid().optional(),
      number: z.number().int().positive(),
      title: z.string().min(1).max(120),
      description: z.string().max(500).default(""),
      question_count: z.number().int().positive().max(50),
      pass_percentage: z.number().int().min(1).max(100),
      is_published: z.boolean(),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.id) {
      const { error } = await supabaseAdmin.from("levels").update({
        number: data.number, title: data.title, description: data.description,
        question_count: data.question_count, pass_percentage: data.pass_percentage,
        is_published: data.is_published, updated_at: new Date().toISOString(),
      }).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: created, error } = await supabaseAdmin.from("levels").insert({
      number: data.number, title: data.title, description: data.description,
      question_count: data.question_count, pass_percentage: data.pass_percentage,
      is_published: data.is_published, position: data.number,
    }).select("id").single();
    if (error) throw new Error(error.message);
    return { id: created.id };
  });

export const adminDeleteLevel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("levels").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminSaveQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid().optional(),
      level_id: z.string().uuid(),
      order_index: z.number().int().min(0),
      type: z.enum(["mcq", "tf", "fill"]).default("mcq"),
      prompt: z.string().min(1),
      choices: z.array(z.string()).min(2).max(6),
      correct_answer: z.string().min(1),
      explanation: z.string().default(""),
      grammar_note: z.string().default(""),
      difficulty: z.enum(["easy", "medium", "hard"]).default("easy"),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.id) {
      const { error } = await supabaseAdmin.from("questions").update({
        order_index: data.order_index, type: data.type, prompt: data.prompt,
        choices: data.choices, correct_answer: data.correct_answer,
        explanation: data.explanation, grammar_note: data.grammar_note, difficulty: data.difficulty,
      }).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: created, error } = await supabaseAdmin.from("questions").insert({
      level_id: data.level_id, order_index: data.order_index, type: data.type,
      prompt: data.prompt, choices: data.choices, correct_answer: data.correct_answer,
      explanation: data.explanation, grammar_note: data.grammar_note, difficulty: data.difficulty,
    }).select("id").single();
    if (error) throw new Error(error.message);
    return { id: created.id };
  });

export const adminDeleteQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("questions").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// AI: generate a set of quiz questions for a topic
export const aiGenerateQuestions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      topic: z.string().min(2).max(200),
      count: z.number().int().min(1).max(15).default(7),
      difficulty: z.enum(["easy", "medium", "hard"]).default("easy"),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
    const { generateText, Output } = await import("ai");
    const { z: zz } = await import("zod");
    const gateway = createLovableAiGatewayProvider(key);
    const { output } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      output: Output.object({
        schema: zz.object({
          questions: zz.array(zz.object({
            prompt: zz.string(),
            choices: zz.array(zz.string()).length(4),
            correct_answer: zz.string(),
            explanation: zz.string(),
            grammar_note: zz.string(),
          })),
        }),
      }),
      prompt: `Generate ${data.count} ${data.difficulty} multiple-choice English grammar questions on the topic: "${data.topic}". Each question has exactly 4 choices, one correct. The "correct_answer" must exactly match one of the choices. Include a short explanation and grammar note for each.`,
    });
    return output;
  });
