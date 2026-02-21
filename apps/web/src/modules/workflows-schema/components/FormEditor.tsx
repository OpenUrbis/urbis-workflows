import { IconButton, Tooltip } from "@chakra-ui/react";
import { useContext, useState } from "react";
import { FaTrash, FaList, FaCube } from "react-icons/fa";
import { IField, IFormContext, PresetOptions } from "@open-urbis/types";
import { Field } from "../form-engine/Field";
import { FieldEditable } from "../form-engine/FieldEditable";
import { AddFieldMenu } from "./AddFieldMenu";
import { FieldOptionEditor } from "./FieldOptionEditor";
import { StyleContext } from "../../../reducers/style.reducer";

export type FormEditorProps = {
  fields: IField[];
  value?: any;
  valid?: { [key: string]: boolean };
  general: IFormContext;
  fieldLimitNumber?: number;
  showPresets?: boolean;
  showPresetsBlocks?: boolean;
  onConfigChange: (fields: IField[]) => void;
  onChange?: (value: any) => void;
  onValidChange?: (valid: { [key: string]: boolean }) => void;
};

export const FormEditor: React.FC<FormEditorProps> = ({
  fields: fieldsInput,
  value,
  valid: validInput,
  general,
  onConfigChange,
  onChange,
  onValidChange,
  fieldLimitNumber = 1000,
  showPresets = true,
  showPresetsBlocks = false,
}): JSX.Element => {
  const styleContext = useContext(StyleContext);
  const [form, setForm] = useState<any>(value ?? {});
  const [valid, setValid] = useState<any>(validInput ?? {});
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  const handleRemoveField = (layerIndex: number) => {
    const newFields = [...fieldsInput];
    newFields.splice(layerIndex, 1);
    onConfigChange(newFields);
  };

  const handleAddField = (field: IField | null) => {
    if (field !== null) {
      const newFields = [...fieldsInput];
      newFields.push(field);
      onConfigChange(newFields);
    }
  };

  const handleSetField = (index: number, field: IField) => {
    const newFields = [...fieldsInput];
    newFields[index] = field;
    onConfigChange(newFields);
  };

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    index: number
  ) => {
    setDraggingIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (draggingIndex === null) return;

    let newIndex = draggingIndex < index ? index + 1 : index;

    newIndex = newIndex > fieldsInput.length ? fieldsInput.length : newIndex;

    if (draggingIndex !== newIndex) {
      const newFields = [...fieldsInput];
      const itemToMove = newFields.splice(draggingIndex, 1)[0];

      if (draggingIndex < newIndex) {
        newIndex--;
      }

      newFields.splice(newIndex, 0, itemToMove);

      onConfigChange(newFields);
      setDraggingIndex(newIndex);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <>
      <div className="flex flex-col space-y-4">
        {!fieldsInput.length ? (
          <div className="flex flex-col items-center justify-center py-6 text-gray-500">
            <FaCube size={32} className="mb-4 opacity-50" />
            <p
              className="text-sm text-center mb-2"
              style={{ color: styleContext.state.textColor }}
            >
              Nenhum campo configurado
            </p>
            <p
              className="text-xs text-center"
              style={{ color: styleContext.state.textColor }}
            >
              Adicione campos usando o botão abaixo
            </p>
          </div>
        ) : (
          fieldsInput.map((field, index) => {
            return (
              <div
                key={field.key}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragOver={(e) => handleDragOver(e)}
              >
                {field.type !== "preset" && (
                  <FieldEditable
                    parent={field}
                    field={field}
                    context={form}
                    validContext={valid}
                    value={form[field.key]}
                    valid={valid[field.key]}
                    general={general}
                    onChange={(value: any) => {
                      setForm((form: any) => {
                        const newValue = { ...form, [field.key]: value };
                        onChange?.(newValue);
                        return newValue;
                      });
                    }}
                    onValidChange={(v: boolean) => {
                      setValid((valid: any) => {
                        const newValid = { ...valid, [field.key]: v };
                        onValidChange?.(newValid);
                        return newValid;
                      });
                    }}
                    onConfigChange={(config) => handleSetField(index, config)}
                    onRemove={() => {
                      handleRemoveField(index);
                    }}
                  />
                )}
                {field.type === "preset" && (
                  <div className="flex space-x-4">
                    <FieldOptionEditor
                      field={field}
                      general={general}
                      onChange={(config) => handleSetField(index, config)}
                    />
                    <div className="w-full p-6 border rounded-lg space-y-4">
                      <div className="flex items-center w-full">
                        <Tooltip label="Campo do tipo preset" placement="top">
                          <div className={`flex items-center space-x-2 px-2 py-1.5 rounded-lg ${
                            styleContext.state.buttonHoverColorWeight === "200"
                              ? "bg-gray-200 text-gray-800"
                              : "bg-gray-700 text-gray-200"
                          }`}>
                            <FaList className="text-blue-500" size={14} />
                            <label className="font-bold text-xs">
                              {(field.options as PresetOptions).key ?? field.key}
                            </label>
                          </div>
                        </Tooltip>
                        <div className="flex-grow"></div>
                        <IconButton
                          aria-label="Remove field"
                          icon={<FaTrash />}
                          onClick={() => {
                            handleRemoveField(index);
                          }}
                          bg={
                            styleContext.state.buttonHoverColorWeight === "200"
                              ? "gray.100"
                              : "gray.800"
                          }
                          color={
                            styleContext.state.buttonHoverColorWeight === "200"
                              ? "gray.600"
                              : "gray.200"
                          }
                          _hover={{
                            bg:
                              styleContext.state.buttonHoverColorWeight === "200"
                                ? "gray.200"
                                : "gray.700",
                          }}
                        />
                      </div>
                      {field.preset?.map((preset) => {
                        const presetKey =
                          (preset.options as PresetOptions).key ?? preset.key;
                        return (
                          <Field
                            key={presetKey}
                            parent={field}
                            field={preset}
                            context={form?.[field.key]}
                            validContext={valid[field.key]}
                            value={form[field.key]?.[presetKey]}
                            valid={valid[field.key]?.[presetKey]}
                            general={general}
                            onChange={(value: any) => {
                              setForm((form: any) => {
                                const newValue = {
                                  ...form,
                                  [field.key]: {
                                    ...form[field.key],
                                    [presetKey]: value,
                                  },
                                };
                                onChange?.(newValue);
                                return newValue;
                              });
                            }}
                            onValidChange={(v: boolean) => {
                              setValid((valid: any) => {
                                const newValid = {
                                  ...valid,
                                  [field.key]: {
                                    ...valid[field.key],
                                    [presetKey]: v,
                                  },
                                };
                                onValidChange?.(newValid);
                                return newValid;
                              });
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      {fieldsInput.length < fieldLimitNumber && (
        <div className="flex justify-center mt-10">
          <AddFieldMenu
            addFieldCallback={handleAddField}
            showPresets={showPresets}
            showPresetsBlocks={showPresetsBlocks}
          />
        </div>
      )}
    </>
  );
};
