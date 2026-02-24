import { getAccessToken } from "../../auth/token";
import React, { FormEvent, useContext, useEffect, useState } from "react";
import {
  FaPlus,
  FaTrash,
  FaSave,
  FaFileAlt,
  FaRegCopy,
  FaFont,
  FaHashtag,
  FaToggleOn,
  FaCalendar,
  FaTable,
  FaCode,
} from "react-icons/fa";
import { SL } from "../../components";
import { Button, Input, Label } from "@open-urbis/map-ui";
import EditableHeader from "../../components/EditableHeader";
import { HotkeyContext } from "../../reducers/hotkeys.reducer";
import {
  AddEnvironment,
  EnvironmentValueForm,
} from "./components/AddEnvironment";
import { VersionsMenu } from "./components/VersionsMenu";
import { ApiClient } from "../../api";
import { TreeList } from "./components/TreeList";
import { StyleContext } from "../../reducers/style.reducer";
import {
  ConstantVariableMetadata,
  CreateConstantVariableHttpDto,
  FindOneConstantVariableResponse,
  ConstantTypeEnum,
} from "../../api/types/constant-variables.dto";
import { useSnackbar } from "../../hooks/snackbar";
import { Loader2 } from "lucide-react";

type VersionInfo = {
  id: string;
  version: number;
  commitMessage: string;
  timestamp: string;
  createdBy: string;
};

const getConstantTypeDescription = (type: ConstantTypeEnum): string => {
  const typeMap: Record<ConstantTypeEnum, string> = {
    [ConstantTypeEnum.STRING]: "Texto",
    [ConstantTypeEnum.NUMBER]: "Número",
    [ConstantTypeEnum.BOOLEAN]: "Booleano",
    [ConstantTypeEnum.DATE]: "Data",
    [ConstantTypeEnum.OBJECT]: "Objeto",
    [ConstantTypeEnum.TABLE]: "Tabela",
  };
  return typeMap[type] || "Desconhecido";
};

const calculateReverseVersionNumber = (
  index: number,
  total: number,
  page: number = 1,
  pageSize: number = 10
): number => {
  const reversedIndex = total - index - 1;
  return pageSize * (page - 1) + (reversedIndex + 1);
};

const getConstantTypeIcon = (item: ConstantVariableMetadata) => {
  switch (item.type) {
    case ConstantTypeEnum.STRING:
      return { icon: FaFont, color: "blue" };
    case ConstantTypeEnum.NUMBER:
      return { icon: FaHashtag, color: "purple" };
    case ConstantTypeEnum.BOOLEAN:
      return { icon: FaToggleOn, color: "green" };
    case ConstantTypeEnum.DATE:
      return { icon: FaCalendar, color: "orange" };
    case ConstantTypeEnum.TABLE:
      return { icon: FaTable, color: "red" };
    case ConstantTypeEnum.OBJECT:
      return { icon: FaCode, color: "yellow" };
    default:
      return { icon: FaFileAlt, color: "gray" };
  }
};

