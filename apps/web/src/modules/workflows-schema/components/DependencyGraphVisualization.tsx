import React, { useCallback, useEffect, useState } from "react";
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  NodeTypes,
  useNodesState,
  useEdgesState,
  Position,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
} from "../../../components";
import {
  ActivityTemplate,
  Incoming,
  Outgoing,
} from "../../../api/types/schema";

// Custom node component for activities
const ActivityNode = ({ data }: { data: any }) => {
  const isDarkMode = data.styleContext?.state?.buttonHoverColorWeight !== "200";

  const getBorderColor = () => {
    if (data.type === "activity") return isDarkMode ? "#c084fc" : "#a855f7";
    if (data.type === "incoming") return isDarkMode ? "#60a5fa" : "#3b82f6";
    return isDarkMode ? "#4ade80" : "#22c55e";
  };

  const getBgColor = () => {
    if (isDarkMode) return data.isSelected ? "#581c87" : "#1f2937";
    return data.isSelected ? "#f3e8ff" : "#ffffff";
  };

  const getBadgeClass = () => {
    if (data.type === "activity") return "bg-purple-100 text-purple-800";
    if (data.type === "incoming") return "bg-blue-100 text-blue-800";
    return "bg-green-100 text-green-800";
  };

  return (
    <div
      className="p-3 rounded-md shadow-md"
      style={{
        width: 200,
        backgroundColor: getBgColor(),
        borderWidth: 2,
        borderStyle: "solid",
        borderColor: getBorderColor(),
      }}
    >
      <div
        className="font-bold text-sm truncate"
        title={data.label}
        style={{ color: isDarkMode ? "#ffffff" : "#1f2937" }}
      >
        {data.label}
      </div>
      <div
        className="text-xs truncate"
        title={data.namespace}
        style={{ color: isDarkMode ? "#9ca3af" : "#6b7280" }}
      >
        {data.namespace}
      </div>
      {data.type && (
        <span className={`inline-flex mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${getBadgeClass()}`}>
          {data.type === "activity"
            ? "Atividade"
            : data.type === "incoming"
              ? "Entrada"
              : "Saída"}
        </span>
      )}
    </div>
  );
};

const nodeTypes: NodeTypes = {
  activityNode: ActivityNode,
};

interface DependencyGraphVisualizationProps {
  isOpen: boolean;
  onClose: () => void;
  activities: ActivityTemplate[];
  incoming?: Incoming[];
  outgoing?: Outgoing[];
  styleContext: any;
  currentActivityId?: string;
}

export const DependencyGraphVisualization: React.FC<
  DependencyGraphVisualizationProps
