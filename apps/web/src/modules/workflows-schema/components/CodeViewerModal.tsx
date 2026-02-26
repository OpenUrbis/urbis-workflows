import React, { useContext, useState, useEffect } from "react";
import { CodeEditor } from "./CodeEditor";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { StyleContext } from "../../../reducers";
import { SL } from "../../../components";
import {
  IconButton,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from "../../../components";

interface CodeViewerModalProps {
  title: string;
  code: any;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (code: any) => void;
  language?: "json" | "javascript" | "html";
  readOnly?: boolean;
}

export const CodeViewerModal: React.FC<CodeViewerModalProps> = ({
  code,
  title,
  isOpen,
  onClose,
  onSave,
  language = "json",
  readOnly = true,
}) => {
  const styleContext = useContext(StyleContext);
  const [editedCode, setEditedCode] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [hasSyntaxError, setHasSyntaxError] = useState(false);
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const [showWarnings, setShowWarnings] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    if (code) {
      const formattedCode =
        typeof code === "string" ? code : JSON.stringify(code, null, 2);
      setEditedCode(formattedCode);
      setHasChanges(false);
      setHasSyntaxError(false);
      setValidationErrors([]);
    }
  }, [code]);

  const handleCodeChange = (newCode: string) => {
    setEditedCode(newCode);
    setHasChanges(true);

    // Check for syntax errors when language is JSON
    if (language === "json") {
      try {
        JSON.parse(newCode);
        setHasSyntaxError(false);
      } catch (error) {
        setHasSyntaxError(true);
      }
    }
  };

  const handleValidate = (errors: any[]) => {
    setValidationErrors(errors);
    setHasSyntaxError(errors.some((error) => error.severity === 8));
  };

  const handleSave = async () => {
    if (!onSave || !hasChanges || hasSyntaxError) return;

    try {
      const parsedCode =
        language === "json" ? JSON.parse(editedCode) : editedCode;

      await onSave({ code: parsedCode });

      setHasChanges(false);
      onClose();
    } catch (error) {
      await confirmation(
        "O código contém erros de sintaxe. Por favor, corrija os erros antes de salvar.",
        { type: "warning" }
      );
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (
      e.key === "Enter" &&
      !e.shiftKey &&
      !readOnly &&
      onSave &&
      hasChanges &&
      !hasSyntaxError
    ) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
    
  }, [isOpen, hasChanges, hasSyntaxError]);

  const isSaveDisabled = !hasChanges || hasSyntaxError;

  // Separate errors and warnings
  const errors = validationErrors.filter((error) => error.severity === 8);
  const warnings = validationErrors.filter((error) => error.severity !== 8);

  const alertRowStyle = (variant: "error" | "warning") => {
    const isLight = styleContext.state.buttonHoverColorWeight === "200";
    if (variant === "error") {
      return {
        backgroundColor: isLight ? "#fee2e2" : "#7f1d1d",
        color: isLight ? "#991b1b" : "#fecaca",
      };
    }
    return {
      backgroundColor: isLight ? "#fef3c7" : "#78350f",
      color: isLight ? "#92400e" : "#fef3c7",
    };
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <div
          className="flex flex-col max-h-[80vh] max-w-[56rem]"
        >
        <ModalHeader
          className="flex items-center justify-between border-b pb-4"
          style={{ color: styleContext.state.textColor }}
        >
          <div className="flex items-center space-x-3">
            <span>{title}</span>
          </div>
        </ModalHeader>
        <ModalBody className="mt-4 p-0 overflow-auto">
          <div style={{ height: "400px" }}>
            <CodeEditor
              value={editedCode}
              onChange={readOnly ? () => {} : handleCodeChange}
              language={language}
              height="100%"
              onValidate={handleValidate}
              readOnly={readOnly}
            />
          </div>
        </ModalBody>
        <ModalFooter
          className="p-0 flex flex-col w-full"
          style={{
            borderColor:
              styleContext.state.buttonHoverColorWeight === "200"
                ? "#E5E7EB"
                : "#374151",
          }}
        >
          {validationErrors.length > 0 && (
            <div className="w-full px-4 py-3 max-h-[150px] overflow-y-auto">
              {errors.length > 0 && (
                <div>
                  <div
                    className="cursor-pointer flex items-center gap-2 px-3 py-2 rounded-md"
                    onClick={() => setShowErrors(!showErrors)}
                    style={alertRowStyle("error")}
                  >
                    <div className="h-2.5 w-2.5 rounded-full bg-current opacity-60" />
                    <div className="flex-grow">
                      {errors.length} {errors.length === 1 ? "erro" : "erros"}{" "}
                      encontrado
                      {errors.length === 1 ? "" : "s"}
                    </div>
                    <IconButton
                      aria-label="Toggle errors"
                      icon={showErrors ? <FaChevronUp /> : <FaChevronDown />}
                      style={{ color: styleContext.state.textColor }}
                    />
                  </div>
                  {showErrors && (
                    <div className="pl-4 mt-2 space-y-2">
                      {errors.map((error, index) => (
                        <div
                          key={`error-${index}`}
                          className="flex items-center gap-2 px-3 py-2 rounded-md"
                          style={alertRowStyle("error")}
                        >
                          <div className="h-2 w-2 rounded-full bg-current opacity-60" />
                          Linha {error.startLineNumber}: {error.message}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {warnings.length > 0 && (
                <div className="mt-2">
                  <div
                    className="cursor-pointer flex items-center gap-2 px-3 py-2 rounded-md"
                    onClick={() => setShowWarnings(!showWarnings)}
                    style={alertRowStyle("warning")}
                  >
                    <div className="h-2.5 w-2.5 rounded-full bg-current opacity-60" />
                    <div className="flex-grow">
                      {warnings.length}{" "}
                      {warnings.length === 1 ? "aviso" : "avisos"} encontrado
                      {warnings.length === 1 ? "" : "s"}
                    </div>
                    <IconButton
                      aria-label="Toggle warnings"
                      icon={showWarnings ? <FaChevronUp /> : <FaChevronDown />}
                      style={{ color: styleContext.state.textColor }}
                    />
                  </div>
                  {showWarnings && (
                    <div className="pl-4 mt-2 space-y-2">
                      {warnings.map((warning, index) => (
                        <div
                          key={`warning-${index}`}
                          className="flex items-center gap-2 px-3 py-2 rounded-md"
                          style={alertRowStyle("warning")}
                        >
                          <div className="h-2 w-2 rounded-full bg-current opacity-60" />
                          Linha {warning.startLineNumber}: {warning.message}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          <div className="border-t w-full">
            <div className="px-4 py-3 flex justify-end space-x-3">
              {!readOnly && onSave && (
                <button
                  onClick={handleSave}
                  disabled={isSaveDisabled}
                  className="px-6 py-2.5 rounded-lg font-medium text-white transition-colors flex items-center space-x-2"
                  style={{
                    backgroundColor:
                      styleContext.state.buttonHoverColorWeight === "200"
                        ? "#eab308"
                        : "#854d0e",
                    opacity: isSaveDisabled ? "0.5" : "1",
                    cursor: isSaveDisabled ? "not-allowed" : "pointer",
                  }}
                >
                  <span>Salvar Alterações</span>
                  <SL
                    bg={
                      styleContext.state.buttonHoverColorWeight === "200"
                        ? "yellow.600"
                        : "yellow.900"
                    }
                  >
                    Enter
                  </SL>
                </button>
              )}
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center space-x-2"
                style={{
                  backgroundColor:
                    styleContext.state.buttonHoverColorWeight === "200"
                      ? "#f3f4f6"
                      : "#1f2937",
                  color: styleContext.state.textColor,
                }}
              >
                <span>{!readOnly && onSave ? "Cancelar" : "Fechar"}</span>
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
            </div>
          </div>
        </ModalFooter>
        </div>
      </ModalContent>
    </Modal>
  );
};
