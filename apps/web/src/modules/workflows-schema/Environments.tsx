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
import { Input, SL } from "../../components";
import { Spinner, FormControl, FormLabel } from "@chakra-ui/react";
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
    <div className="flex flex-col space-y-6 mb-24 px-20 min-h-[80vh]">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-medium text-left">
          Variáveis de Ambiente
        </h1>
        <button
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 text-white ${
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
        </button>
      </div>

      <div className="flex flex-grow border rounded-lg   shadow-sm overflow-hidden">
        <div
          className="w-3/12 border-r"
          style={{
            borderColor:
              styleContext.state.buttonHoverColorWeight === "200"
                ? "#E5E7EB"
                : "#374151",
            backgroundColor: styleContext.state.backgroundColor,
          }}
        >
          <TreeList
            items={environments}
            search={search}
            onClick={selectEnvironmentCallback}
            onSearchChange={searchCallback}
            icon={FaFileAlt}
            iconColor="blue"
            getIcon={getConstantTypeIcon}
          />
        </div>
        <div className="flex flex-col p-6 w-9/12">
          {loading && (
            <div className="flex-grow flex items-center justify-center">
              <Spinner size="xl" />
            </div>
          )}
          {!loading && selectedEnvironment === null && addingEnvironment && (
            <AddEnvironment onAddEnvironment={handleAddEnvironment} />
          )}
          {!loading && selectedEnvironment === null && !addingEnvironment && (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <FaFileAlt size={48} className="mb-4 opacity-50" />
              <p className="text-xl font-medium mb-2">
                Nenhuma variável selecionada
              </p>
              <p className="text-sm mb-6">
                Selecione uma variável da lista ao lado ou crie uma nova
              </p>
              <button
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 text-white ${
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
              </button>
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
                      className="text-xl md:text-3xl font-black text-center mb-3"
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
                  <FormControl id="namespace">
                    <FormLabel>Chave</FormLabel>
                    <Input
                      type="text"
                      placeholder="dir0/dir1/filename"
                      size="lg"
                      value={selectedEnvironment.namespace}
                      onChange={(e) =>
                        handleSetEnvironment("namespace", e.target.value)
                      }
                    />
                  </FormControl>
                  <FormControl id="type">
                    <FormLabel>Tipo</FormLabel>
                    <Input
                      type="text"
                      size="lg"
                      value={getConstantTypeDescription(
                        selectedEnvironment.type
                      )}
                      readOnly
                    />
                  </FormControl>
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
                <div className="flex gap-4">
                  <button
                    onClick={handleDuplicate}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
                      styleContext.state.buttonHoverColorWeight === "200"
                        ? "bg-gray-100 hover:bg-gray-200 text-gray-700"
                        : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                    }`}
                  >
                    <FaRegCopy className="text-sm" />
                    <span>Duplicar</span>
                  </button>
                  <button
                    onClick={handleRemoveEnvironment}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
                      styleContext.state.buttonHoverColorWeight === "200"
                        ? "bg-red-100 hover:bg-red-200 text-red-600"
                        : "bg-red-900 hover:bg-red-800 text-red-300"
                    }`}
                  >
                    <FaTrash className="text-sm" />
                    <span>Remover</span>
                  </button>
                </div>
              </div>

              <div className="fixed bottom-16 right-4 flex space-x-4">
                <button
                  className={`px-6 py-2.5 rounded-lg shadow-lg flex items-center space-x-2 transition-colors duration-200 text-white ${
                    styleContext.state.buttonHoverColorWeight === "200"
                      ? "bg-yellow-600 hover:bg-yellow-700"
                      : "bg-yellow-800 hover:bg-yellow-900"
                  }`}
                  onClick={handleSaveEnvironment}
                  disabled={loading}
                >
                  <FaSave size={14} />
                  <span>Salvar</span> <SL bg="yellow.600">S</SL>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
