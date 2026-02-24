import React, { memo, useCallback, useContext, useRef, useState } from "react";
import { BlockOptions, IField } from "@open-urbis/types";
import { AddFieldMenu } from "../components/AddFieldMenu";
import { FieldOptionEditor } from "../components/FieldOptionEditor";
import { FieldEditable } from "./FieldEditable";
import { StepEditable } from "./fields";
import { FieldBlockEditableProps } from "./utils/types";
import { Tooltip } from "@chakra-ui/react";
import { StyleContext } from "../../../reducers/style.reducer";
import { FaCube } from "react-icons/fa";

const FieldEditableItem: React.FC<{
  parent: any;
  fieldDef: IField;
  fieldKey: string;
  index: number;
  general: any;
  value: any;
  valid: any;
  context: any;
  validContext: any;
  onChange: (key: string, value: any) => void;
  onValidChange: (key: string, valid: any) => void;
  onConfigChange: (index: number, config: IField) => void;
  onRemove: (index: number) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
}> = memo(({
  parent,
  fieldDef,
  fieldKey,
  index,
  general,
  value,
  valid,
  context,
  validContext,
  onChange,
  onValidChange,
  onConfigChange,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
}) => {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onValidChangeRef = useRef(onValidChange);
  onValidChangeRef.current = onValidChange;
  const onConfigChangeRef = useRef(onConfigChange);
  onConfigChangeRef.current = onConfigChange;
  const onRemoveRef = useRef(onRemove);
  onRemoveRef.current = onRemove;
  const fieldKeyRef = useRef(fieldKey);
  fieldKeyRef.current = fieldKey;
  const indexRef = useRef(index);
  indexRef.current = index;

  const handleChange = useCallback((v: any) => {
    onChangeRef.current(fieldKeyRef.current, v);
  }, []);

  const handleValidChange = useCallback((v: any) => {
    onValidChangeRef.current(fieldKeyRef.current, v);
  }, []);

  const handleConfigChange = useCallback((config: IField) => {
    onConfigChangeRef.current(indexRef.current, config);
  }, []);

  const handleRemove = useCallback(() => {
    onRemoveRef.current(indexRef.current);
  }, []);

  const handleDragStartLocal = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    onDragStart(e, index);
  }, [onDragStart, index]);

  const handleDragOverLocal = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    onDragOver(e, index);
  }, [onDragOver, index]);

  return (
    <div
      className="mb-4"
      draggable
      onDragStart={handleDragStartLocal}
      onDragOver={handleDragOverLocal}
      onDrop={onDrop}
    >
      <FieldEditable
        parent={parent}
        context={context}
        validContext={validContext}
        general={general}
        field={fieldDef}
        value={value}
        valid={valid}
        onChange={handleChange}
        onValidChange={handleValidChange}
        onConfigChange={handleConfigChange}
        onRemove={handleRemove}
      />
    </div>
  );
});

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

  const fieldRef = useRef(field);
  fieldRef.current = field;
  const onConfigChangeRef = useRef(onConfigChange);
  onConfigChangeRef.current = onConfigChange;

  const handleFieldConfigChange = useCallback((index: number, config: IField) => {
    const newFields = [...fieldRef.current];
    newFields[index] = config;
    onConfigChangeRef.current(newFields);
  }, []);

  const handleDragStart = useCallback((
    e: React.DragEvent<HTMLDivElement>,
    index: number
  ) => {
    setStartDraggingIndex(index);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragOver = useCallback((
    e: React.DragEvent<HTMLDivElement>,
    index: number
  ) => {
    e.preventDefault();
    setStartDraggingIndex((startIdx) => {
      if (startIdx === null) return startIdx;

      let newIndex = startIdx < index ? index + 1 : index;
      newIndex = newIndex > fieldRef.current.length ? fieldRef.current.length : newIndex;

      if (startIdx !== newIndex) {
        setCurrentDraggingIndex(newIndex);
      }
      return startIdx;
    });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    setStartDraggingIndex((startIdx) => {
      setCurrentDraggingIndex((currentIdx) => {
        if (startIdx !== null && currentIdx !== null) {
          const newFields = [...fieldRef.current];
          const [movedItem] = newFields.splice(startIdx, 1);
          
          const targetIndex = startIdx < currentIdx
            ? currentIdx - 1
            : currentIdx;
          
          newFields.splice(targetIndex, 0, {
            ...movedItem,
            options: { ...movedItem.options }
          });

          onConfigChangeRef.current(newFields);
        }
        return null;
      });
      return null;
    });
  }, []);

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
              field.map((f, index) => {
                const fKey = (f.options as any).key ?? f.key;
                return (
                  <FieldEditableItem
                    key={`parent-${parent.key}-field-${f.key}-${index}-drag`}
                    parent={parent}
                    fieldDef={f}
                    fieldKey={fKey}
                    index={index}
                    general={general}
                    value={value?.[fKey]}
                    valid={valid?.[fKey]}
                    context={value}
                    validContext={valid}
                    onChange={onChange}
                    onValidChange={onValidChange}
                    onConfigChange={handleFieldConfigChange}
                    onRemove={onRemove}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  />
                );
              })
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
