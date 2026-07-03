import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Search, Plus, LayoutGrid, List, Moon, Sun, Instagram, X } from "lucide-react";
import { Toaster } from "sonner";

import { useDevFolder } from "@/hooks/useDevFolder";
import { Sidebar } from "@/components/devfolder/Sidebar";
import { SnippetCard } from "@/components/devfolder/SnippetCard";
import { SnippetEditor } from "@/components/devfolder/SnippetEditor";
import { EmptyState } from "@/components/devfolder/EmptyState";
import { SnippetsSkeleton } from "@/components/devfolder/SnippetsSkeleton";
import type { Snippet } from "@/lib/types";
import { cn } from "@/lib/utils";

const LAYOUT_STORAGE_KEY = "devfolder_layout_mode";
const THEME_STORAGE_KEY = "devfolder_theme";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DevFolder — Gerenciador minimalista de snippets para devs" },
      {
        name: "description",
        content:
          "Salve, organize e busque trechos de código por linguagem e pasta. Local-first. Rápido. Limpo.",
      },
      { property: "og:title", content: "DevFolder — Gerenciador de snippets para devs" },
      {
        property: "og:description",
        content:
          "Gerenciador de snippets minimalista e local-first com pastas, favoritos e realce de sintaxe.",
      },
    ],
  }),
  component: DevFolderPage,
});

