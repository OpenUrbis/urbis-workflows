import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FaTimes } from "react-icons/fa";
import { getAccessToken } from "../../../auth/token";
import { ApiClient } from "../../../api";

const api = new ApiClient({
  baseURL: import.meta.env.VITE_BACK_END_API || "",
  headers: { Authorization: `Bearer ${getAccessToken()}` },
});

interface FieldLabel {
  key: string;
  label: string;
  type: "text" | "number";
}

/** A single completed filter clause */
interface QueryToken {
  field: FieldLabel;
  operator: string;
  value: string;
}

const OPERATORS = [
  { value: "=", label: "= igual", description: "Igual a" },
  { value: "!=", label: "≠ diferente", description: "Diferente de" },
  { value: ">", label: "> maior", description: "Maior que" },
  { value: "<", label: "< menor", description: "Menor que" },
  { value: ">=", label: "≥ maior ou igual", description: "Maior ou igual a" },
  { value: "<=", label: "≤ menor ou igual", description: "Menor ou igual a" },
];

const NUMERIC_OPERATORS = OPERATORS;
const TEXT_OPERATORS = OPERATORS.filter((o) => ["=", "!="].includes(o.value));

type BuildStep = "field" | "operator" | "value";

interface StructuredQueryInputProps {
  value: string;
  onChange: (value: string) => void;
  onApply: () => void;
}

/** Serialize tokens into the backend query string format */
function serializeTokens(tokens: QueryToken[]): string {
  return tokens.map((t) => `${t.field.label} ${t.operator} ${t.value}`).join(" & ");
}

/** Parse a serialized query string back into tokens (best-effort, needs field labels) */
function parseTokens(
  query: string,
  fieldLabels: FieldLabel[],
): QueryToken[] {
  if (!query.trim()) return [];
  const clauses = query.split("&").map((c) => c.trim()).filter(Boolean);
  const re = /^(.+?)\s*(>=|<=|!=|>|<|=)\s*(.+)$/;
  const tokens: QueryToken[] = [];
  for (const clause of clauses) {
    const m = clause.match(re);
    if (!m) continue;
    const label = m[1].trim();
    const op = m[2];
    const val = m[3].trim();
    const field = fieldLabels.find((fl) => fl.label.toLowerCase() === label.toLowerCase());
    if (field) {
      tokens.push({ field, operator: op, value: val });
    }
  }
  return tokens;
}

/**
 * Badge-based structured query builder.
 * Flow: select field (autocomplete) → select operator (autocomplete) → type value → Enter → badge.
 */
