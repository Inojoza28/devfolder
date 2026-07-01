import { useCallback, useEffect, useMemo, useState } from "react";
import { storage, uid } from "@/lib/storage";
import type { Folder, Language, Snippet } from "@/lib/types";

export type View =
  | { kind: "all" }
  | { kind: "favorites" }
  | { kind: "recent" }
  | { kind: "folder"; folderId: string };

export interface ExportPayload {
  version: 1;
  exportedAt: number;
  folders: Folder[];
  snippets: Snippet[];
}

export type ExportSelection =
  | { kind: "all" }
  | { kind: "folders"; folderIds: string[] }
  | { kind: "snippets"; snippetIds: string[] }
  | { kind: "custom"; folderIds: string[]; snippetIds: string[] };

export function useCodePast() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<View>({ kind: "all" });
  const [query, setQuery] = useState("");

  // Load synchronously on mount — no artificial delay
  useEffect(() => {
    setFolders(storage.loadFolders());
    setSnippets(storage.loadSnippets());
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) storage.saveSnippets(snippets);
  }, [snippets, ready]);
  useEffect(() => {
    if (ready) storage.saveFolders(folders);
  }, [folders, ready]);

  const addFolder = useCallback((name: string) => {
    const folder: Folder = { id: uid(), name: name.trim(), createdAt: Date.now() };
    setFolders((prev) => [...prev, folder]);
    return folder;
  }, []);

  const renameFolder = useCallback((id: string, name: string) => {
    setFolders((prev) => prev.map((f) => (f.id === id ? { ...f, name: name.trim() } : f)));
  }, []);

  const deleteFolder = useCallback((id: string, mode: "move" | "delete-snippets" = "move") => {
    setFolders((prev) => prev.filter((f) => f.id !== id));
    if (mode === "delete-snippets") {
      setSnippets((prev) => prev.filter((s) => s.folderId !== id));
    } else {
      setSnippets((prev) => prev.map((s) => (s.folderId === id ? { ...s, folderId: null } : s)));
    }
    setView((v) => (v.kind === "folder" && v.folderId === id ? { kind: "all" } : v));
  }, []);

  const reorderFolders = useCallback((activeId: string, overId: string) => {
    if (activeId === overId) return;
    setFolders((prev) => {
      const from = prev.findIndex((f) => f.id === activeId);
      const to = prev.findIndex((f) => f.id === overId);
      if (from === -1 || to === -1) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }, []);

  const upsertSnippet = useCallback(
    (input: {
      id?: string;
      title: string;
      code: string;
      language: Language;
      folderId: string | null;
    }) => {
      const now = Date.now();
      if (input.id) {
        setSnippets((prev) =>
          prev.map((s) =>
            s.id === input.id
              ? {
                  ...s,
                  title: input.title,
                  code: input.code,
                  language: input.language,
                  folderId: input.folderId,
                  updatedAt: now,
                }
              : s,
          ),
        );
        return input.id;
      }
      const snippet: Snippet = {
        id: uid(),
        title: input.title,
        code: input.code,
        language: input.language,
        folderId: input.folderId,
        favorite: false,
        createdAt: now,
        updatedAt: now,
      };
      setSnippets((prev) => [snippet, ...prev]);
      return snippet.id;
    },
    [],
  );

  const deleteSnippet = useCallback((id: string) => {
    setSnippets((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setSnippets((prev) => prev.map((s) => (s.id === id ? { ...s, favorite: !s.favorite } : s)));
  }, []);

  const moveSnippet = useCallback((id: string, folderId: string | null) => {
    setSnippets((prev) =>
      prev.map((s) => (s.id === id ? { ...s, folderId, updatedAt: Date.now() } : s)),
    );
  }, []);

  const reorderSnippets = useCallback((activeId: string, overId: string) => {
    if (activeId === overId) return;
    setSnippets((prev) => {
      const from = prev.findIndex((s) => s.id === activeId);
      const to = prev.findIndex((s) => s.id === overId);
      if (from === -1 || to === -1) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }, []);

  const exportData = useCallback(
    (selection?: ExportSelection): ExportPayload => {
      const sel = selection ?? { kind: "all" as const };

      if (sel.kind === "all") {
        return { version: 1, exportedAt: Date.now(), folders, snippets };
      }

      const folderIds =
        sel.kind === "folders" || sel.kind === "custom" ? sel.folderIds : [];
      const snippetIds =
        sel.kind === "snippets" || sel.kind === "custom" ? sel.snippetIds : [];

      const folderSet = new Set(folderIds);
      const snippetSet = new Set(snippetIds);

      // All snippets contained in the selected folders + any directly selected snippet
      const includedSnippets = snippets.filter(
        (s) => snippetSet.has(s.id) || (s.folderId && folderSet.has(s.folderId)),
      );

      // Include selected folders + folders referenced by included snippets
      const referencedFolderIds = new Set<string>(folderIds);
      for (const s of includedSnippets) {
        if (s.folderId) referencedFolderIds.add(s.folderId);
      }
      const includedFolders = folders.filter((f) => referencedFolderIds.has(f.id));

      return {
        version: 1,
        exportedAt: Date.now(),
        folders: includedFolders,
        snippets: includedSnippets,
      };
    },
    [folders, snippets],
  );

  const importData = useCallback(
    (payload: unknown, mode: "merge" | "replace" = "merge") => {
      const p = payload as Partial<ExportPayload>;
      if (
        !p ||
        typeof p !== "object" ||
        !Array.isArray(p.folders) ||
        !Array.isArray(p.snippets)
      ) {
        throw new Error("Invalid file format");
      }

      const incomingFolders = p.folders.filter(
        (f): f is Folder => !!f && typeof f.id === "string" && typeof f.name === "string",
      );
      const incomingSnippets = p.snippets.filter(
        (s): s is Snippet =>
          !!s && typeof s.id === "string" && typeof s.title === "string" && typeof s.code === "string",
      );

      if (mode === "replace") {
        setFolders(incomingFolders);
        setSnippets(incomingSnippets);
        return { folders: incomingFolders.length, snippets: incomingSnippets.length };
      }

      let addedFolders = 0;
      let addedSnippets = 0;
      setFolders((prev) => {
        const existing = new Set(prev.map((f) => f.id));
        const toAdd = incomingFolders.filter((f) => !existing.has(f.id));
        addedFolders = toAdd.length;
        return [...prev, ...toAdd];
      });
      setSnippets((prev) => {
        const existing = new Set(prev.map((s) => s.id));
        const toAdd = incomingSnippets.filter((s) => !existing.has(s.id));
        addedSnippets = toAdd.length;
        return [...toAdd, ...prev];
      });
      return { folders: addedFolders, snippets: addedSnippets };
    },
    [],
  );

  const visibleSnippets = useMemo(() => {
    let list = snippets;
    if (view.kind === "favorites") list = list.filter((s) => s.favorite);
    else if (view.kind === "folder")
      list = list.filter((s) => s.folderId === view.folderId);
    else if (view.kind === "recent")
      list = [...list].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 20);

    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.language.toLowerCase().includes(q) ||
          s.code.toLowerCase().includes(q),
      );
    }
    return list;
  }, [snippets, view, query]);

  const counts = useMemo(() => {
    const perFolder: Record<string, number> = {};
    for (const s of snippets) {
      if (s.folderId) perFolder[s.folderId] = (perFolder[s.folderId] ?? 0) + 1;
    }
    return {
      all: snippets.length,
      favorites: snippets.filter((s) => s.favorite).length,
      perFolder,
    };
  }, [snippets]);

  return {
    ready,
    folders,
    snippets,
    visibleSnippets,
    view,
    setView,
    query,
    setQuery,
    counts,
    addFolder,
    renameFolder,
    deleteFolder,
    reorderFolders,
    upsertSnippet,
    deleteSnippet,
    toggleFavorite,
    moveSnippet,
    reorderSnippets,
    exportData,
    importData,
  };
}

export type CodePastApi = ReturnType<typeof useCodePast>;
