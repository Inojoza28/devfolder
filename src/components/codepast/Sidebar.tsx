import { useEffect, useRef, useState } from "react";
import {
  Folder as FolderIcon,
  Layers,
  Star,
  Clock,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Download,
  Upload,
  GripVertical,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

import type { CodePastApi } from "@/hooks/useCodePast";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "./ConfirmDialog";
import { ExportDialog } from "./ExportDialog";
import { SNIPPET_DND_TYPE } from "./SnippetCard";
import logoSrc from "@/assets/logo_codepast.png";

const FOLDER_DND_TYPE = "application/x-codepast-folder";
const SIDEBAR_STORAGE_KEY = "codepast_sidebar_collapsed";

interface Props {
  api: CodePastApi;
  onNewSnippet: () => void;
}

export function Sidebar({ api, onNewSnippet }: Props) {
  const {
    folders,
    view,
    setView,
    counts,
    addFolder,
    renameFolder,
    deleteFolder,
    reorderFolders,
    moveSnippet,
    importData,
  } = api;
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | "__none" | null>(null);
  const [folderDropId, setFolderDropId] = useState<string | null>(null);
  const [draggingFolderId, setDraggingFolderId] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
    setCollapsed(saved === "1" || saved === "true");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  const commitNew = () => {
    if (newName.trim()) addFolder(newName);
    setNewName("");
    setAdding(false);
  };

  const handleFile = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const result = importData(parsed, "merge");
      toast.success("Biblioteca importada", {
        description: `${result.snippets} novo${result.snippets === 1 ? "" : "s"} snippet${result.snippets === 1 ? "" : "s"} · ${result.folders} nova${result.folders === 1 ? "" : "s"} pasta${result.folders === 1 ? "" : "s"}`,
      });
    } catch (err) {
      toast.error("Falha na importação", {
        description: err instanceof Error ? err.message : "Arquivo inválido",
      });
    }
  };

  return (
    <>
      <aside
        className={cn(
          "flex shrink-0 flex-col border-r border-border bg-surface transition-[width] duration-200 ease-out overflow-hidden overflow-x-hidden",
          collapsed ? "w-[3.75rem] max-w-[3.75rem]" : "w-64",
        )}
      >
      <div
        className={cn(
          collapsed
            ? "flex flex-col items-center gap-2 pt-6 pb-4 px-0"
            : "flex items-center gap-1.5 pt-6 pb-4 justify-between px-3",
        )}
      >
        <div className="flex items-center gap-2">
          <img
            src={logoSrc}
            alt="CodePast"
            width={34}
            height={34}
            className="size-[34px] shrink-0"
          />
          {!collapsed && (
            <h1 className="text-base font-semibold tracking-tight">CodePast</h1>
          )}
        </div>

        {collapsed ? (
          <div className="mt-1">
            <button
              onClick={() => setCollapsed((value) => !value)}
              className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
              aria-label={collapsed ? "Expandir barra lateral" : "Recolher barra lateral"}
              title={collapsed ? "Expandir barra lateral" : "Recolher barra lateral"}
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setCollapsed((value) => !value)}
            className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
            aria-label={collapsed ? "Expandir barra lateral" : "Recolher barra lateral"}
            title={collapsed ? "Expandir barra lateral" : "Recolher barra lateral"}
          >
            <ChevronLeft className="size-4" />
          </button>
        )}
      </div>

      <div className={cn("pb-4", collapsed ? "px-0" : "px-4")}>
        <Button
          onClick={onNewSnippet}
          className={cn(
            "w-full gap-2 bg-primary text-primary-foreground hover:brightness-110",
            collapsed ? "justify-center px-0" : "justify-start",
          )}
          size="sm"
        >
          <Plus className="size-4" />
          {!collapsed && "Novo snippet"}
        </Button>
      </div>

      <nav className={cn("flex-1 overflow-y-auto overflow-x-hidden scrollbar-slim pb-4 min-w-0", collapsed ? "px-0" : "px-3")}>
        <NavItem
          icon={<Layers className="size-4" />}
          label="Todos os snippets"
          count={counts.all}
          active={view.kind === "all"}
          onClick={() => setView({ kind: "all" })}
          collapsed={collapsed}
        />
        <NavItem
          icon={<Star className="size-4" />}
          label="Favoritos"
          count={counts.favorites}
          active={view.kind === "favorites"}
          onClick={() => setView({ kind: "favorites" })}
          collapsed={collapsed}
        />
        <NavItem
          icon={<Clock className="size-4" />}
          label="Recentes"
          active={view.kind === "recent"}
          onClick={() => setView({ kind: "recent" })}
          collapsed={collapsed}
        />

        {/* "No folder" drop target */}
        <div
          onDragOver={(e) => {
            if (e.dataTransfer.types.includes(SNIPPET_DND_TYPE)) {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              setDropTargetId("__none");
            }
          }}
          onDragLeave={() => setDropTargetId((v) => (v === "__none" ? null : v))}
          onDrop={(e) => {
            const id = e.dataTransfer.getData(SNIPPET_DND_TYPE);
            setDropTargetId(null);
            if (id) {
              e.preventDefault();
              moveSnippet(id, null);
              toast.success("Removido da pasta");
            }
          }}
          className={cn(
            "mt-1 rounded-md transition-colors",
            dropTargetId === "__none" && "bg-primary/10 ring-1 ring-primary/40",
          )}
        >
          <div className={cn(
            "pointer-events-none py-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground/50",
            collapsed && "sr-only px-0",
            !collapsed && "px-3",
          )}>
            {dropTargetId === "__none" ? "Solte para remover da pasta" : ""}
          </div>
        </div>

        <div className={cn("mt-4 mb-2 flex items-center", collapsed ? "justify-center px-0" : "justify-between px-3")}> 
          <span
            className={cn(
              "text-[10px] font-bold uppercase tracking-widest text-muted-foreground",
              collapsed && "sr-only",
            )}
          >
            Pastas
          </span>
          <button
            onClick={() => setAdding((v) => !v)}
            className="text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Nova pasta"
            title="Nova pasta"
          >
            <Plus className="size-3.5" />
          </button>
        </div>

        {adding && !collapsed && (
          <div className="mb-1 flex items-center gap-1 px-2">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitNew();
                if (e.key === "Escape") {
                  setAdding(false);
                  setNewName("");
                }
              }}
              placeholder="Nome da pasta"
              className="min-w-0 flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              onClick={commitNew}
              className="rounded p-1 text-primary hover:bg-white/5"
            >
              <Check className="size-3.5" />
            </button>
          </div>
        )}

        <div className="space-y-0.5">
          {folders.map((f) => {
            const active = view.kind === "folder" && view.folderId === f.id;
            const editing = editingId === f.id;
            const isDropTarget = dropTargetId === f.id;
            const isFolderDropTarget = folderDropId === f.id && draggingFolderId !== f.id;
            const isBeingDragged = draggingFolderId === f.id;
            return (
              <div
                key={f.id}
                draggable={!editing}
                onDragStart={(e) => {
                  e.dataTransfer.setData(FOLDER_DND_TYPE, f.id);
                  e.dataTransfer.effectAllowed = "move";
                  setDraggingFolderId(f.id);
                }}
                onDragEnd={() => {
                  setDraggingFolderId(null);
                  setFolderDropId(null);
                }}
                onDragOver={(e) => {
                  if (e.dataTransfer.types.includes(FOLDER_DND_TYPE)) {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                    setFolderDropId(f.id);
                  }
                }}
                onDragLeave={() =>
                  setFolderDropId((v) => (v === f.id ? null : v))
                }
                onDrop={(e) => {
                  const activeId = e.dataTransfer.getData(FOLDER_DND_TYPE);
                  setFolderDropId(null);
                  if (activeId && activeId !== f.id) {
                    e.preventDefault();
                    reorderFolders(activeId, f.id);
                  }
                }}
                className={cn(
                  "group relative rounded-md",
                  isBeingDragged && "opacity-40",
                  isFolderDropTarget && "ring-2 ring-primary/60",
                )}
              >
                {editing ? (
                  <div className="flex items-center gap-1 px-2 py-1">
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          if (editName.trim()) renameFolder(f.id, editName);
                          setEditingId(null);
                        }
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="min-w-0 flex-1 rounded-md border border-border bg-background px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-ring"
                    />
                    <button
                      onClick={() => {
                        if (editName.trim()) renameFolder(f.id, editName);
                        setEditingId(null);
                      }}
                      className="rounded p-1 text-primary hover:bg-white/5"
                    >
                      <Check className="size-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="rounded p-1 text-muted-foreground hover:bg-white/5"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ) : (
                            <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setView({ kind: "folder", folderId: f.id })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setView({ kind: "folder", folderId: f.id });
                        }
                      }}
                      onDragOver={(e) => {
                        if (e.dataTransfer.types.includes(SNIPPET_DND_TYPE)) {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = "move";
                          setDropTargetId(f.id);
                        }
                      }}
                      onDragLeave={() =>
                        setDropTargetId((v) => (v === f.id ? null : v))
                      }
                      onDrop={(e) => {
                        const id = e.dataTransfer.getData(SNIPPET_DND_TYPE);
                        setDropTargetId(null);
                        if (id) {
                          e.preventDefault();
                          moveSnippet(id, f.id);
                          toast.success(`Movido para ${f.name}`);
                        }
                      }}
                      title={collapsed ? f.name : undefined}
                      className={cn(
                        "group/item flex w-full items-center rounded-md px-2 py-1.5 text-sm transition-colors",
                        collapsed && "justify-center gap-0",
                        active
                          ? "bg-white/5 text-foreground"
                          : "text-muted-foreground hover:bg-white/[0.03] hover:text-foreground",
                        isDropTarget && "bg-primary/10 ring-1 ring-primary/50",
                      )}
                    >
                      {!collapsed && (
                        <span
                          className="cursor-grab text-muted-foreground/30 opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
                          aria-hidden
                          title="Arraste para reordenar"
                        >
                          <GripVertical className="size-3.5" />
                        </span>
                      )}
                      <FolderIcon
                        className={cn(
                          "size-4 shrink-0 mr-2",
                          active || isDropTarget
                            ? "text-primary"
                            : "text-muted-foreground/60",
                        )}
                      />
                      <span className={cn("min-w-0 truncate text-left", collapsed && "sr-only")}>{f.name}</span>
                      {!collapsed && (
                        <>
                          <span className="ml-auto font-mono text-[10px] text-muted-foreground/60 opacity-100 group-hover:opacity-0">
                            {counts.perFolder[f.id] ?? 0}
                          </span>
                          <span className="absolute right-2 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingId(f.id);
                                setEditName(f.name);
                              }}
                              className="rounded p-1 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                              aria-label="Renomear pasta"
                            >
                              <Pencil className="size-3" />
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPendingDelete({ id: f.id, name: f.name });
                              }}
                              className="rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/20 hover:text-destructive"
                              aria-label="Excluir pasta"
                              title="Excluir pasta"
                            >
                              <Trash2 className="size-3" />
                            </button>
                          </span>
                        </>
                      )}
                    </div>
                )}
              </div>
            );
          })}
          {folders.length === 0 && !adding && (
            <p className={cn(
              "px-3 py-2 text-xs text-muted-foreground/60",
              collapsed && "sr-only",
            )}>
              Nenhuma pasta ainda
            </p>
          )}
        </div>
      </nav>

      <div className="border-t border-border p-3">
          {collapsed ? (
            <div className="mb-2 flex flex-col items-center gap-2">
              <button
                onClick={() => setExportOpen(true)}
                disabled={counts.all === 0 && folders.length === 0}
                className="flex h-11 w-11 items-center justify-center rounded-md border border-border bg-background/40 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                title="Exportar biblioteca em JSON"
              >
                <Download className="size-4" />
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                className="flex h-11 w-11 items-center justify-center rounded-md border border-border bg-background/40 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
                title="Importar biblioteca JSON"
              >
                <Upload className="size-4" />
              </button>
            </div>
          ) : (
            <div className="mb-2 flex gap-1.5">
              <button
                onClick={() => setExportOpen(true)}
                disabled={counts.all === 0 && folders.length === 0}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-border bg-background/40 px-2 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                title="Exportar biblioteca em JSON"
              >
                <Download className="size-3" />
                Exportar
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-border bg-background/40 px-2 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
                title="Importar biblioteca JSON"
              >
                <Upload className="size-3" />
                Importar
              </button>
            </div>
          )}
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = "";
              }}
            />
          <p className={cn("px-1 text-[10px] text-muted-foreground", collapsed && "sr-only")}>
            <span className="font-mono">v1.0</span> · Dados salvos localmente
          </p>
      </div>

      </aside>
      <ExportDialog open={exportOpen} onOpenChange={setExportOpen} api={api} />

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(v) => !v && setPendingDelete(null)}
        title={
          <div className="flex items-center gap-2">
            <Trash2 className="size-4 text-destructive" />
            <span>Excluir pasta?</span>
          </div>
        }
        description={
          pendingDelete && (
            <div className="space-y-3 text-left">
              <p>
                A pasta{" "}
                <span className="font-medium text-foreground">{pendingDelete.name}</span>{" "}
                será removida. Como você quer tratar os snippets que estão nela?
              </p>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (pendingDelete) deleteFolder(pendingDelete.id, "move");
                    setPendingDelete(null);
                  }}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-accent"
                >
                  <span className="font-medium">Mover para Todos os snippets</span>
                  <p className="mt-1 text-xs text-muted-foreground">
                    A pasta some, mas os snippets ficam acessíveis na visão geral.
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (pendingDelete) deleteFolder(pendingDelete.id, "delete-snippets");
                    setPendingDelete(null);
                  }}
                  className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-destructive/20"
                >
                  <span className="font-medium text-destructive">Excluir pasta e snippets</span>
                  <p className="mt-1 text-xs text-muted-foreground">
                    A pasta e todos os snippets dentro dela serão removidos permanentemente.
                  </p>
                </button>
              </div>
            </div>
          )
        }
        confirmLabel=""
        cancelLabel="Cancelar"
        destructive={false}
        hideConfirmButton
        onConfirm={() => {
          if (pendingDelete) deleteFolder(pendingDelete.id, "move");
          setPendingDelete(null);
        }}
      />
    </>
  );
}

function NavItem({
  icon,
  label,
  count,
  active,
  onClick,
  collapsed,
}: {
  icon: React.ReactNode;
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
  collapsed: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center rounded-md text-sm transition-colors",
        collapsed ? "justify-center gap-0 px-0 py-2" : "gap-3 px-3 py-2",
        active
          ? "bg-white/5 text-foreground"
          : "text-muted-foreground hover:bg-white/[0.03] hover:text-foreground",
      )}
      title={collapsed ? label : undefined}
    >
      <span className={cn(active ? "text-primary" : "text-muted-foreground/60")}>
        {icon}
      </span>
      <span className={cn("flex-1 overflow-hidden text-left font-medium", collapsed && "sr-only")}>{label}</span>
      {typeof count === "number" && !collapsed && (
        <span className="font-mono text-[10px] text-muted-foreground/60">
          {count}
        </span>
      )}
    </button>
  );
}
