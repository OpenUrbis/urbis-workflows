import React, { useState } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { CodeEditor } from "../../components/CodeEditor";
import { TaxConfig } from "../../../../api/types/schema";
import { IFormContext } from "@open-urbis/types";
import {
  FormControl,
  FormHelperText,
  FormLabel,
  IconButton,
} from "../../../../components";

interface TaxCalculationEditorProps {
  tax: TaxConfig;
  context?: Record<string, any>;
  general: IFormContext;
  styleContext: any;
  onChangeTaxCalculation: (code: string) => void;
}

export const defaultTaxLogic = `/**
 * Função para cálculo de taxa
 * @param {Object} context - Contexto do formulário atual
 * @param {Object} $data - Dados globais do formulário
 * @param {Object} $modules - Módulos de código disponíveis
 * @param {Object} $user - Informações do usuário atual
 * @param {Object} $variables - Variáveis do ambiente
 * @param {string} $state - Estado atual do formulário
 * @returns {Object} Objeto com os detalhes da taxa
 */
function calculateTax(context, $data, $modules, $user, $variables, $state) {
  // Exemplo de cálculo de taxa
  return {
    value: 100.00,
    description: "Taxa de exemplo",
    details: {
      baseValue: 100.00,
      adjustments: [],
      total: 100.00
    }
  };
}`;

export const TaxCalculationEditor: React.FC<TaxCalculationEditorProps> = ({
  tax,
  context = {},
  general,
  styleContext,
  onChangeTaxCalculation,
}) => {
  const [mockData, setMockData] = useState("{}");
  const [previewResult, setPreviewResult] = useState("");
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const [showWarnings, setShowWarnings] = useState(false);

  const errors = validationErrors.filter((error) => error.severity === 8);
  const warnings = validationErrors.filter((error) => error.severity !== 8);

  const alertRowStyle = (variant: "error" | "warning") => {
    const isLight = styleContext.state.buttonHoverColorWeight === "200";
    if (variant === "error") {
      return {
        backgroundColor: isLight ? "#fee2e2" : "#7f1d1d",
        color: isLight ? "#991b1b" : "#fecaca",
      };
    }
    return {
      backgroundColor: isLight ? "#fef3c7" : "#78350f",
      color: isLight ? "#92400e" : "#fef3c7",
    };
  };

  const handleValidate = (errors: any[]) => {
    setValidationErrors(errors);
  };

  const handlePreview = () => {
    try {
      const evalContext = {
        ...context,
        ...JSON.parse(mockData),
      };

      const functionBody = tax?.taxCalculation?.code?.match(
        /function\s+calculateTax\s*\([^)]*\)\s*{([\s\S]*)}/
      )?.[1];

      if (!functionBody) {
        throw new Error("Could not find calculateTax function in the code");
      }

      // eslint-disable-next-line no-new-func
      const calculateTax = new Function(
        "context",
        "$data",
        "$modules",
        "$user",
        "$variables",
        "$state",
        `${functionBody}
        return calculateTax(context, $data, $modules, $user, $variables, $state);`
      );

      const result = calculateTax(
        evalContext,
        general.$data,
        general.$modules,
        general.$user,
        general.$variables,
        general.$state
      );

      setPreviewResult(JSON.stringify(result, null, 2));
    } catch (error: any) {
      setPreviewResult(
        JSON.stringify({ error: error.message }, null, 2)
      );
    }
  };

  return (
    <div className="flex flex-col space-y-2">
      <div
        className="text-sm mb-2"
        style={{
          color:
            styleContext.state.buttonHoverColorWeight === "200"
              ? "#4B5563"
              : "#9CA3AF",
        }}
      >
        Escreva uma função JavaScript que recebe o contexto do formulário e
        retorna um objeto com os detalhes da taxa.
      </div>
      <CodeEditor
        value={tax.taxCalculation.code || defaultTaxLogic}
        onChange={onChangeTaxCalculation}
        language="javascript"
        height="40vh"
        onValidate={handleValidate}
      />
      {validationErrors.length > 0 && (
        <div className="mt-2 space-y-2">
          {errors.map((error, index) => (
            <div
              key={`error-${index}`}
              className="flex items-center gap-2 px-3 py-2 rounded-md"
              style={alertRowStyle("error")}
            >
              <div className="h-2 w-2 rounded-full bg-current opacity-60" />
              Erro na linha {error.startLineNumber}: {error.message}
            </div>
          ))}

          {warnings.length > 0 && (
            <div>
              <div
                className="cursor-pointer flex items-center gap-2 px-3 py-2 rounded-md"
                onClick={() => setShowWarnings(!showWarnings)}
                style={alertRowStyle("warning")}
              >
                <div className="h-2.5 w-2.5 rounded-full bg-current opacity-60" />
                <div className="flex-grow">
                  {warnings.length} {warnings.length === 1 ? "aviso" : "avisos"}{" "}
                  encontrado{warnings.length === 1 ? "" : "s"}
                </div>
                <IconButton
                  aria-label="Toggle warnings"
                  icon={showWarnings ? <FaChevronUp /> : <FaChevronDown />}
                  style={{ color: styleContext.state.textColor }}
                />
              </div>
              {showWarnings && (
                <div className="pl-4 mt-2 space-y-2">
                  {warnings.map((warning, index) => (
                    <div
                      key={`warning-${index}`}
                      className="flex items-center gap-2 px-3 py-2 rounded-md"
                      style={alertRowStyle("warning")}
                    >
                      <div className="h-2 w-2 rounded-full bg-current opacity-60" />
                      Linha {warning.startLineNumber}: {warning.message}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col space-y-4 mt-6">
        <div className="flex flex-col space-y-4">
          <FormControl>
            <FormLabel style={{ color: styleContext.state.textColor }}>
              Dados de Teste (context)
            </FormLabel>
            <CodeEditor
              value={mockData}
              onChange={setMockData}
              language="json"
              height="15vh"
            />
            <FormHelperText style={{ color: styleContext.state.textColor }}>
              Dados de exemplo que serão acessados em context. Ex:{" "}
              {"{ taxa: 1 }"} será acessado como context.taxa
            </FormHelperText>
          </FormControl>
          <div className="flex justify-end">
            <button
              disabled={errors.length > 0}
              onClick={handlePreview}
              className="px-4 py-2.5 rounded-lg flex items-center justify-center space-x-2 transition-colors duration-150 font-medium"
              style={{
                backgroundColor:
                  styleContext.state.buttonHoverColorWeight === "200"
                    ? "#ca8a04"
                    : "#854d0e",
                color: "#ffffff",
                opacity: errors.length > 0 ? 0.5 : 1,
                cursor: errors.length > 0 ? "not-allowed" : "pointer",
              }}
              onMouseEnter={(e) => {
                if (errors.length === 0) {
                  e.currentTarget.style.backgroundColor =
                    styleContext.state.buttonHoverColorWeight === "200"
                      ? "#a16207"
                      : "#713f12";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor =
                  styleContext.state.buttonHoverColorWeight === "200"
                    ? "#ca8a04"
                    : "#854d0e";
              }}
            >
              Testar Cálculo
            </button>
          </div>
        </div>

        <div className="flex flex-col space-y-2">
          <FormLabel style={{ color: styleContext.state.textColor }}>
            Resultado do Cálculo
          </FormLabel>
          <CodeEditor
            value={previewResult}
            onChange={() => {}}
            language="json"
            height="30vh"
            readOnly
          />
        </div>
      </div>
    </div>
  );
};
