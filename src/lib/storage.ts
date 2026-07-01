import type { Folder, Snippet } from "./types";

const SNIPPETS_KEY = "codepast.snippets.v1";
const FOLDERS_KEY = "codepast.folders.v1";

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export const storage = {
  loadSnippets(): Snippet[] {
    if (typeof window === "undefined") return [];
    return safeParse<Snippet[]>(localStorage.getItem(SNIPPETS_KEY), []);
  },
  saveSnippets(snippets: Snippet[]) {
    if (typeof window === "undefined") return;
    localStorage.setItem(SNIPPETS_KEY, JSON.stringify(snippets));
  },
  loadFolders(): Folder[] {
    if (typeof window === "undefined") return [];
    return safeParse<Folder[]>(localStorage.getItem(FOLDERS_KEY), []);
  },
  saveFolders(folders: Folder[]) {
    if (typeof window === "undefined") return;
    localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
  },
};

export function uid(): string {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
  );
}
