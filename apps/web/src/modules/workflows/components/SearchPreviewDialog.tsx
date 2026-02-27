import React, { useEffect, useState } from "react";
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@open-urbis/map-ui";
import { FaSearch, FaExternalLinkAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { ApiClient } from "../../../api";
import { FindOneWorkflowResponse } from "../../../api/types/workflows.dto";
import { Spinner } from "../../../components";
import { formatId } from "../activities/common";
import { findFieldMatches, FieldMatch } from "../utils/field-matcher";
import { getAccessToken } from "../../../auth/token";

const api = new ApiClient({
  baseURL: import.meta.env.VITE_BACK_END_API || "",
  headers: {
    Authorization: `Bearer ${getAccessToken()}`,
  },
});

interface SearchPreviewDialogProps {
  workflowId: string | null;
  query: string;
  onClose: () => void;
}

export function SearchPreviewDialog({
  workflowId,
  query,
  onClose,
}: SearchPreviewDialogProps): JSX.Element {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [workflow, setWorkflow] = useState<FindOneWorkflowResponse | null>(
    null,
  );
  const [matches, setMatches] = useState<FieldMatch[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!workflowId || !query) {
      setWorkflow(null);
      setMatches([]);
      return;
    }

    let cancelled = false;

    const fetchAndMatch = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.workflows.findOne(workflowId);
        if (cancelled) return;

        setWorkflow(response);

        const fieldMatches = findFieldMatches(
          response.schema,
          response.value,
          query,
        );
        setMatches(fieldMatches);
      } catch (err) {
        if (!cancelled) {
          console.error("Error fetching workflow preview:", err);
          setError("Não foi possível carregar a pré-visualização.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAndMatch();
    return () => {
      cancelled = true;
    };
  }, [workflowId, query]);

  // Group matches by activity
  const matchesByActivity = matches.reduce(
    (acc, match) => {
      if (!acc[match.activityNamespace]) {
        acc[match.activityNamespace] = {
          label: match.activityLabel,
          fields: [],
        };
      }
      acc[match.activityNamespace].fields.push(match);
      return acc;
    },
    {} as Record<string, { label: string; fields: FieldMatch[] }>,
  );

  const activityGroups = Object.values(matchesByActivity);

  return (
    <Dialog open={!!workflowId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[700px] max-h-[80vh] flex flex-col">
        <DialogHeader className="pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <FaSearch size={14} className="text-primary" />
            <span>Resultados para &ldquo;{query}&rdquo;</span>
          </DialogTitle>
          {workflow && (
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="font-medium">
                {formatId(workflow.id)}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {workflow.label}
              </span>
            </div>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-4 min-h-[200px]">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Spinner size="lg" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground">
              <p>{error}</p>
            </div>
          ) : matches.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <FaSearch size={24} className="mb-3 opacity-40" />
              <p className="text-sm">
                Nenhuma correspondência encontrada no conteúdo dos formulários.
              </p>
              <p className="text-xs mt-1">
                O termo pode estar nos metadados (assunto, descrição) em vez dos
                campos.
              </p>
            </div>
          ) : (
            activityGroups.map((group) => (
              <div key={group.label} className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2">
                    {group.label}
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <div className="space-y-1.5">
                  {group.fields.map((match, idx) => (
                    <div
                      key={`${match.fieldPath}-${idx}`}
                      className="rounded-lg border border-border bg-muted/20 px-4 py-3"
                    >
                      <div className="text-xs font-medium text-muted-foreground mb-1">
                        {match.fieldLabel}
                      </div>
                      <div
                        className="text-sm text-foreground [&_mark]:bg-yellow-200 [&_mark]:text-yellow-900 [&_mark]:rounded-sm [&_mark]:px-0.5 dark:[&_mark]:bg-yellow-500/30 dark:[&_mark]:text-yellow-200"
                        dangerouslySetInnerHTML={{
                          __html: match.highlightedValue,
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <DialogFooter className="pt-4 border-t border-border flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {matches.length > 0 && (
              <span>
                {matches.length} campo{matches.length !== 1 ? "s" : ""}{" "}
                encontrado{matches.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Fechar
            </Button>
            {workflow && (
              <Button
                size="sm"
                onClick={() => {
                  onClose();
                  navigate(`/workflows/${workflow.id}?highlight=${encodeURIComponent(query)}`);
                }}
                className="gap-1.5"
              >
                <FaExternalLinkAlt size={11} />
                Abrir Protocolo
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
