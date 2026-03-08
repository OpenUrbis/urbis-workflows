import { getAccessToken } from "../../../auth/token";
import { Spinner } from "../../../components/LegacyUi";
import axios from "axios";
import { useEffect, useState } from "react";
import { useSnackbar } from "../../../hooks/snackbar";
import { CodeEditor } from "./CodeEditor";
import { ProtocolIntegrations } from "../../../types/global";
import {
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@open-urbis/map-ui";

enum LoadingTypes {
  NOT_LOADING = 0,
  SEI_UNITS = 1,
  SEI_PROCESSES_TYPES = 2,
  SEI_DOCUMENTS_TYPES = 3,
  SEI_LEGAL_HYPOTHESIS = 4,
}

export type IntegrationsProps = {
  data: ProtocolIntegrations["sei"] | undefined;
  onChange: (data: ProtocolIntegrations["sei"]) => void;
};

export const Integrations: React.FC<IntegrationsProps> = ({
  data,
  onChange,
}): JSX.Element => {
  const snackbar = useSnackbar();
  const [integrations, setIntegrations] = useState<ProtocolIntegrations["sei"]>(
    data ?? {}
  );
  const [seiUnits, setSeiUnits] = useState<
    { id: string; description: string }[]
  >([]);
  const [seiProcessesTypes, setSeiProcessesTypes] = useState<
    { id: string; description: string }[]
  >([]);
  const [seiDocumentsTypes, setSeiDocumentsTypes] = useState<
    { id: string; description: string }[]
  >([]);
  const [seiLegalHypothesis, setSeiLegalHypothesis] = useState<
    { id: string; description: string }[]
  >([]);
  const [loading, setLoading] = useState<LoadingTypes>(0);

  const handleFetchSeiUnits = async () => {
    setLoading(LoadingTypes.SEI_UNITS);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACK_END_API}/integrations/sei/units`,
        {
          headers: {
            authorization: `Bearer ${getAccessToken()}`,
          },
        }
      );

      setSeiUnits(response.data);
    } catch (e) {
      snackbar.error("Não foi possível buscar as unidades SEI");
    }
    setLoading(LoadingTypes.NOT_LOADING);
  };

  const handleFetchSeiProcessesTypes = async () => {
    setLoading(LoadingTypes.SEI_PROCESSES_TYPES);

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACK_END_API}/integrations/sei/processes-types`,
        {
          params: {
            IdUnidade: integrations?.IdUnidade,
          },
          headers: {
            authorization: `Bearer ${getAccessToken()}`,
          },
        }
      );

      setSeiProcessesTypes(response.data);
    } catch (e) {
      snackbar.error("Não foi possível buscar os tipos de processo");
    }

    setLoading(LoadingTypes.NOT_LOADING);
  };

  const handleFetchSeiDocumentsTypes = async () => {
    setLoading(LoadingTypes.SEI_DOCUMENTS_TYPES);

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACK_END_API}/integrations/sei/documents-types`,
        {
          params: {
            IdUnidade: integrations?.IdUnidade,
            IdTipoProcedimento: integrations?.IdTipoProcedimento,
          },
          headers: {
            authorization: `Bearer ${getAccessToken()}`,
          },
        }
      );

      setSeiDocumentsTypes(response.data);
    } catch (e) {
      snackbar.error("Não foi possível buscar os tipos de documentos");
    }

    setLoading(LoadingTypes.NOT_LOADING);
  };

  useEffect(() => {
    handleFetchSeiUnits();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (integrations?.IdUnidade !== undefined) {
      handleFetchSeiProcessesTypes();
    }
    // eslint-disable-next-line
  }, [integrations?.IdUnidade]);

  const handleFetchSeiLegalHypothesis = async () => {
    setLoading(LoadingTypes.SEI_LEGAL_HYPOTHESIS);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACK_END_API}/integrations/sei/legal-hypothesis`,
        {
          params: {
            IdUnidade: integrations?.IdUnidade,
          },
          headers: {
            authorization: `Bearer ${getAccessToken()}`,
          },
        }
      );
      setSeiLegalHypothesis(response.data);
    } catch (e) {
      snackbar.error("Não foi possível buscar as hipóteses legais");
    }
    setLoading(LoadingTypes.NOT_LOADING);
  };

  useEffect(() => {
    if (integrations?.IdTipoProcedimento !== undefined) {
      handleFetchSeiDocumentsTypes();
    }
    // eslint-disable-next-line
  }, [integrations?.IdTipoProcedimento]);

  useEffect(() => {
    if (
      integrations?.IdUnidade !== undefined &&
      integrations?.NivelAcesso !== undefined &&
      integrations.NivelAcesso > 0
    ) {
      handleFetchSeiLegalHypothesis();
    }
    // eslint-disable-next-line
  }, [integrations?.IdUnidade, integrations?.NivelAcesso]);

  useEffect(() => {
    onChange(integrations);
  }, [integrations, onChange]);

  return (
    <div className="flex flex-col md:w-1/2 mx-auto space-y-6">
      <h2 className="text-xl md:text-2xl font-bold mb-2 text-center">
        SEI
      </h2>

      {/* Unidade */}
      <div className="space-y-2">
        <Label htmlFor="IdUnidade">Unidade</Label>
        {loading === LoadingTypes.SEI_UNITS ? (
          <div className="text-center py-2"><Spinner /></div>
        ) : (
          <Select
            value={integrations?.IdUnidade ?? ""}
            onValueChange={(value) =>
              setIntegrations({ ...integrations, IdUnidade: value })
            }
          >
            <SelectTrigger className="h-11 bg-background text-foreground">
              <SelectValue placeholder="Selecione a unidade" />
            </SelectTrigger>
            <SelectContent className="z-[1601] bg-background text-foreground">
              {seiUnits.map((unit) => (
                <SelectItem key={`unit-${unit.id}`} value={unit.id}>
                  {unit.description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Tipo do procedimento */}
      <div className="space-y-2">
        <Label htmlFor="IdTipoProcedimento">Tipo do procedimento</Label>
        {loading === LoadingTypes.SEI_PROCESSES_TYPES ? (
          <div className="text-center py-2"><Spinner /></div>
        ) : (
          <Select
            value={integrations?.IdTipoProcedimento ?? ""}
            onValueChange={(value) =>
              setIntegrations({ ...integrations, IdTipoProcedimento: value })
            }
          >
            <SelectTrigger className="h-11 bg-background text-foreground">
              <SelectValue placeholder="Selecione o tipo de procedimento" />
            </SelectTrigger>
            <SelectContent className="z-[1601] bg-background text-foreground">
              {seiProcessesTypes.map((type) => (
                <SelectItem key={`process-${type.id}`} value={type.id}>
                  {type.description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Nível de acesso */}
      <div className="space-y-2">
        <Label htmlFor="NivelAcesso">Nível de acesso</Label>
        <Select
          value={String(integrations?.NivelAcesso ?? 0)}
          onValueChange={(value) =>
            setIntegrations({
              ...integrations,
              NivelAcesso: Number(value) as 0 | 1 | 2,
            })
          }
        >
          <SelectTrigger className="h-11 bg-background text-foreground">
            <SelectValue placeholder="Selecione o nível de acesso" />
          </SelectTrigger>
          <SelectContent className="z-[1601] bg-background text-foreground">
            <SelectItem value="0">Público</SelectItem>
            <SelectItem value="1">Restrito</SelectItem>
            <SelectItem value="2">Sigiloso</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Hipótese Legal */}
      {integrations?.NivelAcesso !== undefined &&
        integrations.NivelAcesso > 0 && (
          <div className="space-y-2">
            <Label htmlFor="IdHipoteseLegal">Hipótese Legal</Label>
            {loading === LoadingTypes.SEI_LEGAL_HYPOTHESIS ? (
              <div className="text-center py-2"><Spinner /></div>
            ) : (
              <Select
                value={String(integrations?.IdHipoteseLegal ?? "")}
                onValueChange={(value) =>
                  setIntegrations({ ...integrations, IdHipoteseLegal: value })
                }
              >
                <SelectTrigger className="h-11 bg-background text-foreground">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent className="z-[1601] bg-background text-foreground">
                  {seiLegalHypothesis.map((h) => (
                    <SelectItem key={`hypothesis-${h.id}`} value={h.id}>
                      {h.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}

      {/* Tipo do documento da folha de rosto */}
      <div className="space-y-2">
        <Label htmlFor="CoverLetterIdSerie">Tipo do documento da folha de rosto</Label>
        {loading === LoadingTypes.SEI_DOCUMENTS_TYPES ? (
          <div className="text-center py-2"><Spinner /></div>
        ) : (
          <Select
            value={String(integrations?.CoverLetterIdSerie ?? "")}
            onValueChange={(value) =>
              setIntegrations({
                ...integrations,
                CoverLetterIdSerie: Number(value),
              })
            }
          >
            <SelectTrigger className="h-11 bg-background text-foreground">
              <SelectValue placeholder="Selecione o tipo de documento" />
            </SelectTrigger>
            <SelectContent className="z-[1601] bg-background text-foreground">
              {seiDocumentsTypes.map((type) => (
                <SelectItem key={`cover-${type.id}`} value={type.id}>
                  {type.description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Folha de rosto */}
      <div className="space-y-2">
        <Label htmlFor="coverLetter">Folha de rosto</Label>
        <CodeEditor
          language="html"
          height="200px"
          value={integrations?.coverLetter ?? ""}
          onChange={(code) => {
            setIntegrations({
              ...integrations,
              coverLetter: code,
            });
          }}
        />
      </div>

      {/* Tipo do documento */}
      <div className="space-y-2">
        <Label htmlFor="DocumentIdSerie">Tipo do documento</Label>
        {loading === LoadingTypes.SEI_DOCUMENTS_TYPES ? (
          <div className="text-center py-2"><Spinner /></div>
        ) : (
          <Select
            value={String(integrations?.DocumentIdSerie ?? "")}
            onValueChange={(value) =>
              setIntegrations({
                ...integrations,
                DocumentIdSerie: Number(value),
              })
            }
          >
            <SelectTrigger className="h-11 bg-background text-foreground">
              <SelectValue placeholder="Selecione o tipo de documento" />
            </SelectTrigger>
            <SelectContent className="z-[1601] bg-background text-foreground">
              {seiDocumentsTypes.map((type) => (
                <SelectItem key={`doc-${type.id}`} value={type.id}>
                  {type.description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Tipo do documento da placa */}
      <div className="space-y-2">
        <Label htmlFor="PlateIdSerie">Tipo do documento da placa</Label>
        {loading === LoadingTypes.SEI_DOCUMENTS_TYPES ? (
          <div className="text-center py-2"><Spinner /></div>
        ) : (
          <Select
            value={String(integrations?.PlateIdSerie ?? "")}
            onValueChange={(value) =>
              setIntegrations({
                ...integrations,
                PlateIdSerie: Number(value),
              })
            }
          >
            <SelectTrigger className="h-11 bg-background text-foreground">
              <SelectValue placeholder="Selecione o tipo de documento" />
            </SelectTrigger>
            <SelectContent className="z-[1601] bg-background text-foreground">
              {seiDocumentsTypes.map((type) => (
                <SelectItem key={`plate-${type.id}`} value={type.id}>
                  {type.description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Tipo do documento do boleto */}
      <div className="space-y-2">
        <Label htmlFor="TaxDocumentIdSerie">Tipo do documento do boleto</Label>
        {loading === LoadingTypes.SEI_DOCUMENTS_TYPES ? (
          <div className="text-center py-2"><Spinner /></div>
        ) : (
          <Select
            value={String(integrations?.TaxDocumentIdSerie ?? "")}
            onValueChange={(value) =>
              setIntegrations({
                ...integrations,
                TaxDocumentIdSerie: Number(value),
              })
            }
          >
            <SelectTrigger className="h-11 bg-background text-foreground">
              <SelectValue placeholder="Selecione o tipo de documento" />
            </SelectTrigger>
            <SelectContent className="z-[1601] bg-background text-foreground">
              {seiDocumentsTypes.map((type) => (
                <SelectItem key={`tax-${type.id}`} value={type.id}>
                  {type.description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
};
