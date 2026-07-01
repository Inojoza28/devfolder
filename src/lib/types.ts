export type Language =
  | "typescript"
  | "javascript"
  | "python"
  | "go"
  | "rust"
  | "java"
  | "csharp"
  | "cpp"
  | "c"
  | "php"
  | "ruby"
  | "swift"
  | "kotlin"
  | "html"
  | "css"
  | "scss"
  | "sql"
  | "bash"
  | "json"
  | "yaml"
  | "markdown"
  | "plaintext";

export const LANGUAGES: { value: Language; label: string }[] = [
  { value: "typescript", label: "TypeScript" },
  { value: "javascript", label: "JavaScript" },
  { value: "python", label: "Python" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "java", label: "Java" },
  { value: "csharp", label: "C#" },
  { value: "cpp", label: "C++" },
  { value: "c", label: "C" },
  { value: "php", label: "PHP" },
  { value: "ruby", label: "Ruby" },
  { value: "swift", label: "Swift" },
  { value: "kotlin", label: "Kotlin" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "scss", label: "SCSS" },
  { value: "sql", label: "SQL" },
  { value: "bash", label: "Bash" },
  { value: "json", label: "JSON" },
  { value: "yaml", label: "YAML" },
  { value: "markdown", label: "Markdown" },
  { value: "plaintext", label: "Plain text" },
];

export const LANGUAGE_COLORS: Record<Language, string> = {
  typescript: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  javascript: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  python: "text-sky-400 bg-sky-500/10 border-sky-500/20",
  go: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  rust: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  java: "text-red-400 bg-red-500/10 border-red-500/20",
  csharp: "text-violet-400 bg-violet-500/10 border-violet-500/20",
  cpp: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
  c: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
  php: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  ruby: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  swift: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  kotlin: "text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20",
  html: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  css: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  scss: "text-pink-400 bg-pink-500/10 border-pink-500/20",
  sql: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  bash: "text-lime-400 bg-lime-500/10 border-lime-500/20",
  json: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  yaml: "text-teal-400 bg-teal-500/10 border-teal-500/20",
  markdown: "text-neutral-300 bg-white/5 border-white/10",
  plaintext: "text-neutral-300 bg-white/5 border-white/10",
};

export interface Folder {
  id: string;
  name: string;
  createdAt: number;
}

export interface Snippet {
  id: string;
  title: string;
  code: string;
  language: Language;
  folderId: string | null;
  favorite: boolean;
  createdAt: number;
  updatedAt: number;
}