function DevFolderPage() {
  const api = useDevFolder();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Snippet | null>(null);
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window === "undefined") return "dark";
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
    return document.documentElement.classList.contains("light") ? "light" : "dark";
  });
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedLayout = window.localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (savedLayout === "grid" || savedLayout === "list") {
      setLayout(savedLayout);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(LAYOUT_STORAGE_KEY, layout);
  }, [layout]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    document.documentElement.classList.toggle("light", theme === "light");
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const openNew = () => {
    setEditing(null);
    setEditorOpen(true);
  };
  const openEdit = (s: Snippet) => {
    setEditing(s);
    setEditorOpen(true);
  };

  const heading =
    api.view.kind === "all"
      ? "Todos os snippets"
      : api.view.kind === "favorites"
        ? "Favoritos"
        : api.view.kind === "recent"
          ? "Recentes"
          : api.folders.find((f) => f.id === (api.view as { folderId: string }).folderId)?.name ??
            "Pasta";

  const subtitle = !api.ready
    ? "Carregando sua biblioteca…"
    : api.view.kind === "all"
      ? `${api.counts.all} snippet${api.counts.all === 1 ? "" : "s"} em ${api.folders.length} pasta${api.folders.length === 1 ? "" : "s"}`
      : `${api.visibleSnippets.length} snippet${api.visibleSnippets.length === 1 ? "" : "s"}`;

  const isFirstRun = api.ready && api.snippets.length === 0 && api.folders.length === 0;

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background text-foreground md:flex-row">
      <Sidebar api={api} onNewSnippet={openNew} />

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Barra de busca superior */}
        <header className="flex min-h-16 shrink-0 items-center gap-3 border-b border-border px-4 py-3 md:h-16 md:gap-4 md:px-8 md:py-0">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              value={api.query}
              onChange={(e) => api.setQuery(e.target.value)}
              placeholder="Buscar snippets por título, linguagem ou conteúdo…"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
              disabled={!api.ready}
            />
            {api.query && (
              <button
                onClick={() => api.setQuery("")}
                className="rounded px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
              >
                Limpar
              </button>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => setTheme((value) => (value === "dark" ? "light" : "dark"))}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/70 bg-background/70 text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
              aria-label={theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
              title={theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
            <button
              onClick={openNew}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-semibold text-primary-foreground transition-all hover:brightness-110 sm:px-3.5"
            >
              <Plus className="size-3.5" />
              <span className="hidden sm:inline">Novo snippet</span>
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="scrollbar-slim min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto max-w-5xl">
            <div className="mb-6 flex items-end justify-between gap-4 md:mb-8">
              <div className="min-w-0">
                <h2 className="truncate text-2xl font-semibold tracking-tight">
                  {heading}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
              </div>
              <div className="flex shrink-0 gap-1 rounded-md border border-border p-0.5">
                <LayoutButton
                  active={layout === "list"}
                  onClick={() => setLayout("list")}
                  label="Visualização em lista"
                >
                  <List className="size-4" />
                </LayoutButton>
                <LayoutButton
                  active={layout === "grid"}
                  onClick={() => setLayout("grid")}
                  label="Visualização em grade"
                >
                  <LayoutGrid className="size-4" />
                </LayoutButton>
              </div>
            </div>

            {!api.ready ? (
              <SnippetsSkeleton layout={layout} />
            ) : api.visibleSnippets.length === 0 ? (
              <EmptyState
                onNew={openNew}
                onImport={() => importRef.current?.click()}
                hasQuery={!!api.query}
                isFirstRun={isFirstRun}
              />
            ) : (
              <div
                className={cn(
                  "grid gap-6",
                  layout === "grid" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1",
                )}
              >
                {api.visibleSnippets.map((s) => (
                  <SnippetCard
                    key={s.id}
                    snippet={s}
                    folders={api.folders}
                    onEdit={openEdit}
                    onDelete={api.deleteSnippet}
                    onToggleFavorite={api.toggleFavorite}
                    onMove={api.moveSnippet}
                    onReorder={api.reorderSnippets}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <SnippetEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        snippet={editing}
        folders={api.folders}
        onSave={api.upsertSnippet}
        onDelete={api.deleteSnippet}
      />

      <CreatorBadge />

      {/* Hidden file input used by EmptyState "Import from file" */}
      <input
        ref={importRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          try {
            const text = await file.text();
            api.importData(JSON.parse(text), "merge");
          } catch {
            /* toast handled in sidebar path; keep silent here */
          }
          e.target.value = "";
        }}
      />

      <Toaster
        position="bottom-right"
        theme="dark"
        toastOptions={{
          classNames: {
            toast:
              "!bg-card !border !border-border !text-foreground !rounded-lg",
            description: "!text-muted-foreground",
          },
        }}
      />
    </div>
  );
}

function CreatorBadge() {
  const [collapsed, setCollapsed] = useState(false);
  const instagramUrl = "https://www.instagram.com/dev_inojoza_/";

  if (collapsed) {
    return (
      <a
        href={instagramUrl}
        target="_blank"
        rel="noreferrer"
        aria-label="Abrir Instagram de Gabriel Inojoza"
        className="fixed bottom-4 right-4 z-40 flex size-9 items-center justify-center rounded-full border border-border/25 bg-background/25 text-muted-foreground/85 shadow-sm shadow-black/5 backdrop-blur transition-colors hover:border-border/50 hover:bg-background/55 hover:text-foreground md:bottom-5 md:right-5"
      >
        <Instagram className="size-3.5" />
      </a>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 flex max-w-[calc(100vw-2rem)] items-center gap-0.5 rounded-full border border-border/25 bg-background/25 px-1.5 py-1 shadow-sm shadow-black/5 backdrop-blur transition-colors hover:border-border/50 hover:bg-background/55 md:bottom-5 md:right-5">
      <a
        href={instagramUrl}
        target="_blank"
        rel="noreferrer"
        className="group flex min-w-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium text-muted-foreground/85 transition-colors hover:text-foreground"
      >
        <Instagram className="size-3 shrink-0 text-muted-foreground/82 transition-colors group-hover:text-foreground" />
        <span className="truncate">Gabriel Inojoza</span>
      </a>
      <button
        type="button"
        onClick={() => setCollapsed(true)}
        aria-label="Recolher badge"
        className="flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground/80 transition-colors hover:bg-foreground/5 hover:text-foreground"
      >
        <X className="size-3" />
      </button>
    </div>
  );
}

function LayoutButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "rounded p-1.5 transition-colors",
        active
          ? "bg-white/10 text-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