export function StructuredQueryInput({ value, onChange, onApply }: StructuredQueryInputProps) {
  const [fieldLabels, setFieldLabels] = useState<FieldLabel[]>([]);
  const [tokens, setTokens] = useState<QueryToken[]>([]);
  const [step, setStep] = useState<BuildStep>("field");
  const [currentField, setCurrentField] = useState<FieldLabel | null>(null);
  const [currentOperator, setCurrentOperator] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tokensInitialized = useRef(false);

  // Fetch field labels once on mount
  useEffect(() => {
    api.workflows.getFieldLabels().then(setFieldLabels).catch(() => {});
  }, []);

  // Parse existing value into tokens when field labels arrive (one-time hydration)
  useEffect(() => {
    if (fieldLabels.length > 0 && value && !tokensInitialized.current) {
      const parsed = parseTokens(value, fieldLabels);
      if (parsed.length > 0) setTokens(parsed);
      tokensInitialized.current = true;
    }
  }, [fieldLabels, value]);

  // Sync tokens → serialized value for parent
  const syncToParent = useCallback(
    (newTokens: QueryToken[]) => {
      setTokens(newTokens);
      onChange(serializeTokens(newTokens));
    },
    [onChange],
  );

  // Filtered suggestions for current step
  const suggestions = useMemo(() => {
    if (step === "field") {
      const q = inputValue.toLowerCase();
      if (!q) return fieldLabels.slice(0, 10);
      return fieldLabels.filter((fl) => fl.label.toLowerCase().includes(q)).slice(0, 10);
    }
    if (step === "operator" && currentField) {
      const ops = currentField.type === "number" ? NUMERIC_OPERATORS : TEXT_OPERATORS;
      const q = inputValue.toLowerCase();
      if (!q) return ops;
      return ops.filter((o) => o.label.toLowerCase().includes(q) || o.value.includes(q));
    }
    return [];
  }, [step, inputValue, fieldLabels, currentField]);

  const resetBuilder = useCallback(() => {
    setStep("field");
    setCurrentField(null);
    setCurrentOperator(null);
    setInputValue("");
    setSelectedIdx(0);
    setShowDropdown(false);
  }, []);

  const selectField = useCallback(
    (field: FieldLabel) => {
      setCurrentField(field);
      setStep("operator");
      setInputValue("");
      setSelectedIdx(0);
      setShowDropdown(true);
      setTimeout(() => inputRef.current?.focus(), 0);
    },
    [],
  );

  const selectOperator = useCallback(
    (op: string) => {
      setCurrentOperator(op);
      setStep("value");
      setInputValue("");
      setSelectedIdx(0);
      setShowDropdown(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    },
    [],
  );

  const commitToken = useCallback(() => {
    if (!currentField || !currentOperator || !inputValue.trim()) return;
    const newTokens = [...tokens, { field: currentField, operator: currentOperator, value: inputValue.trim() }];
    syncToParent(newTokens);
    resetBuilder();
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [currentField, currentOperator, inputValue, tokens, syncToParent, resetBuilder]);

  const removeToken = useCallback(
    (index: number) => {
      const newTokens = tokens.filter((_, i) => i !== index);
      syncToParent(newTokens);
    },
    [tokens, syncToParent],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value);
      setSelectedIdx(0);
      if (step === "field" || step === "operator") {
        setShowDropdown(true);
      }
    },
    [step],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const hasSuggestions = (step === "field" || step === "operator") && suggestions.length > 0 && showDropdown;

      if (hasSuggestions) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedIdx((prev) => Math.min(prev + 1, suggestions.length - 1));
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedIdx((prev) => Math.max(prev - 1, 0));
          return;
        }
        if (e.key === "Enter" || e.key === "Tab") {
          e.preventDefault();
          const item = suggestions[selectedIdx];
          if (step === "field" && item && "key" in item) {
            selectField(item as FieldLabel);
          } else if (step === "operator" && item && "value" in item) {
            selectOperator((item as typeof OPERATORS[number]).value);
          }
          return;
        }
        if (e.key === "Escape") {
          setShowDropdown(false);
          return;
        }
      }

      // In value step, Enter commits the token
      if (step === "value" && e.key === "Enter") {
        e.preventDefault();
        commitToken();
        return;
      }

      // Backspace on empty input: go back a step or remove last token
      if (e.key === "Backspace" && inputValue === "") {
        e.preventDefault();
        if (step === "value") {
          setStep("operator");
          setCurrentOperator(null);
          setShowDropdown(true);
        } else if (step === "operator") {
          setStep("field");
          setCurrentField(null);
          setShowDropdown(true);
        } else if (step === "field" && tokens.length > 0) {
          removeToken(tokens.length - 1);
        }
        return;
      }

      // Escape resets the current builder
      if (e.key === "Escape") {
        if (step !== "field" || inputValue) {
          e.preventDefault();
          resetBuilder();
        }
      }
    },
    [step, suggestions, showDropdown, selectedIdx, selectField, selectOperator, commitToken, inputValue, tokens, removeToken, resetBuilder],
  );

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Build the inline "breadcrumb" showing the current build progress
  const buildProgress = useMemo(() => {
    const parts: React.ReactNode[] = [];
    if (currentField) {
      parts.push(
        <span key="f" className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-medium px-1.5 py-0.5 rounded">
          {currentField.label}
        </span>,
      );
    }
    if (currentOperator) {
      parts.push(
        <span key="o" className="inline-flex items-center bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 text-xs font-bold px-1.5 py-0.5 rounded mx-0.5">
          {currentOperator}
        </span>,
      );
    }
    return parts;
  }, [currentField, currentOperator]);

  const placeholder = step === "field"
    ? "Selecione um campo..."
    : step === "operator"
      ? "Selecione operador..."
      : "Digite o valor e pressione Enter";

  return (
    <div ref={containerRef} className="relative">
      {/* Token badges + inline input */}
      <div
        className="flex flex-wrap items-center gap-1.5 min-h-[2.25rem] px-2 py-1 rounded-md border border-input bg-background text-sm cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {/* Completed tokens */}
        {tokens.map((t, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 bg-muted border border-border rounded-md pl-2 pr-1 py-0.5 text-xs font-medium group"
          >
            <span className="text-foreground">{t.field.label}</span>
            <span className="text-amber-600 dark:text-amber-400 font-bold">{t.operator}</span>
            <span className="text-primary font-semibold">{t.value}</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeToken(i); }}
              className="ml-0.5 p-0.5 rounded hover:bg-destructive/20 hover:text-destructive transition-colors"
              aria-label={`Remover filtro ${t.field.label}`}
            >
              <FaTimes size={8} />
            </button>
          </span>
        ))}

        {/* Build progress crumbs */}
        {buildProgress}

        {/* Inline input */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (step === "field" || step === "operator") setShowDropdown(true);
          }}
          placeholder={tokens.length === 0 && step === "field" ? placeholder : step !== "field" ? placeholder : "+"}
          className="flex-1 min-w-[120px] bg-transparent outline-none text-sm placeholder:text-muted-foreground"
        />
      </div>

      {/* Dropdown */}
      {showDropdown && suggestions.length > 0 && (step === "field" || step === "operator") && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden max-h-64 overflow-y-auto">
          {step === "field" && (suggestions as FieldLabel[]).map((s, i) => (
            <button
              key={s.key}
              type="button"
              className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-muted/60 transition-colors ${
                i === selectedIdx ? "bg-muted/60" : ""
              }`}
              onMouseDown={(e) => { e.preventDefault(); selectField(s); }}
              onMouseEnter={() => setSelectedIdx(i)}
            >
              <span className="truncate">{s.label}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded ml-2 shrink-0 ${
                s.type === "number"
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                  : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              }`}>
                {s.type === "number" ? "Número" : "Texto"}
              </span>
            </button>
          ))}
          {step === "operator" && (suggestions as typeof OPERATORS).map((o, i) => (
            <button
              key={o.value}
              type="button"
              className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-muted/60 transition-colors ${
                i === selectedIdx ? "bg-muted/60" : ""
              }`}
              onMouseDown={(e) => { e.preventDefault(); selectOperator(o.value); }}
              onMouseEnter={() => setSelectedIdx(i)}
            >
              <span className="font-mono font-bold text-base mr-3">{o.value}</span>
              <span className="flex-1 text-muted-foreground">{o.description}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
