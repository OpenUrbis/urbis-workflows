import { IconButton, Spinner, Tooltip } from "@chakra-ui/react";
import React, { useCallback, useContext, useMemo, useState } from "react";
import {
  FaTrash,
  FaEyeSlash,
  FaChevronUp,
  FaChevronDown,
  FaList,
} from "react-icons/fa";
import {
  ArrayOptions,
  BlockOptions,
  FieldInputOptions,
  IField,
  PresetOptions,
} from "@open-urbis/types";
import { HelpTooltipClickable } from "../../../components";
import { FieldOptionEditor } from "../components/FieldOptionEditor";
import { FormEditor } from "../components/FormEditor";
import { RenderFieldModelCalculation } from "./components/RenderFieldModelCalculation";
import { RenderFieldPrivacyInfo } from "./components/RenderFieldPrivacyInfo";
import { RenderValidState } from "./components/RenderValidState";
import { FIELD_COMPONENT_MAP, useFieldDynamic } from "./Field";
import { FieldBlock } from "./FieldBlock";
import { FieldBlockEditable } from "./FieldBlockEditable";
import { Integration, Link } from "./fields";
import { LabelEditable } from "./fields/LabelEditable";
import { ParagraphEditable } from "./fields/ParagraphEditable";
import { TitleEditable } from "./fields/TitleEditable";
import {
  FieldEditableProps,
  InlineEditableTypes,
  InputFieldTypes,
} from "./utils/types";
import { StyleContext } from "../../../reducers/style.reducer";

