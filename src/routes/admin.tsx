import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { bootstrapAdmin, hasAdminAccount } from "@/lib/admin.functions";
import { Loader2, Shield } from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"loading" | "signin" | "bootstrap">("loading");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    hasAdminAccount().then((r) => setMode(r.exists ? "signin" : "bootstrap"));
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      if (mode === "bootstrap") {
        await bootstrapAdmin({ data: { email, password } });
      }
      const { error: se } = await supabase.auth.signInWithPassword({ email, password });
      if (se) throw se;
      navigate({ to: "/dashboard" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center px-6">
      <div className="w-full max-w-sm glass rounded-3xl shadow-soft p-8">
        <div className="grid place-items-center h-12 w-12 rounded-2xl bg-primary/10 mb-4">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <h1 className="font-display text-3xl">{mode === "bootstrap" ? "Create teacher account" : "Teacher sign in"}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {mode === "bootstrap" ? "One-time setup for Mr. Mostafa Awad." : "Restricted area."}
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <input
            type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full rounded-xl border bg-transparent px-4 py-3 focus:outline-none focus:border-primary"
          />
          <input
            type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (min 8 chars)"
            className="w-full rounded-xl border bg-transparent px-4 py-3 focus:outline-none focus:border-primary"
          />
          {error && <div className="text-sm text-destructive">{error}</div>}
          <button
            type="submit" disabled={busy || mode === "loading"}
            className="w-full rounded-xl bg-primary text-primary-foreground py-3 font-medium hover:opacity-90 disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "bootstrap" ? "Create & sign in" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
