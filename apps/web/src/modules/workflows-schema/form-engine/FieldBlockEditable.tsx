import React, { useContext, useState } from "react";
import { BlockOptions, IField } from "@open-urbis/types";
import { AddFieldMenu } from "../components/AddFieldMenu";
import { FieldOptionEditor } from "../components/FieldOptionEditor";
import { FieldEditable } from "./FieldEditable";
import { StepEditable } from "./fields";
import { FieldBlockEditableProps } from "./utils/types";
import { Tooltip } from "@chakra-ui/react";
import { StyleContext } from "../../../reducers/style.reducer";
import { FaCube } from "react-icons/fa";

export const FieldBlockEditable: React.FC<FieldBlockEditableProps> = ({
  parent,
  field,
  layout = "block",
  general,
  value,
  valid,
  onChange,
  onValidChange,
  onConfigChange,
  onParentConfigChange,
  onRemove,
}): JSX.Element => {
  const styleContext = useContext(StyleContext);
  const [startDraggingIndex, setStartDraggingIndex] = useState<number | null>(
    null
  );
  const [currentDraggingIndex, setCurrentDraggingIndex] = useState<
    number | null
  >(null);

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    index: number
  ) => {
    setStartDraggingIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (
    e: React.DragEvent<HTMLDivElement>,
    index: number
  ) => {
    e.preventDefault();
    if (startDraggingIndex === null) return;

    let newIndex = startDraggingIndex < index ? index + 1 : index;
    newIndex = newIndex > field.length ? field.length : newIndex;

    if (startDraggingIndex !== newIndex) {
      setCurrentDraggingIndex(newIndex);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    if (startDraggingIndex !== null && currentDraggingIndex !== null) {
      const newFields = [...field];
      const [movedItem] = newFields.splice(startDraggingIndex, 1);
      
      const targetIndex = startDraggingIndex < currentDraggingIndex
        ? currentDraggingIndex - 1
        : currentDraggingIndex;
      
      newFields.splice(targetIndex, 0, {
        ...movedItem,
        options: { ...movedItem.options }
      });

      onConfigChange(newFields);

      setStartDraggingIndex(null);
      setCurrentDraggingIndex(null);
    }
  };

  return (
    <>
      {(parent.options as BlockOptions).hideEditMenu !== true && (
        <div className="flex items-center">
          <div className="flex items-center space-x-2">
            <FieldOptionEditor
              general={general}
              field={parent}
              onChange={(config) => {
                onParentConfigChange(config);
              }}
            />
            <Tooltip label="Chave de identificação do bloco" placement="top">
              <div
                className={`px-2 py-0.5 rounded-lg ${
                  styleContext.state.buttonHoverColorWeight === "200"
                    ? "bg-gray-200 text-gray-800"
                    : "bg-gray-700 text-gray-200"
                }`}
              >
                <label className="font-bold text-xs">{parent.key}</label>
              </div>
            </Tooltip>
          </div>
        </div>
      )}

      <div className="mt-10">
        {layout === "step" && (
          <StepEditable
            field={field}
            general={general}
            value={value}
            valid={valid}
            onChange={onChange}
            onValidChange={onValidChange}
            onConfigChange={onConfigChange}
          />
        )}
        {layout === "block" && (
          <div
            className={`${
              (parent.options as BlockOptions).card &&
              (parent.options as BlockOptions).open === false
                ? "hidden"
                : ""
            }`}
          >
            {!field?.length ? (
              <div className="flex flex-col items-center justify-center text-gray-500">
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
              field.map((f, index) => (
                <div
                  key={`parent-${parent.key}-field-${f.key}-${index}-drag`}
                  className="mb-4"
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={handleDrop}
                >
                  <FieldEditable
                    parent={parent}
                    context={value}
                    validContext={valid}
                    general={general}
                    field={f}
                    value={value?.[(f.options as any).key ?? f.key]}
                    valid={valid?.[(f.options as any).key ?? f.key]}
                    onChange={(v) => {
                      onChange((f.options as any).key ?? f.key, v);
                    }}
                    onValidChange={(valid) => {
                      onValidChange((f.options as any).key ?? f.key, valid);
                    }}
                    onConfigChange={(config: IField) => {
                      const newFields = [...field];
                      newFields[index] = config;
                      onConfigChange(newFields);
                    }}
                    onRemove={() => onRemove(index)}
                  />
                </div>
              ))
            )}
            <div className="flex justify-center mt-10">
              <AddFieldMenu
                addFieldCallback={(config: any) => {
                  if (config) {
                    const newFields = [...field, config];
                    onConfigChange(newFields);
                  }
                }}
                showPresets={true}
                showPresetsBlocks={true}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
};