export const FieldEditable: React.FC<FieldEditableProps> = ({
  parent,
  context,
  validContext,
  general,
  field,
  value,
  valid,
  onChange,
  onValidChange,
  onConfigChange,
  onRemove,
}): JSX.Element => {
  const styleContext = useContext(StyleContext);
  const { loading, visible, options, validState, setOptions } = useFieldDynamic(
    field,
    context,
    validContext,
    general,
    value,
    onChange,
    onValidChange
  );

  const [localValue, setLocalValue] = useState(value);
  const [localValid, setLocalValid] = useState(valid);
  const [showHidden, setShowHidden] = useState(false);

  const FieldComponent = FIELD_COMPONENT_MAP[field.type] || (() => <></>);

  const handleConfigChange = useCallback(
    (config: any) => {
      onConfigChange(config);
      setOptions({ ...options, ...config.options });
    },
    [onConfigChange, options, setOptions]
  );

  const fieldOptionEditor = useMemo(
    () => (
      <FieldOptionEditor
        field={field}
        general={general}
        onChange={handleConfigChange}
      />
    ),
    [field, general, handleConfigChange]
  );

  const showHiddenField = () => {
    return (
      <div className="flex-1 mt-2">
        <div className="flex justify-start">
          <Tooltip
            label="Clique para visualizar o campo oculto"
            placement="top"
          >
            <div
              onClick={() => setShowHidden(true)}
              className={`inline-flex items-center space-x-2 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-opacity-80 ${
                styleContext.state.buttonHoverColorWeight === "200"
                  ? "bg-gray-200 text-gray-800"
                  : "bg-gray-700 text-gray-200"
              }`}
            >
              <FaEyeSlash size={14} className="text-gray-500" />
              <span className="text-xs font-medium">Campo oculto</span>
            </div>
          </Tooltip>
        </div>
      </div>
    );
  };

  const hideFieldButton = () => {
    return (
      <Tooltip label="Clique para ocultar o campo" placement="top">
        <div
          onClick={() => setShowHidden(false)}
          className={`inline-flex items-center space-x-2 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-opacity-80 ${
            styleContext.state.buttonHoverColorWeight === "200"
              ? "bg-gray-200 text-gray-800"
              : "bg-gray-700 text-gray-200"
          }`}
        >
          <FaEyeSlash size={14} className="text-gray-500" />
          <span className="text-xs font-medium">Ocultar campo</span>
        </div>
      </Tooltip>
    );
  };

  const renderFieldContent = (content: JSX.Element) => {
    if (!visible && !showHidden) {
      return showHiddenField();
    }
    return content;
  };

  const deleteActionButton = () => {
    return (
      <IconButton
        aria-label="Remove field"
        icon={<FaTrash />}
        onClick={onRemove}
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
    );
  };

  return (
    <div className="w-full" key={`field-container-${field.key}`}>
      {InlineEditableTypes.includes(field.type) && (
        <div
          className="flex space-x-4 w-full"
          key={`inline-editable-${field.key}`}
        >
          <div className="w-full">
            <div className="flex items-center space-x-4 w-full">
              {fieldOptionEditor}
              {renderFieldContent(
                <div className="flex-1">
                  {field.type === "title" && (
                    <TitleEditable
                      key={field.key}
                      onChange={(config) =>
                        onConfigChange({ ...field, ...config })
                      }
                      props={{ ...field } as any}
                    />
                  )}
                  {field.type === "subtitle" && (
                    <ParagraphEditable
                      key={field.key}
                      onChange={(config) =>
                        onConfigChange({ ...field, ...config })
                      }
                      props={{ ...field } as any}
                    />
                  )}
                  {field.type === "link" && (
                    <>
                      <div className="flex items-center space-x-2">
                        <Tooltip label="Campo do tipo vínculo" placement="top">
                          <div className="bg-pink-100 px-2 py-0.5 rounded-full">
                            <span className="text-xs font-medium text-pink-800">
                              Vínculo
                            </span>
                          </div>
                        </Tooltip>
                        <Tooltip
                          label="Chave de identificação do vínculo"
                          placement="top"
                        >
                          <div
                            className={`px-2 py-0.5 rounded-lg ${
                              styleContext.state.buttonHoverColorWeight ===
                              "200"
                                ? "bg-gray-200 text-gray-800"
                                : "bg-gray-700 text-gray-200"
                            }`}
                          >
                            <label className="font-bold text-xs">
                              {field.key}
                            </label>
                          </div>
                        </Tooltip>
                      </div>
                      <Link value={value} general={general} />
                    </>
                  )}
                  {field.type === "integration" && (
                    <>
                      <div className="flex items-center space-x-2">
                        <Tooltip
                          label="Campo do tipo integração"
                          placement="top"
                        >
                          <div className="bg-indigo-100 px-2 py-0.5 rounded-full">
                            <span className="text-xs font-medium text-indigo-800">
                              Integração
                            </span>
                          </div>
                        </Tooltip>
                        <Tooltip
                          label="Chave de identificação da integração"
                          placement="top"
                        >
                          <div
                            className={`px-2 py-0.5 rounded-lg ${
                              styleContext.state.buttonHoverColorWeight ===
                              "200"
                                ? "bg-gray-200 text-gray-800"
                                : "bg-gray-700 text-gray-200"
                            }`}
                          >
                            <label className="font-bold text-xs">
                              {field.key}
                            </label>
                          </div>
                        </Tooltip>
                      </div>
                      <Integration
                        field={field}
                        options={options}
                        value={value}
                      />
                      {loading && (
                        <div className="mt-4">
                          <Spinner />
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
              {deleteActionButton()}
            </div>
          </div>
        </div>
      )}
      {parent && InputFieldTypes.includes(field.type) && (
        <div className="flex space-x-6 w-full" key={`input-field-${field.key}`}>
          {fieldOptionEditor}
          {renderFieldContent(
            <div className="w-full">
              <div className="flex items-start space-x-4">
                <LabelEditable
                  fieldKey={field.key}
                  onChange={(config) => {
                    const newOptions = {
                      ...field.options,
                      ...config.options,
                    };
                    onConfigChange({
                      ...field,
                      options: newOptions,
                    });
                    setOptions(newOptions);
                  }}
                  props={
                    {
                      ...field,
                      options,
                    } as any
                  }
                />
                <RenderFieldPrivacyInfo
                  sensibilityLevel={options.sensibilityLevel}
                  accessLevel={options.accessLevel}
                  permissions={options.permissions}
                />
                <RenderFieldModelCalculation
                  parent={parent}
                  field={field}
                  general={general}
                />
                {(options as FieldInputOptions).tooltip && (
                  <HelpTooltipClickable
                    tooltip={(options as FieldInputOptions).tooltip as string}
                  />
                )}
              </div>
              <FieldComponent
                field={field}
                key={field.key}
                options={options}
                general={general}
                value={value}
                valid={valid}
                context={context}
                onChange={onChange}
                onValidChange={onValidChange}
              />
            </div>
          )}
          {deleteActionButton()}
        </div>
      )}
      {field.type === "block" && field.block && (
        <div
          key={`block-field-${field.key}`}
          className={`${
            (options as BlockOptions).card
              ? `w-full rounded ${
                  (options as BlockOptions).hideCardBorder
                    ? "border-none px-6 pt-6"
                    : "border border-gray-200 p-6"
                }`
              : ""
          }`}
        >
          {(options as BlockOptions).card && (
            <div className="flex items-center space-x-2 text-lg">
              <div className="flex items-center space-x-3 flex-1">
                <LabelEditable
                  fieldKey={field.key}
                  onChange={(config) => {
                    const newOptions = {
                      ...field.options,
                      ...config.options,
                    };
                    onConfigChange({
                      ...field,
                      options: newOptions,
                    });
                    setOptions(newOptions);
                  }}
                  props={
                    {
                      ...field,
                      options: {
                        ...field.options,
                        ...options,
                      },
                    } as any
                  }
                />
                <div className="mb-2">
                  <RenderFieldPrivacyInfo
                    sensibilityLevel={options.sensibilityLevel}
                    accessLevel={options.accessLevel}
                    permissions={options.permissions}
                  />
                </div>
                <div className="mb-2">
                  <RenderFieldModelCalculation
                    parent={parent || field}
                    field={field}
                    general={general}
                  />
                </div>
                {(options as BlockOptions).tooltip && (
                  <div className="mb-2">
                    <HelpTooltipClickable
                      tooltip={(options as BlockOptions).tooltip as string}
                    />
                  </div>
                )}
              </div>
              {(options as BlockOptions).toggle !== false && (
                <div
                  className="flex items-center space-x-2 cursor-pointer text-blue-500 hover:text-blue-700 transition-colors"
                  onClick={() =>
                    setOptions({
                      ...options,
                      open: !!!(options as BlockOptions).open,
                    } as BlockOptions)
                  }
                >
                  {(options as BlockOptions).open === true ? (
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
              )}
              {deleteActionButton()}
            </div>
          )}
          {((options as BlockOptions).open ?? true) && (
            <FieldBlockEditable
              parent={{ ...field, options }}
              field={field.block}
              layout={(options as BlockOptions).layout}
              general={general}
              value={localValue}
              valid={localValid}
              onChange={(k, v) => {
                setLocalValue((current: any) => {
                  const newLocalValue = { ...current, [k]: v };
                  onChange(newLocalValue);
                  return newLocalValue;
                });
              }}
              onValidChange={(k, v) => {
                setLocalValid((current: any) => {
                  const newLocalValid = { ...current, [k]: v };
                  onValidChange(newLocalValid);
                  return newLocalValid;
                });
              }}
              onConfigChange={(f: IField[]) => {
                onConfigChange({ ...field, block: f });
              }}
              onParentConfigChange={(parent: IField) => {
                onConfigChange(parent);
              }}
              onRemove={(index) => {
                onConfigChange({
                  ...field,
                  block: field.block?.filter((_, i) => i !== index),
                });
              }}
            />
          )}
        </div>
      )}
      {field.type === "preset" && field.preset && (
        <div
          className="flex space-x-4 w-full"
          key={`preset-field-${field.key}`}
        >
          {fieldOptionEditor}
          {renderFieldContent(
            <div className="p-6 w-full border rounded space-y-4">
              <div className="flex items-center w-full">
                <Tooltip label="Campo do tipo preset" placement="top">
                  <div
                    className={`flex items-center space-x-2 px-2 py-1.5 rounded-lg ${
                      styleContext.state.buttonHoverColorWeight === "200"
                        ? "bg-gray-200 text-gray-800"
                        : "bg-gray-700 text-gray-200"
                    }`}
                  >
                    <FaList className="text-blue-500" size={14} />
                    <label className="font-bold text-xs">
                      {(options as PresetOptions).key ?? field.key}
                    </label>
                  </div>
                </Tooltip>
                <div className="flex-grow"></div>
                {deleteActionButton()}
              </div>
              <FieldBlock
                parent={field}
                field={field.preset}
                general={general}
                value={localValue}
                valid={localValid}
                onChange={(k, v) => {
                  setLocalValue((current: any) => {
                    const newLocalValue = { ...current, [k]: v };
                    onChange(newLocalValue);
                    return newLocalValue;
                  });
                }}
                onValidChange={(k, v) => {
                  setLocalValid((current: any) => {
                    const newLocalValid = { ...current, [k]: v };
                    onValidChange(newLocalValid);
                    return newLocalValid;
                  });
                }}
              />
            </div>
          )}
        </div>
      )}
      {field.type === "array" && field.block && (
        <div className="flex space-x-4 w-full" key={`array-field-${field.key}`}>
          {fieldOptionEditor}
          {renderFieldContent(
            <div className="flex flex-col w-full">
              <div className="flex items-center space-x-4">
                <LabelEditable
                  fieldKey={field.key}
                  onChange={(config) =>
                    onConfigChange({
                      ...field,
                      options: {
                        ...field.options,
                        ...config.options,
                      },
                    })
                  }
                  props={{ ...field } as any}
                />
                {(options as ArrayOptions).tooltip && (
                  <HelpTooltipClickable
                    tooltip={(options as ArrayOptions).tooltip as string}
                  />
                )}
              </div>
              <div className="p-6 w-full border rounded space-y-4">
                <FormEditor
                  fields={field.block as IField[]}
                  general={general}
                  value={value?.[0]}
                  valid={valid}
                  onConfigChange={(block) => {
                    onConfigChange({ ...field, block });
                  }}
                  onChange={(v) => {
                    onChange([v].concat((value ?? []).slice(1)));
                  }}
                  onValidChange={(valid) => {
                    onValidChange([valid]);
                  }}
                  showPresets={true}
                  showPresetsBlocks={true}
                ></FormEditor>
              </div>
            </div>
          )}
          {deleteActionButton()}
        </div>
      )}
      <div className="flex flex-col px-16">
        {!visible && showHidden && (
          <div className="mt-4">{hideFieldButton()}</div>
        )}
        {validState !== undefined && validState !== null && (
          <div className="mt-4">
            <RenderValidState validState={validState} />
          </div>
        )}
      </div>
    </div>
  );
};
