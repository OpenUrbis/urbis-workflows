import React, { useContext, useState, useEffect } from "react";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  ModalFooter,
  Box,
  Alert,
  AlertIcon,
  IconButton,
  Collapse,
} from "@chakra-ui/react";
import { CodeEditor } from "./CodeEditor";
import { FaTimes, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { StyleContext } from "../../../reducers";
import { SL } from "../../../components";

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

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl">
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent
        maxHeight="80vh"
        maxWidth="56rem"
        bg={styleContext.state.backgroundColor}
        display="flex"
        flexDirection="column"
      >
        <ModalHeader
          className="flex items-center justify-between border-b pb-4"
          style={{ color: styleContext.state.textColor }}
        >
          <div className="flex items-center space-x-3">
            <span>{title}</span>
          </div>
          <button
            onClick={onClose}
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
                  <Alert
                    status="error"
                    className="cursor-pointer"
                    onClick={() => setShowErrors(!showErrors)}
                    style={{
                      backgroundColor:
                        styleContext.state.buttonHoverColorWeight === "200"
                          ? "#fee2e2"
                          : "#7f1d1d",
                      color:
                        styleContext.state.buttonHoverColorWeight === "200"
                          ? "#991b1b"
                          : "#fecaca",
                    }}
                  >
                    <AlertIcon />
                    <div className="flex-grow">
                      {errors.length} {errors.length === 1 ? "erro" : "erros"}{" "}
                      encontrado
                      {errors.length === 1 ? "" : "s"}
                    </div>
                    <IconButton
                      aria-label="Toggle errors"
                      icon={showErrors ? <FaChevronUp /> : <FaChevronDown />}
                      size="sm"
                      variant="ghost"
                      style={{ color: styleContext.state.textColor }}
                    />
                  </Alert>
                  <Collapse in={showErrors}>
                    <Box pl={4} mt={2} className="space-y-2">
                      {errors.map((error, index) => (
                        <Alert
                          status="error"
                          variant="left-accent"
                          key={`error-${index}`}
                          style={{
                            backgroundColor:
                              styleContext.state.buttonHoverColorWeight ===
                              "200"
                                ? "#fee2e2"
                                : "#7f1d1d",
                            color:
                              styleContext.state.buttonHoverColorWeight ===
                              "200"
                                ? "#991b1b"
                                : "#fecaca",
                          }}
                        >
                          <AlertIcon />
                          Linha {error.startLineNumber}: {error.message}
                        </Alert>
                      ))}
                    </Box>
                  </Collapse>
                </div>
              )}

              {warnings.length > 0 && (
                <div className="mt-2">
                  <Alert
                    status="warning"
                    className="cursor-pointer"
                    onClick={() => setShowWarnings(!showWarnings)}
                    style={{
                      backgroundColor:
                        styleContext.state.buttonHoverColorWeight === "200"
                          ? "#fef3c7"
                          : "#78350f",
                      color:
                        styleContext.state.buttonHoverColorWeight === "200"
                          ? "#92400e"
                          : "#fef3c7",
                    }}
                  >
                    <AlertIcon />
                    <div className="flex-grow">
                      {warnings.length}{" "}
                      {warnings.length === 1 ? "aviso" : "avisos"} encontrado
                      {warnings.length === 1 ? "" : "s"}
                    </div>
                    <IconButton
                      aria-label="Toggle warnings"
                      icon={showWarnings ? <FaChevronUp /> : <FaChevronDown />}
                      size="sm"
                      variant="ghost"
                      style={{ color: styleContext.state.textColor }}
                    />
                  </Alert>
                  <Collapse in={showWarnings}>
                    <Box pl={4} mt={2} className="space-y-2">
                      {warnings.map((warning, index) => (
                        <Alert
                          status="warning"
                          variant="left-accent"
                          key={`warning-${index}`}
                          style={{
                            backgroundColor:
                              styleContext.state.buttonHoverColorWeight ===
                              "200"
                                ? "#fef3c7"
                                : "#78350f",
                            color:
                              styleContext.state.buttonHoverColorWeight ===
                              "200"
                                ? "#92400e"
                                : "#fef3c7",
                          }}
                        >
                          <AlertIcon />
                          Linha {warning.startLineNumber}: {warning.message}
                        </Alert>
                      ))}
                    </Box>
                  </Collapse>
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
      </ModalContent>
    </Modal>
  );
};
