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
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Box,
  Text,
  Badge,
  Flex,
} from "@chakra-ui/react";
import {
  ActivityTemplate,
  Incoming,
  Outgoing,
} from "../../../api/types/schema";

// Custom node component for activities
const ActivityNode = ({ data }: { data: any }) => {
  const isDarkMode = data.styleContext?.state?.buttonHoverColorWeight !== "200";

  return (
    <Box
      p={3}
      borderRadius="md"
      bg={
        isDarkMode
          ? data.isSelected
            ? "purple.900"
            : "gray.800"
          : data.isSelected
            ? "purple.100"
            : "white"
      }
      borderWidth={2}
      borderColor={
        data.type === "activity"
          ? isDarkMode
            ? "purple.400"
            : "purple.500"
          : data.type === "incoming"
            ? isDarkMode
              ? "blue.400"
              : "blue.500"
            : isDarkMode
              ? "green.400"
              : "green.500"
      }
      boxShadow="md"
      width="200px"
    >
      <Text
        fontWeight="bold"
        fontSize="sm"
        noOfLines={1}
        title={data.label}
        color={isDarkMode ? "white" : "gray.800"}
      >
        {data.label}
      </Text>
      <Text
        fontSize="xs"
        color={isDarkMode ? "gray.400" : "gray.500"}
        noOfLines={1}
        title={data.namespace}
      >
        {data.namespace}
      </Text>
      {data.type && (
        <Badge
          mt={1}
          colorScheme={
            data.type === "activity"
              ? "purple"
              : data.type === "incoming"
                ? "blue"
                : "green"
          }
          fontSize="xs"
        >
          {data.type === "activity"
            ? "Atividade"
            : data.type === "incoming"
              ? "Entrada"
              : "Saída"}
        </Badge>
      )}
    </Box>
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
    <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent
        maxW="90vw"
        maxH="90vh"
        h="80vh"
        style={{
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
        <ModalHeader style={{ color: styleContext.state.textColor }}>
          <Flex justify="space-between" align="center" pr={8}>
            <Text>Visualização do Fluxo</Text>
            <Flex gap={2} flexWrap="wrap" justifyContent="flex-end">
              <Badge colorScheme="purple" px={2} py={1}>
                Atividades
              </Badge>
              <Badge colorScheme="blue" px={2} py={1}>
                Entradas
              </Badge>
              <Badge colorScheme="green" px={2} py={1}>
                Saídas
              </Badge>
            </Flex>
          </Flex>
        </ModalHeader>
        <ModalCloseButton style={{ color: styleContext.state.textColor }} />
        <ModalBody p={0} position="relative">
          <Box width="100%" height="100%" className="reactflow-wrapper">
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
                  <Box
                    position="absolute"
                    bottom={4}
                    right={4}
                    p={3}
                    borderRadius="md"
                    boxShadow="md"
                    zIndex={10}
                    style={{
                      backgroundColor:
                        styleContext.state.buttonHoverColorWeight === "200"
                          ? "rgba(255, 255, 255, 0.9)"
                          : "rgba(31, 41, 55, 0.9)",
                      borderColor:
                        styleContext.state.buttonHoverColorWeight === "200"
                          ? "#e5e7eb"
                          : "#374151",
                      borderWidth: "1px",
                      color: styleContext.state.textColor,
                    }}
                  >
                    <Text fontWeight="bold" mb={2} fontSize="sm">
                      Legenda
                    </Text>

                    <Flex direction="column" gap={2}>
                      {/* Node types */}
                      <Flex align="center" gap={2}>
                        <Box
                          w="16px"
                          h="16px"
                          borderRadius="md"
                          borderWidth={2}
                          borderColor={
                            styleContext.state.buttonHoverColorWeight === "200"
                              ? "purple.500"
                              : "purple.400"
                          }
                        />
                        <Text fontSize="xs">Atividades</Text>
                      </Flex>

                      <Flex align="center" gap={2}>
                        <Box
                          w="16px"
                          h="16px"
                          borderRadius="md"
                          borderWidth={2}
                          borderColor={
                            styleContext.state.buttonHoverColorWeight === "200"
                              ? "blue.500"
                              : "blue.400"
                          }
                        />
                        <Text fontSize="xs">Entradas</Text>
                      </Flex>

                      <Flex align="center" gap={2}>
                        <Box
                          w="16px"
                          h="16px"
                          borderRadius="md"
                          borderWidth={2}
                          borderColor={
                            styleContext.state.buttonHoverColorWeight === "200"
                              ? "green.500"
                              : "green.400"
                          }
                        />
                        <Text fontSize="xs">Saídas</Text>
                      </Flex>

                      <Box
                        h="1px"
                        bg={
                          styleContext.state.buttonHoverColorWeight === "200"
                            ? "gray.200"
                            : "gray.600"
                        }
                        my={1}
                      />

                      {/* Edge types */}
                      <Flex align="center" gap={2}>
                        <Box
                          w="16px"
                          h="2px"
                          bg={
                            styleContext.state.buttonHoverColorWeight === "200"
                              ? "#9333ea"
                              : "#a855f7"
                          }
                        />
                        <Text fontSize="xs">Dependências entre atividades</Text>
                      </Flex>

                      <Flex align="center" gap={2}>
                        <Box
                          w="16px"
                          h="2px"
                          bg={
                            styleContext.state.buttonHoverColorWeight === "200"
                              ? "#3182ce"
                              : "#60a5fa"
                          }
                        />
                        <Text fontSize="xs">Dependências de entrada</Text>
                      </Flex>

                      <Flex align="center" gap={2}>
                        <Box
                          w="16px"
                          h="2px"
                          bg={
                            styleContext.state.buttonHoverColorWeight === "200"
                              ? "#38a169"
                              : "#4ade80"
                          }
                        />
                        <Text fontSize="xs">Dependências de saída</Text>
                      </Flex>
                    </Flex>
                  </Box>
                </ReactFlow>
              </div>
            ) : (
              <Flex justify="center" align="center" height="100%" width="100%">
                <Text color={styleContext.state.textColor}>
                  Carregando visualização...
                </Text>
              </Flex>
            )}
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
