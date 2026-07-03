import { useEffect, useState } from "react";
import { Check, Copy, Trash2 } from "lucide-react";
import { ConfirmDialog } from "./ConfirmDialog";

import type { Folder, Language, Snippet } from "@/lib/types";
import { LANGUAGES } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CodeBlock } from "./CodeBlock";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  snippet: Snippet | null;
  folders: Folder[];
  onSave: (input: {
    id?: string;
    title: string;
    code: string;
    language: Language;
    folderId: string | null;
  }) => void;
  onDelete?: (id: string) => void;
}

export function SnippetEditor({
  open,
  onOpenChange,
  snippet,
  folders,
  onSave,
  onDelete,
}: Props) {
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState<Language>("typescript");
  const [folderId, setFolderId] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (snippet) {
      setTitle(snippet.title);
      setCode(snippet.code);
      setLanguage(snippet.language);
      setFolderId(snippet.folderId);
      setPreview(true);
    } else {
      setTitle("");
      setCode("");
      setLanguage("typescript");
      setFolderId(null);
      setPreview(false);
    }
  }, [open, snippet]);

  const canSave = title.trim().length > 0 && code.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      id: snippet?.id,
      title: title.trim(),
      code,
      language,
      folderId,
    });
    onOpenChange(false);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[90vh] max-h-[900px] max-w-5xl flex-col gap-0 overflow-hidden p-0">
        <DialogTitle className="sr-only">
          {snippet ? "Editar snippet" : "Novo snippet"}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {snippet ? "Modifique o conteúdo e os metadados do snippet." : "Crie um novo snippet."}
        </DialogDescription>

        <div className="flex items-center gap-4 border-b border-border px-6 py-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título do snippet…"
            className="min-w-0 flex-1 bg-transparent text-lg font-semibold tracking-tight text-foreground outline-none placeholder:text-muted-foreground/50"
          />
        </div>

        <div className="flex items-center gap-3 border-b border-border bg-surface px-6 py-3">
          <Select
            value={language}
            onValueChange={(v) => setLanguage(v as Language)}
          >
            <SelectTrigger className="h-8 w-40 border-border bg-background text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((l) => (
                <SelectItem key={l.value} value={l.value}>
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={folderId ?? "__none"}
            onValueChange={(v) => setFolderId(v === "__none" ? null : v)}
          >
            <SelectTrigger className="h-8 w-48 border-border bg-background text-xs">
              <SelectValue placeholder="Sem pasta" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">Sem pasta</SelectItem>
              {folders.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="ml-auto flex items-center gap-1 rounded-md border border-border p-1">
            <TabButton active={!preview} onClick={() => setPreview(false)}>
              Editar
            </TabButton>
            <TabButton active={preview} onClick={() => setPreview(true)}>
              Prévia
            </TabButton>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden bg-background">
          {preview ? (
            <div className="h-full overflow-auto scrollbar-slim p-6">
              <CodeBlock
                code={code || "// nada para pré-visualizar"}
                language={language}
                withLineNumbers
              />
            </div>
          ) : (
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Cole ou escreva seu código…"
              spellCheck={false}
              className="scrollbar-slim h-full w-full resize-none bg-background p-6 font-mono text-[13px] leading-6 text-foreground outline-none placeholder:text-muted-foreground/40"
            />
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border bg-surface px-6 py-3">
          <div className="flex items-center gap-4">
            {snippet && onDelete && (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-destructive/80 transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="size-3.5" />
                Excluir
              </button>
            )}
            {snippet && (
              <div className="hidden gap-3 text-[10px] font-mono text-muted-foreground md:flex">
                <span>Criado em {new Date(snippet.createdAt).toLocaleDateString("pt-BR")}</span>
                <span>Editado em {new Date(snippet.updatedAt).toLocaleString("pt-BR")}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copy}
              className="gap-1.5"
              disabled={!code}
            >
              {copied ? (
                <>
                  <Check className="size-3.5" /> Copiado
                </>
              ) : (
                <>
                  <Copy className="size-3.5" /> Copiar
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!canSave}
              className="bg-primary text-primary-foreground hover:brightness-110"
            >
              {snippet ? "Salvar alterações" : "Criar snippet"}
            </Button>
          </div>
        </div>
      </DialogContent>

      {snippet && onDelete && (
        <ConfirmDialog
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
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
          onConfirm={() => {
            onDelete(snippet.id);
            setConfirmDelete(false);
            onOpenChange(false);
          }}
        />
      )}
    </Dialog>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "snippet-editor-tab rounded px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "is-active bg-white/10 text-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
