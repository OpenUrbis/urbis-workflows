import { getAccessToken } from "../../auth/token";
import React, { FormEvent, useContext, useEffect, useState } from "react";
import {
  FaPen,
  FaPlus,
  FaRegCopy,
  FaTrash,
  FaSave,
  FaMinus,
  FaList,
} from "react-icons/fa";
import { BsThreeDots } from "react-icons/bs";
import { SL } from "../../components";
import { Button, Input, Label } from "@open-urbis/map-ui";
import { Loader2 } from "lucide-react";
import EditableHeader from "../../components/EditableHeader";
import { FormEditor } from "./components/FormEditor";
import { TreeList } from "./components/TreeList";
import { AddFormsPreset } from "./components/AddFormsPreset";
import { HotkeyContext } from "../../reducers/hotkeys.reducer";
import { VersionsMenu } from "./components/VersionsMenu";
import { FormsApiClient } from "../../api/clients/forms.client";
import { StepEditable } from "./form-engine/fields/StepEditable";
import { IField } from "@open-urbis/types";
import { StyleContext } from "../../reducers/style.reducer";
import {
  CreateFormDto,
  FormData,
  FormMetadata,
} from "../../api/types/form.dto";

const formsClient = new FormsApiClient({
  baseURL: import.meta.env.VITE_BACK_END_API || "",
  headers: {
    Authorization: `Bearer ${getAccessToken()}`,
  },
});

interface VersionInfo {
  id: string;
  version: number;
  commitMessage: string;
  timestamp: string;
  createdBy: string;
  stage?: string;
}

const calculateReverseVersionNumber = (
  index: number,
  total: number,
  page: number = 1,
  pageSize: number = 10
): number => {
  const reversedIndex = total - index - 1;
  return pageSize * (page - 1) + (reversedIndex + 1);
};

const getFormIcon = (form: FormMetadata) => {
  switch (form.type) {
    case "field":
      return {
        icon: FaMinus,
        color: "blue",
        label: "Campo",
        bgColor: "bg-blue-100",
        textColor: "text-blue-800",
      };
    case "block":
      return {
        icon: FaList,
        color: "purple",
        label: "Bloco",
        bgColor: "bg-purple-100",
        textColor: "text-purple-800",
      };
    case "step":
      return {
        icon: BsThreeDots,
        color: "green",
        label: "Etapa",
        bgColor: "bg-green-100",
        textColor: "text-green-800",
      };
    default:
      return {
        icon: FaMinus,
        color: "blue",
        label: "Campo",
        bgColor: "bg-blue-100",
        textColor: "text-blue-800",
      };
  }
};

