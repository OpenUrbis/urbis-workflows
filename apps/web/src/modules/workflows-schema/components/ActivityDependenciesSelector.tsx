import React, { useState } from "react";
import {
  FormControl,
  FormLabel,
  FormHelperText,
  Checkbox,
  Tooltip,
  Badge,
  Input,
  InputGroup,
  InputLeftElement,
} from "@chakra-ui/react";
import { FaProjectDiagram, FaSearch, FaTimes } from "react-icons/fa";
import { ActivityTemplate } from "../../../api/types/schema";
import { SideDrawer } from "../../../components/SideDrawer";

export interface ActivityDependenciesSelectorProps {
  activities: ActivityTemplate[];
  selectedDependencies: string[];
  onChange: (dependencies: string[]) => void;
  styleContext: any;
  title?: string;
  helperText?: string;
  currentActivityId?: string; // To prevent self-dependency
}

export const ActivityDependenciesSelector: React.FC<
  ActivityDependenciesSelectorProps
> = ({
  activities,
  selectedDependencies,
  onChange,
  styleContext,
  title = "Dependências de Atividades",
  helperText = "Selecione as atividades que precisam ser concluídas antes que esta atividade seja habilitada",
  currentActivityId,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Filter out the current activity to prevent self-dependency
  const availableActivities = activities.filter(
    (activity) => !currentActivityId || activity.id !== currentActivityId
  );

  const filteredActivities = availableActivities.filter(
    (activity) =>
      activity.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.namespace.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpen = () => {
    setIsOpen(true);
    setSearchTerm("");
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleToggleDependency = (activityId: string) => {
    const newDependencies = selectedDependencies.includes(activityId)
      ? selectedDependencies.filter((id) => id !== activityId)
      : [...selectedDependencies, activityId];

    onChange(newDependencies);
  };

  const getActivityLabel = (activityId: string): string => {
    const activity = activities.find((a) => a.id === activityId);
    return activity ? activity.label : "Atividade desconhecida";
  };

  return (
    <>
      <FormControl>
        <FormLabel style={{ color: styleContext.state.textColor }}>
          {title}
        </FormLabel>
        <div
          className="border rounded-lg p-4"
          style={{
            color: styleContext.state.textColor,
            borderColor:
              styleContext.state.buttonHoverColorWeight === "200"
                ? "#E5E7EB"
                : "#374151",
          }}
        >
          <div className="flex flex-wrap gap-2 mb-3">
            {selectedDependencies.length === 0 ? (
              <div className="text-sm opacity-75 py-1">
                Nenhuma dependência selecionada
              </div>
            ) : (
              selectedDependencies.map((depId) => (
                <Badge
                  key={depId}
                  colorScheme="purple"
                  variant="solid"
                  className="flex items-center py-1"
                  borderRadius="md"
                >
                  <span className="mx-1">{getActivityLabel(depId)}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleDependency(depId);
                    }}
                    className="mr-1 hover:bg-opacity-10 rounded p-1 transition-colors duration-150"
                    style={{
                      color: "white",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor =
                        "rgba(255, 255, 255, 0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                    aria-label="Remove"
                  >
                    <FaTimes size={10} />
                  </button>
                </Badge>
              ))
            )}
          </div>
          <button
            onClick={handleOpen}
            className={`flex items-center px-4 py-3 rounded-lg transition-colors duration-150 w-full ${
              isOpen
                ? styleContext.state.buttonHoverColorWeight === "200"
                  ? "bg-gray-200 border-gray-300"
                  : "bg-gray-700 border-gray-600"
                : styleContext.state.buttonHoverColorWeight === "200"
                  ? "bg-gray-100 hover:bg-gray-200 border-gray-200"
                  : "bg-gray-800 hover:bg-gray-700 border-gray-700"
            } border`}
            style={{ color: styleContext.state.textColor }}
          >
            <div className="flex items-center space-x-2 w-full">
              <div
                className={`p-2 rounded-lg ${
                  styleContext.state.buttonHoverColorWeight === "200"
                    ? "bg-purple-100"
                    : "bg-purple-900"
                }`}
              >
                <FaProjectDiagram
                  className={
                    styleContext.state.buttonHoverColorWeight === "200"
                      ? "text-purple-600"
                      : "text-purple-300"
                  }
                  size={16}
                />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-medium">
                  {selectedDependencies.length > 0
                    ? `Gerenciar Dependências (${selectedDependencies.length})`
                    : "Adicionar Dependências"}
                </span>
                <span className="text-xs opacity-70">
                  Selecione as atividades dependentes
                </span>
              </div>
            </div>
          </button>
        </div>
        <FormHelperText style={{ color: styleContext.state.textColor }}>
          {helperText}
        </FormHelperText>
      </FormControl>

      {isOpen && (
        <SideDrawer
          isOpen={isOpen}
          onClose={handleClose}
          styleContext={styleContext}
          title="Selecionar Dependências"
          badge={{
            text: `${selectedDependencies.length} selecionadas`,
            colorScheme: "purple",
          }}
        >
          <div
            className="p-4 border-b"
            style={{
              borderColor:
                styleContext.state.buttonHoverColorWeight === "200"
                  ? "#E5E7EB"
                  : "#374151",
            }}
          >
            <InputGroup size="lg">
              <InputLeftElement
                pointerEvents="none"
                height="100%"
                children={<FaSearch className="text-gray-400" />}
              />
              <Input
                placeholder="Buscar atividades..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  backgroundColor: styleContext.state.backgroundColor,
                  color: styleContext.state.textColor,
                  borderColor:
                    styleContext.state.buttonHoverColorWeight === "200"
                      ? "#E5E7EB"
                      : "#374151",
                }}
                _hover={{
                  borderColor:
                    styleContext.state.buttonHoverColorWeight === "200"
                      ? "#D1D5DB"
                      : "#4B5563",
                }}
                _focus={{
                  borderColor:
                    styleContext.state.buttonHoverColorWeight === "200"
                      ? "#a855f7"
                      : "#7e22ce",
                  boxShadow:
                    styleContext.state.buttonHoverColorWeight === "200"
                      ? "0 0 0 1px #a855f7"
                      : "0 0 0 1px #7e22ce",
                }}
              />
            </InputGroup>
          </div>

          <div className="p-4">
            <p
              className="text-sm mb-4 font-medium"
              style={{ color: styleContext.state.textColor }}
            >
              Selecione as atividades que precisam ser concluídas antes:
            </p>

            {filteredActivities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <FaSearch size={32} className="mb-4 opacity-50" />
                <p className="text-lg font-medium mb-1">
                  Nenhuma atividade encontrada
                </p>
                <p className="text-sm">Tente buscar com outros termos</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredActivities.map((activity) => {
                  const isSelected = selectedDependencies.includes(activity.id);

                  return (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors duration-150"
                      style={{
                        backgroundColor: isSelected
                          ? styleContext.state.buttonHoverColorWeight === "200"
                            ? "rgba(233, 216, 253, 0.5)"
                            : "rgba(88, 28, 135, 0.2)"
                          : "transparent",
                      }}
                      onClick={() => handleToggleDependency(activity.id)}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor =
                            styleContext.state.buttonHoverColorWeight === "200"
                              ? "rgba(243, 244, 246, 0.8)"
                              : "rgba(31, 41, 55, 0.5)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }
                      }}
                    >
                      <div className="flex items-center w-full">
                        <Checkbox
                          isChecked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleToggleDependency(activity.id);
                          }}
                          colorScheme="purple"
                          size="lg"
                          className="mr-3"
                          borderRadius="md"
                          onClick={(e) => e.stopPropagation()}
                          sx={{
                            "span.chakra-checkbox__control": {
                              borderRadius: "0.375rem",
                            },
                          }}
                        />
                        <div className="flex-1">
                          <Tooltip
                            label={activity.documentation}
                            placement="top"
                            hasArrow
                            isDisabled={
                              !activity.documentation ||
                              activity.documentation.length <= 60
                            }
                          >
                            <div>
                              <p
                                className="font-medium"
                                style={{
                                  color: styleContext.state.textColor,
                                }}
                              >
                                {activity.label}
                              </p>
                              <p
                                className="text-sm"
                                style={{
                                  color:
                                    styleContext.state
                                      .buttonHoverColorWeight === "200"
                                      ? "#6B7280"
                                      : "#9CA3AF",
                                }}
                              >
                                {activity.namespace}
                              </p>
                            </div>
                          </Tooltip>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </SideDrawer>
      )}
    </>
  );
};
