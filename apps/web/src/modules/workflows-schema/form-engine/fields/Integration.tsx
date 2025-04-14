import { useDisclosure, Tooltip } from "@chakra-ui/react";
import { useContext, useEffect, useState } from "react";
import { StyleContext } from "../../../../reducers";
import { FaExternalLinkAlt, FaClock, FaServer } from "react-icons/fa";
import { evalFieldExpression } from "../utils/expressions";
import { IField, IntegrationOptions } from "@open-urbis/types";
import { CodeViewerModal } from "../../components/CodeViewerModal";

export type FieldIntegrationProps = {
  field: IField;
  options: IntegrationOptions;
  value?:
    | { [key: string]: any }
    | { $cache: { url: string }; $timestamp: number };
};

type Log = {
  source: string;
  message: string;
  timestamp: Date | string | number;
};

export const Integration: React.FC<FieldIntegrationProps> = ({
  field,
  options,
  value,
}) => {
  const styleContext = useContext(StyleContext);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [dynamicLogValue, setDynamicLogValue] = useState<Log[] | undefined>(
    undefined
  );

  useEffect(() => {
    if (
      field.expressions?.log !== undefined &&
      field.expressions?.log.length > 0
    ) {
      const logValue = evalFieldExpression(
        field.expressions?.log,
        value,
        {},
        {}
      );
      setDynamicLogValue(logValue);
    } else {
      setDynamicLogValue(undefined);
    }
  }, [field.expressions?.log, value]);

  const displayLog = options.log === true;
  const displayDefaultLogValue =
    displayLog && dynamicLogValue === undefined && value?.$cache !== undefined;
  const displayDynamicLogValue =
    dynamicLogValue !== undefined && Array.isArray(dynamicLogValue);

  const formatDate = (date: Date | string | number) => {
    const dateObj = new Date(date);
    return `${dateObj.toLocaleDateString("pt-br")} ${dateObj.toLocaleTimeString("pt-br")}`;
  };

  const truncateUrl = (url: string, maxLength: number = 80) => {
    if (url.length <= maxLength) return url;
    const start = url.substring(0, maxLength / 2);
    const end = url.substring(url.length - 20);
    return `${start}...${end}`;
  };

  const renderLogCard = (
    message: string,
    source: string,
    timestamp: Date | string | number
  ) => (
    <div
      className={`rounded-lg border p-4 mt-4 transition-colors duration-150 ${
        styleContext.state.buttonHoverColorWeight === "200"
          ? "border-gray-200 hover:bg-gray-50"
          : "border-gray-700 hover:bg-gray-800"
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center space-x-2 max-w-[90%]">
          <FaServer className="flex-shrink-0 text-gray-400 mt-0.5" size={14} />
          <Tooltip label={source} placement="top" hasArrow>
            <span
              className="text-sm font-medium"
              style={{ color: styleContext.state.textColor }}
            >
              {truncateUrl(source)}
            </span>
          </Tooltip>
        </div>
        <div className="flex-shrink-0 ml-2">
          <Tooltip label="Mostrar Retorno da Integração" placement="top">
            <button
              onClick={onOpen}
              className={`p-1.5 rounded-lg transition-colors ${
                styleContext.state.buttonHoverColorWeight === "200"
                  ? "hover:bg-gray-100"
                  : "hover:bg-gray-700"
              }`}
            >
              <FaExternalLinkAlt size={14} className="text-gray-400" />
            </button>
          </Tooltip>
        </div>
      </div>
      <div
        className="mb-3 whitespace-pre-wrap break-words"
        style={{
          color: styleContext.state.textColor,
          maxWidth: "100%",
          wordBreak: "break-word",
        }}
      >
        {message}
      </div>
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <FaClock size={12} />
        <span>{formatDate(timestamp)}</span>
      </div>
    </div>
  );

  return (
    <>
      {displayDefaultLogValue &&
        renderLogCard(
          "Integração executada com sucesso",
          value.$cache.url,
          value.$timestamp
        )}

      {displayDynamicLogValue &&
        dynamicLogValue?.map((log: Log, index: number) => (
          <div key={index}>
            {renderLogCard(log.message, log.source, log.timestamp)}
          </div>
        ))}

      <CodeViewerModal
        isOpen={isOpen}
        onClose={onClose}
        title="Retorno da Integração"
        code={value}
        language="json"
        readOnly
      />
    </>
  );
};
