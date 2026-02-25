import React, { FC, useContext, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@open-urbis/map-ui";
import { StyleContext } from "../reducers";
import SL from "./ShortcutLabel";
import {
  FaTimes,
  FaExclamationTriangle,
  FaCheckCircle,
  FaQuestionCircle,
} from "react-icons/fa";

type ConfirmResolve = (value: boolean) => void;

let resolveConfirm: ConfirmResolve | null = null;
let setConfirmParams: React.Dispatch<React.SetStateAction<ConfirmProps>>;

interface ConfirmProps {
  title?: string;
  message?: string;
  type?: "warning" | "success" | "question";
  confirmText?: string;
  cancelText?: string;
}

const ConfirmModal: FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState<string>("");
  const [modalMessage, setModalMessage] = useState<string>("");
  const [modalType, setModalType] = useState<
    "warning" | "success" | "question"
  >("warning");
  const [confirmText, setConfirmText] = useState<string>("Confirmar");
  const [cancelText, setCancelText] = useState<string>("Cancelar");
  const [confirmParams, setConfirmParamsState] = useState<ConfirmProps>({});
  const styleContext = useContext(StyleContext);

  setConfirmParams = setConfirmParamsState;

  useEffect(() => {
    setModalTitle(confirmParams?.title || "Confirmação");
    setModalMessage(confirmParams?.message || "");
    setModalType(confirmParams?.type || "warning");
    setConfirmText(confirmParams?.confirmText || "Confirmar");
    setCancelText(confirmParams?.cancelText || "Cancelar");
    if (resolveConfirm) {
      setIsOpen(true);
    }
  }, [confirmParams]);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleConfirm = () => {
    if (resolveConfirm) {
      resolveConfirm(true);
    }
    handleClose();
  };

  const handleCancel = () => {
    if (resolveConfirm) {
      resolveConfirm(false);
    }
    handleClose();
  };

  // Define the global confirmation function
  (window as any).confirmation = (
    message: string,
    options?: Partial<ConfirmProps>
  ) => {
    return new Promise<boolean>((resolve) => {
      if (setConfirmParams) {
        setConfirmParams({
          title: options?.title || "Confirmação",
          message,
          type: options?.type || "warning",
          confirmText: options?.confirmText || "Confirmar",
          cancelText: options?.cancelText || "Cancelar",
        });
      }
      resolveConfirm = resolve;
    });
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      handleConfirm();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  useEffect(() => {
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
    
  }, [isOpen]);

  const getIcon = () => {
    switch (modalType) {
      case "warning":
        return <FaExclamationTriangle className="text-yellow-500" size={24} />;
      case "success":
        return <FaCheckCircle className="text-green-500" size={24} />;
      default:
        return <FaQuestionCircle className="text-blue-500" size={24} />;
    }
  };

  const getConfirmButtonStyle = () => {
    switch (modalType) {
      case "warning":
        return "bg-yellow-500 hover:bg-yellow-600";
      case "success":
        return "bg-green-500 hover:bg-green-600";
      default:
        return "bg-blue-500 hover:bg-blue-600";
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleCancel();
      }}
    >
      <DialogContent
        className="shadow-xl"
        style={{
          width: "400px",
          backgroundColor: styleContext.state.backgroundColor,
        }}
      >
        <DialogHeader className="px-6 pt-4 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getIcon()}
              <DialogTitle asChild>
                <span
                  className="text-xl font-bold"
                  style={{ color: styleContext.state.textColor }}
                >
                  {modalTitle}
                </span>
              </DialogTitle>
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
            >
              <FaTimes size={12} />
            </button>
          </div>
        </DialogHeader>

        <div className="px-6 py-6">
          <p style={{ color: styleContext.state.textColor }}>{modalMessage}</p>
        </div>

        <DialogFooter className="px-6 pt-4 pb-4 border-t space-x-3">
          <button
            className={`px-6 py-2.5 rounded-lg font-medium text-white transition-colors flex items-center space-x-2 ${getConfirmButtonStyle()}`}
            onClick={handleConfirm}
            style={
              modalType === "warning"
                ? {
                    backgroundColor:
                      styleContext.state.buttonHoverColorWeight === "200"
                        ? "#eab308"
                        : "#854d0e",
                  }
                : modalType === "success"
                  ? {
                      backgroundColor:
                        styleContext.state.buttonHoverColorWeight === "200"
                          ? "#22c55e"
                          : "#166534",
                    }
                  : {
                      backgroundColor:
                        styleContext.state.buttonHoverColorWeight === "200"
                          ? "#3b82f6"
                          : "#1e40af",
                    }
            }
          >
            <span>{confirmText}</span>
            <SL
              bg={
                modalType === "warning"
                  ? styleContext.state.buttonHoverColorWeight === "200"
                    ? "yellow.600"
                    : "yellow.800"
                  : modalType === "success"
                    ? styleContext.state.buttonHoverColorWeight === "200"
                      ? "green.600"
                      : "green.800"
                    : styleContext.state.buttonHoverColorWeight === "200"
                      ? "blue.600"
                      : "blue.800"
              }
            >
              Enter
            </SL>
          </button>
          <button
            className="px-6 py-2.5 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition-colors flex items-center space-x-2"
            onClick={handleCancel}
            style={{
              backgroundColor:
                styleContext.state.buttonHoverColorWeight === "200"
                  ? "#f3f4f6"
                  : "#1f2937",
              color: styleContext.state.textColor,
            }}
          >
            <span>{cancelText}</span>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmModal;
