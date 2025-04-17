import React, { FormEvent, useContext, useEffect, useState } from "react";
import { FaPlus, FaTrash, FaSave, FaKey } from "react-icons/fa";
import { Input, SL } from "../../components";
import { Spinner } from "@chakra-ui/react";
import EditableHeader from "../../components/EditableHeader";
import { HotkeyContext } from "../../reducers/hotkeys.reducer";
import { StyleContext } from "../../reducers/style.reducer";
import { AddSecret } from "./components/AddSecret";
import { ApiClient } from "../../api";
import {
  CreateSecretHttpDto,
  SecretMetadata,
  FindOneSecretResponse,
  UpdateSecretHttpDto,
} from "../../api/types/integrations.dto";
import { TreeList } from "./components/TreeList";
import { VersionsMenu } from "./components/VersionsMenu";

const api = new ApiClient({
  baseURL: import.meta.env.VITE_BACK_END_API || "http://localhost:4000",
  headers: {
    authorization: `Bearer ${localStorage.getItem("token") || ""}`,
  },
});

type SelectedSecret = FindOneSecretResponse & {
  newValue?: string;
};

type VersionInfo = {
  id: string;
  version: number;
  commitMessage: string;
  timestamp: string;
  createdBy: string;
};

export const Secrets: React.FC = () => {
  const hotkeyContext = useContext(HotkeyContext);
  const styleContext = useContext(StyleContext);
  const [loading, setLoading] = useState(true);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [search, setSearch] = useState("");
  const [secrets, setSecrets] = useState<SecretMetadata[]>([]);
  const [selectedSecret, setSelectedSecret] = useState<SelectedSecret | null>(
    null
  );
  const [addingSecret, setAddingSecret] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<{
    version: number;
    stage?: string;
  }>({ version: 0 });
  const [versions, setVersions] = useState<VersionInfo[]>([]);

  const calculateReverseVersionNumber = (
    index: number,
    total: number,
    page: number = 1,
    pageSize: number = 10
  ): number => {
    const reversedIndex = total - index - 1;
    return pageSize * (page - 1) + (reversedIndex + 1);
  };

  const fetchSecrets = async () => {
    try {
      const response = await api.integrations.findAllSecrets();
      setSecrets(response.secrets);
    } catch (error) {
      console.error("Failed to fetch secrets:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecrets();
  }, []);

  useEffect(() => {
    hotkeyContext.dispatch({
      type: "SET_HOTKEY",
      payload: {
        N: (e) => !loading && handleAddSecretForm(e),
      },
    });

    return () => {
      hotkeyContext.dispatch({
        type: "UNSET_HOTKEY",
        delete: ["N"],
      });
    };
    
  }, [loading]);

  const searchCallback = (search: string) => {
    setSearch(search);
  };

  const fetchSecretVersion = async (version: number, stage?: string) => {
    setLoading(true);

    if (selectedSecret !== null && selectedSecret.id !== undefined) {
      const versionInfo = versions.find((v) => v.version === version);

      if (!versionInfo) {
        setLoading(false);
        return;
      }

      const secret = await api.integrations.findOneSecretVersion(
        selectedSecret.id,
        versionInfo.id
      );

      setCurrentVersion({ version, stage });
      setSelectedSecret({
        ...secret,
        id: selectedSecret.id,
        updatedAt: selectedSecret.updatedAt,
        updatedBy: selectedSecret.updatedBy,
      });
    }
    setLoading(false);
  };

  const selectSecretCallback = async (secretConfig: SecretMetadata) => {
    if (secretConfig !== undefined && secretConfig.id) {
      setLoading(true);
      try {
        const secret = await api.integrations.findOneSecret(secretConfig.id);
        setSelectedSecret(secret);
        setAddingSecret(false);
        setLoading(false);

        // Load versions separately
        setLoadingVersions(true);
        try {
          const versionsResponse = await api.integrations.findOneSecretVersions(
            secretConfig.id
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
        } catch (error) {
          console.error("Failed to fetch versions:", error);
        } finally {
          setLoadingVersions(false);
        }
      } catch (error) {
        console.error("Failed to fetch secret:", error);
        setLoading(false);
      }
    }
  };

  const handleSetSecret = (key: string, value: any) => {
    if (selectedSecret !== null) {
      setSelectedSecret((prev: any) => ({
        ...prev,
        [key]: value,
      }));
    }
  };

  const handleAddSecretForm = (e: FormEvent | undefined) => {
    e?.preventDefault();
    setSelectedSecret(null);
    setAddingSecret(true);
  };

  const handleSaveSecret = async () => {
    if (selectedSecret !== null && selectedSecret.id) {
      const commitMessage = await prompt(
        "Insira a mensagem de alteração da versão"
      );

      if (!commitMessage?.trim()) {
        return;
      }

      setLoading(true);
      try {
        const updateData: UpdateSecretHttpDto = {
          label: selectedSecret.label,
          namespace: selectedSecret.namespace,
          documentation: selectedSecret.documentation,
          value: selectedSecret.newValue || "",
          commit: commitMessage,
        };
        await api.integrations.updateSecret(selectedSecret.id, updateData);
        await fetchSecrets();

        // Load new versions separately
        setLoadingVersions(true);
        try {
          const versionsResponse = await api.integrations.findOneSecretVersions(
            selectedSecret.id
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
        setSelectedSecret((prev) => ({ ...prev!, newValue: "" }));
      } catch (error) {
        console.error("Failed to update secret:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAddSecret = async (newSecret: Partial<CreateSecretHttpDto>) => {
    setLoading(true);
    try {
      const createData: CreateSecretHttpDto = {
        label: newSecret.label || "",
        namespace: newSecret.namespace || "",
        documentation: newSecret.documentation || "",
        value: newSecret.value || "",
        commit: "Created new secret",
      };
      await api.integrations.createSecret(createData);
      await fetchSecrets();
      setAddingSecret(false);
    } catch (error) {
      console.error("Failed to create secret:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSecret = async () => {
    if (selectedSecret !== null && selectedSecret.id) {
      const response = await confirmation(
        "Tem certeza que deseja remover este segredo?"
      );

      if (!response) {
        return;
      }

      try {
        setLoading(true);
        await api.integrations.removeSecret(selectedSecret.id);
        await fetchSecrets();
        setSelectedSecret(null);
      } catch (error) {
        console.error("Failed to remove secret:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex flex-col space-y-6 mb-24 px-20 min-h-[80vh]">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-medium text-left">Segredos</h1>
        <button
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 text-white ${
            styleContext.state.buttonHoverColorWeight === "200"
              ? "bg-yellow-600 hover:bg-yellow-700"
              : "bg-yellow-800 hover:bg-yellow-900"
          }`}
          onClick={handleAddSecretForm}
          disabled={loading}
        >
          <FaPlus size={16} />
          <span>Segredo</span>
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
          }}
        >
          <TreeList
            items={secrets}
            search={search}
            onClick={selectSecretCallback}
            onSearchChange={searchCallback}
            icon={FaKey}
            iconColor="blue"
          />
        </div>
        <div className="flex flex-col p-6 w-9/12">
          {loading && !selectedSecret && (
            <div className="flex-grow flex items-center justify-center">
              <Spinner size="xl" />
            </div>
          )}
          {!loading && selectedSecret === null && addingSecret && (
            <AddSecret onAddSecret={handleAddSecret} />
          )}
          {!loading && selectedSecret === null && !addingSecret && (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <FaKey size={48} className="mb-4 opacity-50" />
              <p className="text-xl font-medium mb-2">
                Nenhum segredo selecionado
              </p>
              <p className="text-sm mb-6">
                Selecione um segredo da lista ao lado ou crie um novo
              </p>
              <button
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 text-white ${
                  styleContext.state.buttonHoverColorWeight === "200"
                    ? "bg-yellow-600 hover:bg-yellow-700"
                    : "bg-yellow-800 hover:bg-yellow-900"
                }`}
                onClick={handleAddSecretForm}
              >
                <FaPlus size={16} />
                <span>Segredo</span>
                <span className="text-sm opacity-75 ml-2">
                  <SL bg="yellow.600">N</SL>
                </span>
              </button>
            </div>
          )}
          {selectedSecret !== null && (
            <>
              {loading ? (
                <div className="flex-grow flex items-center justify-center">
                  <Spinner size="xl" />
                </div>
              ) : (
                <>
                  <div className="flex flex-col mx-auto w-full mb-8">
                    <div className="flex items-start justify-between">
                      <div className="flex-grow flex flex-col items-center">
                        <EditableHeader
                          value={selectedSecret.label}
                          onTextChange={(text) =>
                            handleSetSecret("label", text)
                          }
                          className="text-xl md:text-3xl font-black text-center mb-3"
                        />
                        <EditableHeader
                          value={selectedSecret.documentation}
                          onTextChange={(text) =>
                            handleSetSecret("documentation", text)
                          }
                          className="text-gray-600 dark:text-gray-400 text-center"
                        />
                      </div>
                      <div className="w-48 flex items-center justify-center">
                        <VersionsMenu
                          versions={versions}
                          defaultVersion={currentVersion}
                          callback={fetchSecretVersion}
                          loading={loadingVersions}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="w-4/5 mx-auto">
                    <div className="flex flex-col space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          ID
                        </label>
                        <Input
                          type="text"
                          placeholder="ID"
                          size="lg"
                          value={selectedSecret.id}
                          readOnly
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Chave
                        </label>
                        <Input
                          type="text"
                          placeholder="dir0/dir1/filename"
                          size="lg"
                          value={selectedSecret.namespace}
                          onChange={(e) =>
                            handleSetSecret("namespace", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Valor atual
                        </label>
                        <Input
                          type="text"
                          placeholder="O valor do segredo está oculto por segurança"
                          size="lg"
                          readOnly
                          value="********"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Novo valor
                        </label>
                        <Input
                          type="text"
                          placeholder="Digite o novo valor do segredo"
                          size="lg"
                          value={selectedSecret.newValue || ""}
                          onChange={(e) =>
                            handleSetSecret("newValue", e.target.value)
                          }
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          Por motivos de segurança, o valor atual do segredo não
                          é exibido. Para atualizar, digite o novo valor acima.
                        </p>
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
                    <div className="flex gap-4">
                      <button
                        onClick={handleRemoveSecret}
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
                      onClick={handleSaveSecret}
                      disabled={loading}
                    >
                      <FaSave size={14} />
                      <span>Salvar</span> <SL bg="yellow.600">S</SL>
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
