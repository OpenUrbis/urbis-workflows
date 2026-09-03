import { useContext, useState, useEffect } from "react";
import { IField, IFormContext, MapOptions } from "@open-urbis/types";
import { FaEllipsisV, FaChevronUp, FaChevronDown } from "react-icons/fa";
import { StyleContext } from "../../../reducers";
import { Field } from "../form-engine/Field";
import MapLayersEditor from "./MapLayersEditor";
import { createFieldConfig } from "./fieldConfigs";
import React from "react";
import { SideDrawer } from "../../../components/SideDrawer";
import { PermissionsSelector } from "./PermissionsSelector";
import { IconButton } from "../../../components";

// Add utility functions for items conversion
const convertItemsToString = (
  items: Array<{ label: string; value: any }> = []
): string => {
  return items
    .map((item) => {
      if (item.label === item.value || item.value === undefined) {
        return item.label;
      }
      return `${item.label};${item.value}`;
    })
    .join("\n");
};

const convertStringToItems = (
  itemsStr: string = ""
): Array<{ label: string; value: any }> => {
  if (!itemsStr.trim()) return [];

  return itemsStr.split("\n").map((line) => {
    const [label, value] = line.split(";");
    if (!value) {
      return { label: label.trim(), value: label.trim() };
    }

    // Try to parse the value into its proper type
    let parsedValue: any = value.trim();
    if (parsedValue === "true") parsedValue = true;
    else if (parsedValue === "false") parsedValue = false;
    else if (!isNaN(Number(parsedValue))) parsedValue = Number(parsedValue);
    else if (parsedValue.startsWith('"') && parsedValue.endsWith('"')) {
      parsedValue = parsedValue.slice(1, -1);
    }

    return { label: label.trim(), value: parsedValue };
  });
};

export type FieldOptionEditorProps = {
  field: IField;
  general: IFormContext;
  options?: { iconSize?: number; textColor?: string };
  onChange: (config: IField) => void;
};

interface IBlockValue {
  [key: string]: any;
}

interface IFieldValue {
  [blockName: string]: IBlockValue;
}

// Field type color mapping
const fieldTypeColors = {
  input: { bg: "bg-blue-100", text: "text-blue-800" },
  textarea: { bg: "bg-blue-100", text: "text-blue-800" },
  select: { bg: "bg-purple-100", text: "text-purple-800" },
  radio: { bg: "bg-purple-100", text: "text-purple-800" },
  checkbox: { bg: "bg-purple-100", text: "text-purple-800" },
  block: { bg: "bg-green-100", text: "text-green-800" },
  array: { bg: "bg-green-100", text: "text-green-800" },
  title: { bg: "bg-yellow-100", text: "text-yellow-800" },
  subtitle: { bg: "bg-yellow-100", text: "text-yellow-800" },
  upload: { bg: "bg-orange-100", text: "text-orange-800" },
  integration: { bg: "bg-indigo-100", text: "text-indigo-800" },
  link: { bg: "bg-pink-100", text: "text-pink-800" },
  map: { bg: "bg-teal-100", text: "text-teal-800" },
  mapPicker: { bg: "bg-teal-100", text: "text-teal-800" },
  mapPerimeter: { bg: "bg-teal-100", text: "text-teal-800" },
  preset: { bg: "bg-cyan-100", text: "text-cyan-800" },
  table: { bg: "bg-amber-100", text: "text-amber-800" },
};

// Field type label mapping
const fieldTypeLabels = {
  input: "Campo de Texto",
  textarea: "Área de Texto",
  select: "Seleção",
  radio: "Escolha",
  checkbox: "Múltipla Escolha",
  block: "Bloco",
  array: "Arranjo",
  title: "Título",
  subtitle: "Subtítulo",
  upload: "Upload",
  integration: "Integração",
  link: "Vínculo",
  map: "Mapa",
  mapPicker: "DWG",
  mapPerimeter: "Perímetro",
  preset: "Preset",
  table: "Tabela",
};

// Helper function to extract block paths from field config
const extractConfigPaths = (
  config: IField,
  parentPath: string = ""
): Map<string, string> => {
  const paths = new Map<string, string>();

  if (config.block) {
    config.block.forEach((blockField) => {
      const currentPath = parentPath
        ? `${parentPath}.${blockField.key}`
        : blockField.key;

      if (blockField.block) {
        // This is a section (like default-options, specific-options, expressions)
        blockField.block.forEach((field) => {
          const key = field.key;
          // Extract the actual field path from the key (e.g., options.required from options.required)
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const [_, ...rest] = key.split(".");
          if (rest.length > 0) {
            paths.set(key, `${blockField.key}.${key}`);
          }
        });

        // Recursively process nested blocks
        const nestedPaths = extractConfigPaths(blockField, currentPath);
        nestedPaths.forEach((value, key) => paths.set(key, value));
      }
    });
  }

  return paths;
};

