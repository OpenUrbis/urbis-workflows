import { getAccessToken } from "../../../auth/token";
import { FormControl, FormLabel, Spinner } from "../../../components/LegacyUi";
import axios from "axios";
import { useEffect, useState } from "react";
import { useSnackbar } from "../../../hooks/snackbar";
import { CodeEditor } from "./CodeEditor";
import { ProtocolIntegrations } from "../../../types/global";

enum LoadingTypes {
  NOT_LOADING = 0,
  SEI_UNITS = 1,
  SEI_PROCESSES_TYPES = 2,
  SEI_DOCUMENTS_TYPES = 3,
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
  const [loading, setLoading] = useState<LoadingTypes>(0);

  const handleFetchSeiUnits = async () => {
    setLoading(LoadingTypes.SEI_UNITS);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACK_END_API}/protocols/integrations/sei/units`,
        {
          headers: {
            authorization: `${getAccessToken()}`,
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
        `${import.meta.env.VITE_BACK_END_API}/protocols/integrations/sei/processes-types`,
        {
          params: {
            IdUnidade: integrations?.IdUnidade,
          },
          headers: {
            authorization: `${getAccessToken()}`,
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
        `${import.meta.env.VITE_BACK_END_API}/protocols/integrations/sei/documents-types`,
        {
          params: {
            IdUnidade: integrations?.IdUnidade,
            IdTipoProcedimento: integrations?.IdTipoProcedimento,
          },
          headers: {
            authorization: `${getAccessToken()}`,
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

  useEffect(() => {
    if (integrations?.IdTipoProcedimento !== undefined) {
      handleFetchSeiDocumentsTypes();
    }
    // eslint-disable-next-line
  }, [integrations?.IdTipoProcedimento]);

  useEffect(() => {
    onChange(integrations);
  }, [integrations, onChange]);

  return (
    <div className="flex flex-col md:w-1/2 mx-auto space-y-4 ">
      <label className="text-xl md:text-2xl font-black mb-2 text-center">
        SEI
      </label>
      <FormControl id="IdUnidade">
        <FormLabel>Unidade</FormLabel>
        <select
          className="flex-grow h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={integrations?.IdUnidade}
          onChange={(e) =>
            setIntegrations({
              ...integrations,
              IdUnidade: e.target.value,
            })
          }
        >
          {seiUnits.map((unit) => (
            <option key={`unit-${unit.id}`} value={unit.id}>
              {unit.description}
            </option>
          ))}
        </select>
      </FormControl>
      {loading === LoadingTypes.SEI_UNITS && (
        <div className=" text-center">
          <Spinner />
        </div>
      )}
      <FormControl id="IdTipoProcedimento">
        <FormLabel>Tipo do procedimento</FormLabel>
        <select
          className="flex-grow h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={integrations?.IdTipoProcedimento}
          onChange={(e) =>
            setIntegrations({
              ...integrations,
              IdTipoProcedimento: e.target.value,
            })
          }
        >
          {seiProcessesTypes.map((type) => (
            <option key={`unit-${type.id}`} value={type.id}>
              {type.description}
            </option>
          ))}
        </select>
      </FormControl>
      {loading === LoadingTypes.SEI_PROCESSES_TYPES && (
        <div className=" text-center">
          <Spinner />
        </div>
      )}
      <FormControl id="NivelAcesso">
        <FormLabel>Nivel de acesso</FormLabel>
        <select
          className="flex-grow h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={integrations?.NivelAcesso}
          onChange={(e) =>
            setIntegrations({
              ...integrations,
              NivelAcesso: Number(e.target.value) as 0 | 1,
            })
          }
        >
          <option key="nivel-acesso-0" value={0}>
            Público
          </option>
          <option key="nivel-acesso-1" value={1}>
            Privado
          </option>
        </select>
      </FormControl>
      <FormControl id="CoverLetterIdSerie">
        <FormLabel>Tipo do documento da folha de rosto</FormLabel>
        <select
          className="flex-grow h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={integrations?.CoverLetterIdSerie}
          onChange={(e) =>
            setIntegrations({
              ...integrations,
              CoverLetterIdSerie: Number(e.target.value) as 0 | 1,
            })
          }
        >
          {seiDocumentsTypes.map((type) => (
            <option key={`unit-${type.id}`} value={type.id}>
              {type.description}
            </option>
          ))}
        </select>
      </FormControl>
      {loading === LoadingTypes.SEI_DOCUMENTS_TYPES && (
        <div className=" text-center">
          <Spinner />
        </div>
      )}
      <FormControl id="coverLetter">
        <FormLabel>Folha de rosto</FormLabel>
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
      </FormControl>
      <FormControl id="DocumentIdSerie">
        <FormLabel>Tipo do documento</FormLabel>
        <select
          className="flex-grow h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={integrations?.DocumentIdSerie}
          onChange={(e) =>
            setIntegrations({
              ...integrations,
              DocumentIdSerie: Number(e.target.value) as 0 | 1,
            })
          }
        >
          {seiDocumentsTypes.map((type) => (
            <option key={`unit-${type.id}`} value={type.id}>
              {type.description}
            </option>
          ))}
        </select>
      </FormControl>
      {loading === LoadingTypes.SEI_DOCUMENTS_TYPES && (
        <div className=" text-center">
          <Spinner />
        </div>
      )}
      <FormControl id="PlateIdSerie">
        <FormLabel>Tipo do documento da placa</FormLabel>
        <select
          className="flex-grow h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={integrations?.PlateIdSerie}
          onChange={(e) =>
            setIntegrations({
              ...integrations,
              PlateIdSerie: Number(e.target.value) as 0 | 1,
            })
          }
        >
          {seiDocumentsTypes.map((type) => (
            <option key={`unit-${type.id}`} value={type.id}>
              {type.description}
            </option>
          ))}
        </select>
      </FormControl>
      {loading === LoadingTypes.SEI_DOCUMENTS_TYPES && (
        <div className=" text-center">
          <Spinner />
        </div>
      )}
      <FormControl id="TaxDocumentIdSerie">
        <FormLabel>Tipo do documento do boleto</FormLabel>
        <select
          className="flex-grow h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={integrations?.TaxDocumentIdSerie}
          onChange={(e) =>
            setIntegrations({
              ...integrations,
              TaxDocumentIdSerie: Number(e.target.value) as 0 | 1,
            })
          }
        >
          {seiDocumentsTypes.map((type) => (
            <option key={`unit-${type.id}`} value={type.id}>
              {type.description}
            </option>
          ))}
        </select>
      </FormControl>
      {loading === LoadingTypes.SEI_DOCUMENTS_TYPES && (
        <div className=" text-center">
          <Spinner />
        </div>
      )}
    </div>
  );
};
