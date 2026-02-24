import { getAccessToken } from "../../auth/token";
import React, { FormEvent, useContext, useEffect, useState } from "react";
import { FaPlus, FaTrash, FaCode, FaSave, FaRegCopy } from "react-icons/fa";
import { SL } from "../../components";
import { Button, Input, Label } from "@open-urbis/map-ui";
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
import { Loader2 } from "lucide-react";

const codeModulesClient = new CodeModulesApiClient({
  baseURL: import.meta.env.VITE_BACK_END_API || "",
  headers: {
    Authorization: `Bearer ${getAccessToken()}`,
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
    <div className="flex flex-col space-y-6 mb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[80vh]">
      <div className="flex items-start justify-between mb-6">
        <h1 className="text-2xl font-semibold mt-4 tracking-tight text-foreground">
          Módulos de Código
        </h1>
        <Button
          type="button"
          size="sm"
          className="mt-4 h-9 rounded-full px-4 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
          onClick={handleAddFunctionForm}
          disabled={loading}
        >
          <FaPlus size={16} />
          <span>Módulo</span>
          <span className="text-sm opacity-75 ml-2">
            <SL
              bg="hsl(var(--primary))"
              className="text-[hsl(var(--primary-foreground))]"
            >
              N
            </SL>
          </span>
        </Button>
      </div>

      <div className="flex flex-grow border rounded-lg shadow-sm overflow-hidden border-border bg-card text-card-foreground">
        <div
          className="w-3/12 border-r border-border bg-card"
        >
          <TreeList
            items={functions}
            search={search}
            onClick={selectFunctionCallback}
            onSearchChange={searchCallback}
            icon={FaCode}
            iconColor="blue"
            density="compact"
          />
        </div>
        <div className="flex flex-col p-6 w-9/12">
          {loading && (
            <div className="flex-grow flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          {!loading && selectedFunction === null && addingFunction && (
            <AddModule onAddFunction={handleAddFunction} />
          )}
          {!loading && selectedFunction === null && !addingFunction && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <FaCode size={48} className="mb-4 opacity-50" />
              <p className="text-xl font-medium mb-2 text-foreground">
                Nenhum módulo selecionado
              </p>
              <p className="text-sm mb-6">
                Selecione um módulo da lista ao lado ou crie um novo
              </p>
              <Button
                type="button"
                size="sm"
                className="h-9 rounded-full px-4 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={handleAddFunctionForm}
              >
                <FaPlus size={16} />
                <span>Módulo</span>
                <span className="text-sm opacity-75 ml-2">
                  <SL
                    bg="hsl(var(--primary))"
                    className="text-[hsl(var(--primary-foreground))]"
                  >
                    N
                  </SL>
                </span>
              </Button>
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
                      className="text-lg md:text-2xl font-semibold text-center mb-3"
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
                  <div id="namespace">
                    <Label className="mb-1 block">Chave</Label>
                    <Input
                      type="text"
                      placeholder="dir0/dir1/filename"
                      className="h-10"
                      value={selectedFunction.namespace}
                      onChange={(e) =>
                        handleSetFunction("namespace", e.target.value)
                      }
                    />
                  </div>
                  <div id="code">
                    <Label className="mb-1 block">Código</Label>
                    <CodeEditor
                      height="30vh"
                      language="javascript"
                      value={selectedFunction.code}
                      onChange={(value) => handleSetFunction("code", value)}
                    />
                  </div>
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
                    onClick={handleRemoveFunction}
                    className="h-9 px-4 gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <FaTrash className="text-sm" />
                    <span>Remover</span>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="h-9 px-4 rounded-lg flex items-center gap-2 transition-colors duration-200 bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={handleSaveFunction}
                    disabled={loading}
                  >
                    <FaSave size={14} />
                    <span>Salvar</span>
                    <SL
                      bg="hsl(var(--primary))"
                      className="text-[hsl(var(--primary-foreground))]"
                    >
                      S
                    </SL>
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
