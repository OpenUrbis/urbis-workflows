import { getAccessToken } from "../../../../auth/token";
import {
  Stepper,
  Box,
  StepIndicator,
  StepTitle,
  useSteps,
  StepStatus,
  Step,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Center,
  ButtonProps,
  Tooltip,
  Portal,
} from "@chakra-ui/react";
import {
  useState,
  useContext,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";
import {
  FaPlus,
  FaTrash,
  FaCheck,
  FaCircle,
  FaMinus,
  FaList,
} from "react-icons/fa";
import { BsThreeDots } from "react-icons/bs";
import { BlockOptions, FieldTypeEnum, IField, IFormContext } from "@open-urbis/types";
import EditableHeader from "../../../../components/EditableHeader";
import { FieldEditable } from "../FieldEditable";
import { Field } from "../Field";
import { HelpTooltipClickable } from "../../../../components";
import { StyleContext } from "../../../../reducers";
import { FormsApiClient } from "../../../../api/clients/forms.client";
import { TreeList } from "../../components/TreeList";

const formsClient = new FormsApiClient({
  baseURL: import.meta.env.VITE_BACK_END_API || "",
  headers: {
    Authorization: `Bearer ${getAccessToken()}`,
  },
});

export type FieldStepEditableProps = {
  field: IField[];
  general: IFormContext;
  value: any;
  valid: any;
  onChange: (key: string, value: any) => void;
  onValidChange: (key: string, valid: boolean) => void;
  onConfigChange: (field: IField[]) => void;
};

type FlattenedField = IField & {
  presetKey?: string;
  presetIndex?: number;
  isPreset?: boolean;
  stepIndex?: number;
};

type StepMenuProps = {
  onAddStep: () => void;
  onImportStep: () => void;
  buttonProps?: ButtonProps;
  styleContext: any;
  variant?: "icon" | "button";
};

const StepMenu: React.FC<StepMenuProps> = ({
  onAddStep,
  onImportStep,
  buttonProps,
  styleContext,
  variant = "button",
}) => {
  return (
    <Menu>
      {variant === "button" ? (
        <MenuButton
          as={Button}
          leftIcon={<FaPlus />}
          style={{
            backgroundColor:
              styleContext.state.buttonHoverColorWeight === "200"
                ? "#ca8a04"
                : "#854d0e",
            color: "#ffffff",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor =
              styleContext.state.buttonHoverColorWeight === "200"
                ? "#a16207"
                : "#713f12";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor =
              styleContext.state.buttonHoverColorWeight === "200"
                ? "#ca8a04"
                : "#854d0e";
          }}
          className="px-4 py-2.5 rounded flex items-center justify-center space-x-2"
          {...buttonProps}
        >
          <span>Etapa</span>
        </MenuButton>
      ) : (
        <MenuButton
          as={IconButton}
          aria-label="Add Step"
          icon={<FaPlus />}
          bg={
            styleContext.state.buttonHoverColorWeight === "200"
              ? "gray.100"
              : "gray.800"
          }
          color={
            styleContext.state.buttonHoverColorWeight === "200"
              ? "gray.600"
              : "gray.200"
          }
          _hover={{
            bg:
              styleContext.state.buttonHoverColorWeight === "200"
                ? "gray.200"
                : "gray.700",
          }}
          {...buttonProps}
        />
      )}
      <Portal>
        <MenuList
          zIndex={"overlay"}
          bg={
            styleContext.state.buttonHoverColorWeight === "200"
              ? "white"
              : "gray.800"
          }
          borderColor={
            styleContext.state.buttonHoverColorWeight === "200"
              ? "gray.200"
              : "gray.600"
          }
        >
          <MenuItem
            icon={<FaPlus />}
            onClick={onAddStep}
            bg={
              styleContext.state.buttonHoverColorWeight === "200"
                ? "white"
                : "gray.800"
            }
            _hover={{
              bg:
                styleContext.state.buttonHoverColorWeight === "200"
                  ? "gray.100"
                  : "gray.700",
            }}
          >
            <span style={{ color: styleContext.state.textColor }}>
              Nova Etapa
            </span>
          </MenuItem>
          <MenuItem
            icon={<FaList />}
            onClick={onImportStep}
            bg={
              styleContext.state.buttonHoverColorWeight === "200"
                ? "white"
                : "gray.800"
            }
            _hover={{
              bg:
                styleContext.state.buttonHoverColorWeight === "200"
                  ? "gray.100"
                  : "gray.700",
            }}
          >
            <span style={{ color: styleContext.state.textColor }}>
              Importar Pré-Definido
            </span>
          </MenuItem>
        </MenuList>
      </Portal>
    </Menu>
  );
};

const getFormIcon = (form: any) => {
  switch (form.type) {
    case "field":
      return {
        icon: FaMinus,
        color: "blue",
        label: "Campo",
        bgColor: "bg-blue-100",
        textColor: "text-blue-800",
      };
    case "block":
      return {
        icon: FaList,
        color: "purple",
        label: "Bloco",
        bgColor: "bg-purple-100",
        textColor: "text-purple-800",
      };
    case "step":
      return {
        icon: BsThreeDots,
        color: "green",
        label: "Etapa",
        bgColor: "bg-green-100",
        textColor: "text-green-800",
      };
    default:
      return {
        icon: FaMinus,
        color: "blue",
        label: "Campo",
        bgColor: "bg-blue-100",
        textColor: "text-blue-800",
      };
  }
};

const cleanupFieldStructure = (field: IField | IField[]): IField | IField[] => {
  if (Array.isArray(field)) {
    return field.map((f) => cleanupFieldStructure(f)) as IField[];
  }

  const { stepIndex, presetKey, presetIndex, isPreset, ...cleanField } =
    field as any;

  if (cleanField.block) {
    cleanField.block = cleanupFieldStructure(cleanField.block) as IField[];
  }

  return cleanField;
};

export const StepEditable: React.FC<FieldStepEditableProps> = ({
  field,
  general,
  value,
  valid,
  onChange,
  onValidChange,
  onConfigChange,
}) => {
  const { activeStep, setActiveStep } = useSteps({
    index: 0,
    count: field?.length ?? 0,
  });
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [rerender, setRerender] = useState<boolean>(true);
  const styleContext = useContext(StyleContext);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [stepPresets, setStepPresets] = useState<any[]>([]);
  const [presetSearch, setPresetSearch] = useState("");

  // Add refs for scroll handling
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    index: number
  ) => {
    const originalIndex = getOriginalFieldIndex(index);
    setDraggingIndex(originalIndex);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (
    e: React.DragEvent<HTMLDivElement>,
    index: number
  ) => {
    e.preventDefault();
    if (draggingIndex === null) return;

    const targetOriginalIndex = getOriginalFieldIndex(index);

    if (draggingIndex !== targetOriginalIndex) {
      const newFields = [...field];
      const [movedItem] = newFields.splice(draggingIndex, 1);

      // When dragging from left to right, we need to insert at the target index
      // When dragging from right to left, we need to insert at the target index
      const insertIndex = targetOriginalIndex;

      newFields.splice(insertIndex, 0, movedItem);
      onConfigChange(cleanupFieldStructure(newFields) as IField[]);
      setDraggingIndex(insertIndex);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    setDraggingIndex(null);
  };

  const handleAddStep = () => {
    const newFields = [
      ...(field ?? []),
      {
        key: `key-${(field?.length ?? 0) + 1}`,
        type: FieldTypeEnum.Block,
        options: {
          layout: "block",
          label: `Etapa ${(field?.length ?? 0) + 1}`,
        } as BlockOptions,
        block: [],
        expressions: {},
      },
    ];
    onConfigChange(cleanupFieldStructure(newFields) as IField[]);
  };

  const handleImportStep = async () => {
    try {
      const response = await formsClient.findAll();
      const filteredPresets = response.forms.filter(
        (form) => form.type === "step"
      );
      setStepPresets(filteredPresets);
      onOpen();
    } catch (error) {
      console.error("Error importing step preset:", error);
      window.alert("Erro ao carregar presets de etapa");
    }
  };

  const handlePresetSelect = async (preset: any) => {
    try {
      const fullPreset = await formsClient.findOne(preset.id);
      if (fullPreset) {
        const insertAtIndex = preset.insertAtIndex ?? field.length;
        const newFields = [...field];
        newFields.splice(insertAtIndex, 0, {
          ...fullPreset.form,
          key: `key-${(field?.length ?? 0) + 1}`,
        });
        onConfigChange(cleanupFieldStructure(newFields) as IField[]);
        onClose();
      }
    } catch (error) {
      console.error("Error selecting preset:", error);
      window.alert("Erro ao selecionar preset");
    }
  };

  const handleCloseModal = () => {
    setPresetSearch("");
    onClose();
  };

  const getFlattenedFields = useCallback(
    (fields: IField[]): FlattenedField[] => {
      const flattened: FlattenedField[] = [];
      let stepIndex = 0;

      fields.forEach((field, index) => {
        if (field?.type === "preset" && field?.preset) {
          field.preset.forEach((presetField) => {
            flattened.push({
              ...structuredClone(presetField),
              presetKey: field.key,
              presetIndex: index,
              isPreset: true,
              stepIndex: stepIndex++,
            });
          });
        } else {
          flattened.push({
            ...structuredClone(field),
            stepIndex: stepIndex++,
          });
        }
      });

      return flattened.sort((a, b) => (a.stepIndex ?? 0) - (b.stepIndex ?? 0));
    },
    []
  );

  const flattenedFields = useMemo(
    () => getFlattenedFields(field),
    [field, getFlattenedFields]
  );

  // Initialize step refs array when flattenedFields changes
  useEffect(() => {
    stepRefs.current = flattenedFields.map(() => null);
  }, [flattenedFields]);

  // Add effect for initial left alignment
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = 0;
    }
  }, [field]);

  // Add effect to scroll to active step when it changes
  useEffect(() => {
    if (scrollContainerRef.current && stepRefs.current[activeStep]) {
      const container = scrollContainerRef.current;
      const stepElement = stepRefs.current[activeStep];

      if (stepElement) {
        // Calculate position to scroll to (align to start)
        const containerLeft = container.getBoundingClientRect().left;
        const stepLeft = stepElement.getBoundingClientRect().left;
        const scrollOffset = stepLeft - containerLeft + container.scrollLeft;

        container.scrollTo({
          left: scrollOffset,
          behavior: "smooth",
        });
      }
    }
  }, [activeStep]);

  const handleRemoveStep = (index: number): void => {
    const targetField = flattenedFields[index];
    if (targetField.isPreset) {
      const newFields = field.filter((_, i) => i !== targetField.presetIndex);
      onConfigChange(cleanupFieldStructure(newFields) as IField[]);
    } else {
      const originalIndex = field.findIndex((f) => f.key === targetField.key);
      const newFields = field?.filter((_, i) => i !== originalIndex) ?? [];
      onConfigChange(cleanupFieldStructure(newFields) as IField[]);
    }
  };

  // Helper function to find the original field index from a flattened index
  const getOriginalFieldIndex = useCallback(
    (flattenedIndex: number): number => {
      const targetField = flattenedFields[flattenedIndex];
      if (targetField.isPreset) {
        return targetField.presetIndex!;
      }

      // Count how many fields we've seen up to this point
      let originalIndex = 0;
      let seenFlattenedFields = 0;

      for (
        let i = 0;
        i < (field?.length ?? 0) && seenFlattenedFields <= flattenedIndex;
        i++
      ) {
        const currentField = field?.[i];
        if (currentField?.type === "preset" && currentField?.preset?.length) {
          seenFlattenedFields += currentField.preset.length;
        } else {
          seenFlattenedFields += 1;
        }
        if (seenFlattenedFields > flattenedIndex) {
          originalIndex = i;
          break;
        }
      }

      return originalIndex;
    },
    [field, flattenedFields]
  );

  return (
    <>
      <div
        ref={scrollContainerRef}
        className="flex justify-start w-full pb-6"
        style={{ overflowX: "auto", whiteSpace: "nowrap" }}
      >
        {flattenedFields.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 w-full">
            <FaList size={32} className="mb-4 opacity-50" />
            <p
              className="text-xl font-medium mb-2"
              style={{ color: styleContext.state.textColor }}
            >
              Nenhuma etapa cadastrada
            </p>
            <p
              className="text-sm mb-6"
              style={{ color: styleContext.state.textColor }}
            >
              Adicione uma etapa usando o botão abaixo
            </p>
            <StepMenu
              onAddStep={handleAddStep}
              onImportStep={handleImportStep}
              styleContext={styleContext}
            />
          </div>
        )}
        <Stepper
          size="lg"
          index={activeStep}
          sx={{
            border: "none",
            boxShadow: "none",
            gap: 0,
            "& > *": {
              flex: "0 0 auto",
            },
          }}
          colorScheme="transparent"
          className="overflow-visible"
        >
          {flattenedFields.map((f, index) => {
            const isPresetEnd =
              f.isPreset &&
              (!flattenedFields[index + 1]?.isPreset ||
                flattenedFields[index + 1]?.presetKey !== f.presetKey);

            return (
              <div
                key={`step-${f.key}-${index}`}
                className="relative group"
                ref={(el) => (stepRefs.current[index] = el)}
              >
                <Step
                  className="cursor-pointer flex items-center"
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={handleDrop}
                >
                  <div className="w-[40px] mr-2">
                    {(!f.isPreset ||
                      (f.isPreset && !flattenedFields[index - 1]?.isPreset) ||
                      flattenedFields[index - 1]?.presetKey !==
                        f.presetKey) && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <StepMenu
                          onAddStep={() => {
                            const newStep = {
                              key: `key-${(field?.length ?? 0) + 1}`,
                              type: FieldTypeEnum.Block,
                              options: {
                                layout: "block",
                                label: `Etapa ${(field?.length ?? 0) + 1}`,
                              } as BlockOptions,
                              block: [],
                              expressions: {},
                            };
                            const originalIndex = getOriginalFieldIndex(index);
                            const newFields = [...field];
                            newFields.splice(originalIndex, 0, newStep);
                            onConfigChange(
                              cleanupFieldStructure(newFields) as IField[]
                            );
                          }}
                          onImportStep={async () => {
                            const originalIndex = getOriginalFieldIndex(index);
                            await handleImportStep();
                            setStepPresets((presets) =>
                              presets.map((preset) => ({
                                ...preset,
                                insertAtIndex: originalIndex,
                              }))
                            );
                          }}
                          styleContext={styleContext}
                          variant="icon"
                        />
                      </div>
                    )}
                  </div>
                  <StepIndicator
                    onClick={() => {
                      setActiveStep(index);
                      setRerender(false);
                      setTimeout(() => {
                        setRerender(true);
                      }, 0);
                    }}
                    sx={{
                      border: "none",
                      boxShadow: "none",
                    }}
                  >
                    <StepStatus
                      complete={
                        <Center
                          w="36px"
                          h="36px"
                          bg={
                            styleContext.state.buttonHoverColorWeight === "200"
                              ? "green.400"
                              : "green.900"
                          }
                          color={
                            styleContext.state.buttonHoverColorWeight === "200"
                              ? "white"
                              : "green.200"
                          }
                          border="3px solid"
                          borderColor={
                            styleContext.state.buttonHoverColorWeight === "200"
                              ? "green.300"
                              : "green.400"
                          }
                          borderRadius="12px"
                          _hover={{
                            bg: "green.600",
                          }}
                        >
                          <FaCheck size={14} />
                        </Center>
                      }
                      incomplete={
                        <Center
                          w="36px"
                          h="36px"
                          bg={
                            styleContext.state.buttonHoverColorWeight === "200"
                              ? "gray.100"
                              : "gray.800"
                          }
                          border="3px solid"
                          borderColor={
                            styleContext.state.buttonHoverColorWeight === "200"
                              ? "gray.200"
                              : "gray.600"
                          }
                          borderRadius="12px"
                          _hover={{
                            bg: "gray.100",
                            borderColor: "gray.300",
                          }}
                        >
                          <FaCircle
                            size={8}
                            color={
                              styleContext.state.buttonHoverColorWeight ===
                              "200"
                                ? "#CBD5E0"
                                : "#4A5568"
                            }
                          />
                        </Center>
                      }
                      active={
                        <Center
                          w="36px"
                          h="36px"
                          bg={
                            styleContext.state.buttonHoverColorWeight === "200"
                              ? "green.400"
                              : "green.600"
                          }
                          border="3px solid"
                          borderColor={
                            styleContext.state.buttonHoverColorWeight === "200"
                              ? "green.300"
                              : "green.400"
                          }
                          borderRadius="12px"
                          color="white"
                          _hover={{
                            bg: "green.500",
                            borderColor: "green.300",
                          }}
                        >
                          <FaCircle size={8} />
                        </Center>
                      }
                    />
                  </StepIndicator>

                  <Box flexShrink="0">
                    <StepTitle className="flex items-center space-x-2">
                      <div className="flex items-center ml-2">
                        <EditableHeader
                          value={(f.options as BlockOptions).label}
                          onTextChange={(text: string) => {
                            const targetIndex = getOriginalFieldIndex(index);
                            const newFields = [...field];
                            (
                              newFields[targetIndex].options as BlockOptions
                            ).label = text;
                            onConfigChange(
                              cleanupFieldStructure(newFields) as IField[]
                            );
                          }}
                          readOnly={f.isPreset}
                        />
                        {f.isPreset && (
                          <Tooltip
                            label="Esta etapa foi importada de um modelo pré-definido"
                            placement="top"
                          >
                            <div className="ml-2 px-1 py-0.5 bg-blue-100 rounded-sm text-[10px] text-blue-700 font-medium opacity-75">
                              P
                            </div>
                          </Tooltip>
                        )}
                        {(f.options as BlockOptions).tooltip && (
                          <div className="flex items-center mb-1 ml-2.5">
                            <HelpTooltipClickable
                              tooltip={
                                (f.options as BlockOptions).tooltip as string
                              }
                            />
                          </div>
                        )}
                      </div>
                    </StepTitle>
                  </Box>
                  {!f.isPreset && (
                    <IconButton
                      aria-label="Remove Step"
                      icon={<FaTrash />}
                      onClick={() => {
                        if (activeStep === index && index > 0) {
                          setActiveStep(index - 1);
                        }
                        handleRemoveStep(index);
                      }}
                      className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      bg={
                        styleContext.state.buttonHoverColorWeight === "200"
                          ? "gray.100"
                          : "gray.800"
                      }
                      color={
                        styleContext.state.buttonHoverColorWeight === "200"
                          ? "gray.600"
                          : "gray.200"
                      }
                      _hover={{
                        bg:
                          styleContext.state.buttonHoverColorWeight === "200"
                            ? "gray.200"
                            : "gray.700",
                      }}
                    />
                  )}
                  {f.isPreset && isPresetEnd && (
                    <>
                      <IconButton
                        aria-label="Remove Preset Group"
                        icon={<FaTrash />}
                        className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => {
                          if (f.presetIndex !== undefined) {
                            handleRemoveStep(index);
                          }
                        }}
                        bg={
                          styleContext.state.buttonHoverColorWeight === "200"
                            ? "gray.100"
                            : "gray.800"
                        }
                        color={
                          styleContext.state.buttonHoverColorWeight === "200"
                            ? "gray.600"
                            : "gray.200"
                        }
                        _hover={{
                          bg:
                            styleContext.state.buttonHoverColorWeight === "200"
                              ? "gray.200"
                              : "gray.700",
                        }}
                      />
                    </>
                  )}
                  {index === flattenedFields.length - 1 && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                      <StepMenu
                        onAddStep={handleAddStep}
                        onImportStep={async () => {
                          await handleImportStep();
                          setStepPresets((presets) =>
                            presets.map((preset) => ({
                              ...preset,
                              insertAtIndex: field.length,
                            }))
                          );
                        }}
                        styleContext={styleContext}
                        variant="icon"
                      />
                    </div>
                  )}
                </Step>
              </div>
            );
          })}
        </Stepper>
      </div>

      <div>
        {flattenedFields.length > 0 &&
          rerender &&
          flattenedFields[activeStep] &&
          (flattenedFields[activeStep].isPreset ? (
            <Field
              parent={flattenedFields[activeStep]}
              context={value}
              validContext={valid}
              general={general}
              field={flattenedFields[activeStep]}
              value={value?.[flattenedFields[activeStep]?.key] ?? {}}
              valid={valid?.[flattenedFields[activeStep]?.key] ?? {}}
              onChange={(v) => {
                onChange(flattenedFields[activeStep]?.key, v);
              }}
              onValidChange={(valid: any) => {
                onValidChange(flattenedFields[activeStep].key, valid);
              }}
            />
          ) : (
            <FieldEditable
              parent={flattenedFields[activeStep]}
              context={value}
              validContext={valid}
              general={general}
              field={flattenedFields[activeStep]}
              value={value?.[flattenedFields[activeStep]?.key] ?? {}}
              valid={valid?.[flattenedFields[activeStep]?.key] ?? {}}
              onChange={(v) => {
                onChange(flattenedFields[activeStep]?.key, v);
              }}
              onValidChange={(valid: any) => {
                onValidChange(flattenedFields[activeStep].key, valid);
              }}
              onConfigChange={(config: IField) => {
                const targetIndex = flattenedFields[activeStep].isPreset
                  ? flattenedFields[activeStep].presetIndex
                  : activeStep;

                if (targetIndex !== undefined) {
                  const newFields = [...field];
                  newFields[targetIndex] = config;
                  onConfigChange(cleanupFieldStructure(newFields) as IField[]);
                }
              }}
              onRemove={() => {}}
            />
          ))}
      </div>

      <Modal isOpen={isOpen} onClose={handleCloseModal} size="xl">
        <ModalOverlay />
        <ModalContent
          bg={styleContext.state.backgroundColor}
          borderColor={
            styleContext.state.buttonHoverColorWeight === "200"
              ? "gray.200"
              : "gray.600"
          }
        >
          <ModalHeader style={{ color: styleContext.state.textColor }}>
            Importar etapa pré-definida
          </ModalHeader>
          <ModalBody>
            <TreeList
              items={stepPresets.map((preset) => ({
                id: preset.id,
                label: preset.label || "Sem título",
                namespace: preset.namespace || "global",
                type: preset.type,
                documentation: preset.documentation,
                insertAtIndex: preset.insertAtIndex,
              }))}
              search={presetSearch}
              onClick={handlePresetSelect}
              onSearchChange={setPresetSearch}
              icon={BsThreeDots}
              iconColor="green"
              getIcon={getFormIcon}
            />
          </ModalBody>
          <ModalFooter>
            <Button
              onClick={handleCloseModal}
              style={{
                backgroundColor:
                  styleContext.state.buttonHoverColorWeight === "200"
                    ? "#E5E7EB"
                    : "#374151",
                color: styleContext.state.textColor,
              }}
              _hover={{
                backgroundColor:
                  styleContext.state.buttonHoverColorWeight === "200"
                    ? "#D1D5DB"
                    : "#4B5563",
              }}
            >
              Cancelar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};
