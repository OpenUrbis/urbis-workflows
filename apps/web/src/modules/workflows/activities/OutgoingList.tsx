import { Tooltip } from "../../../components/LegacyUi";
import {
  FaProjectDiagram,
  FaChevronUp,
  FaChevronDown,
  FaLock,
  FaUnlock,
  FaCheck,
  FaClock,
} from "react-icons/fa";
import { Outgoing, ActivityTemplate } from "../../../api/types/schema";
import { truncateText } from "./common";
import { ActivityStateEnum } from "../../../api/types/workflows.dto";
import { WorkflowStageEnum } from "../../../api/types/workflows-schema.dto";

export const OutgoingList: React.FC<{
  outgoing: Outgoing[];
  showDependentWorkflows: boolean;
  setShowDependentWorkflows: (show: boolean) => void;
  styleContext: any;
  context?: any;
  currentWorkflowId?: string;
  activities?: ActivityTemplate[];
  stage?: WorkflowStageEnum;
}> = ({
  outgoing,
  showDependentWorkflows,
  setShowDependentWorkflows,
  styleContext,
  context = {},
  currentWorkflowId = "",
  activities = [],
  stage = WorkflowStageEnum.DEVELOPMENT,
}) => {
  const isWorkflowEnabled = (workflow: Outgoing): boolean => {
    if (!workflow.dependsOn || workflow.dependsOn.length === 0) {
      return true;
    }

    return workflow.dependsOn.every((activityId) => {
      const activity = activities.find((act) => act.id === activityId);
      const activityNamespace = activity?.namespace;

      if (!activityNamespace) return false;

      return (
        !!context[activityNamespace] &&
        (context[activityNamespace].state === ActivityStateEnum.COMPLETED ||
          context[activityNamespace].state === ActivityStateEnum.IN_PROGRESS) // tmp until full implementation
      );
    });
  };

  const handleWorkflowClick = (workflow: Outgoing) => {
    if (isWorkflowEnabled(workflow) && workflow.outgoingTo) {
      window.open(
        `/workflows/${workflow.outgoingTo}/create?stage=${stage}&from=${currentWorkflowId}`,
        "_blank"
      );
    }
  };

  const getDependencyInfo = (workflow: Outgoing) => {
    if (!workflow.dependsOn || workflow.dependsOn.length === 0) {
      return [];
    }

    return workflow.dependsOn.map((activityId) => {
      const activity = activities.find((act) => act.id === activityId);
      const activityNamespace = activity?.namespace;

      const isCompleted = activityNamespace
        ? !!context[activityNamespace] &&
          context[activityNamespace].state === ActivityStateEnum.COMPLETED
        : false;

      return {
        id: activityId,
        label: activity?.label || "Atividade desconhecida",
        isCompleted,
      };
    });
  };

  return (
    <>
      <Tooltip
        label="Fluxos que serão desbloqueados após a conclusão deste"
        placement="top"
        hasArrow
      >
        <button
          onClick={() => setShowDependentWorkflows(!showDependentWorkflows)}
          className={`w-full flex items-center justify-between mb-6 px-3 rounded-lg ${
            styleContext.state.buttonHoverColorWeight === "200"
              ? "hover:bg-gray-100"
              : "hover:bg-gray-800"
          }`}
        >
          <div className="flex items-center space-x-2">
            <FaProjectDiagram size={14} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-500">
              Fluxos Subsequentes
            </span>
            <span
              className={`text-sm px-2 py-0.5 rounded-full ${
                styleContext.state.buttonHoverColorWeight === "200"
                  ? "bg-purple-100 text-purple-800"
                  : "bg-purple-900 text-purple-100"
              }`}
            >
              {outgoing.length}
            </span>
          </div>
          <div className="text-gray-500">
            {showDependentWorkflows ? <FaChevronUp /> : <FaChevronDown />}
          </div>
        </button>
      </Tooltip>

      {showDependentWorkflows && outgoing.length > 0 && (
        <div className="mb-6">
          <div className="flex flex-col space-y-2">
            {outgoing.map((workflow) => {
              const enabled = isWorkflowEnabled(workflow);
              const dependencies = getDependencyInfo(workflow);

              return (
                <div
                  key={workflow.id}
                  className={`flex items-center p-4 rounded-lg ${
                    styleContext.state.buttonHoverColorWeight === "200"
                      ? "bg-gray-50"
                      : "bg-gray-900"
                  } ${
                    enabled
                      ? "opacity-100 cursor-pointer hover:bg-opacity-80"
                      : "opacity-50 cursor-not-allowed"
                  }`}
                  onClick={() => enabled && handleWorkflowClick(workflow)}
                >
                  <div
                    className="flex items-center justify-center mr-4"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      backgroundColor: enabled
                        ? styleContext.state.buttonHoverColorWeight === "200"
                          ? "#dcfce7"
                          : "#166534"
                        : styleContext.state.buttonHoverColorWeight === "200"
                          ? "#d1d5db"
                          : "#374151",
                      color: enabled
                        ? styleContext.state.buttonHoverColorWeight === "200"
                          ? "#166534"
                          : "#dcfce7"
                        : "white",
                    }}
                  >
                    {enabled ? <FaUnlock size={14} /> : <FaLock size={14} />}
                  </div>
                  <div className="flex-1 relative">
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
                    {workflow.dependsOn && workflow.dependsOn.length > 0 && (
                      <div className="mt-2 flex justify-between items-center">
                        <Tooltip
                          label="Atividades necessárias para desbloquear este fluxo"
                          placement="top"
                          hasArrow
                        >
                          <div
                            className={`text-xs px-2 py-1 rounded-full inline-block ${
                              styleContext.state.buttonHoverColorWeight ===
                              "200"
                                ? "bg-gray-100"
                                : "bg-gray-800"
                            }`}
                          >
                            Depende de {workflow.dependsOn.length} atividade(s)
                          </div>
                        </Tooltip>

                        {dependencies.length > 0 && (
                          <Tooltip
                            label={
                              <div className="p-1">
                                <div className="font-bold mb-1">
                                  Dependências:
                                </div>
                                <ul className="list-none pl-1">
                                  {dependencies.map((dep, index) => (
                                    <li
                                      key={index}
                                      className="flex items-center mb-1"
                                    >
                                      {dep.isCompleted ? (
                                        <FaCheck
                                          size={12}
                                          className="text-green-500 mr-2"
                                        />
                                      ) : (
                                        <FaClock
                                          size={12}
                                          className="text-yellow-500 mr-2"
                                        />
                                      )}
                                      <span>{dep.label}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            }
                            placement="left"
                            hasArrow
                          >
                            <div className="absolute bottom-0 right-0 p-1">
                              <FaProjectDiagram
                                size={16}
                                className={`${
                                  styleContext.state.buttonHoverColorWeight ===
                                  "200"
                                    ? "text-purple-500"
                                    : "text-purple-400"
                                } cursor-help transition-colors`}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          </Tooltip>
                        )}
                      </div>
                    )}
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
