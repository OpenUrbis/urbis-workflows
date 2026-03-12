import { getAccessToken } from "../../auth/token";
import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { useSnackbar } from "../../hooks/snackbar";
import { StyleContext } from "../../reducers";
import { Spinner } from "../../components/LegacyUi";
import { FaFileAlt, FaHistory, FaLink, FaSyncAlt } from "react-icons/fa";

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
        <div className="flex items-center space-x-2 mb-3 px-3">
          <FaLink size={14} className="text-gray-500" />
          <span className="text-sm font-medium text-gray-500">
            Integração SEI
          </span>
        </div>

        <button
          type="button"
          className="h-9 w-9 inline-flex items-center justify-center rounded-md disabled:opacity-50 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          onClick={handleSyncTracking}
          disabled={syncing}
          aria-label={syncing ? "Sincronizando tramitação" : "Atualizar tramitação"}
          title={syncing ? "Sincronizando..." : "Atualizar tramitação"}
        >
          <FaSyncAlt size={14} className={syncing ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Process Info */}
      <div
        className="rounded-lg border p-4 space-y-2 overflow-hidden"
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
            <span
              className="text-sm font-mono break-all"
              style={{ color: styleContext.state.textColor }}
            >
              {seiState.processFormatted}
            </span>
          )}
        </div>

        {seiState.processLink && (
          <a
            href={seiState.processLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-500 hover:underline break-words"
          >
            Acessar processo no SEI
          </a>
        )}

        {seiState.error && (
          <p className="text-sm text-red-500 whitespace-pre-wrap break-words">
            {seiState.error}
          </p>
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
          <div className="flex items-center space-x-2 mb-3 px-3">
            <FaFileAlt size={14} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-500">
              Documentos Espelhados
            </span>
            <span
              className={`text-sm px-2 py-0.5 rounded-full ${
                isDark ? "bg-purple-900 text-purple-100" : "bg-purple-100 text-purple-800"
              }`}
            >
              {seiState.documents.length}
            </span>
          </div>
          <div
            className="overflow-x-auto rounded-lg border"
            style={{
              borderColor: isDark ? "#374151" : "#E5E7EB",
              backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
            }}
          >
            <table className="w-full text-sm" style={{ color: styleContext.state.textColor }}>
              <thead>
                <tr
                  style={{
                    backgroundColor: isDark ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.04)",
                    borderBottomWidth: 1,
                    borderColor: isDark ? "#374151" : "#E5E7EB",
                  }}
                >
                  <th className="text-left py-2.5 px-3 font-medium">Tipo</th>
                  <th className="text-left py-2.5 px-3 font-medium">Arquivo</th>
                  <th className="text-left py-2.5 px-3 font-medium">Acesso</th>
                  <th className="text-left py-2.5 px-3 font-medium">Data</th>
                </tr>
              </thead>
              <tbody>
                {seiState.documents.map((doc, idx) => (
                  <tr
                    key={idx}
                    style={{
                      borderBottomWidth: idx < seiState.documents!.length - 1 ? 1 : 0,
                      borderColor: isDark ? "#374151" : "#E5E7EB",
                    }}
                  >
                    <td className="py-2.5 px-3">
                      {DOC_TYPE_LABELS[doc.type] || doc.type}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-xs">
                      {doc.fileName || doc.documentId}
                    </td>
                    <td className="py-2.5 px-3">
                      {ACCESS_LEVEL_LABELS[doc.accessLevel] || doc.accessLevel}
                    </td>
                    <td className="py-2.5 px-3 text-xs">
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
          <div className="flex items-center space-x-2 mb-3 px-3">
            <FaHistory size={14} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-500">
              Tramitação
            </span>
            <span
              className={`text-sm px-2 py-0.5 rounded-full ${
                isDark ? "bg-purple-900 text-purple-100" : "bg-purple-100 text-purple-800"
              }`}
            >
              {seiState.tracking.length}
            </span>
          </div>
          <div
            className="overflow-x-auto rounded-lg border"
            style={{
              borderColor: isDark ? "#374151" : "#E5E7EB",
              backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
            }}
          >
            <table className="w-full text-sm" style={{ color: styleContext.state.textColor }}>
              <thead>
                <tr
                  style={{
                    backgroundColor: isDark ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.04)",
                    borderBottomWidth: 1,
                    borderColor: isDark ? "#374151" : "#E5E7EB",
                  }}
                >
                  <th className="text-left py-2.5 px-3 font-medium">Data</th>
                  <th className="text-left py-2.5 px-3 font-medium">Ação</th>
                  <th className="text-left py-2.5 px-3 font-medium">Unidade</th>
                  <th className="text-left py-2.5 px-3 font-medium">Usuário</th>
                </tr>
              </thead>
              <tbody>
                {seiState.tracking.map((entry, idx) => (
                  <tr
                    key={idx}
                    style={{
                      borderBottomWidth: idx < seiState.tracking!.length - 1 ? 1 : 0,
                      borderColor: isDark ? "#374151" : "#E5E7EB",
                    }}
                  >
                    <td className="py-2.5 px-3 text-xs whitespace-nowrap">
                      {entry.timestamp
                        ? new Date(entry.timestamp).toLocaleString("pt-BR")
                        : "-"}
                    </td>
                    <td className="py-2.5 px-3">{entry.action}</td>
                    <td className="py-2.5 px-3">{entry.unit || "-"}</td>
                    <td className="py-2.5 px-3">{entry.user || "-"}</td>
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
