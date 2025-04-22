import React, { useContext } from "react";
import { FaExclamationTriangle, FaInfoCircle } from "react-icons/fa";
import { MdCheckCircle, MdError } from "react-icons/md";
import { ValidState } from "../Field";
import { StyleContext } from "../../../../reducers/style.reducer";

type ValidStateType = "valid" | "invalid" | "warning" | "information";

interface ExtendedValidState extends ValidState {
  description?: string;
}

export const RenderValidState = ({
  validState,
}: {
  validState: ExtendedValidState | boolean;
}) => {
  const styleContext = useContext(StyleContext);

  const ValidStateIcons = {
    valid: <MdCheckCircle size={16} />,
    invalid: <MdError size={16} />,
    warning: <FaExclamationTriangle size={16} />,
    information: <FaInfoCircle size={16} />,
  };

  if (validState === false) {
    return (
      <div
        className={`flex items-start space-x-3 p-3 rounded-lg border ${
          styleContext.state.buttonHoverColorWeight === "200"
            ? "bg-red-50 border-red-200 text-red-800"
            : "bg-red-900/20 border-red-800 text-red-200"
        }`}
      >
        <div className="mt-0.5">
          <MdError size={16} className={
            styleContext.state.buttonHoverColorWeight === "200"
              ? "text-red-500"
              : "text-red-400"
          } />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">Campo inválido</p>
          <p className="text-xs mt-1 opacity-80">
            Verifique os dados inseridos e tente novamente
          </p>
        </div>
      </div>
    );
  }

  if (
    typeof validState === "object" &&
    validState !== null &&
    "type" in validState
  ) {
    const colorMap = {
      valid: {
        light: {
          bg: "bg-green-50",
          border: "border-green-200",
          text: "text-green-800",
          icon: "text-green-500",
        },
        dark: {
          bg: "bg-green-900/20",
          border: "border-green-800",
          text: "text-green-200",
          icon: "text-green-400",
        },
      },
      invalid: {
        light: {
          bg: "bg-red-50",
          border: "border-red-200",
          text: "text-red-800",
          icon: "text-red-500",
        },
        dark: {
          bg: "bg-red-900/20",
          border: "border-red-800",
          text: "text-red-200",
          icon: "text-red-400",
        },
      },
      warning: {
        light: {
          bg: "bg-yellow-50",
          border: "border-yellow-200",
          text: "text-yellow-800",
          icon: "text-yellow-500",
        },
        dark: {
          bg: "bg-yellow-900/20",
          border: "border-yellow-800",
          text: "text-yellow-200",
          icon: "text-yellow-400",
        },
      },
      information: {
        light: {
          bg: "bg-blue-50",
          border: "border-blue-200",
          text: "text-blue-800",
          icon: "text-blue-500",
        },
        dark: {
          bg: "bg-blue-900/20",
          border: "border-blue-800",
          text: "text-blue-200",
          icon: "text-blue-400",
        },
      },
    };

    const theme =
      styleContext.state.buttonHoverColorWeight === "200" ? "light" : "dark";
    const stateType = validState.type as ValidStateType;

    // Default to 'invalid' if the type is not recognized
    const colors = colorMap[stateType] || colorMap.invalid;
    const themeColors = colors[theme];

    return (
      <div
        className={`flex items-start space-x-3 p-3 rounded-lg border ${themeColors.bg} ${themeColors.border}`}
      >
        <div className="mt-0.5">
          <span className={themeColors.icon}>
            {ValidStateIcons[stateType] || ValidStateIcons.invalid}
          </span>
        </div>
        <div className="flex-1">
          <p className={`text-sm font-medium ${themeColors.text}`}>
            {validState.message}
          </p>
          {validState.description && (
            <div className="max-h-24 overflow-y-auto">
              <p className={`text-xs mt-1 opacity-80 ${themeColors.text}`}>
                {validState.description}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};
