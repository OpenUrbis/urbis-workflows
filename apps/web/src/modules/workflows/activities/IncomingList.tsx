import { Tooltip } from "../../../components/LegacyUi";
import {
  FaProjectDiagram,
  FaChevronUp,
  FaChevronDown,
  FaCheckCircle,
  FaArrowRight,
} from "react-icons/fa";
import { Incoming } from "../../../api/types/schema";
import { truncateText } from "./common";

export const IncomingList: React.FC<{
  incomings: Incoming[];
  selectedIncoming?: Incoming;
  isOpen?: boolean;
  onSelect?: (workflow: Incoming) => void;
  onToggle?: (isOpen: boolean) => void;
  styleContext: any;
  context: any;
}> = ({
  incomings,
  selectedIncoming,
  isOpen,
  onSelect,
  onToggle,
  styleContext,
  context,
}) => {
  const showDependencies = isOpen ?? incomings.length > 0;
  const completedCount = incomings.filter(
    (workflow) => context[workflow.namespace]?.$metadata?.workflowId
  ).length;

  return (
    <>
      <Tooltip
        label="Fluxos que precisam ser concluídos antes deste"
        placement="top"
        hasArrow
      >
        <button
          onClick={() => onToggle?.(!showDependencies)}
          className={`w-full flex items-center justify-between p-3 mb-3 rounded-lg ${
            styleContext.state.buttonHoverColorWeight === "200"
              ? "hover:bg-gray-100"
              : "hover:bg-gray-800"
          }`}
        >
          <div className="flex items-center space-x-2">
            <div className="transform scale-x-[-1]">
              <FaProjectDiagram size={14} />
            </div>
            <span className="text-sm font-medium">Pré-requisitos</span>
            <span
              className={`text-sm px-2 py-0.5 rounded-full ${
                completedCount === incomings.length
                  ? styleContext.state.buttonHoverColorWeight === "200"
                    ? "bg-green-100 text-green-800"
                    : "bg-green-900 text-green-100"
                  : styleContext.state.buttonHoverColorWeight === "200"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-yellow-900 text-yellow-100"
              }`}
            >
              {completedCount}/{incomings.length}
            </span>
          </div>
          {showDependencies ? <FaChevronUp /> : <FaChevronDown />}
        </button>
      </Tooltip>

      {showDependencies && (
        <div className="mb-6">
          <div className="flex flex-col space-y-2">
            {incomings.map((workflow) => {
              const isSelected = selectedIncoming?.id === workflow.id;
              const isCompleted =
                context[workflow.namespace]?.$metadata?.workflowId;

              return (
                <div
                  key={workflow.id}
                  onClick={() => onSelect?.(workflow)}
                  className={`flex items-center p-4 rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? styleContext.state.buttonHoverColorWeight === "200"
                        ? "bg-gray-200 text-gray-800"
                        : "bg-gray-700 text-gray-200"
                      : styleContext.state.buttonHoverColorWeight === "200"
                        ? "bg-gray-50 hover:bg-gray-100"
                        : "bg-gray-900 hover:bg-gray-800"
                  } ${
                    isCompleted
                      ? styleContext.state.buttonHoverColorWeight === "200"
                        ? "text-gray-800"
                        : "text-gray-100"
                      : ""
                  }`}
                >
                  <div
                    className="flex items-center justify-center mr-4"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 12,
                      color: "white",
                      backgroundColor: isCompleted
                        ? styleContext.state.buttonHoverColorWeight === "200"
                          ? "#4ade80"
                          : "#14532d"
                        : styleContext.state.buttonHoverColorWeight === "200"
                          ? "#facc15"
                          : "#713f12",
                    }}
                  >
                    {isCompleted ? (
                      <FaCheckCircle size={14} />
                    ) : (
                      <FaArrowRight size={14} />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{workflow.label}</div>
                    <Tooltip
                      label={workflow.documentation}
                      placement="top"
                      hasArrow
                      isDisabled={workflow.documentation?.length <= 60}
                    >
                      <div className="text-sm opacity-75">
                        {truncateText(workflow.documentation)}
                      </div>
                    </Tooltip>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};