export const Environments: React.FC = () => {
  const hotkeyContext = useContext(HotkeyContext);
  const styleContext = useContext(StyleContext);
  const snackbar = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [search, setSearch] = useState("");
  const [environments, setEnvironments] = useState<ConstantVariableMetadata[]>(
    []
  );
  const [selectedEnvironment, setSelectedEnvironment] =
    useState<FindOneConstantVariableResponse | null>(null);
  const [addingEnvironment, setAddingEnvironment] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<{
    version: number;
    stage?: string;
  }>({ version: 0 });
  const [versions, setVersions] = useState<VersionInfo[]>([]);

  const api = new ApiClient({
    baseURL: import.meta.env.VITE_BACK_END_API || "",
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
    },
  });

  const fetchEnvironments = async () => {
    const response = await api.constantVariables.findAll();
    setEnvironments(response.variables);
    setLoading(false);
  };

  const fetchEnvironmentVersion = async (version: number, stage?: string) => {
    setLoading(true);

    if (selectedEnvironment !== null && selectedEnvironment.id !== undefined) {
      const versionInfo = versions.find((v) => v.version === version);

      if (!versionInfo) {
        setLoading(false);
        return;
      }

      const environment = await api.constantVariables.findOneVersion(
        selectedEnvironment.id,
        versionInfo.id
      );

      setCurrentVersion({ version, stage });
      setSelectedEnvironment({
        ...environment,
        id: selectedEnvironment.id,
        updatedAt: selectedEnvironment.updatedAt,
        updatedBy: selectedEnvironment.updatedBy,
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEnvironments();
    
  }, []);

  useEffect(() => {
    hotkeyContext.dispatch({
      type: "SET_HOTKEY",
      payload: {
        N: (e) => !loading && handleAddEnvironmentForm(e),
        S: () => !loading && handleSaveEnvironment(),
      },
    });

    return () => {
      hotkeyContext.dispatch({
        type: "UNSET_HOTKEY",
        delete: ["N", "S"],
      });
    };
    
  }, [loading]);

  const searchCallback = (search: string) => {
    setSearch(search);
  };

  const selectEnvironmentCallback = async (
    environmentConfig: ConstantVariableMetadata
  ) => {
    if (environmentConfig !== undefined && environmentConfig.id) {
      setLoading(true);
      const environment = await api.constantVariables.findOne(
        environmentConfig.id
      );

      setSelectedEnvironment(environment);
      setLoading(false);
      setAddingEnvironment(false);

      setLoadingVersions(true);
      try {
        const versionsResponse = await api.constantVariables.findOneVersions(
          environmentConfig.id
        );

        const totalVersions = versionsResponse.pagination.total;
        const versionInfos: VersionInfo[] = versionsResponse.versions.map(
          (version, index) => ({
            id: version.id,
            version: calculateReverseVersionNumber(
              index,
              totalVersions,
              versionsResponse.pagination.page,
              versionsResponse.pagination.pageSize
            ),
            commitMessage: version.commit,
            timestamp: new Date(version.createdAt).toISOString(),
            createdBy: version.createdBy.name,
          })
        );

        setVersions(versionInfos);
        setCurrentVersion({
          version: calculateReverseVersionNumber(
            0,
            totalVersions,
            versionsResponse.pagination.page,
            versionsResponse.pagination.pageSize
          ),
        });
      } finally {
        setLoadingVersions(false);
      }
    }
  };

  const handleSetEnvironment = (key: string, value: any) => {
    if (selectedEnvironment !== null) {
      setSelectedEnvironment((prev: any) => ({
        ...prev,
        [key]: value,
      }));
    }
  };

  const handleAddEnvironmentForm = (e: FormEvent | undefined) => {
    e?.preventDefault();
    setSelectedEnvironment(null);
    setAddingEnvironment(true);
  };

  const handleSaveEnvironment = async () => {
    if (selectedEnvironment !== null && selectedEnvironment.id) {
      const commitMessage = await prompt(
        "Insira a mensagem de alteração da versão"
      );

      if (!commitMessage?.trim()) {
        return;
      }

      setLoading(true);
      await api.constantVariables.update(selectedEnvironment.id, {
        label: selectedEnvironment.label,
        documentation: selectedEnvironment.documentation,
        namespace: selectedEnvironment.namespace,
        type: selectedEnvironment.type,
        value: selectedEnvironment.value,
        commit: commitMessage,
      });
      await fetchEnvironments();

      setLoadingVersions(true);
      try {
        const versionsResponse = await api.constantVariables.findOneVersions(
          selectedEnvironment.id
        );

        const totalVersions = versionsResponse.pagination.total;
        const versionInfos: VersionInfo[] = versionsResponse.versions.map(
          (version, index) => ({
            id: version.id,
            version: calculateReverseVersionNumber(
              index,
              totalVersions,
              versionsResponse.pagination.page,
              versionsResponse.pagination.pageSize
            ),
            commitMessage: version.commit,
            timestamp: new Date(version.createdAt).toISOString(),
            createdBy: version.createdBy.name,
          })
        );

        setVersions(versionInfos);
        setCurrentVersion({
          version: calculateReverseVersionNumber(
            0,
            totalVersions,
            versionsResponse.pagination.page,
            versionsResponse.pagination.pageSize
          ),
        });
      } finally {
        setLoadingVersions(false);
        setLoading(false);
      }
    }
  };

  const handleAddEnvironment = async (
    newEnvironment: CreateConstantVariableHttpDto
  ) => {
    try {
      setLoading(true);
      await api.constantVariables.create({
        ...newEnvironment,
        commit: "Adicionando nova variável de ambiente",
      });
      await fetchEnvironments();
      setAddingEnvironment(false);
      setLoading(false);
    } catch (error) {
      console.error(error);
      snackbar.error("Erro ao adicionar variável de ambiente");
      setLoading(false);
    }
  };

  const handleRemoveEnvironment = async () => {
    if (selectedEnvironment !== null && selectedEnvironment.id) {
      const response = await confirmation(
        "Tem certeza que deseja remover esta variável?"
      );

      if (!response) {
        return;
      }

      setLoading(true);
      await api.constantVariables.remove(selectedEnvironment.id);
      await fetchEnvironments();
      setSelectedEnvironment(null);
      setLoading(false);
    }
  };

  const handleDuplicate = async () => {
    if (selectedEnvironment !== null && selectedEnvironment.id) {
      setLoading(true);
      await api.constantVariables.copy(selectedEnvironment.id);
      await fetchEnvironments();
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col space-y-6 mb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[80vh]">
      <div className="flex items-start justify-between mb-6">
        <h1 className="text-2xl font-semibold mt-4 tracking-tight text-foreground">
          Variáveis de Ambiente
        </h1>
        <Button
          type="button"
          size="sm"
          className={`mt-4 h-9 rounded-full px-4 gap-2 text-white ${
            styleContext.state.buttonHoverColorWeight === "200"
              ? "bg-yellow-600 hover:bg-yellow-700"
              : "bg-yellow-800 hover:bg-yellow-900"
          }`}
          onClick={handleAddEnvironmentForm}
          disabled={loading}
        >
          <FaPlus size={16} />
          <span>Variável</span>
          <span className="text-sm opacity-75 ml-2">
            <SL bg="yellow.600">N</SL>
          </span>
        </Button>
      </div>

      <div className="flex flex-grow border rounded-lg shadow-sm overflow-hidden border-border bg-card text-card-foreground">
        <div
          className="w-3/12 border-r border-border bg-card"
        >
          <TreeList
            items={environments}
            search={search}
            onClick={selectEnvironmentCallback}
            onSearchChange={searchCallback}
            icon={FaFileAlt}
            iconColor="blue"
            getIcon={getConstantTypeIcon}
            density="compact"
          />
        </div>
        <div className="flex flex-col p-6 w-9/12">
          {loading && (
            <div className="flex-grow flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          {!loading && selectedEnvironment === null && addingEnvironment && (
            <AddEnvironment onAddEnvironment={handleAddEnvironment} />
          )}
          {!loading && selectedEnvironment === null && !addingEnvironment && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <FaFileAlt size={48} className="mb-4 opacity-50" />
              <p className="text-xl font-medium mb-2 text-foreground">
                Nenhuma variável selecionada
              </p>
              <p className="text-sm mb-6">
                Selecione uma variável da lista ao lado ou crie uma nova
              </p>
              <Button
                type="button"
                size="sm"
                className={`h-9 rounded-full px-4 gap-2 text-white ${
                  styleContext.state.buttonHoverColorWeight === "200"
                    ? "bg-yellow-600 hover:bg-yellow-700"
                    : "bg-yellow-800 hover:bg-yellow-900"
                }`}
                onClick={handleAddEnvironmentForm}
              >
                <FaPlus size={16} />
                <span>Variável</span>
                <span className="text-sm opacity-75 ml-2">
                  <SL bg="yellow.600">N</SL>
                </span>
              </Button>
            </div>
          )}
          {!loading && selectedEnvironment !== null && (
            <>
              <div className="flex flex-col mx-auto w-full mb-8">
                <div className="flex items-start justify-between">
                  <div className="flex-grow flex flex-col items-center">
                    <EditableHeader
                      value={selectedEnvironment.label}
                      onTextChange={(text) =>
                        handleSetEnvironment("label", text)
                      }
                      className="text-lg md:text-2xl font-semibold text-center mb-3"
                    />
                    <EditableHeader
                      value={selectedEnvironment.documentation}
                      onTextChange={(text) =>
                        handleSetEnvironment("documentation", text)
                      }
                      className="text-gray-600 dark:text-gray-400 text-center"
                    />
                  </div>
                  <div className="w-48 min-h-[40px] flex items-center justify-center">
                    <VersionsMenu
                      versions={versions}
                      defaultVersion={currentVersion}
                      callback={fetchEnvironmentVersion}
                      loading={loadingVersions}
                    />
                  </div>
                </div>
              </div>

              <div className="w-4/5 mx-auto">
                <div className="flex flex-col space-y-4">
                  <div id="namespace">
                    <Label className="mb-1 block">Chave</Label>
                    <Input
                      type="text"
                      placeholder="dir0/dir1/filename"
                      className="h-10"
                      value={selectedEnvironment.namespace}
                      onChange={(e) =>
                        handleSetEnvironment("namespace", e.target.value)
                      }
                    />
                  </div>
                  <div id="type">
                    <Label className="mb-1 block">Tipo</Label>
                    <Input
                      type="text"
                      className="h-10"
                      value={getConstantTypeDescription(
                        selectedEnvironment.type
                      )}
                      readOnly
                    />
                  </div>
                  <EnvironmentValueForm
                    value={selectedEnvironment.value}
                    type={selectedEnvironment.type}
                    setValue={(value) => handleSetEnvironment("value", value)}
                    isDisabled={false}
                  />
                </div>
              </div>

              <div className="flex-grow" />

              <div
                className="flex justify-end items-center px-8 py-4 border-t mt-8"
                style={{
                  borderColor:
                    styleContext.state.buttonHoverColorWeight === "200"
                      ? "#E5E7EB"
                      : "#374151",
                }}
              >
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDuplicate}
                    className="h-9 px-4 gap-2"
                    style={{ color: styleContext.state.textColor }}
                  >
                    <FaRegCopy className="text-sm" />
                    <span>Duplicar</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveEnvironment}
                    className="h-9 px-4 gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <FaTrash className="text-sm" />
                    <span>Remover</span>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className={`h-9 px-4 rounded-lg flex items-center gap-2 transition-colors duration-200 text-white ${
                      styleContext.state.buttonHoverColorWeight === "200"
                        ? "bg-yellow-600 hover:bg-yellow-700"
                        : "bg-yellow-800 hover:bg-yellow-900"
                    }`}
                    onClick={handleSaveEnvironment}
                    disabled={loading}
                  >
                    <FaSave size={14} />
                    <span>Salvar</span>
                    <SL bg="yellow.600">S</SL>
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
