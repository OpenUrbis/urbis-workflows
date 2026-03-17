import { getAccessToken } from "../../../auth/token";
import { Spinner } from "../../../components/LegacyUi";
import axios from "axios";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSnackbar } from "../../../hooks/snackbar";
import { Label } from "@open-urbis/map-ui";
import { Input as DSInput } from "@open-urbis/map-ui";
import { ProtocolIntegrations } from "../../../types/global";

type DocTypeItem = { id: string; description: string; applicability?: string };

const documentTypesCache = new Map<string, DocTypeItem[]>();

async function fetchDocumentTypesCached(
  IdUnidade: string,
  IdTipoProcedimento: string,
  getToken: () => string | undefined,
  onError: (msg: string) => void
): Promise<DocTypeItem[]> {
  const key = `${IdUnidade}:${IdTipoProcedimento}`;
  const cached = documentTypesCache.get(key);
  if (cached) return cached;
  try {
    const response = await axios.get(
      `${import.meta.env.VITE_BACK_END_API}/integrations/sei/documents-types`,
      {
        params: { IdUnidade, IdTipoProcedimento },
        headers: { authorization: `Bearer ${getToken()}` },
      }
    );
    const data = Array.isArray(response.data) ? response.data : [];
    documentTypesCache.set(key, data);
    return data;
  } catch {
    onError("Não foi possível buscar os tipos de documentos SEI");
    return [];
  }
}

const SEI_APPLICABILITY_LABELS: Record<string, string> = {
  T: "Documentos internos e externos",
  I: "Documentos internos",
  E: "Documentos externos",
  F: "Formulários",
};

type FallbackKey = "DocumentIdSerie" | "SignatureIdSerie" | "TaxDocumentIdSerie";

const FALLBACK_LABELS: Record<FallbackKey, string> = {
  DocumentIdSerie: "Documento gerado",
  SignatureIdSerie: "Assinatura",
  TaxDocumentIdSerie: "Boleto",
};

export type SeiDocumentTypeSelectorProps = {
  label: string;
  value: number | undefined;
  onChange: (idSerie: number | undefined) => void;
  integrationsSei: ProtocolIntegrations["sei"] | undefined;
  fallbackKey: FallbackKey;
};

export function SeiDocumentTypeSelector({
  label,
  value,
  onChange,
  integrationsSei,
  fallbackKey,
}: SeiDocumentTypeSelectorProps): JSX.Element {
  const snackbar = useSnackbar();
  const [docTypes, setDocTypes] = useState<DocTypeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastFetchedKey = useRef<string | null>(null);

  const idUnidade = integrationsSei?.IdUnidade;
  const idTipoProcedimento = integrationsSei?.IdTipoProcedimento;

  useEffect(() => {
    if (!idUnidade || !idTipoProcedimento) {
      lastFetchedKey.current = null;
      setDocTypes([]);
      setLoading(false);
      return;
    }
    const key = `${idUnidade}:${idTipoProcedimento}`;
    const cached = documentTypesCache.get(key);
    if (cached) {
      lastFetchedKey.current = key;
      setDocTypes(cached);
      setLoading(false);
      return;
    }
    if (lastFetchedKey.current === key) return;
    let cancelled = false;
    lastFetchedKey.current = key;
    setLoading(true);
    fetchDocumentTypesCached(
      idUnidade,
      idTipoProcedimento,
      () => getAccessToken() ?? undefined,
      (msg) => snackbar.error(msg)
    ).then((data) => {
      if (!cancelled) setDocTypes(data);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [idUnidade, idTipoProcedimento]);

  const fallbackSerie = integrationsSei?.[fallbackKey];
  const fallbackLabel =
    fallbackSerie != null
      ? docTypes.find((t) => t.id === String(fallbackSerie))?.description ??
        FALLBACK_LABELS[fallbackKey]
      : null;

  const filterItems = useCallback(
    <T extends { id: string; description: string }>(
      items: T[],
      q: string
    ): T[] => {
      if (!q) return items.slice(0, 50);
      const lower = q.toLowerCase();
      const out: T[] = [];
      for (const item of items) {
        if (item.description.toLowerCase().includes(lower)) {
          out.push(item);
          if (out.length >= 50) break;
        }
      }
      return out;
    },
    []
  );

  const filtered = useMemo(
    () => filterItems(docTypes, search),
    [docTypes, search, filterItems]
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedDescription =
    value != null
      ? docTypes.find((t) => t.id === String(value))?.description
      : null;

  const placeholder = value != null
    ? selectedDescription ?? "Buscar tipo de documento..."
    : fallbackLabel
      ? `Usar padrão do assunto: ${fallbackLabel}`
      : "Selecione ou use o padrão nas Integrações";

  const canSelect = integrationsSei?.IdUnidade && integrationsSei?.IdTipoProcedimento;

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {loading ? (
        <div className="text-center py-2">
          <Spinner />
        </div>
      ) : (
        <div className="relative" ref={containerRef}>
          <DSInput
            placeholder={placeholder}
            value={open ? search : ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setSearch(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            className="h-11 bg-background text-foreground"
            readOnly={!canSelect}
          />
          {open && canSelect && (
            <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-md border bg-background shadow-lg">
              {value != null && (
                <div
                  className="px-3 py-2 text-sm cursor-pointer hover:bg-muted text-muted-foreground border-b"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onChange(undefined);
                    setSearch("");
                    setOpen(false);
                  }}
                >
                  Usar padrão do assunto{fallbackLabel ? `: ${fallbackLabel}` : ""}
                </div>
              )}
              {filtered.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  Nenhum tipo encontrado
                </div>
              ) : (
                filtered.map((type) => (
                  <div
                    key={type.id}
                    className="px-3 py-2 text-sm cursor-pointer hover:bg-muted text-foreground"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onChange(Number(type.id));
                      setSearch("");
                      setOpen(false);
                    }}
                  >
                    <div className="truncate">{type.description}</div>
                    {type.applicability && (
                      <div className="text-xs text-muted-foreground">
                        {SEI_APPLICABILITY_LABELS[type.applicability] ?? type.applicability}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
      {!canSelect && (
        <p className="text-xs text-muted-foreground">
          Configure Unidade e Tipo de procedimento em Integrações para escolher um tipo por atividade.
        </p>
      )}
    </div>
  );
}
