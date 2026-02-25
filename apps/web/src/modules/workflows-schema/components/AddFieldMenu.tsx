import { getAccessToken } from "../../../auth/token";
import React, { useContext, useEffect, useState } from "react";
import {
  FaMinus,
  FaList,
  FaRegSquare,
  FaAlignLeft,
  FaFont,
  FaRegFileAlt,
  FaRegCheckSquare,
  FaRegDotCircle,
  FaTable,
  FaUpload,
  FaLink,
  FaMap,
  FaLayerGroup,
} from "react-icons/fa";
import { BsThreeDots } from "react-icons/bs";
import { IField, FieldTypeEnum, IFieldOptionsType } from "@open-urbis/types";
import { StyleContext } from "../../../reducers";
import { FormsApiClient } from "../../../api/clients/forms.client";
import type { FormMetadata } from "../../../api/types/form.dto";
import { FormTypeEnum } from "../../../api/types/form.dto";
import { TreeList } from "./TreeList";
import {
  HotkeyContext,
  withNoModifiers,
  withNumberInput,
} from "../../../reducers/hotkeys.reducer";
import { SL } from "../../../components";
import {
  Button,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from "../../../components";

const formsClient = new FormsApiClient({
  baseURL: import.meta.env.VITE_BACK_END_API || "",
  headers: {
    Authorization: `Bearer ${getAccessToken()}`,
  },
});

interface AddFieldMenuProps {
  addFieldCallback: (config: IField | null) => void;
  showPresets?: boolean;
  showPresetsBlocks?: boolean;
}

interface FieldTypeGroup {
  label: string;
  types: [FieldTypeEnum, string, React.ComponentType<any>][];
}

const fieldTypeGroups: FieldTypeGroup[] = [
  {
    label: "Texto",
    types: [
      [FieldTypeEnum.Input, "Texto simples", FaMinus],
      [FieldTypeEnum.Textarea, "Texto em área", FaAlignLeft],
    ],
  },
  {
    label: "Seleção",
    types: [
      [FieldTypeEnum.Select, "Seleção", FaRegSquare],
      [FieldTypeEnum.Radio, "Escolha", FaRegDotCircle],
      [FieldTypeEnum.Checkbox, "Múltipla escolha", FaRegCheckSquare],
    ],
  },
  {
    label: "Dados",
    types: [
      [FieldTypeEnum.Upload, "Anexo", FaUpload],
      [FieldTypeEnum.Integration, "Integração", FaLink],
      [FieldTypeEnum.Link, "Vínculo", FaLink],
      [FieldTypeEnum.Map, "Mapa", FaMap],
    ],
  },
  {
    label: "Estrutura",
    types: [
      [FieldTypeEnum.Title, "Título", FaFont],
      [FieldTypeEnum.Subtitle, "Descrição", FaRegFileAlt],
      [FieldTypeEnum.Block, "Bloco", FaList],
      [FieldTypeEnum.Array, "Arranjo", FaLayerGroup],
      [FieldTypeEnum.Table, "Tabela", FaTable],
    ],
  },
];

const getPresetIcon = (preset: FormMetadata) => {
  switch (preset.type) {
    case FormTypeEnum.FIELD:
      return {
        icon: FaMinus,
        color: "blue",
        label: "Campo",
        bgColor: "bg-blue-100",
        textColor: "text-blue-800",
      };
    case FormTypeEnum.BLOCK:
      return {
        icon: FaList,
        color: "purple",
        label: "Bloco",
        bgColor: "bg-purple-100",
        textColor: "text-purple-800",
      };
    case FormTypeEnum.STEP:
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

const mapPresetsToTreeItems = (presets: FormMetadata[]) => {
  return presets.map((preset) => ({
    ...preset,
    label: preset.label || "Sem título",
    namespace: preset.namespace || "global",
  }));
};

export const AddFieldMenu: React.FC<AddFieldMenuProps> = ({
  addFieldCallback,
  showPresets,
  showPresetsBlocks,
}) => {
  const styleContext = useContext(StyleContext);
  const hotkeyContext = useContext(HotkeyContext);
  const [submenuOpen, setSubmenuOpen] = useState(false);
  const [presetModalOpen, setPresetModalOpen] = useState(false);
  const [presets, setPresets] = useState<FormMetadata[]>([]);
  const [presetsSearch, setPresetsSearch] = useState("");

  const template = (type: FieldTypeEnum): IField => {
    const baseOptions = {
      label: "Insira a etiqueta",
      required: true,
      readOnly: false,
      enableEdition: false,
    };

    let options: IFieldOptionsType;
    switch (type) {
      case FieldTypeEnum.Title:
        options = {
          title: "Insira o título",
        };
        break;
      case FieldTypeEnum.Subtitle:
        options = {
          html: "Insira o subtitulo (suporta sintaxe HTML)",
        };
        break;
      case FieldTypeEnum.Block:
        options = {
          ...baseOptions,
          card: true,
          readOnly: undefined,
        };
        break;
      case FieldTypeEnum.Input:
        options = {
          ...baseOptions,
          type: "text",
        };
        break;
      case FieldTypeEnum.Textarea:
        options = {
          ...baseOptions,
        };
        break;
      case FieldTypeEnum.Select:
        options = {
          ...baseOptions,
          items: [],
        };
        break;
      case FieldTypeEnum.Radio:
        options = {
          ...baseOptions,
          items: [],
        };
        break;
      case FieldTypeEnum.Checkbox:
        options = {
          ...baseOptions,
          items: [],
        };
        break;
      case FieldTypeEnum.Upload:
        options = {
          ...baseOptions,
          multiple: true,
          gallery: false,
          maxSize: 20 * 1024 * 1024, // 20MB
          supportedExtensions: undefined,
        };
        break;
      case FieldTypeEnum.Integration:
        options = {
          ...baseOptions,
          label: undefined,
        };
        break;
      case FieldTypeEnum.Link:
        options = {
          ...baseOptions,
          readOnly: undefined,
          label: undefined,
        };
        break;
      case FieldTypeEnum.Map:
        options = {
          ...baseOptions,
          layers: [],
          height: "400px",
          width: "100%",
          table: true,
          zoomControl: true,
          hideHeader: false,
          source: "",
        };
        break;
      case FieldTypeEnum.Array:
        options = {
          ...baseOptions,
          readOnly: undefined,
        };
        break;
      case FieldTypeEnum.Table:
        options = {
          ...baseOptions,
        };
        break;
      default:
        options = baseOptions;
    }

    return {
      type,
      key: (Math.random() + 1).toString(36).substring(7),
      options,
      expressions: {},
      ...(type === FieldTypeEnum.Array || type === FieldTypeEnum.Block
        ? {
            block: [],
          }
        : {}),
    };
  };

  const presetTemplate = async (
    preset: FormMetadata
  ): Promise<IField | null> => {
    if (preset.id !== undefined) {
      const presetConfig = await formsClient.findOne(preset.id);

      if (presetConfig) {
        return {
          type: FieldTypeEnum.Preset,
          key: preset.id,
          preset: presetConfig.form.preset ?? [],
          options: {
            tooltip: preset.documentation,
          },
          expressions: {},
        };
      }
    }

    return null;
  };

  const handlePresetSelect = async (preset: FormMetadata) => {
    const presetConfig = await presetTemplate(preset);
    addFieldCallback(presetConfig);
    presetModalController.onClose();
  };

  const fetchPresets = async () => {
    try {
      const response = await formsClient.findAll();
      const fieldPresets = response.forms.filter(
        (form) => form.type !== FormTypeEnum.STEP
      );
      setPresets(fieldPresets);
    } catch (error) {
      console.error("Error fetching presets:", error);
      setPresets([]);
    }
  };

  useEffect(() => {
    if (showPresets) {
      fetchPresets();
    }
  }, [showPresets]);

  const handleFieldSelection = (index: number) => {
    // Flatten all field types into a single array
    const allFields = fieldTypeGroups.flatMap((group) => group.types);

    // Convert 1-based index to 0-based
    const fieldIndex = index - 1;

    if (fieldIndex >= 0 && fieldIndex < allFields.length) {
      const field = allFields[fieldIndex];
      addFieldCallback(template(field[0]));
    }
  };

  useEffect(() => {
    hotkeyContext.dispatch({
      type: "SET_HOTKEY",
      payload: {
        C: withNumberInput((event, index) => {
          event?.preventDefault();
          if (index !== undefined) {
            handleFieldSelection(index);
          }
        }),
        V: withNoModifiers((event) => {
          event?.preventDefault();
          setPresetModalOpen(true);
        }),
      },
    });

    return () => {
      hotkeyContext.dispatch({
        type: "UNSET_HOTKEY",
        delete: ["C", "V"],
      });
    };
    
  }, [hotkeyContext, addFieldCallback]);

  const handleCloseModal = () => {
    setPresetsSearch("");
    setPresetModalOpen(false);
  };

  return (
    <div className="text-left flex space-x-2">
      <Menu
        open={submenuOpen}
        onOpenChange={setSubmenuOpen}
      >
        <MenuButton
          as="button"
          className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-150 ${
            submenuOpen
              ? styleContext.state.buttonHoverColorWeight === "200"
                ? "bg-gray-200 border-gray-300"
                : "bg-gray-700 border-gray-600"
              : styleContext.state.buttonHoverColorWeight === "200"
                ? "bg-gray-100 hover:bg-gray-200 border-gray-200"
                : "bg-gray-800 hover:bg-gray-700 border-gray-700"
          } border`}
          onClick={() => setSubmenuOpen(true)}
          style={{ color: styleContext.state.textColor }}
        >
          <div className="flex items-center space-x-2">
            <div
              className={`p-2 rounded-lg ${
                styleContext.state.buttonHoverColorWeight === "200"
                  ? "bg-blue-100"
                  : "bg-blue-900"
              }`}
            >
              <FaMinus
                className={
                  styleContext.state.buttonHoverColorWeight === "200"
                    ? "text-blue-600"
                    : "text-blue-300"
                }
                size={16}
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <span className="font-medium">Campos Padrão</span>
                <SL>C</SL>
              </div>
              <span className="text-xs opacity-70">
                Adicionar campo de formulário
              </span>
            </div>
          </div>
        </MenuButton>
        <MenuList
          className="p-2"
        >
          <div
            className="max-h-[300px] overflow-y-auto"
            style={{
              backgroundColor: styleContext.state.backgroundColor,
              borderWidth: 1,
              borderStyle: "solid",
              borderColor:
                styleContext.state.buttonHoverColorWeight === "200"
                  ? "#e5e7eb"
                  : "#4b5563",
              borderRadius: 8,
            }}
          >
            {fieldTypeGroups.map((group, groupIndex) => (
              <React.Fragment key={group.label}>
                {groupIndex > 0 && (
                  <div
                    className="mx-4 my-2 border-t"
                    style={{
                      borderColor:
                        styleContext.state.buttonHoverColorWeight === "200"
                          ? "#e5e7eb"
                          : "#374151",
                    }}
                  />
                )}
                <div
                  className={`px-4 ${groupIndex === 0 ? "mt-0" : "mt-2"} mb-1 text-xs font-medium tracking-wider uppercase`}
                  style={{ color: styleContext.state.textColor, opacity: 0.7 }}
                >
                  {group.label}
                </div>
                {group.types.map(([type, label, Icon], typeIndex) => {
                  // Calculate the overall index for this field across all groups
                  const globalIndex =
                    fieldTypeGroups
                      .slice(0, groupIndex)
                      .reduce((sum, g) => sum + g.types.length, 0) +
                    typeIndex +
                    1;

                  return (
                    <MenuItem
                      key={type}
                      onClick={() => {
                        addFieldCallback(template(type));
                        setSubmenuOpen(false);
                      }}
                      className="transition-colors duration-150"
                      style={{
                        color: styleContext.state.textColor,
                        backgroundColor: styleContext.state.backgroundColor,
                        paddingLeft: 16,
                        paddingRight: 16,
                        paddingTop: 8,
                        paddingBottom: 8,
                      }}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center space-x-2">
                          <Icon size={14} className="opacity-75" />
                          <span>{label}</span>
                        </div>
                        {globalIndex <= 9 && <SL>C+{globalIndex}</SL>}
                      </div>
                    </MenuItem>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </MenuList>
      </Menu>

      {showPresetsBlocks && (
        <button
          onClick={() => setPresetModalOpen(true)}
          className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-150 ${
            presetModalOpen
              ? styleContext.state.buttonHoverColorWeight === "200"
                ? "bg-gray-200 border-gray-300"
                : "bg-gray-700 border-gray-600"
              : styleContext.state.buttonHoverColorWeight === "200"
                ? "bg-gray-100 hover:bg-gray-200 border-gray-200"
                : "bg-gray-800 hover:bg-gray-700 border-gray-700"
          } border`}
          style={{ color: styleContext.state.textColor }}
        >
          <div className="flex items-center space-x-2">
            <div
              className={`p-2 rounded-lg ${
                styleContext.state.buttonHoverColorWeight === "200"
                  ? "bg-purple-100"
                  : "bg-purple-900"
              }`}
            >
              <FaList
                className={
                  styleContext.state.buttonHoverColorWeight === "200"
                    ? "text-purple-600"
                    : "text-purple-300"
                }
                size={16}
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <span className="font-medium">Pré-Definidos</span>
                <SL>V</SL>
              </div>
              <span className="text-xs opacity-70">
                Adicionar campo pré-configurado
              </span>
            </div>
          </div>
        </button>
      )}

      <Modal
        isOpen={presetModalOpen}
        onClose={handleCloseModal}
      >
        <ModalOverlay />
        <ModalContent>
          <div
            style={{
              backgroundColor: styleContext.state.backgroundColor,
              borderWidth: 1,
              borderStyle: "solid",
              borderColor:
                styleContext.state.buttonHoverColorWeight === "200"
                  ? "#e5e7eb"
                  : "#4b5563",
              borderRadius: 12,
            }}
          >
            <ModalHeader>
              <div style={{ color: styleContext.state.textColor }}>
                Selecionar Pré-Definido
              </div>
            </ModalHeader>
            <ModalBody>
            <TreeList
              items={mapPresetsToTreeItems(presets)}
              search={presetsSearch}
              onClick={handlePresetSelect}
              onSearchChange={setPresetsSearch}
              getIcon={getPresetIcon}
              icon={FaMinus}
              iconColor="blue"
            />
            </ModalBody>
            <ModalFooter>
            <Button
              onClick={handleCloseModal}
              style={{
                backgroundColor:
                  styleContext.state.buttonHoverColorWeight === "200"
                    ? "#E5E7EB"
                    : "#374151",
                color: styleContext.state.textColor,
              }}
            >
              Cancelar
            </Button>
            </ModalFooter>
          </div>
        </ModalContent>
      </Modal>
    </div>
  );
};
