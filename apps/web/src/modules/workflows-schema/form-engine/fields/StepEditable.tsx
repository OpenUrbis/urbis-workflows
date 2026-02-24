import { getAccessToken } from "../../../../auth/token";
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@open-urbis/map-ui";
import {
  type ComponentProps,
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
  buttonProps?: ComponentProps<typeof Button>;
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === "button" ? (
          <Button
            type="button"
            size="sm"
            className={`h-11 rounded-xl px-4 font-semibold shadow-sm inline-flex items-center justify-center gap-2 text-white ${
              styleContext.state.buttonHoverColorWeight === "200"
                ? "bg-primary hover:bg-primary/90"
                : "bg-primary hover:bg-primary/90"
            }`}
            {...buttonProps}
          >
            <FaPlus size={14} />
            <span>Etapa</span>
          </Button>
        ) : (
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="h-8 w-8"
            {...buttonProps}
          >
            <FaPlus size={14} />
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={onAddStep} className="flex items-center gap-2">
          <FaPlus size={12} />
          <span>Nova Etapa</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onImportStep} className="flex items-center gap-2">
          <FaList size={12} />
          <span>Importar Pré-Definido</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
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
  const [activeStep, setActiveStep] = useState(0);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const styleContext = useContext(StyleContext);
  const [isPresetDialogOpen, setIsPresetDialogOpen] = useState(false);
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
      setIsPresetDialogOpen(true);
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
        const presetForm = (fullPreset as any)?.form;
        const importedSteps = Array.isArray(presetForm)
          ? presetForm
          : Array.isArray(presetForm?.preset)
            ? presetForm.preset
            : [];

        if (importedSteps.length === 0) {
          return;
        }

        const newFields = [...field];
        newFields.splice(insertAtIndex, 0, ...importedSteps);
        onConfigChange(cleanupFieldStructure(newFields) as IField[]);
        setIsPresetDialogOpen(false);
      }
    } catch (error) {
      console.error("Error selecting preset:", error);
      window.alert("Erro ao selecionar preset");
    }
  };

  const handleCloseModal = () => {
    setPresetSearch("");
    setIsPresetDialogOpen(false);
  };

  const getFlattenedFields = useCallback(
    (fields: IField[]): FlattenedField[] => {
      const flattened: FlattenedField[] = [];
      let stepIndex = 0;

      fields.forEach((field, index) => {
        if (field?.type === "preset" && field?.preset) {
          field.preset.forEach((presetField) => {
            flattened.push({
              ...presetField,
              presetKey: field.key,
              presetIndex: index,
              isPreset: true,
              stepIndex: stepIndex++,
            });
          });
        } else {
          flattened.push({
            ...field,
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

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onValidChangeRef = useRef(onValidChange);
  onValidChangeRef.current = onValidChange;
  const onConfigChangeRef = useRef(onConfigChange);
  onConfigChangeRef.current = onConfigChange;
  const fieldRef = useRef(field);
  fieldRef.current = field;

  const activeStepRef = useRef(activeStep);
  activeStepRef.current = activeStep;
  const flattenedFieldsRef = useRef(flattenedFields);
  flattenedFieldsRef.current = flattenedFields;

  const handleFieldChange = useCallback((v: any) => {
    const key = flattenedFieldsRef.current[activeStepRef.current]?.key;
    if (key) onChangeRef.current(key, v);
  }, []);

  const handleFieldValidChange = useCallback((valid: any) => {
    const key = flattenedFieldsRef.current[activeStepRef.current]?.key;
    if (key) onValidChangeRef.current(key, valid);
  }, []);

  const handleFieldConfigChange = useCallback((config: IField) => {
    const activeField = flattenedFieldsRef.current[activeStepRef.current];
    const targetIndex = activeField?.isPreset
      ? activeField.presetIndex
      : activeStepRef.current;

    if (targetIndex !== undefined) {
      const newFields = [...fieldRef.current];
      newFields[targetIndex] = config;
      onConfigChangeRef.current(cleanupFieldStructure(newFields) as IField[]);
    }
  }, []);

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
        <TooltipProvider>
          <div className="flex items-center overflow-visible">
            {flattenedFields.map((f, index) => {
              const isPresetEnd =
                f.isPreset &&
                (!flattenedFields[index + 1]?.isPreset ||
                  flattenedFields[index + 1]?.presetKey !== f.presetKey);

              return (
                <div
                  key={`step-${f.key}-${index}`}
                  className="relative group flex items-center"
                  ref={(el) => (stepRefs.current[index] = el)}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={handleDrop}
                >
                  <div className="w-[40px] mr-2">
                    {(!f.isPreset ||
                      (f.isPreset && !flattenedFields[index - 1]?.isPreset) ||
                      flattenedFields[index - 1]?.presetKey !== f.presetKey) && (
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
                            onConfigChange(cleanupFieldStructure(newFields) as IField[]);
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

                  <button
                    type="button"
                    onClick={() => {
                      setActiveStep(index);
                    }}
                    className="cursor-pointer flex items-center"
                  >
                    <div
                      className={`h-9 w-9 rounded-xl border-2 flex items-center justify-center transition-colors ${
                        index < activeStep
                          ? styleContext.state.buttonHoverColorWeight === "200"
                            ? "bg-green-500 border-green-400 text-white"
                            : "bg-green-700 border-green-500 text-white"
                          : index === activeStep
                            ? styleContext.state.buttonHoverColorWeight === "200"
                              ? "bg-green-500 border-green-400 text-white"
                              : "bg-green-700 border-green-500 text-white"
                            : styleContext.state.buttonHoverColorWeight === "200"
                              ? "bg-gray-100 border-gray-200 text-gray-400"
                              : "bg-gray-800 border-gray-600 text-gray-500"
                      }`}
                    >
                      {index < activeStep ? <FaCheck size={14} /> : <FaCircle size={8} />}
                    </div>

                    <div className="ml-2 flex items-center space-x-2">
                      <EditableHeader
                        value={(f.options as BlockOptions).label}
                        onTextChange={(text: string) => {
                          const targetIndex = getOriginalFieldIndex(index);
                          const newFields = [...field];
                          (newFields[targetIndex].options as BlockOptions).label = text;
                          onConfigChange(cleanupFieldStructure(newFields) as IField[]);
                        }}
                        readOnly={f.isPreset}
                      />
                      {f.isPreset && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="ml-2 px-1 py-0.5 bg-blue-100 rounded-sm text-[10px] text-blue-700 font-medium opacity-75">
                              P
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            Esta etapa foi importada de um modelo pré-definido
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {(f.options as BlockOptions).tooltip && (
                        <div className="flex items-center mb-1 ml-2.5">
                          <HelpTooltipClickable
                            tooltip={(f.options as BlockOptions).tooltip as string}
                          />
                        </div>
                      )}
                    </div>
                  </button>

                  {!f.isPreset && (
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => {
                        if (activeStep === index && index > 0) {
                          setActiveStep(index - 1);
                        }
                        handleRemoveStep(index);
                      }}
                      className="h-8 w-8 ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <FaTrash size={12} />
                    </Button>
                  )}

                  {f.isPreset && isPresetEnd && (
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        if (f.presetIndex !== undefined) {
                          handleRemoveStep(index);
                        }
                      }}
                    >
                      <FaTrash size={12} />
                    </Button>
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

                  {index < flattenedFields.length - 1 && (
                    <div
                      className={`mx-4 h-px w-10 ${
                        styleContext.state.buttonHoverColorWeight === "200"
                          ? "bg-gray-300"
                          : "bg-gray-600"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </TooltipProvider>
      </div>

      <div key={activeStep}>
        {flattenedFields.length > 0 &&
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
              onChange={handleFieldChange}
              onValidChange={handleFieldValidChange}
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
              onChange={handleFieldChange}
              onValidChange={handleFieldValidChange}
              onConfigChange={handleFieldConfigChange}
              onRemove={() => {}}
            />
          ))}
      </div>

      <Dialog
        open={isPresetDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseModal();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importar etapa pré-definida</DialogTitle>
          </DialogHeader>
          <div>
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
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCloseModal}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
