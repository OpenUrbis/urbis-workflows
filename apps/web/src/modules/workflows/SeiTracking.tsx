import { getAccessToken } from "../../auth/token";
import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { useSnackbar } from "../../hooks/snackbar";
import { StyleContext } from "../../reducers";
import { Spinner } from "../../components/LegacyUi";

interface SeiMirroredDocument {
  documentId: string;
  activityId: string;
  seiDocumentId?: string;
  seiDocumentLink?: string;
  type: string;
  accessLevel: number;
  legalHypothesisId?: string | number;
  syncedAt: string;
  fileName?: string;
}

interface SeiTrackingEntry {
  timestamp: string;
  action: string;
  unit?: string;
  user?: string;
}

interface SeiIntegrationState {
  processId?: string;
  processLink?: string;
  processFormatted?: string;
  status?: "PENDING" | "OPEN" | "ERROR";
  error?: string;
  documents?: SeiMirroredDocument[];
  tracking?: SeiTrackingEntry[];
  lastSyncAt?: string;
}

export interface SeiTrackingProps {
  workflowId: string;
}

const ACCESS_LEVEL_LABELS: Record<number, string> = {
  0: "Público",
  1: "Restrito",
  2: "Sigiloso",
};

const DOC_TYPE_LABELS: Record<string, string> = {
  form_public: "Formulário (Público)",
  form_restricted: "Formulário (Restrito)",
  signature_public: "Assinatura (Público)",
  signature_restricted: "Assinatura (Restrito)",
  document: "Documento",
  tax: "Taxa",
  upload: "Arquivo Anexado",
};

