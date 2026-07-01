import { useEffect, useMemo, useState } from "react";
import { Download, FolderIcon, Layers, FileCode2, Search, Check } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DevFolderApi, ExportSelection } from "@/hooks/useDevFolder";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  api: DevFolderApi;
}

type Tab = "all" | "folders" | "snippets";

export function ExportDialog({ open, onOpenChange, api }: Props) {
  const { folders, snippets, counts, exportData } = api;
  const [tab, setTab] = useState<Tab>("all");
  const [folderIds, setFolderIds] = useState<Set<string>>(new Set());
  const [snippetIds, setSnippetIds] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!open) return;
    setTab("all");
    setFolderIds(new Set());
    setSnippetIds(new Set());
    setQ("");
  }, [open]);

  const selection: ExportSelection = useMemo(() => {
    if (tab === "all") return { kind: "all" };
    if (tab === "folders") return { kind: "folders", folderIds: [...folderIds] };
    return { kind: "snippets", snippetIds: [...snippetIds] };
  }, [tab, folderIds, snippetIds]);

  // Live preview of exactly what will be exported
  const preview = useMemo(() => {
    if (tab === "all") {
      return {
        folders: folders.length,
        snippets: counts.all,
        detail: `Toda a biblioteca (${counts.all} snippet${counts.all === 1 ? "" : "s"} · ${folders.length} pasta${folders.length === 1 ? "" : "s"})`,
      };
    }
    if (tab === "folders") {
      const set = folderIds;
      const includedSnippets = snippets.filter((s) => s.folderId && set.has(s.folderId));
      return {
        folders: set.size,
        snippets: includedSnippets.length,
        detail:
          set.size === 0
            ? "Selecione uma ou mais pastas"
            : `${set.size} pasta${set.size === 1 ? "" : "s"} · ${includedSnippets.length} snippet${includedSnippets.length === 1 ? "" : "s"} incluído${includedSnippets.length === 1 ? "" : "s"}`,
      };
    }
    const set = snippetIds;
    const included = snippets.filter((s) => set.has(s.id));
    const uniqueFolders = new Set(included.map((s) => s.folderId).filter(Boolean) as string[]);
    return {
      folders: uniqueFolders.size,
      snippets: included.length,
      detail:
        set.size === 0
          ? "Selecione um ou mais snippets"
          : `${included.length} snippet${included.length === 1 ? "" : "s"}${uniqueFolders.size > 0 ? ` · de ${uniqueFolders.size} pasta${uniqueFolders.size === 1 ? "" : "s"}` : ""}`,
    };
  }, [tab, folderIds, snippetIds, folders, snippets, counts.all]);

  const canExport =
    tab === "all"
      ? counts.all > 0 || folders.length > 0
      : tab === "folders"
        ? folderIds.size > 0
        : snippetIds.size > 0;

  const filteredSnippets = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return snippets;
    return snippets.filter(
      (s) =>
        s.title.toLowerCase().includes(term) ||
        s.language.toLowerCase().includes(term),
    );
  }, [snippets, q]);

  const toggle = (set: Set<string>, id: string, setter: (s: Set<string>) => void) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setter(next);
  };

  const selectAllFolders = () => setFolderIds(new Set(folders.map((f) => f.id)));
  const clearFolders = () => setFolderIds(new Set());
  const selectAllSnippets = () =>
    setSnippetIds(new Set(filteredSnippets.map((s) => s.id)));
  const clearSnippets = () => setSnippetIds(new Set());

  const handleExport = () => {
    try {
      const payload = exportData(selection);
      if (payload.snippets.length === 0 && payload.folders.length === 0) {
        toast.error("Nada para exportar");
        return;
      }
      const date = new Date().toISOString().slice(0, 10);
      let filename = "devfolder-completo";
      if (tab === "folders") filename = `devfolder-pastas-${payload.folders.length}`;
      else if (tab === "snippets") filename = `devfolder-snippets-${payload.snippets.length}`;

      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}-${date}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast.success("Exportação concluída", {
        description: `${payload.snippets.length} snippet${payload.snippets.length === 1 ? "" : "s"} · ${payload.folders.length} pasta${payload.folders.length === 1 ? "" : "s"}`,
      });
      onOpenChange(false);
    } catch {
      toast.error("Não foi possível exportar");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Exportar biblioteca</DialogTitle>
          <DialogDescription>
            Selecione o que deseja incluir na exportação. O arquivo será salvo em JSON
            e poderá ser reimportado a qualquer momento.
          </DialogDescription>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-1 rounded-lg border border-border bg-background/40 p-1">
          <TabButton active={tab === "all"} onClick={() => setTab("all")} icon={<Layers className="size-3.5" />}>
            Tudo
          </TabButton>
          <TabButton
            active={tab === "folders"}
            onClick={() => setTab("folders")}
            icon={<FolderIcon className="size-3.5" />}
            disabled={folders.length === 0}
          >
            Pastas {folderIds.size > 0 && <Badge>{folderIds.size}</Badge>}
          </TabButton>
          <TabButton
            active={tab === "snippets"}
            onClick={() => setTab("snippets")}
            icon={<FileCode2 className="size-3.5" />}
            disabled={snippets.length === 0}
          >
            Snippets {snippetIds.size > 0 && <Badge>{snippetIds.size}</Badge>}
          </TabButton>
        </div>

        <div className="min-h-[240px] py-1">
          {tab === "all" && (
            <div className="rounded-lg border border-border bg-background/40 p-6 text-center">
              <Layers className="mx-auto mb-3 size-8 text-primary/70" />
              <p className="text-sm font-medium text-foreground">
                Exportar toda a biblioteca
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {counts.all} snippet{counts.all === 1 ? "" : "s"} em {folders.length}{" "}
                pasta{folders.length === 1 ? "" : "s"} serão exportados
              </p>
            </div>
          )}

          {tab === "folders" && (
            <>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {folderIds.size} de {folders.length} selecionada
                  {folderIds.size === 1 ? "" : "s"}
                </span>
                <div className="flex gap-2 text-xs">
                  <button
                    onClick={selectAllFolders}
                    className="text-primary hover:underline"
                  >
                    Selecionar todas
                  </button>
                  <button
                    onClick={clearFolders}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Limpar
                  </button>
                </div>
              </div>
              <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-border bg-background/40 p-2 scrollbar-slim">
                {folders.map((f) => {
                  const c = snippets.filter((s) => s.folderId === f.id).length;
                  const checked = folderIds.has(f.id);
                  return (
                    <CheckRow
                      key={f.id}
                      checked={checked}
                      onToggle={() => toggle(folderIds, f.id, setFolderIds)}
                      icon={<FolderIcon className="size-4" />}
                      title={f.name}
                      subtitle={`${c} snippet${c === 1 ? "" : "s"}`}
                    />
                  );
                })}
              </div>
            </>
          )}

          {tab === "snippets" && (
            <>
              <div className="mb-2 flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Buscar por título ou linguagem…"
                    className="w-full rounded-md border border-border bg-background/60 py-1.5 pl-8 pr-2 text-xs outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
                <button
                  onClick={selectAllSnippets}
                  className="text-xs text-primary hover:underline"
                >
                  Selecionar {q ? "filtrados" : "todos"}
                </button>
                <button
                  onClick={clearSnippets}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Limpar
                </button>
              </div>
              <div className="mb-1 text-xs text-muted-foreground">
                {snippetIds.size} de {snippets.length} selecionado
                {snippetIds.size === 1 ? "" : "s"}
              </div>
              <div className="max-h-56 space-y-1 overflow-y-auto rounded-lg border border-border bg-background/40 p-2 scrollbar-slim">
                {filteredSnippets.length === 0 ? (
                  <p className="p-4 text-center text-xs text-muted-foreground">
                    Nenhum snippet encontrado
                  </p>
                ) : (
                  filteredSnippets.map((s) => {
                    const folder = folders.find((f) => f.id === s.folderId);
                    return (
                      <CheckRow
                        key={s.id}
                        checked={snippetIds.has(s.id)}
                        onToggle={() => toggle(snippetIds, s.id, setSnippetIds)}
                        icon={<FileCode2 className="size-4" />}
                        title={s.title}
                        subtitle={`${s.language}${folder ? ` · ${folder.name}` : ""}`}
                      />
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>

        {/* Rich preview */}
        <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <Download className="size-3" />
            Prévia da exportação
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <Stat label="Snippets" value={preview.snippets} />
            <Stat label="Pastas" value={preview.folders} />
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">{preview.detail}</p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleExport}
            disabled={!canExport}
            className="gap-1.5 bg-primary text-primary-foreground hover:brightness-110"
          >
            <Download className="size-3.5" />
            Exportar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
        disabled && "cursor-not-allowed opacity-40 hover:bg-transparent hover:text-muted-foreground",
      )}
    >
      {icon}
      {children}
    </button>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="ml-0.5 rounded-full bg-black/30 px-1.5 py-0 font-mono text-[10px]">
      {children}
    </span>
  );
}

function CheckRow({
  checked,
  onToggle,
  icon,
  title,
  subtitle,
}: {
  checked: boolean;
  onToggle: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left transition-colors",
        checked
          ? "bg-primary/10 ring-1 ring-primary/40"
          : "hover:bg-white/[0.03]",
      )}
    >
      <span
        className={cn(
          "grid size-4 shrink-0 place-items-center rounded border transition-colors",
          checked
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-background",
        )}
      >
        {checked && <Check className="size-3" strokeWidth={3} />}
      </span>
      <span className={cn("shrink-0", checked ? "text-primary" : "text-muted-foreground/70")}>
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-foreground">{title}</span>
        <span className="block truncate text-xs text-muted-foreground">{subtitle}</span>
      </span>
    </button>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="font-mono text-lg font-semibold text-foreground">{value}</span>
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
    </div>
  );
}
