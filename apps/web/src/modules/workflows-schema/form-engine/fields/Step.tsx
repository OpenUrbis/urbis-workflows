import { Button } from "@open-urbis/map-ui";
import { IField, IFormContext, BlockOptions } from "@open-urbis/types";
import { Field } from "../Field";
import { HelpTooltipClickable, SL } from "../../../../components";
import { HotkeyContext, StyleContext } from "../../../../reducers";
import { useContext, useEffect, useState, useRef } from "react";
import { visibleCallback } from "../utils/expressions";
import { FaCircle, FaCheck } from "react-icons/fa";

export type FieldStepProps = {
  field: IField[];
  general: IFormContext;
  value: any;
  valid: any;
  onChange: (key: string, value: any) => void;
  onValidChange: (key: string, valid: any) => void;
};

// Recursive function to check if all nested values are true
const isCompleted = (obj: any): boolean => {
  if (typeof obj === "boolean") return obj;
  if (Array.isArray(obj)) return obj.every(isCompleted);
  if (typeof obj === "object" && obj !== null) {
    // handle corner case when $complete is defined at the obj being evaluated
    return Object.keys(obj).every((key) =>
      key === "$complete" ? true : isCompleted(obj[key])
    );
  }
  return false;
};

export const Step: React.FC<FieldStepProps> = ({
  field,
  general,
  value,
  valid,
  onChange,
  onValidChange,
}) => {
  const hotkeyContext = useContext(HotkeyContext);
  const styleContext = useContext(StyleContext);
  const [activeStep, setActiveStep] = useState(0);
  const [visible, setVisible] = useState<{ [key: string]: boolean }>({});
  const [nextStepDisabled, setNextStepDisabled] = useState(false);
  const [lastVisibleStep, setLastVisibleStep] = useState(field.length - 1);
  const [flattenedFields, setFlattenedFields] = useState<IField[]>([]);
  const [rerender, setRerender] = useState<boolean>(true);

  // Add refs for scroll handling
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  const getFlattenedFields = (fields: IField[]): IField[] => {
    const flattened: IField[] = [];

    fields.forEach((f) => {
      if (f?.type === "preset" && f?.preset) {
        f.preset.forEach((presetField) => {
          flattened.push(JSON.parse(JSON.stringify(presetField)));
        });
      } else {
        flattened.push(JSON.parse(JSON.stringify(f)));
      }
    });

    return flattened;
  };

  useEffect(() => {
    const flattenedFields = getFlattenedFields(field);
    setFlattenedFields(flattenedFields);
    // Initialize step refs array with the correct length
    stepRefs.current = flattenedFields.map(() => null);
  }, []);

  // Add effect for initial left alignment
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = 0;
    }
  }, [flattenedFields]);

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

  useEffect(() => {
    const visibleObj: { [key: string]: boolean } = {};
    let lastVisibleIndex = 0;

    const updateVisibility = (f: any, index: number) => {
      if (f.expressions?.visible) {
        visibleCallback(f, value, general, valid, (visible: boolean) => {
          visibleObj[f.key] = visible;
          if (visible !== false) {
            lastVisibleIndex = index;
          }
        });
      } else {
        lastVisibleIndex = index;
      }
    };

    flattenedFields.forEach((f, index) => updateVisibility(f, index));

    setVisible(visibleObj);
    setLastVisibleStep(lastVisibleIndex);
  }, [value]);

  useEffect(() => {
    setNextStepDisabled(!nextStepEnabled());
  }, [valid, activeStep]);

  useEffect(() => {
    hotkeyContext.dispatch({
      type: "SET_HOTKEY",
      payload: {
        right: () => {
          setNextStep(activeStep);
        },
        left: () => {
          setPreviousStep(activeStep);
        },
        S: () => {
          if (!nextStepDisabled) {
            setNextStep(activeStep);
          }
        },
      },
    });

    return () => {
      hotkeyContext.dispatch({
        type: "UNSET_HOTKEY",
        delete: ["right", "left", "S"],
      });
    };
  }, [field, valid, activeStep, nextStepDisabled]);

  const nextStepEnabled = () => {
    const stepKey = flattenedFields[activeStep]?.key;

    if (!stepKey) {
      return false;
    }

    const checkIfIsValid = (obj: any): boolean => {
      if (typeof obj === "boolean") {
        return obj;
      }
      if (Array.isArray(obj)) {
        return obj.every(checkIfIsValid);
      }
      if (typeof obj === "object" && obj !== null) {
        return Object.values(obj).every(checkIfIsValid);
      }
      return true;
    };

    return checkIfIsValid(valid?.[stepKey]);
  };

  const setPreviousStep = (step: number) => {
    let previousStepIndex = step - 1;

    while (
      previousStepIndex >= 0 &&
      visible[flattenedFields[previousStepIndex].key] === false
    ) {
      previousStepIndex--;
    }

    if (previousStepIndex >= 0) {
      setRerender(false);
      setActiveStep(previousStepIndex);
      setTimeout(() => {
        setRerender(true);
      }, 0);
    }

    onValidChange("$complete", false);
  };

  const setNextStep = (step: number) => {
    let nextStepIndex = step + 1;

    while (
      flattenedFields[nextStepIndex] &&
      visible[flattenedFields[nextStepIndex].key] === false
    ) {
      nextStepIndex++;
    }

    if (!nextStepDisabled && nextStepIndex < (flattenedFields?.length ?? 1)) {
      setRerender(false);
      setActiveStep(nextStepIndex);
      setTimeout(() => {
        setRerender(true);
      }, 0);
      onValidChange(
        "$complete",
        nextStepIndex === lastVisibleStep ? isCompleted(valid) : false
      );
    }
  };

  return (
    <div className="w-full pb-6">
      <div
        ref={scrollContainerRef}
        className="flex justify-start"
        style={{ overflowX: "auto", whiteSpace: "nowrap" }}
      >
        <div className="flex items-center space-x-8 overflow-visible">
          {flattenedFields?.map((f, index) => {
            if (visible[f.key] === false) return null;

            const isStepActive = index === activeStep;
            const isStepComplete = index < activeStep;

            return (
              <div
                key={index}
                ref={(el) => (stepRefs.current[index] = el)}
                className="flex items-center"
              >
                <button
                  type="button"
                  onClick={() => {
                    setRerender(false);
                    setActiveStep(index);
                    setTimeout(() => setRerender(true), 0);
                  }}
                  className="flex flex-col items-start gap-2"
                >
                  <div
                    className={`h-9 w-9 rounded-xl border-2 flex items-center justify-center transition-colors ${
                      isStepActive || isStepComplete
                        ? styleContext.state.buttonHoverColorWeight === "200"
                          ? "bg-green-500 border-green-400 text-white"
                          : "bg-green-700 border-green-500 text-white"
                        : styleContext.state.buttonHoverColorWeight === "200"
                          ? "bg-gray-100 border-gray-200 text-gray-400"
                          : "bg-gray-800 border-gray-600 text-gray-500"
                    }`}
                  >
                    {isStepComplete ? <FaCheck size={14} /> : <FaCircle size={8} />}
                  </div>
                  <div className={`flex items-center space-x-2 ${window.innerWidth <= 500 ? "mt-2" : ""}`}>
                    <span style={{ color: styleContext.state.textColor }}>
                      {(f.options as BlockOptions).label}
                    </span>
                    {(f.options as BlockOptions).tooltip && (
                      <div className="pb-1">
                        <HelpTooltipClickable
                          tooltip={(f.options as BlockOptions).tooltip as string}
                        />
                      </div>
                    )}
                  </div>
                </button>

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
      </div>
      {flattenedFields[activeStep] !== undefined && rerender && (
        <>
          <div className="flex justify-center mt-6">
            <Field
              parent={flattenedFields[activeStep]}
              context={value}
              validContext={valid}
              general={general}
              field={flattenedFields[activeStep]}
              value={value?.[flattenedFields[activeStep].key]}
              valid={valid?.[flattenedFields[activeStep].key]}
              onChange={(value) => {
                onChange(flattenedFields[activeStep].key, value);
              }}
              onValidChange={(valid: any) => {
                onValidChange(flattenedFields[activeStep].key, valid);
                onValidChange(
                  "$complete",
                  activeStep === flattenedFields.length - 1
                    ? isCompleted(valid)
                    : false
                );
              }}
            />
          </div>
          <div className="flex justify-start mt-6">
            {activeStep > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={`mr-5 px-6 ${
                  styleContext.state.buttonHoverColorWeight === "200"
                    ? "hover:bg-gray-200"
                    : "hover:bg-gray-700"
                }`}
                onClick={() => setPreviousStep(activeStep)}
                style={{ color: styleContext.state.textColor }}
              >
                Anterior <SL className="ml-2">←</SL>
              </Button>
            )}
            {flattenedFields.length > 1 &&
              (activeStep === 0 ||
                activeStep !== flattenedFields.length - 1) && (
                <Button
                  type="button"
                  size="sm"
                  className={`px-6 text-white ${
                    nextStepDisabled ? "opacity-50 cursor-not-allowed" : ""
                  } ${
                    styleContext.state.buttonHoverColorWeight === "200"
                      ? "bg-yellow-600 hover:bg-yellow-700"
                      : "bg-yellow-800 hover:bg-yellow-900"
                  }`}
                  onClick={() => setNextStep(activeStep)}
                  disabled={nextStepDisabled}
                >
                  Próximo{" "}
                  <SL className="ml-2" bg="yellow.500">
                    →
                  </SL>
                </Button>
              )}
          </div>
        </>
      )}
    </div>
  );
};
