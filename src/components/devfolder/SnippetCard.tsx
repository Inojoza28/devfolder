import { useState } from "react";
import { Copy, Check, Star, Pencil, Trash2, FolderInput, GripVertical } from "lucide-react";

import type { Folder, Snippet } from "@/lib/types";
import { LANGUAGE_COLORS, LANGUAGES } from "@/lib/types";
import { CodeBlock } from "./CodeBlock";
import { ConfirmDialog } from "./ConfirmDialog";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const SNIPPET_DND_TYPE = "application/x-devfolder-snippet";

interface Props {
  snippet: Snippet;
  folders: Folder[];
  onEdit: (s: Snippet) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onMove: (id: string, folderId: string | null) => void;
  onReorder: (activeId: string, overId: string) => void;
}

export function SnippetCard({
  snippet,
  folders,
  onEdit,
  onDelete,
  onToggleFavorite,
  onMove,
  onReorder,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const folder = folders.find((f) => f.id === snippet.folderId);
  const langLabel = LANGUAGES.find((l) => l.value === snippet.language)?.label ?? snippet.language;
  const moveTo = (folderId: string | null) => {
    if (folderId === snippet.folderId) return;
    onMove(snippet.id, folderId);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snippet.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <>
      <div
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData(SNIPPET_DND_TYPE, snippet.id);
          e.dataTransfer.setData("text/plain", snippet.id);
          e.dataTransfer.effectAllowed = "move";
          setDragging(true);
        }}
        onDragEnd={() => setDragging(false)}
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes(SNIPPET_DND_TYPE)) {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            setDragOver(true);
          }
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          const activeId = e.dataTransfer.getData(SNIPPET_DND_TYPE);
          setDragOver(false);
          if (activeId && activeId !== snippet.id) {
            e.preventDefault();
            onReorder(activeId, snippet.id);
          }
        }}
        className={cn(
          "group relative flex flex-col overflow-hidden rounded-xl border bg-card transition-all duration-200",
          dragOver
            ? "border-primary ring-2 ring-primary/40"
            : "border-border hover:border-primary/40",
          dragging && "opacity-50",
        )}
      >
        <div className="flex-1 p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-start gap-2">
              <span
                className="mt-0.5 cursor-grab text-muted-foreground/30 opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
                title="Arraste para reordenar ou mover para uma pasta"
                aria-hidden
              >
                <GripVertical className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <h3
                  className="cursor-pointer truncate text-sm font-medium text-foreground transition-colors group-hover:text-primary"
                  onClick={() => onEdit(snippet)}
                >
                  {snippet.title}
                </h3>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[10px] font-medium",
                      LANGUAGE_COLORS[snippet.language],
                    )}
                  >
                    {langLabel}
                  </span>
                  {folder && (
                    <span className="rounded-full border border-border bg-background/60 px-2 py-0.5 text-[10px] italic text-muted-foreground">
                      {folder.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => onToggleFavorite(snippet.id)}
              className={cn(
                "shrink-0 rounded p-1 transition-colors",
                snippet.favorite
                  ? "text-primary"
                  : "text-muted-foreground/40 hover:text-primary",
              )}
              aria-label={snippet.favorite ? "Remover dos favoritos" : "Favoritar"}
            >
              <Star
                className="size-4"
                fill={snippet.favorite ? "currentColor" : "none"}
              />
            </button>
          </div>

          <div
            onClick={() => onEdit(snippet)}
            className="max-h-40 cursor-pointer overflow-hidden rounded-lg border border-border/60 bg-background/60 p-4"
          >
            <CodeBlock
              code={snippet.code}
              language={snippet.language}
              maxLines={8}
            />
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border bg-black/20 px-5 py-2.5">
          <span className="text-[10px] text-muted-foreground">
            Editado {formatRelative(snippet.updatedAt)}
          </span>
          <div className="flex items-center gap-1">
            <IconAction onClick={copy} label={copied ? "Copiado" : "Copiar"}>
              {copied ? (
                <Check className="size-3.5 text-primary" />
              ) : (
                <Copy className="size-3.5" />
              )}
            </IconAction>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="rounded p-1.5 text-muted-foreground outline-none transition-colors hover:bg-white/5 hover:text-foreground"
                  aria-label="Mover para pasta"
                >
                  <FolderInput className="size-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Mover para</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <MoveMenuItem
                  current={snippet.folderId === null}
                  onSelect={() => moveTo(null)}
                >
                  Sem pasta
                </MoveMenuItem>
                {folders.map((f) => (
                  <MoveMenuItem
                    key={f.id}
                    current={snippet.folderId === f.id}
                    onSelect={() => moveTo(f.id)}
                  >
                    {f.name}
                  </MoveMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <IconAction onClick={() => onEdit(snippet)} label="Editar">
              <Pencil className="size-3.5" />
            </IconAction>
            <IconAction
              onClick={() => setConfirmOpen(true)}
              label="Excluir"
              danger
            >
              <Trash2 className="size-3.5" />
            </IconAction>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Excluir snippet?"
        description={
          <>
            O snippet{" "}
            <span className="font-medium text-foreground">{snippet.title}</span>{" "}
            será removido permanentemente. Esta ação não pode ser desfeita.
          </>
        }
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        destructive
        onConfirm={() => onDelete(snippet.id)}
      />
    </>
  );
}

function MoveMenuItem({
  current,
  onSelect,
  children,
}: {
  current: boolean;
  onSelect: () => void;
  children: React.ReactNode;
}) {
  return (
    <DropdownMenuItem
      onSelect={onSelect}
      aria-current={current ? "true" : undefined}
      className="gap-2"
    >
      <span className="flex size-3.5 shrink-0 items-center justify-center">
        {current && <Check className="size-3.5 text-emerald-500" aria-hidden />}
      </span>
      <span className="min-w-0 flex-1 truncate">{children}</span>
    </DropdownMenuItem>
  );
}

function IconAction({
  onClick,
  label,
  children,
  danger,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "rounded p-1.5 text-muted-foreground transition-colors hover:bg-white/5",
        danger ? "hover:text-destructive" : "hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  const min = 60 * 1000;
  const hour = 60 * min;
  const day = 24 * hour;
  if (diff < min) return "agora mesmo";
  if (diff < hour) return `há ${Math.floor(diff / min)}min`;
  if (diff < day) return `há ${Math.floor(diff / hour)}h`;
  if (diff < 7 * day) return `há ${Math.floor(diff / day)}d`;
  return new Date(ts).toLocaleDateString("pt-BR", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