> = ({
  isOpen,
  onClose,
  activities,
  incoming = [],
  outgoing = [],
  styleContext,
  currentActivityId,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [initialized, setInitialized] = useState(false);

  // Helper function to calculate dependency levels for activities
  const calculateDependencyLevels = (
    activities: ActivityTemplate[],
    levels: { [key: string]: number } = {}
  ): number => {
    let maxLevel = 0;

    // Initialize with activities that have no dependencies
    activities.forEach((activity) => {
      if (!activity.dependsOn || activity.dependsOn.length === 0) {
        levels[activity.id] = 0;
      }
    });

    // Function to check and update dependency levels for an activity
    const updateActivityLevel = (activity: ActivityTemplate): boolean => {
      if (levels[activity.id] !== undefined) return false;

      if (!activity.dependsOn || activity.dependsOn.length === 0) {
        levels[activity.id] = 0;
        return true;
      }

      // Check if all dependencies have levels assigned
      const allDependenciesHaveLevels = activity.dependsOn.every(
        (depId) => levels[depId] !== undefined
      );

      if (allDependenciesHaveLevels) {
        // Set level to max dependency level + 1
        const maxDependencyLevel = Math.max(
          ...activity.dependsOn.map((depId) => levels[depId])
        );
        levels[activity.id] = maxDependencyLevel + 1;
        maxLevel = Math.max(maxLevel, levels[activity.id]);
        return true;
      }

      return false;
    };

    // Iteratively assign levels based on dependencies
    let changed = true;
    while (changed) {
      changed = false;

      // Using a for loop instead of forEach to avoid the no-loop-func warning
      for (let i = 0; i < activities.length; i++) {
        const activity = activities[i];
        const wasUpdated = updateActivityLevel(activity);
        if (wasUpdated) {
          changed = true;
        }
      }
    }

    // Handle circular dependencies by assigning default levels
    activities.forEach((activity) => {
      if (levels[activity.id] === undefined) {
        levels[activity.id] = 0;
      }
    });

    return maxLevel;
  };

  // Generate graph data from activities, incoming, and outgoing
  const generateGraph = useCallback(() => {
    if (!activities || activities.length === 0) return;

    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    const isDarkMode = styleContext.state.buttonHoverColorWeight !== "200";

    // Colors for edges
    const activityEdgeColor = isDarkMode ? "#a855f7" : "#9333ea"; // Purple
    const incomingEdgeColor = isDarkMode ? "#60a5fa" : "#3182ce"; // Blue
    const outgoingEdgeColor = isDarkMode ? "#4ade80" : "#38a169"; // Green

    // Calculate positions for better layout
    const columnSpacing = 300;
    const rowSpacing = 120;

    // Group activities by their dependency level
    const activityLevels: { [key: string]: number } = {};
    const maxLevel = calculateDependencyLevels(activities, activityLevels);

    // Add activity nodes with improved positioning
    activities.forEach((activity, index) => {
      // Position based on dependency level
      const level = activityLevels[activity.id] || 0;
      const column = level + 1; // +1 to leave space for incoming nodes
      const rowInLevel = activities.filter(
        (a, i) => (activityLevels[a.id] || 0) === level && i < index
      ).length;

      // Calculate position with offset to center nodes in their level
      const x = column * columnSpacing;
      const y = (rowInLevel + 0.5) * rowSpacing;

      newNodes.push({
        id: `activity-${activity.id}`,
        type: "activityNode",
        position: { x, y },
        data: {
          label: activity.label,
          namespace: activity.namespace,
          type: "activity",
          isSelected: activity.id === currentActivityId,
          styleContext: styleContext,
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      });

      // Add dependency edges between activities
      if (activity.dependsOn && activity.dependsOn.length > 0) {
        // If activity has explicit dependencies, use them
        activity.dependsOn.forEach((dependencyId) => {
          newEdges.push({
            id: `edge-${dependencyId}-${activity.id}`,
            source: `activity-${dependencyId}`,
            target: `activity-${activity.id}`,
            animated: true,
            style: { stroke: activityEdgeColor },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: activityEdgeColor,
            },
          });
        });
      } else if (index > 0) {
        // If no explicit dependencies and not the first activity, depend on previous activity
        const previousActivity = activities[index - 1];
        newEdges.push({
          id: `edge-${previousActivity.id}-${activity.id}`,
          source: `activity-${previousActivity.id}`,
          target: `activity-${activity.id}`,
          animated: true,
          style: { stroke: activityEdgeColor },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: activityEdgeColor,
          },
        });
      }
    });

    // Add incoming nodes and edges
    incoming.forEach((item, index) => {
      newNodes.push({
        id: `incoming-${item.id}`,
        type: "activityNode",
        position: { x: 0, y: index * rowSpacing },
        data: {
          label: item.label,
          namespace: item.namespace,
          type: "incoming",
          styleContext: styleContext,
        },
        sourcePosition: Position.Right,
      });

      // Connect incoming to its dependent activity
      if (item.dependsOn) {
        // If incoming has explicit dependency
        newEdges.push({
          id: `edge-incoming-${item.id}-to-${item.dependsOn}`,
          source: `incoming-${item.id}`,
          target: `activity-${item.dependsOn}`,
          animated: true,
          style: { stroke: incomingEdgeColor },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: incomingEdgeColor,
          },
        });
      } else if (activities.length > 0) {
        // By default, connect to the first activity
        const firstActivity = activities[0];
        newEdges.push({
          id: `edge-incoming-${item.id}-to-${firstActivity.id}`,
          source: `incoming-${item.id}`,
          target: `activity-${firstActivity.id}`,
          animated: true,
          style: { stroke: incomingEdgeColor },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: incomingEdgeColor,
          },
        });
      }
    });

    // Add outgoing nodes and edges
    outgoing.forEach((item, index) => {
      newNodes.push({
        id: `outgoing-${item.id}`,
        type: "activityNode",
        position: {
          x: (maxLevel + 2) * columnSpacing,
          y: index * rowSpacing,
        },
        data: {
          label: item.label,
          namespace: item.namespace,
          type: "outgoing",
          styleContext: styleContext,
        },
        targetPosition: Position.Left,
      });

      // Connect activities to outgoing
      if (item.dependsOn && item.dependsOn.length > 0) {
        // If outgoing has explicit dependencies
        item.dependsOn.forEach((dependencyId) => {
          newEdges.push({
            id: `edge-${dependencyId}-to-outgoing-${item.id}`,
            source: `activity-${dependencyId}`,
            target: `outgoing-${item.id}`,
            animated: true,
            style: { stroke: outgoingEdgeColor },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: outgoingEdgeColor,
            },
          });
        });
      } else if (activities.length > 0) {
        // By default, connect to the last activity
        const lastActivity = activities[activities.length - 1];
        newEdges.push({
          id: `edge-${lastActivity.id}-to-outgoing-${item.id}`,
          source: `activity-${lastActivity.id}`,
          target: `outgoing-${item.id}`,
          animated: true,
          style: { stroke: outgoingEdgeColor },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: outgoingEdgeColor,
          },
        });
      }
    });

    console.log("Generated nodes:", newNodes);
    console.log("Generated edges:", newEdges);

    setNodes(newNodes);
    setEdges(newEdges);
    setInitialized(true);
  }, [
    activities,
    incoming,
    outgoing,
    currentActivityId,
    styleContext,
    setNodes,
    setEdges,
  ]);

  // Update graph when dependencies change
  useEffect(() => {
    if (isOpen) {
      // Reset state when modal opens
      setNodes([]);
      setEdges([]);
      setInitialized(false);

      // Small delay to ensure the modal is fully rendered before generating the graph
      const timer = setTimeout(() => {
        generateGraph();
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isOpen, generateGraph, setNodes, setEdges]);

  // Debug logging
  useEffect(() => {
    if (initialized && nodes.length > 0) {
      console.log(`Generated ${nodes.length} nodes and ${edges.length} edges`);
    }
  }, [initialized, nodes, edges, setNodes, setEdges]);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <div
          style={{
            maxWidth: "90vw",
            maxHeight: "90vh",
            height: "80vh",
            backgroundColor: styleContext.state.backgroundColor,
          }}
        >
        <style>
          {`
            .reactflow-wrapper {
              width: 100%;
              height: 100%;
              min-height: 500px;
            }
            
            .reactflow-wrapper .react-flow {
              width: 100%;
              height: 100%;
            }
            
            .react-flow__node {
              width: auto;
              max-width: 250px;
            }
          `}
        </style>
        <ModalHeader>
          <div className="flex items-center justify-between pr-8" style={{ color: styleContext.state.textColor }}>
            <div>Visualização do Fluxo</div>
            <div className="flex gap-2 flex-wrap justify-end">
              <span className="px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800">
                Atividades
              </span>
              <span className="px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                Entradas
              </span>
              <span className="px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
                Saídas
              </span>
            </div>
          </div>
        </ModalHeader>
        <ModalBody className="p-0" style={{ position: "relative" }}>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 h-8 w-8 rounded-md inline-flex items-center justify-center"
            style={{ color: styleContext.state.textColor }}
          >
            ×
          </button>
          <div style={{ width: "100%", height: "100%" }} className="reactflow-wrapper">
            {initialized && nodes.length > 0 ? (
              <div
                style={{ width: "100%", height: "100%", minHeight: "500px" }}
              >
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  nodeTypes={nodeTypes}
                  fitView
                  fitViewOptions={{ padding: 0.2 }}
                  minZoom={0.1}
                  maxZoom={2}
                  defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
                  attributionPosition="bottom-right"
                  style={{
                    backgroundColor:
                      styleContext.state.buttonHoverColorWeight === "200"
                        ? "#f9fafb" // light gray for light mode
                        : "#111827", // dark gray for dark mode
                    width: "100%",
                    height: "100%",
                  }}
                >
                  <Controls
                    style={{
                      backgroundColor:
                        styleContext.state.buttonHoverColorWeight === "200"
                          ? "#ffffff"
                          : "#1f2937",
                      borderColor:
                        styleContext.state.buttonHoverColorWeight === "200"
                          ? "#e5e7eb"
                          : "#374151",
                      color: styleContext.state.textColor,
                    }}
                  />
                  <Background
                    gap={12}
                    size={1}
                    color={
                      styleContext.state.buttonHoverColorWeight === "200"
                        ? "#e5e7eb" // light gray for light mode
                        : "#374151" // dark gray for dark mode
                    }
                  />

                  {/* Legend */}
                  <div
                    className="absolute bottom-4 right-4 p-3 rounded-md shadow-md"
                    style={{
                      zIndex: 10,
                      backgroundColor:
                        styleContext.state.buttonHoverColorWeight === "200"
                          ? "rgba(255, 255, 255, 0.9)"
                          : "rgba(31, 41, 55, 0.9)",
                      borderColor:
                        styleContext.state.buttonHoverColorWeight === "200"
                          ? "#e5e7eb"
                          : "#374151",
                      borderWidth: 1,
                      borderStyle: "solid",
                      color: styleContext.state.textColor,
                    }}
                  >
                    <div className="font-bold text-sm mb-2">Legenda</div>

                    <div className="flex flex-col gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <div
                          className="rounded-md"
                          style={{ width: 16, height: 16, borderWidth: 2, borderStyle: "solid", borderColor: styleContext.state.buttonHoverColorWeight === "200" ? "#a855f7" : "#c084fc" }}
                        />
                        <div>Atividades</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div
                          className="rounded-md"
                          style={{ width: 16, height: 16, borderWidth: 2, borderStyle: "solid", borderColor: styleContext.state.buttonHoverColorWeight === "200" ? "#3b82f6" : "#60a5fa" }}
                        />
                        <div>Entradas</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div
                          className="rounded-md"
                          style={{ width: 16, height: 16, borderWidth: 2, borderStyle: "solid", borderColor: styleContext.state.buttonHoverColorWeight === "200" ? "#22c55e" : "#4ade80" }}
                        />
                        <div>Saídas</div>
                      </div>

                      <div
                        style={{ height: 1, backgroundColor: styleContext.state.buttonHoverColorWeight === "200" ? "#e5e7eb" : "#4b5563" }}
                      />

                      <div className="flex items-center gap-2">
                        <div
                          style={{ width: 16, height: 2, backgroundColor: styleContext.state.buttonHoverColorWeight === "200" ? "#9333ea" : "#a855f7" }}
                        />
                        <div>Dependências entre atividades</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div
                          style={{ width: 16, height: 2, backgroundColor: styleContext.state.buttonHoverColorWeight === "200" ? "#3182ce" : "#60a5fa" }}
                        />
                        <div>Dependências de entrada</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div
                          style={{ width: 16, height: 2, backgroundColor: styleContext.state.buttonHoverColorWeight === "200" ? "#38a169" : "#4ade80" }}
                        />
                        <div>Dependências de saída</div>
                      </div>
                    </div>
                  </div>
                </ReactFlow>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full w-full" style={{ color: styleContext.state.textColor }}>
                Carregando visualização...
              </div>
            )}
          </div>
        </ModalBody>
        </div>
      </ModalContent>
    </Modal>
  );
};
