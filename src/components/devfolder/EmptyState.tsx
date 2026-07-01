import { Plus, Sparkles, Upload } from "lucide-react";

interface Props {
  onNew: () => void;
  onImport: () => void;
  hasQuery: boolean;
  isFirstRun: boolean;
}

export function EmptyState({ onNew, onImport, hasQuery, isFirstRun }: Props) {
  if (hasQuery) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface/40 py-24 text-center">
        <h3 className="text-base font-medium">Nenhum snippet encontrado</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Tente outro termo, linguagem diferente ou limpe a busca.
        </p>
      </div>
    );
  }

  if (!isFirstRun) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface/40 py-20 text-center">
        <h3 className="text-base font-medium">Nada por aqui ainda</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Crie um novo snippet para adicioná-lo a esta visualização.
        </p>
        <button
          onClick={onNew}
          className="mt-6 flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-all hover:brightness-110"
        >
          <Plus className="size-3.5" />
          Novo snippet
        </button>
      </div>
    );
  }

  // Primeira execução — cartão de boas-vindas
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-6">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-primary">
            <Sparkles className="size-3" />
            Bem-vindo
          </div>
          <h3 className="text-lg font-semibold tracking-tight">
            Sua biblioteca de snippets está vazia
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            O DevFolder é um gerenciador de snippets local-first. Tudo fica no seu
            navegador — sem contas, sem servidores. Comece criando seu primeiro
            snippet ou importe uma biblioteca existente.
          </p>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            onClick={onNew}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground transition-all hover:brightness-110"
          >
            <Plus className="size-3.5" />
            Criar primeiro snippet
          </button>
          <button
            onClick={onImport}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3.5 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-white/5"
          >
            <Upload className="size-3.5" />
            Importar de um arquivo
          </button>
        </div>
      </div>

      {/* Cartão fantasma de prévia */}
      <button
        onClick={onNew}
        className="group relative flex flex-col overflow-hidden rounded-xl border border-dashed border-border bg-card/40 text-left transition-all hover:border-primary/50 hover:bg-card/60"
      >
        <div className="flex-1 p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="h-4 w-1/2 rounded bg-white/5" />
              <div className="mt-3 flex gap-2">
                <div className="h-4 w-16 rounded-full bg-white/5" />
                <div className="h-4 w-20 rounded-full bg-white/5" />
              </div>
            </div>
          </div>
          <div className="space-y-2 rounded-lg border border-border/40 bg-background/40 p-4">
            <div className="h-2.5 w-full rounded bg-white/5" />
            <div className="h-2.5 w-11/12 rounded bg-white/5" />
            <div className="h-2.5 w-4/5 rounded bg-white/5" />
            <div className="h-2.5 w-2/3 rounded bg-white/5" />
          </div>
        </div>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/20 opacity-70 backdrop-blur-[1px] transition-opacity group-hover:opacity-100">
          <span className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/90 px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-lg">
            <Plus className="size-3.5" />
            Novo snippet
          </span>
        </div>
      </button>
    </div>
  );
}
