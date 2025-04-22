import React, { FC, useContext, useEffect, useState } from "react";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useDisclosure,
} from "@chakra-ui/react";
import { IField, FieldTypeEnum, TextAreaOptions } from "@open-urbis/types";
import { Field } from "../modules/workflows-schema/form-engine/Field";
import { StyleContext } from "../reducers";
import HelpTooltipClickable from "./HelpTooltipCliclable";
import SL from "./ShortcutLabel";
import { AdvancedEditor } from "./AdvancedEditor";
import { FaInfoCircle, FaTimes, FaExclamationTriangle } from "react-icons/fa";

type PromptResolve = (value: string | null) => void;

let resolvePrompt: PromptResolve | null = null;
let setPromptParams: React.Dispatch<React.SetStateAction<PromptProps>>;

interface IPromptPropsOptions {
  code?: boolean;
  tooltip?: string;
  validator?: (value: any) => boolean;
  errorMessage?: string;
  intellisenseObj?: {
    obj: any;
    docs?: any;
  };
  isIndexSelector?: boolean;
}

interface PromptProps {
  title?: string;
  defaultValue?: string;
  fields?: IField[];
  options?: IPromptPropsOptions;
}

const PromptModal: FC<PromptProps> = ({
  title = "",
  defaultValue = "",
  fields,
  options,
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [input, setInput] = useState<string>(defaultValue);
  const [modalTitle, setModalTitle] = useState<string>(title);
  const [formFields, setFields] = useState<any[]>(fields || []);
  const [modalOptions, setModalOptions] = useState<IPromptPropsOptions>(
    options || {}
  );
  const [promptParams, setPromptParamsState] = useState<PromptProps>({});
  const [form, setForm] = useState<any>(input || {});
  const [valid, setValid] = useState<any>({});
  const [hasError, setHasError] = useState<boolean>(false);
  const [editorError, setEditorError] = useState<any[]>([]);
  const styleContext = useContext(StyleContext);

  setPromptParams = setPromptParamsState;

  useEffect(() => {
    setInput(promptParams?.defaultValue || "");
    setModalTitle(promptParams?.title || "");
    setFields(promptParams?.fields || []);
    setForm(promptParams?.defaultValue || {});
    setModalOptions(promptParams?.options || {});
    if (resolvePrompt) {
      onOpen();
    }
    
  }, [resolvePrompt, promptParams]);

  useEffect(() => {
    const { validator } = promptParams?.options ?? {};
    let resultValidate = false;
    if (validator) resultValidate = !validator(input);

    if (hasError !== resultValidate) setHasError(resultValidate);

    
  }, [input]);

  const handleClose = () => {
    // Focus on the close button before closing the modal
    const closeButton = document.querySelector(
      '[aria-label="Close"]'
    ) as HTMLButtonElement;
    if (closeButton) {
      closeButton.focus();
    }
    onClose();
  };

  const handleConfirm = () => {
    if (resolvePrompt) {
      if (formFields?.length) {
        resolvePrompt(form);
      } else {
        if (modalOptions.code) {
          if (editorError.length) return;
        }
        resolvePrompt(input);
      }
    }
    handleClose();
  };

  const handleCancel = () => {
    if (resolvePrompt) {
      resolvePrompt(null);
    }
    handleClose();
  };

  (window as any).prompt = (
    title: string,
    defaultValue?: string,
    fields?: any[],
    options?: any
  ) => {
    return new Promise<string | null>((resolve) => {
      if (setPromptParams) {
        setPromptParams({
          title,
          defaultValue,
          fields,
          options,
        });
      }
      resolvePrompt = resolve;
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleConfirm();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  const renderError = () => {
    const { errorMessage: message } = promptParams?.options ?? {};
    if (!hasError || !message) return;

    return (
      <div role="alert" className="w-full mt-3">
        <div
          className="flex items-center space-x-2 p-3 rounded-lg"
          style={{
            backgroundColor:
              styleContext.state.buttonHoverColorWeight === "200"
                ? "#fee2e2"
                : "#7f1d1d",
            color:
              styleContext.state.buttonHoverColorWeight === "200"
                ? "#991b1b"
                : "#fecaca",
            border: `1px solid ${styleContext.state.buttonHoverColorWeight === "200" ? "#fecaca" : "#991b1b"}`,
          }}
        >
          <FaExclamationTriangle size={16} />
          <p className="text-sm font-medium">{message}</p>
        </div>
      </div>
    );
  };

  const isIndexSelector =
    modalTitle.toLowerCase().includes("índice") ||
    modalTitle.toLowerCase().includes("indice");

  const renderInputArea = () => {
    if (formFields.length) {
      return formFields.map((field: any) => (
        <div key={field.key} className="mb-4">
          <Field
            parent={field}
            general={{}}
            field={field}
            value={form[field.key]}
            valid={valid[field.key]}
            onChange={(value) => {
              setForm({ ...form, [field.key]: value });
            }}
            onValidChange={(v: boolean) => {
              setValid({ ...valid, [field.key]: v });
            }}
            context={form[field.key]}
            validContext={valid[field.key]}
          />
        </div>
      ));
    }

    if (modalOptions.code) {
      return (
        <div className="rounded-lg overflow-hidden border border-gray-200">
          <AdvancedEditor
            height="30vh"
            initialValue={input}
            intellisense={modalOptions?.intellisenseObj}
            onChange={(value) => setInput(value ?? "")}
            onValidate={(error) => setEditorError(error)}
          />
        </div>
      );
    }

    if (isIndexSelector) {
      return (
        <div className="flex flex-col space-y-4">
          <div className="flex items-center space-x-3">
            <input
              type="number"
              value={input}
              onChange={(e) => {
                const value = e.target.value;
                // Only update if the value is empty or a positive number
                if (
                  value === "" ||
                  (!isNaN(Number(value)) && Number(value) >= 0)
                ) {
                  setInput(value);
                }
              }}
              onKeyDown={(e) => {
                // Prevent non-numeric keys except for special keys like backspace, delete, arrows
                if (
                  !/^\d$/.test(e.key) && // not a number
                  ![
                    "Backspace",
                    "Delete",
                    "ArrowLeft",
                    "ArrowRight",
                    "Tab",
                    "Enter",
                    "Escape",
                  ].includes(e.key) &&
                  !(
                    (e.ctrlKey || e.metaKey) &&
                    ["c", "v", "a"].includes(e.key.toLowerCase())
                  ) // allow copy/paste/select all
                ) {
                  e.preventDefault();
                }
                // Handle original key events for Enter and Escape
                handleKeyDown(e);
              }}
              min="0"
              // Focus management using a delayed approach to prevent scroll jumping
              // This approach ensures that:
              // 1. The modal is fully rendered and positioned before focus is set
              // 2. The scroll position remains stable when the modal opens/closes
              // 3. Focus is only set when both the input exists and modal is open
              ref={(input) => {
                if (input && isOpen) {
                  setTimeout(() => {
                    input.focus();
                  }, 0);
                }
              }}
              className={`w-32 px-4 py-3 text-2xl font-bold text-center rounded-lg border ${
                hasError
                  ? "border-red-400 focus:border-red-500"
                  : "border-gray-200 focus:border-yellow-400"
              } focus:outline-none focus:ring-2 ${
                hasError ? "focus:ring-red-200" : "focus:ring-yellow-100"
              }`}
              placeholder="0"
              style={{
                color: styleContext.state.textColor,
                backgroundColor: styleContext.state.backgroundColor,
                borderColor:
                  styleContext.state.buttonHoverColorWeight === "200"
                    ? "#e5e7eb"
                    : "#374151",
              }}
            />
            <div style={{ color: styleContext.state.textColor }}>
              <span className="font-medium">Atalho:</span> Digite o número +{" "}
              <SL
                bg={
                  styleContext.state.buttonHoverColorWeight === "200"
                    ? "yellow.100"
                    : "yellow.800"
                }
                className="ml-1"
                alwaysShow
              >
                Enter
              </SL>
            </div>
          </div>
          <div
            className="text-sm"
            style={{ color: styleContext.state.textColor }}
          >
            Digite o número do item que deseja selecionar
          </div>
        </div>
      );
    }

    // Default textarea using Field component
    const textareaField: IField = {
      key: "prompt-input",
      type: FieldTypeEnum.Textarea,
      options: {
        placeholder: "",
        autoFocus: true,
      } as TextAreaOptions,
      expressions: {},
    };

    return (
      <div className="relative w-full">
        <Field
          parent={textareaField}
          general={{}}
          field={textareaField}
          value={input}
          valid={true}
          onChange={(value) => setInput(value)}
          onValidChange={() => {}}
          context={{}}
          validContext={{}}
        />
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      motionPreset="slideInBottom"
      isCentered
      onEsc={handleCancel}
      closeOnEsc={false}
    >
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent
        className="px-6 py-"
        style={{
          minWidth: isIndexSelector ? "400px" : "400px",
          maxWidth: "600px",
          backgroundColor: styleContext.state.backgroundColor,
        }}
      >
        <ModalHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 text-xl mt-4">
              <span style={{ color: styleContext.state.textColor }}>
                {modalTitle}
              </span>
              {modalOptions?.tooltip && (
                <div className="text-sm">
                  <HelpTooltipClickable
                    tooltip={modalOptions.tooltip}
                    icon={FaInfoCircle}
                    size="20px"
                  />
                </div>
              )}
            </div>
            <button
              onClick={handleCancel}
              className="hover:bg-opacity-10 rounded p-1.5 transition-colors duration-150"
              style={{
                color:
                  styleContext.state.buttonHoverColorWeight === "200"
                    ? "#6B7280"
                    : "#9CA3AF",
                backgroundColor:
                  styleContext.state.buttonHoverColorWeight === "200"
                    ? "rgba(107, 114, 128, 0.1)"
                    : "rgba(156, 163, 175, 0.1)",
              }}
              aria-label="Close"
            >
              <FaTimes size={12} />
            </button>
          </div>
        </ModalHeader>
        <ModalBody
          className={`my-4 ${isIndexSelector ? "text-center" : ""}`}
          style={{ color: styleContext.state.textColor }}
        >
          {renderInputArea()}
          {renderError()}
        </ModalBody>
        <ModalFooter className="pt-4 border-t space-x-3">
          <button
            className={`px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center space-x-2
              ${
                hasError
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-yellow-600 hover:bg-yellow-700 text-white"
              }`}
            disabled={hasError}
            onClick={handleConfirm}
            style={
              hasError
                ? undefined
                : {
                    backgroundColor:
                      styleContext.state.backgroundColor === "#000000"
                        ? "#d97706"
                        : undefined,
                    color: "#ffffff",
                  }
            }
          >
            <span>{isIndexSelector ? "Selecionar" : "Confirmar"}</span>
            <SL
              bg={
                hasError
                  ? "gray.200"
                  : styleContext.state.buttonHoverColorWeight === "200"
                    ? "yellow.600"
                    : "yellow.900"
              }
            >
              Enter
            </SL>
          </button>
          <button
            className="px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center space-x-2"
            onClick={handleCancel}
            style={{
              backgroundColor:
                styleContext.state.buttonHoverColorWeight === "200"
                  ? "#f3f4f6"
                  : "#1f2937",
              color: styleContext.state.textColor,
            }}
          >
            <span>Cancelar</span>
            <SL
              bg={
                styleContext.state.buttonHoverColorWeight === "200"
                  ? "gray.100"
                  : "gray.600"
              }
            >
              esc
            </SL>
          </button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default PromptModal;
