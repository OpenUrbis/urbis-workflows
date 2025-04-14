import React, { FormEvent, useContext, useEffect, useState } from "react";
import { FaPlus, FaTrash, FaCode, FaSave, FaRegCopy } from "react-icons/fa";
import { Input, SL } from "../../components";
import { Spinner, FormControl, FormLabel } from "@chakra-ui/react";
import EditableHeader from "../../components/EditableHeader";
import { AddModule } from "./components/AddModule";
import { HotkeyContext } from "../../reducers/hotkeys.reducer";
import { CodeEditor } from "./components/CodeEditor";
import { CodeModulesApiClient } from "../../api/clients/code-modules.client";
import {
  CodeModuleMetadata,
  CreateCodeModuleHttpDto,
} from "../../api/types/code-modules.dto";
import { VersionsMenu } from "./components/VersionsMenu";
import { TreeList } from "./components/TreeList";
import { StyleContext } from "../../reducers/style.reducer";

const codeModulesClient = new CodeModulesApiClient({
  baseURL: process.env.REACT_APP_BACK_END_API || "",
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

export type FunctionConfig = CodeModuleMetadata;

export const Modules: React.FC = () => {
  const hotkeyContext = useContext(HotkeyContext);
  const styleContext = useContext(StyleContext);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [functions, setFunctions] = useState<CodeModuleMetadata[]>([]);
  const [selectedFunction, setSelectedFunction] =
    useState<CodeModuleMetadata | null>(null);
  const [addingFunction, setAddingFunction] = useState(false);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<{
    version: number;
    stage?: string;
  }>({ version: 0 });
  const [versions, setVersions] = useState<VersionInfo[]>([]);

  type VersionInfo = {
    id: string;
    version: number;
    commitMessage: string;
    timestamp: string;
    createdBy: string;
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

  const fetchFunctions = async () => {
    const response = await codeModulesClient.findAll();
    setFunctions(response.modules);
    setLoading(false);
  };

  useEffect(() => {
    fetchFunctions();
  }, []);

  useEffect(() => {
    hotkeyContext.dispatch({
      type: "SET_HOTKEY",
      payload: {
        N: (e) => !loading && handleAddFunctionForm(e),
        S: () => !loading && handleSaveFunction(),
      },
    });

    return () => {
      hotkeyContext.dispatch({
        type: "UNSET_HOTKEY",
        delete: ["N", "S"],
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, selectedFunction]);

  const searchCallback = (search: string) => {
    setSearch(search);
  };

  const selectFunctionCallback = async (funConfig: CodeModuleMetadata) => {
    if (funConfig !== undefined && funConfig.id) {
      setLoading(true);
      const fun = await codeModulesClient.findOne(funConfig.id);
      setSelectedFunction(fun);
      setAddingFunction(false);
      setLoading(false);

      setLoadingVersions(true);
      try {
        const versionsResponse = await codeModulesClient.findOneVersions(
          funConfig.id
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

  const handleSetFunction = (key: string, value: any) => {
    if (selectedFunction !== null) {
      setSelectedFunction((prev: any) => ({
        ...prev,
        [key]: value,
      }));
    }
  };

  const handleAddFunctionForm = (e: FormEvent | undefined) => {
    e?.preventDefault();
    setSelectedFunction(null);
    setAddingFunction(true);
  };

  const handleSaveFunction = async () => {
    if (selectedFunction !== null && selectedFunction.id) {
      const commitMessage = await prompt(
        "Insira a mensagem de alteração da versão"
      );

      if (!commitMessage?.trim()) {
        return;
      }

      setLoading(true);
      await codeModulesClient.update(selectedFunction.id, {
        label: selectedFunction.label,
        namespace: selectedFunction.namespace,
        documentation: selectedFunction.documentation,
        code: selectedFunction.code,
        commit: commitMessage,
      });
      await fetchFunctions();

      setLoadingVersions(true);
      try {
        const versionsResponse = await codeModulesClient.findOneVersions(
          selectedFunction.id
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

  const handleAddFunction = async (newFunction: CreateCodeModuleHttpDto) => {
    setLoading(true);
    await codeModulesClient.create(newFunction);
    await fetchFunctions();
    setAddingFunction(false);
    setLoading(false);
  };

  const handleRemoveFunction = async () => {
    if (selectedFunction !== null && selectedFunction.id) {
      const response = await confirmation(
        "Tem certeza que deseja remover esta função?"
      );

      if (!response) {
        return;
      }

      setLoading(true);
      await codeModulesClient.remove(selectedFunction.id);
      await fetchFunctions();
      setSelectedFunction(null);
      setLoading(false);
    }
  };

  const handleDuplicate = async () => {
    if (selectedFunction !== null && selectedFunction.id) {
      setLoading(true);
      await codeModulesClient.copy(selectedFunction.id);
      await fetchFunctions();
      setLoading(false);
    }
  };

  const fetchFunctionVersion = async (version: number, stage?: string) => {
    setLoading(true);

    if (selectedFunction !== null && selectedFunction.id !== undefined) {
      const versionInfo = versions.find((v) => v.version === version);

      if (!versionInfo) {
        setLoading(false);
        return;
      }

      const fun = await codeModulesClient.findOneVersion(
        selectedFunction.id,
        versionInfo.id
      );

      setCurrentVersion({ version, stage });
      setSelectedFunction({
        ...fun,
        id: selectedFunction.id,
        updatedAt: selectedFunction.updatedAt,
        updatedBy: selectedFunction.updatedBy,
      });
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col space-y-6 mb-24 px-20 min-h-[80vh]">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-medium text-left">
          Módulos de Código
        </h1>
        <button
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 text-white ${
            styleContext.state.buttonHoverColorWeight === "200"
              ? "bg-yellow-600 hover:bg-yellow-700"
              : "bg-yellow-800 hover:bg-yellow-900"
          }`}
          onClick={handleAddFunctionForm}
          disabled={loading}
        >
          <FaPlus size={16} />
          <span>Módulo</span>
          <span className="text-sm opacity-75 ml-2">
            <SL bg="yellow.600">N</SL>
          </span>
        </button>
      </div>

      <div className="flex flex-grow border rounded-lg shadow-sm overflow-hidden">
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
            items={functions}
            search={search}
            onClick={selectFunctionCallback}
            onSearchChange={searchCallback}
            icon={FaCode}
            iconColor="blue"
          />
        </div>
        <div className="flex flex-col p-6 w-9/12">
          {loading && (
            <div className="flex-grow flex items-center justify-center">
              <Spinner size="xl" />
            </div>
          )}
          {!loading && selectedFunction === null && addingFunction && (
            <AddModule onAddFunction={handleAddFunction} />
          )}
          {!loading && selectedFunction === null && !addingFunction && (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <FaCode size={48} className="mb-4 opacity-50" />
              <p className="text-xl font-medium mb-2">
                Nenhum módulo selecionado
              </p>
              <p className="text-sm mb-6">
                Selecione um módulo da lista ao lado ou crie um novo
              </p>
              <button
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 text-white ${
                  styleContext.state.buttonHoverColorWeight === "200"
                    ? "bg-yellow-600 hover:bg-yellow-700"
                    : "bg-yellow-800 hover:bg-yellow-900"
                }`}
                onClick={handleAddFunctionForm}
              >
                <FaPlus size={16} />
                <span>Módulo</span>
                <span className="text-sm opacity-75 ml-2">
                  <SL bg="yellow.600">N</SL>
                </span>
              </button>
            </div>
          )}
          {!loading && selectedFunction !== null && (
            <>
              <div className="flex flex-col mx-auto w-full mb-8">
                <div className="flex items-start justify-between">
                  <div className="flex-grow flex flex-col items-center">
                    <EditableHeader
                      value={selectedFunction.label}
                      onTextChange={(text) => handleSetFunction("label", text)}
                      className="text-xl md:text-3xl font-black text-center mb-3"
                    />
                    <EditableHeader
                      value={selectedFunction.documentation}
                      onTextChange={(text) =>
                        handleSetFunction("documentation", text)
                      }
                      className="text-gray-600 dark:text-gray-400 text-center"
                    />
                  </div>
                  <div className="w-48 min-h-[40px] flex items-center justify-center">
                    <VersionsMenu
                      versions={versions}
                      defaultVersion={currentVersion}
                      callback={fetchFunctionVersion}
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
                      value={selectedFunction.namespace}
                      onChange={(e) =>
                        handleSetFunction("namespace", e.target.value)
                      }
                    />
                  </FormControl>
                  <FormControl id="code">
                    <FormLabel>Código</FormLabel>
                    <CodeEditor
                      height="30vh"
                      language="javascript"
                      value={selectedFunction.code}
                      onChange={(value) => handleSetFunction("code", value)}
                    />
                  </FormControl>
                </div>
              </div>

              <div className="flex-grow" />

              <div className="flex justify-end items-center px-8 py-4 border-t mt-8">
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
                    onClick={handleRemoveFunction}
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
                  onClick={handleSaveFunction}
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