// Add type guard
const isBlockValue = (value: any): value is IBlockValue => {
  return typeof value === "object" && value !== null;
};

const mapFieldToFormValue = (field: IField): IFieldValue => {
  const value: IFieldValue = {};

  // Get the editor config for this field type
  const editorConfig = createFieldConfig(field);
  const configPaths = extractConfigPaths(editorConfig);

  // Map values based on the config paths
  configPaths.forEach((blockPath, fieldPath) => {
    // Handle the special $. prefix in fieldPath
    const fieldKeyPath = fieldPath.replace(/^\$\./, ""); // Remove $. prefix
    const pathParts = fieldKeyPath.split(".");

    // Get the block name from blockPath (everything before first dot)
    const [blockName] = blockPath.split(".");

    // Initialize block if it doesn't exist
    if (!value[blockName]) {
      value[blockName] = {};
    }

    // Get the value from field using the path parts
    let fieldValue: any = field;
    for (const part of pathParts) {
      if (fieldValue === undefined) break;
      fieldValue = fieldValue[part];
    }

    if (fieldValue !== undefined) {
      // Special handling for items field
      if (fieldPath === "$.options.items" && Array.isArray(fieldValue)) {
        fieldValue = convertItemsToString(fieldValue);
      }

      // Store the value in the block using the original path with $. prefix
      value[blockName][fieldPath] = fieldValue;
    }
  });

  return value;
};

const mapFormValueToFieldChanges = (
  value: IFieldValue,
  field: IField
): IField => {
  const changes: Partial<IField> = {};

  // Process all form values using the block structure
  Object.entries(value).forEach(([blockName, blockValue]) => {
    if (isBlockValue(blockValue)) {
      // Process each block's key-value pairs
      Object.entries(blockValue).forEach(([path, val]) => {
        // Remove $. prefix to get the actual path in the field
        const fieldPath = path.replace(/^\$\./, "");
        const pathParts = fieldPath.split(".");

        // Special handling for items field
        if (path === "$.options.items" && typeof val === "string") {
          val = convertStringToItems(val);
        }

        // Build up the changes object based on the path
        let current: any = changes;
        for (let i = 0; i < pathParts.length - 1; i++) {
          const part = pathParts[i];
          if (!current[part]) {
            current[part] = {};
          }
          current = current[part];
        }

        // Set the final value
        const lastPart = pathParts[pathParts.length - 1];
        current[lastPart] = val;
      });
    }
  });

  return {
    ...field,
    ...changes,
    options: {
      ...field.options,
      ...changes.options,
    },
    expressions: {
      ...field.expressions,
      ...changes.expressions,
    },
  };
};

