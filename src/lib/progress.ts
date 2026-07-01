// Client-side student progress via localStorage. Simple, no login required.
const KEY = "mrenglish_progress_v1";

export type Progress = {
  studentName: string;
  completed: Record<number, { score: number; total: number; stars: number; passed: boolean; at: string }>;
  weakTopics: Record<string, number>;
};

function empty(): Progress {
  return { studentName: "", completed: {}, weakTopics: {} };
}

export function getProgress(): Progress {
  if (typeof window === "undefined") return empty();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    return { ...empty(), ...JSON.parse(raw) };
  } catch {
    return empty();
  }
}

export function saveProgress(p: Progress) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(p));
}

export function recordLevelResult(levelNumber: number, score: number, total: number, passed: boolean) {
  const p = getProgress();
  const stars = passed ? (score === total ? 3 : score / total >= 0.8 ? 2 : 1) : 0;
  const prev = p.completed[levelNumber];
  // Keep the best stars
  const best = prev && prev.stars > stars ? prev : { score, total, stars, passed, at: new Date().toISOString() };
  p.completed[levelNumber] = best;
  saveProgress(p);
  return best;
}

export function isLevelReachable(levelNumber: number): boolean {
  if (levelNumber <= 1) return true;
  const p = getProgress();
  return !!p.completed[levelNumber - 1]?.passed;
}

export function setStudentName(name: string) {
  const p = getProgress();
  p.studentName = name;
  saveProgress(p);
}