export const FormsPreset: React.FC = () => {
  const hotkeyContext = useContext(HotkeyContext);
  const styleContext = useContext(StyleContext);
  const [loading, setLoading] = useState(true);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [search, setSearch] = useState("");
  const [presets, setPresets] = useState<FormMetadata[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<FormData | null>(null);
  const [addingPreset, setAddingPreset] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<{
    version: number;
    stage?: string;
  }>({ version: 0 });
  const [versions, setVersions] = useState<VersionInfo[]>([]);

  const fetchPresets = async () => {
    const response = await formsClient.findAll();
    setPresets(response.forms);
    setLoading(false);
  };

  const fetchPresetVersion = async (version: number, stage?: string) => {
    setLoading(true);

    if (selectedPreset !== null && selectedPreset.id !== undefined) {
      const versionInfo = versions.find((v) => v.version === version);

      if (!versionInfo) {
        setLoading(false);
        return;
      }

      const preset = await formsClient.findOneVersion(
        selectedPreset.id,
        versionInfo.id
      );

      setCurrentVersion({ version, stage });
      setSelectedPreset({
        ...preset,
        id: selectedPreset.id,
        updatedAt: selectedPreset.updatedAt,
        updatedBy: selectedPreset.updatedBy,
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPresets();
  }, []);

  useEffect(() => {
    hotkeyContext.dispatch({
      type: "SET_HOTKEY",
      payload: {
        S: () => !loading && handleSavePreset(),
        N: (e) => !loading && handleAddPresetForm(e),
      },
    });

    return () => {
      hotkeyContext.dispatch({
        type: "UNSET_HOTKEY",
        delete: ["S", "N"],
      });
    };
    
  }, [loading, selectedPreset]);

  const searchCallback = (search: string) => {
    setSearch(search);
  };

  const selectPresetCallback = async (presetConfig: FormMetadata) => {
    if (presetConfig !== undefined && presetConfig.id) {
      setLoading(true);
      const preset = await formsClient.findOne(presetConfig.id);
      setLoading(false);
      setSelectedPreset(preset);
      setAddingPreset(false);

      setLoadingVersions(true);
      try {
        const versionsResponse = await formsClient.findOneVersions(
          presetConfig.id
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

  const handleSetPreset = (key: string, value: any) => {
    if (selectedPreset !== null && value !== null && value !== undefined) {
      setSelectedPreset((prev: any) => ({
        ...prev,
        [key]: value,
      }));
    }
  };

  const handleFormChange = (fields: IField[]) => {
    if (!selectedPreset) return;

    if (selectedPreset.type === "field") {
      // For field type, store in preset array and limit to 1 field
      handleSetPreset("form", {
        ...selectedPreset.form,
        preset: fields.slice(0, 1),
      });
    } else if (selectedPreset.type === "block") {
      // For block type, store directly in preset array
      handleSetPreset("form", {
        ...selectedPreset.form,
        preset: fields,
      });
    } else {
      // For step type, use the fields directly as they come from StepEditable
      handleSetPreset("form", {
        ...selectedPreset.form,
        preset: fields,
      });
    }
  };

  const handleAddPresetForm = (e: FormEvent | undefined) => {
    e?.preventDefault();
    setSelectedPreset(null);
    setAddingPreset(true);
  };

  const handleSavePreset = async () => {
    if (selectedPreset !== null && selectedPreset.id) {
      const commitMessage = await prompt(
        "Insira a mensagem de alteração da versão"
      );

      if (!commitMessage?.trim()) {
        return;
      }

      setLoading(true);
      await formsClient.update(selectedPreset.id, {
        label: selectedPreset.label,
        namespace: selectedPreset.namespace,
        documentation: selectedPreset.documentation,
        type: selectedPreset.type,
        form: selectedPreset.form,
        commit: commitMessage,
      });
      await fetchPresets();

      setLoadingVersions(true);
      try {
        const versionsResponse = await formsClient.findOneVersions(
          selectedPreset.id
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

  const handleAddPreset = async (newPreset: Omit<CreateFormDto, "commit">) => {
    setLoading(true);
    await formsClient.create({
      ...newPreset,
      commit: "Versão inicial",
    });
    await fetchPresets();
    setAddingPreset(false);
    setLoading(false);
  };

  const handleRemovePreset = async () => {
    if (selectedPreset !== null && selectedPreset.id) {
      const response = await confirmation(
        "Tem certeza que deseja remover este preset?"
      );

      if (!response) {
        return;
      }

      try {
        setLoading(true);
        await formsClient.remove(selectedPreset.id);
        await fetchPresets();
        setSelectedPreset(null);
      } catch (error) {
        console.error("Erro ao remover preset:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDuplicate = async () => {
    if (selectedPreset !== null && selectedPreset.id) {
      setLoading(true);
      await formsClient.copy(selectedPreset.id);
      await fetchPresets();
      setLoading(false);
    }
  };

  const handleCodeEditor = async () => {
    if (selectedPreset !== null && selectedPreset.id) {
      const value = await (prompt as any)(
        "Código do Formulário",
        JSON.stringify(selectedPreset.form, null, 4),
        [],
        { code: true }
      );

      handleSetPreset("form", JSON.parse(value));
    }
  };

  return (
    <div className="flex flex-col space-y-6 mb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[80vh]">
      <div className="flex items-start justify-between mb-6">
        <h1 className="text-2xl font-semibold mt-4 tracking-tight text-foreground">
          Formulários
        </h1>
        <Button
          type="button"
          size="sm"
          className={`mt-4 h-9 rounded-full px-4 gap-2 text-white ${
            styleContext.state.buttonHoverColorWeight === "200"
              ? "bg-yellow-600 hover:bg-yellow-700"
              : "bg-yellow-800 hover:bg-yellow-900"
          }`}
          onClick={handleAddPresetForm}
          disabled={loading}
        >
          <FaPlus size={16} />
          <span>Formulário</span>
          <span className="text-sm opacity-75 ml-2">
            <SL bg="yellow.600">N</SL>
          </span>
        </Button>
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
            items={presets}
            search={search}
            onClick={selectPresetCallback}
            onSearchChange={searchCallback}
            icon={FaList}
            iconColor="yellow"
            getIcon={getFormIcon}
            selectedId={selectedPreset?.id}
            density="compact"
          />
        </div>
        <div className="flex flex-col p-6 w-9/12">
          {loading && (
            <div className="flex-grow flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          {!loading && selectedPreset === null && addingPreset && (
            <AddFormsPreset onAddPreset={handleAddPreset} />
          )}
          {!loading && selectedPreset === null && !addingPreset && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <FaMinus size={40} className="mb-3 opacity-50" />
              <p className="text-lg font-medium mb-1.5 text-foreground">
                Nenhum formulário selecionado
              </p>
              <p className="text-sm mb-6">
                Selecione um formulário da lista ao lado ou crie um novo
              </p>
              <Button
                type="button"
                size="sm"
                className={`h-9 rounded-full px-4 gap-2 text-white ${
                  styleContext.state.buttonHoverColorWeight === "200"
                    ? "bg-yellow-600 hover:bg-yellow-700"
                    : "bg-yellow-800 hover:bg-yellow-900"
                }`}
                onClick={handleAddPresetForm}
              >
                <FaPlus size={16} />
                <span>Formulário</span>
                <span className="text-sm opacity-75 ml-2">
                  <SL bg="yellow.600">N</SL>
                </span>
              </Button>
            </div>
          )}
          {!loading && selectedPreset !== null && (
            <>
              <div className="flex flex-col mx-auto w-full mb-8">
                <div className="flex items-start justify-between">
                  <div className="flex-grow flex flex-col items-center">
                    <EditableHeader
                      value={selectedPreset.label}
                      onTextChange={(text) => handleSetPreset("label", text)}
                      className="text-lg md:text-2xl font-semibold text-center mb-3"
                    />
                    <EditableHeader
                      value={selectedPreset.documentation}
                      onTextChange={(text) =>
                        handleSetPreset("documentation", text)
                      }
                      className="text-gray-600 dark:text-gray-400 text-center"
                    />
                    <div className="flex items-center space-x-2 mt-4">
                      {(() => {
                        const formIcon = getFormIcon(selectedPreset);
                        return (
                          <div
                            className={`px-2 py-0.5 rounded-full flex items-center space-x-1 ${formIcon.bgColor}`}
                          >
                            <formIcon.icon
                              size={12}
                              className={formIcon.textColor}
                            />
                            <span
                              className={`text-xs font-medium ${formIcon.textColor}`}
                            >
                              {formIcon.label}
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="w-48 min-h-[40px] flex items-center justify-center">
                    <VersionsMenu
                      versions={versions}
                      defaultVersion={currentVersion}
                      callback={fetchPresetVersion}
                      loading={loadingVersions}
                    />
                  </div>
                </div>
              </div>

              <div className="w-4/5 mx-auto">
                <div className="flex flex-col space-y-4 mb-8">
                  <div id="namespace">
                    <Label className="mb-1 block">Chave</Label>
                    <Input
                      type="text"
                      placeholder="dir0/dir1/filename"
                      className="h-10"
                      value={selectedPreset.namespace}
                      onChange={(e) =>
                        handleSetPreset("namespace", e.target.value)
                      }
                    />
                  </div>
                </div>

                {selectedPreset.type === "step" ? (
                  <StepEditable
                    field={selectedPreset.form.preset ?? []}
                    general={{}}
                    value={{}}
                    valid={{}}
                    onChange={() => {}}
                    onValidChange={() => {}}
                    onConfigChange={handleFormChange}
                  />
                ) : (
                  <FormEditor
                    fields={
                      selectedPreset.type === "field"
                        ? (selectedPreset.form.preset ?? [])
                        : selectedPreset.type === "block"
                          ? (selectedPreset.form.preset ?? [])
                          : (selectedPreset.form.preset?.[0]?.block ?? [])
                    }
                    general={{}}
                    onConfigChange={handleFormChange}
                    showPresets={true}
                    showPresetsBlocks={selectedPreset.type !== "field"}
                    fieldLimitNumber={
                      selectedPreset.type === "field" ? 1 : 1000
                    }
                  />
                )}
              </div>

              <div className="flex-grow" />

              <div
                className="flex justify-end items-center px-8 py-4 border-t mt-8"
                style={{
                  borderColor:
                    styleContext.state.buttonHoverColorWeight === "200"
                      ? "#E5E7EB"
                      : "#374151",
                  backgroundColor: styleContext.state.backgroundColor,
                }}
              >
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCodeEditor}
                    className="h-9 px-4 gap-2"
                    style={{ color: styleContext.state.textColor }}
                  >
                    <FaPen className="text-sm" />
                    <span>Código</span>
                  </Button>
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
                    onClick={handleRemovePreset}
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
                    onClick={handleSavePreset}
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
