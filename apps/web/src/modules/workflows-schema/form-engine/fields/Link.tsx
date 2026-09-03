import { useContext } from "react";
import { IFormContext } from "@open-urbis/types";
import { StyleContext } from "../../../../reducers";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@open-urbis/map-ui";
import { FaUser, FaLink, FaExclamationTriangle } from "react-icons/fa";

export type FieldLinkProps = {
  value?: { from: string; to: string; by: string; $metadata?: any };
  general: IFormContext;
};

export const Link: React.FC<FieldLinkProps> = ({ value, general }) => {
  const styleContext = useContext(StyleContext);

  if (!value?.from || !value?.by) {
    return null;
  }

  // Get signature metadata from general context
  const signatureMetadata = general.$tree?.signatures?.[value.by];
  const signatureExists = !!signatureMetadata;

  // If signature doesn't exist, show error state
  if (!signatureExists) {
    return (
      <TooltipProvider>
        <div
          className={`rounded-lg border p-4 mt-4 transition-colors duration-150 ${
            styleContext.state.buttonHoverColorWeight === "200"
              ? "border-red-300 bg-red-100"
              : "border-red-700/30 bg-red-800/20"
          }`}
        >
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="flex flex-col space-y-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center space-x-2">
                    <FaUser
                      className={
                        styleContext.state.buttonHoverColorWeight === "200"
                          ? "text-red-600"
                          : "text-red-300"
                      }
                      size={14}
                    />
                    <span
                      className="text-sm font-medium"
                      style={{ color: styleContext.state.textColor }}
                    >
                      {value.from}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Usuário vinculado</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center space-x-2">
                    <FaExclamationTriangle
                      className={
                        styleContext.state.buttonHoverColorWeight === "200"
                          ? "text-red-500"
                          : "text-red-400"
                      }
                      size={12}
                    />
                    <span
                      className={`text-xs font-medium ${
                        styleContext.state.buttonHoverColorWeight === "200"
                          ? "text-red-700"
                          : "text-red-300"
                      }`}
                    >
                      ID: {value.by}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Assinatura não encontrada</TooltipContent>
              </Tooltip>
            </div>
          </div>
          <div
            className="flex-grow ml-6 text-sm whitespace-pre-wrap break-words"
            style={{
              color: styleContext.state.textColor,
              opacity: 0.7,
              maxWidth: "100%",
              wordBreak: "break-word",
            }}
          >
            A assinatura vinculada não foi encontrada. Verifique se o ID da
            assinatura está correto ou se ela ainda existe no fluxo.
          </div>
        </div>
        </div>
      </TooltipProvider>
    );
  }

  const signatureLabel = signatureMetadata.label || "Assinatura";

  return (
    <TooltipProvider>
      <div
        className={`rounded-lg border p-4 mt-4 transition-colors duration-150 ${
          styleContext.state.buttonHoverColorWeight === "200"
            ? "border-blue-300 bg-blue-100 hover:bg-blue-200/70"
            : "border-blue-700/30 bg-blue-800/20 hover:bg-blue-700/30"
        }`}
      >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <div className="flex flex-col space-y-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center space-x-2">
                  <FaUser
                    className={
                      styleContext.state.buttonHoverColorWeight === "200"
                        ? "text-blue-600"
                        : "text-blue-300"
                    }
                    size={14}
                  />
                  <span
                    className="text-sm font-medium"
                    style={{ color: styleContext.state.textColor }}
                  >
                    {value.from}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>Usuário vinculado</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center space-x-2">
                  <FaLink
                    className={
                      styleContext.state.buttonHoverColorWeight === "200"
                        ? "text-blue-500"
                        : "text-blue-400"
                    }
                    size={12}
                  />
                  <span
                    className={`text-xs font-medium ${
                      styleContext.state.buttonHoverColorWeight === "200"
                        ? "text-blue-700"
                        : "text-blue-300"
                    }`}
                  >
                    {signatureLabel}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>Tipo de vínculo</TooltipContent>
            </Tooltip>
          </div>
        </div>
        <div
          className="flex-grow ml-6 text-sm whitespace-pre-wrap break-words"
          style={{
            color: styleContext.state.textColor,
            opacity: 0.7,
            maxWidth: "100%",
            wordBreak: "break-word",
          }}
        >
          {signatureMetadata.documentation || "Usuário vinculado ao protocolo"}
        </div>
      </div>
      </div>
    </TooltipProvider>
  );
};