export const SeiTracking: React.FC<SeiTrackingProps> = ({
  workflowId,
}): JSX.Element => {
  const snackbar = useSnackbar();
  const styleContext = useContext(StyleContext);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [seiState, setSeiState] = useState<SeiIntegrationState | null>(null);

  const fetchTracking = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACK_END_API}/integrations/sei/tracking/${workflowId}`,
        {
          headers: {
            authorization: `Bearer ${getAccessToken()}`,
          },
        }
      );
      setSeiState(response.data);
    } catch (e) {
      // If 404 or no SEI data, just leave null
      setSeiState(null);
    }
    setLoading(false);
  };

  const handleSyncTracking = async () => {
    setSyncing(true);
    try {
      await axios.post(
        `${import.meta.env.VITE_BACK_END_API}/integrations/sei/sync-tracking/${workflowId}`,
        {},
        {
          headers: {
            authorization: `Bearer ${getAccessToken()}`,
          },
        }
      );
      snackbar.success("Sincronização SEI iniciada. Atualize em alguns segundos.");
      // Wait a bit and re-fetch
      setTimeout(() => {
        fetchTracking();
        setSyncing(false);
      }, 3000);
    } catch (e) {
      snackbar.error("Não foi possível iniciar a sincronização SEI");
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchTracking();
    // eslint-disable-next-line
  }, [workflowId]);

  if (loading) {
    return (
      <div className="py-6 text-center">
        <Spinner />
      </div>
    );
  }

  if (!seiState || !seiState.processId) {
    return <></>;
  }

  const isDark = styleContext.state.buttonHoverColorWeight !== "200";

  return (
    <div className="flex flex-col space-y-4">
      <div className="border-b mb-2"></div>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold" style={{ color: styleContext.state.textColor }}>
          Integração SEI
        </h3>
        <button
          className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm px-4 py-2 rounded-md disabled:opacity-50"
          onClick={handleSyncTracking}
          disabled={syncing}
        >
          {syncing ? "Sincronizando..." : "Atualizar Tramitação"}
        </button>
      </div>

      {/* Process Info */}
      <div
        className="rounded-lg border p-4 space-y-2"
        style={{
          borderColor: isDark ? "#374151" : "#E5E7EB",
          backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
        }}
      >
        <div className="flex items-center space-x-3">
          <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={{
              backgroundColor:
                seiState.status === "OPEN"
                  ? "rgba(34, 197, 94, 0.15)"
                  : seiState.status === "ERROR"
                    ? "rgba(239, 68, 68, 0.15)"
                    : "rgba(107, 114, 128, 0.15)",
              color:
                seiState.status === "OPEN"
                  ? "#16a34a"
                  : seiState.status === "ERROR"
                    ? "#dc2626"
                    : "#6b7280",
            }}
          >
            {seiState.status === "OPEN"
              ? "Aberto"
              : seiState.status === "ERROR"
                ? "Erro"
                : "Pendente"}
          </span>
          {seiState.processFormatted && (
            <span className="text-sm font-mono" style={{ color: styleContext.state.textColor }}>
              {seiState.processFormatted}
            </span>
          )}
        </div>

        {seiState.processLink && (
          <a
            href={seiState.processLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-500 hover:underline"
          >
            Acessar processo no SEI
          </a>
        )}

        {seiState.error && (
          <p className="text-sm text-red-500">{seiState.error}</p>
        )}

        {seiState.lastSyncAt && (
          <p className="text-xs" style={{ color: isDark ? "#9CA3AF" : "#6B7280" }}>
            Última sincronização:{" "}
            {new Date(seiState.lastSyncAt).toLocaleString("pt-BR")}
          </p>
        )}
      </div>

      {/* Mirrored Documents */}
      {seiState.documents && seiState.documents.length > 0 && (
        <div>
          <h4
            className="text-sm font-semibold mb-2"
            style={{ color: styleContext.state.textColor }}
          >
            Documentos Espelhados ({seiState.documents.length})
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ color: styleContext.state.textColor }}>
              <thead>
                <tr
                  style={{
                    borderBottomWidth: 1,
                    borderColor: isDark ? "#374151" : "#E5E7EB",
                  }}
                >
                  <th className="text-left py-2 px-2 font-medium">Tipo</th>
                  <th className="text-left py-2 px-2 font-medium">Arquivo</th>
                  <th className="text-left py-2 px-2 font-medium">Acesso</th>
                  <th className="text-left py-2 px-2 font-medium">Data</th>
                </tr>
              </thead>
              <tbody>
                {seiState.documents.map((doc, idx) => (
                  <tr
                    key={idx}
                    style={{
                      borderBottomWidth: 1,
                      borderColor: isDark ? "#1f2937" : "#F3F4F6",
                    }}
                  >
                    <td className="py-2 px-2">
                      {DOC_TYPE_LABELS[doc.type] || doc.type}
                    </td>
                    <td className="py-2 px-2 font-mono text-xs">
                      {doc.fileName || doc.documentId}
                    </td>
                    <td className="py-2 px-2">
                      {ACCESS_LEVEL_LABELS[doc.accessLevel] || doc.accessLevel}
                    </td>
                    <td className="py-2 px-2 text-xs">
                      {doc.syncedAt
                        ? new Date(doc.syncedAt).toLocaleString("pt-BR")
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tracking History */}
      {seiState.tracking && seiState.tracking.length > 0 && (
        <div>
          <h4
            className="text-sm font-semibold mb-2"
            style={{ color: styleContext.state.textColor }}
          >
            Tramitação ({seiState.tracking.length})
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ color: styleContext.state.textColor }}>
              <thead>
                <tr
                  style={{
                    borderBottomWidth: 1,
                    borderColor: isDark ? "#374151" : "#E5E7EB",
                  }}
                >
                  <th className="text-left py-2 px-2 font-medium">Data</th>
                  <th className="text-left py-2 px-2 font-medium">Ação</th>
                  <th className="text-left py-2 px-2 font-medium">Unidade</th>
                  <th className="text-left py-2 px-2 font-medium">Usuário</th>
                </tr>
              </thead>
              <tbody>
                {seiState.tracking.map((entry, idx) => (
                  <tr
                    key={idx}
                    style={{
                      borderBottomWidth: 1,
                      borderColor: isDark ? "#1f2937" : "#F3F4F6",
                    }}
                  >
                    <td className="py-2 px-2 text-xs whitespace-nowrap">
                      {entry.timestamp
                        ? new Date(entry.timestamp).toLocaleString("pt-BR")
                        : "-"}
                    </td>
                    <td className="py-2 px-2">{entry.action}</td>
                    <td className="py-2 px-2">{entry.unit || "-"}</td>
                    <td className="py-2 px-2">{entry.user || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