export const FieldOptionEditor: React.FC<FieldOptionEditorProps> = ({
  field,
  general,
  options,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMapLayersOpen, setIsMapLayersOpen] = useState(true);
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(true);
  const styleContext = useContext(StyleContext);
  const [editorConfig] = useState<IField>(() => createFieldConfig(field));
  const [formValue, setFormValue] = useState<IFieldValue | null>(null);
  const [pendingKeyChange, setPendingKeyChange] = useState<string | null>(null);

  const fieldTypeColor = fieldTypeColors[field.type] || {
    bg: "bg-gray-100",
    text: "text-gray-800",
  };
  const fieldTypeLabel = fieldTypeLabels[field.type] || field.type;

  useEffect(() => {
    if (isOpen && !formValue) {
      setFormValue(mapFieldToFormValue(field));
    }
  }, [isOpen, field, formValue]);

  const handleOpen = () => {
    setIsOpen(true);
    setPendingKeyChange(null);
  };

  const handleClose = () => {
    setIsOpen(false);
    onChange({
      ...field,
      key: pendingKeyChange ?? field.key,
    });
    setFormValue(null);
    setPendingKeyChange(null);
  };

  const handleFieldChange = (value: IFieldValue) => {
    const newKey = Object.values(value).find(
      (blockValue) => blockValue["$.key"] !== undefined
    )?.["$.key"];
    setPendingKeyChange(newKey ?? field.key);
    const newConfig = mapFormValueToFieldChanges(value, field);
    // only update key at close
    onChange({
      ...newConfig,
      key: field.key,
    });
  };

  return (
    <>
      <IconButton
        aria-label="Field Edit Options"
        icon={
          <div
            className={`${
              options?.iconSize
                ? "cursor-pointer p-4 bg-gray-300 rounded-xl hover:bg-gray-400 transition-colors"
                : "hover:text-gray-600 transition-colors"
            }`}
            style={{
              color: options?.textColor ?? styleContext.state.textColor,
            }}
          >
            <FaEllipsisV size={options?.iconSize} />
          </div>
        }
        onClick={handleOpen}
        variant="ghost"
        _hover={{ bg: "transparent" }}
      />

      {isOpen && formValue && (
        <SideDrawer
          isOpen={isOpen}
          onClose={handleClose}
          styleContext={styleContext}
          title="Configurações do Campo"
          badge={{
            text: fieldTypeLabel,
            color: {
              bg: fieldTypeColor.bg,
              text: fieldTypeColor.text,
            },
          }}
        >
          <div className="text-foreground">
            <Field
              parent={editorConfig}
              field={editorConfig}
              general={general}
              value={formValue}
              valid={{}}
              onChange={handleFieldChange}
              onValidChange={() => {}}
              context={formValue}
              validContext={{}}
            />
            {(field.type === "map" || field.type === ("documentMap" as any)) && (
              <div className="flex px-2 flex-col mt-8">
                <div
                  className="flex items-center space-x-2 text-lg p-4"
                  style={{
                    borderColor:
                      styleContext.state.buttonHoverColorWeight === "200"
                        ? "#E5E7EB"
                        : "#374151",
                  }}
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <label className="font-medium">Camadas do Mapa</label>
                  </div>
                  <div
                    className="flex items-center space-x-2 cursor-pointer text-blue-500 hover:text-blue-700 transition-colors"
                    onClick={() => setIsMapLayersOpen(!isMapLayersOpen)}
                  >
                    {isMapLayersOpen ? (
                      <>
                        <FaChevronUp size={14} />
                        <span className="text-sm">Recolher</span>
                      </>
                    ) : (
                      <>
                        <FaChevronDown size={14} />
                        <span className="text-sm">Expandir</span>
                      </>
                    )}
                  </div>
                </div>
                {isMapLayersOpen && (
                  <MapLayersEditor
                    layers={(field.options as MapOptions)?.layers ?? []}
                    onSave={(layers) => {
                      onChange({
                        ...field,
                        options: {
                          ...field.options,
                          layers,
                        } as MapOptions,
                      });
                    }}
                  />
                )}
              </div>
            )}

            {/* Check if the editor config has a controlSection before showing permissions */}
            {editorConfig.block?.some((section) => section.key === "control") && (
              <div className="flex px-2 flex-col mt-8">
                <div
                  className="flex items-center space-x-2 text-lg p-4"
                  style={{
                    borderColor:
                      styleContext.state.buttonHoverColorWeight === "200"
                        ? "#E5E7EB"
                        : "#374151",
                  }}
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <label className="font-medium">Controle de Permissões</label>
                  </div>
                  <div
                    className="flex items-center space-x-2 cursor-pointer text-blue-500 hover:text-blue-700 transition-colors"
                    onClick={() => setIsPermissionsOpen(!isPermissionsOpen)}
                  >
                    {isPermissionsOpen ? (
                      <>
                        <FaChevronUp size={14} />
                        <span className="text-sm">Recolher</span>
                      </>
                    ) : (
                      <>
                        <FaChevronDown size={14} />
                        <span className="text-sm">Expandir</span>
                      </>
                    )}
                  </div>
                </div>
                {isPermissionsOpen && (
                  <div className="px-4 pb-4">
                    <PermissionsSelector
                      showBorder={false}
                      permissions={field.options.permissions}
                      onChange={(permissions) => {
                        onChange({
                          ...field,
                          options: {
                            ...field.options,
                            permissions,
                          },
                        });
                      }}
                      styleContext={styleContext}
                      title="Permissões Específicas do Campo"
                      helperText="Defina quais usuários, papéis ou grupos podem acessar este campo"
                      parentDrawerId="field-option-editor"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </SideDrawer>
      )}
    </>
  );
};

export default FieldOptionEditor;
