import { Center, Tooltip } from "@chakra-ui/react";
import {
  FaList,
  FaCheck,
  FaCircle,
  FaClock,
  FaLock,
  FaProjectDiagram,
} from "react-icons/fa";
import {
  ActivityTemplate,
  ActivityTypeEnum,
  Incoming,
} from "../../../api/types/schema";
import { getActivityTypeLabel } from "./common";
import { ActivityStateEnum } from "../../../api/types/workflows.dto";

// Define activity status enum
export enum ActivityStatus {
  COMPLETED = "COMPLETED",
  PENDING = "PENDING",
  BLOCKED = "BLOCKED",
  ACTIVE = "ACTIVE",
}

export const ActivitiesList: React.FC<{
  activities: ActivityTemplate[];
  activeStep: number;
  setActiveStep: (step: number) => void;
  styleContext: any;
  context?: any;
  incoming?: Incoming[];
}> = ({
  activities,
  activeStep,
  setActiveStep,
  styleContext,
  context = {},
  incoming = [],
}) => {
  const getActivityIndex = (activity: ActivityTemplate) =>
    activities.findIndex((a) => a.id === activity.id);

  // Filter out activities that are not in the ActivityTypeEnum
  const validActivities = activities?.filter((activity) =>
    Object.values(ActivityTypeEnum).includes(activity.type)
  );

  // Check if all incoming dependencies are set
  const areAllIncomingSet = (): boolean => {
    if (!incoming || incoming.length === 0) return true;

    return incoming.every((incomingDep) => {
      // Check if the incoming namespace exists in the context and has data
      return (
        !!context[incomingDep.namespace] &&
        !!context[incomingDep.namespace].$metadata &&
        !!context[incomingDep.namespace].$metadata.workflowId
      );
    });
  };

  // Check if an activity is completed based on its state
  const isActivityCompleted = (activity: ActivityTemplate): boolean => {
    if (!activity.namespace || !context[activity.namespace]) return false;

    // Check if the activity state is COMPLETED (2)
    return (
      context[activity.namespace].state === ActivityStateEnum.COMPLETED ||
      context[activity.namespace].state === ActivityStateEnum.IN_PROGRESS // tmp until full implementation
    );
  };

  // Check if an activity is blocked by dependencies
  const isActivityBlocked = (activity: ActivityTemplate): boolean => {
    // Get the activity index
    const activityIndex = getActivityIndex(activity);

    // Check if all incoming dependencies are set
    const incomingDepsSet = areAllIncomingSet();

    // If there are incoming dependencies and they're not all set,
    // block all activities that don't have explicit dependsOn
    if (
      !incomingDepsSet &&
      (!activity.dependsOn || activity.dependsOn.length === 0)
    ) {
      return true;
    }

    // If it's the first activity (index 0), it has no dependencies
    // But it should still be blocked if incoming dependencies are not set
    if (activityIndex === 0) {
      return !incomingDepsSet;
    }

    // If dependsOn is explicitly defined, check those dependencies
    if (activity.dependsOn && activity.dependsOn.length > 0) {
      return !activity.dependsOn.every((dependencyId) => {
        const dependency = activities.find((act) => act.id === dependencyId);
        if (!dependency || !dependency.namespace) return false;

        // Check if the dependency state is COMPLETED
        return (
          !!context[dependency.namespace] &&
          (context[dependency.namespace].state ===
            ActivityStateEnum.COMPLETED ||
            context[dependency.namespace].state ===
              ActivityStateEnum.IN_PROGRESS) // tmp until full implementation
        );
      });
    }

    // If dependsOn is not defined, check if the previous activity is completed
    // New business rule: activity depends on the previous step when dependsOn is not defined
    const previousActivity = activities[activityIndex - 1];
    if (!previousActivity || !previousActivity.namespace) return false;

    // Check if the previous activity state is COMPLETED
    return !(
      !!context[previousActivity.namespace] &&
      context[previousActivity.namespace].state === ActivityStateEnum.COMPLETED
    );
  };

  // Get activity status
  const getActivityStatus = (
    activity: ActivityTemplate,
    index: number
  ): ActivityStatus => {
    // Check if completed first
    if (isActivityCompleted(activity)) {
      return ActivityStatus.COMPLETED;
    }

    // Check if blocked (even if it's the active step)
    if (isActivityBlocked(activity)) {
      return ActivityStatus.BLOCKED;
    }

    // Check if it's the active step
    if (index === activeStep) {
      return ActivityStatus.ACTIVE;
    }

    // Default to pending
    return ActivityStatus.PENDING;
  };

  // Get dependencies info for tooltip
  const getDependencyInfo = (activity: ActivityTemplate) => {
    const activityIndex = getActivityIndex(activity);
    const incomingDepsSet = areAllIncomingSet();
    const result = [];

    // If it has explicit dependencies, add those
    if (activity.dependsOn && activity.dependsOn.length > 0) {
      const activityDeps = activity.dependsOn.map((dependencyId) => {
        const dependency = activities.find((act) => act.id === dependencyId);
        const dependencyNamespace = dependency?.namespace;

        // Check if the dependency state is COMPLETED
        const isCompleted = dependencyNamespace
          ? !!context[dependencyNamespace] &&
            context[dependencyNamespace].state === ActivityStateEnum.COMPLETED
          : false;

        return {
          id: dependencyId,
          label: dependency?.label || "Atividade desconhecida",
          isCompleted,
          isExternal: false,
        };
      });

      result.push(...activityDeps);
      return result;
    }

    // Add incoming dependencies only if dependsOn is empty and they exist and are not all set
    if (
      (!activity.dependsOn || activity.dependsOn.length === 0) &&
      incoming &&
      incoming.length > 0 &&
      !incomingDepsSet
    ) {
      incoming.forEach((incomingDep) => {
        const isCompleted =
          !!context[incomingDep.namespace] &&
          !!context[incomingDep.namespace].$metadata &&
          !!context[incomingDep.namespace].$metadata.workflowId;

        result.push({
          id: incomingDep.id,
          label: incomingDep.label || "Protocolo externo",
          isCompleted,
          isExternal: true,
        });
      });
    }

    // If no explicit dependencies and not the first activity,
    // show the previous activity as a dependency
    if (
      activityIndex > 0 &&
      (!activity.dependsOn || activity.dependsOn.length === 0)
    ) {
      const previousActivity = activities[activityIndex - 1];
      if (previousActivity) {
        const dependencyNamespace = previousActivity.namespace;

        // Check if the previous activity state is COMPLETED
        const isCompleted = dependencyNamespace
          ? !!context[dependencyNamespace] &&
            context[dependencyNamespace].state === ActivityStateEnum.COMPLETED
          : false;

        result.push({
          id: previousActivity.id,
          label: previousActivity.label || "Atividade anterior",
          isCompleted,
          isExternal: false,
        });
      }
    }

    return result;
  };

  // Get status icon based on activity status
  const getStatusIcon = (status: ActivityStatus, isActive: boolean) => {
    if (isActive) {
      return <FaCircle size={8} />;
    }

    switch (status) {
      case ActivityStatus.COMPLETED:
        return <FaCheck size={14} />;
      case ActivityStatus.BLOCKED:
        return <FaLock size={14} />;
      case ActivityStatus.PENDING:
      default:
        return <FaClock size={14} />;
    }
  };

  // Get status color based on activity status
  const getStatusColor = (status: ActivityStatus, isActive: boolean) => {
    const isDarkMode = styleContext.state.buttonHoverColorWeight !== "200";

    // If active, use the base status color but with a different icon
    if (isActive) {
      if (status === ActivityStatus.COMPLETED) {
        return {
          bg: isDarkMode ? "green.900" : "green.400",
          color: "white",
        };
      } else {
        return {
          bg: isDarkMode ? "gray.700" : "gray.300",
          color: isDarkMode ? "white" : "gray.600",
        };
      }
    }

    // Regular status colors
    switch (status) {
      case ActivityStatus.COMPLETED:
        return {
          bg: isDarkMode ? "green.900" : "green.400",
          color: "white",
        };
      case ActivityStatus.ACTIVE:
        return {
          bg: isDarkMode ? "blue.900" : "blue.400",
          color: "white",
        };
      case ActivityStatus.BLOCKED:
        return {
          bg: isDarkMode ? "gray.700" : "gray.300",
          color: isDarkMode ? "gray.400" : "gray.600",
        };
      case ActivityStatus.PENDING:
      default:
        return {
          bg: isDarkMode ? "gray.700" : "gray.300",
          color: isDarkMode ? "gray.400" : "gray.600",
        };
    }
  };

  // Get status label based on activity status
  const getStatusLabel = (
    status: ActivityStatus,
    isBlocked: boolean
  ): string => {
    // If blocked and we're showing the pill, don't show the status label next to activity type
    if (status === ActivityStatus.BLOCKED && isBlocked) {
      return "";
    }

    switch (status) {
      case ActivityStatus.COMPLETED:
        return "Concluído";
      case ActivityStatus.BLOCKED:
        return "Bloqueado";
      case ActivityStatus.PENDING:
        return "Pendente";
      case ActivityStatus.ACTIVE:
      default:
        return "";
    }
  };

  // Get the reason why an activity is blocked
  const getBlockedReason = (activity: ActivityTemplate): string => {
    const activityIndex = getActivityIndex(activity);

    // Check if incoming dependencies are set - only for activities with empty dependsOn
    if (
      (!activity.dependsOn || activity.dependsOn.length === 0) &&
      incoming &&
      incoming.length > 0 &&
      !areAllIncomingSet()
    ) {
      const missingIncoming = incoming.filter(
        (incomingDep) =>
          !context[incomingDep.namespace] ||
          !context[incomingDep.namespace].$metadata ||
          !context[incomingDep.namespace].$metadata.workflowId
      );

      if (missingIncoming.length === 1) {
        return `Aguardando vínculo com fluxo "${missingIncoming[0].label || "externo"}"`;
      } else if (missingIncoming.length > 1) {
        return `Aguardando vínculo com ${missingIncoming.length} fluxos externos`;
      }
    }

    // If it has explicit dependencies
    if (activity.dependsOn && activity.dependsOn.length > 0) {
      const incompleteDependencies = activity.dependsOn.filter(
        (dependencyId) => {
          const dependency = activities.find((act) => act.id === dependencyId);
          if (!dependency || !dependency.namespace) return true;

          // Check if the dependency state is COMPLETED
          return !(
            !!context[dependency.namespace] &&
            context[dependency.namespace].state === ActivityStateEnum.COMPLETED
          );
        }
      );

      if (incompleteDependencies.length === 1) {
        const dependency = activities.find(
          (act) => act.id === incompleteDependencies[0]
        );
        return `Aguardando conclusão de "${dependency?.label || "atividade desconhecida"}"`;
      } else if (incompleteDependencies.length > 1) {
        return `Aguardando conclusão de ${incompleteDependencies.length} atividades`;
      }
    }

    // If it depends on the previous activity
    if (activityIndex > 0) {
      const previousActivity = activities[activityIndex - 1];
      if (previousActivity && previousActivity.namespace) {
        // Check if the previous activity state is COMPLETED
        const isCompleted =
          !!context[previousActivity.namespace] &&
          context[previousActivity.namespace].state ===
            ActivityStateEnum.COMPLETED;

        if (!isCompleted) {
          return `Aguardando conclusão de "${previousActivity.label || "atividade anterior"}"`;
        }
      }
    }

    return "Bloqueado por dependências não concluídas";
  };

  return (
    <>
      <div className="flex items-center space-x-2 mb-3 px-3">
        <FaList size={14} className="text-gray-500" />
        <span className="text-sm font-medium text-gray-500">
          Atividades do Fluxo
        </span>
      </div>

      <div className="flex flex-col space-y-2">
        {validActivities?.map((activity) => {
          const activityIndex = getActivityIndex(activity);
          const isActive = activityIndex === activeStep;
          const status = getActivityStatus(activity, activityIndex);
          const isBlocked = status === ActivityStatus.BLOCKED;
          const statusColors = getStatusColor(status, isActive);
          const dependencies = getDependencyInfo(activity);
          const statusLabel = getStatusLabel(status, isBlocked);

          return (
            <div
              key={activity.id}
              onClick={() => (isBlocked ? null : setActiveStep(activityIndex))}
              className={`flex items-center p-4 rounded-lg transition-colors ${
                isActive
                  ? styleContext.state.buttonHoverColorWeight === "200"
                    ? "bg-gray-200"
                    : "bg-gray-700"
                  : styleContext.state.buttonHoverColorWeight === "200"
                    ? "bg-gray-50 hover:bg-gray-100"
                    : "bg-gray-900 hover:bg-gray-800"
              } ${isBlocked ? "opacity-70 cursor-not-allowed" : "opacity-100 cursor-pointer"}`}
            >
              <Center
                w="36px"
                h="36px"
                bg={statusColors.bg}
                color={statusColors.color}
                borderRadius="12px"
                mr={4}
              >
                {getStatusIcon(status, isActive)}
              </Center>
              <div className="flex-1 relative">
                <div className="font-medium">{activity.label}</div>
                <div className="text-sm opacity-75 flex items-center">
                  <span>{getActivityTypeLabel(activity.type)}</span>
                  {statusLabel && (
                    <>
                      <span className="mx-2">•</span>
                      <span>{statusLabel}</span>
                    </>
                  )}
                </div>

                {isBlocked && (
                  <div className="mt-2 flex justify-between items-center">
                    <Tooltip
                      label={getBlockedReason(activity)}
                      placement="top"
                      hasArrow
                    >
                      <div
                        className={`text-xs px-2 py-1 rounded-full inline-flex items-center ${
                          styleContext.state.buttonHoverColorWeight === "200"
                            ? "bg-gray-200 text-gray-700"
                            : "bg-gray-700 text-gray-300"
                        }`}
                      >
                        <FaLock size={10} className="mr-1" />
                        Bloqueado
                      </div>
                    </Tooltip>

                    {dependencies.length > 0 && (
                      <Tooltip
                        label={
                          <div className="p-1">
                            <div className="font-bold mb-1">Dependências:</div>
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
                                  {dep.isExternal && (
                                    <FaProjectDiagram
                                      size={10}
                                      className="mr-1 text-blue-500"
                                      style={{ transform: "scaleX(-1)" }}
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
                            style={{ transform: "scaleX(-1)" }}
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
    </>
  );
};
