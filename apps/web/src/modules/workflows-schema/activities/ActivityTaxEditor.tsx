import { useContext, useState } from "react";
import { IFormContext } from "@open-urbis/types";
import {
  FormControl,
  FormHelperText,
  FormLabel,
  IconButton,
  Tooltip,
} from "../../../components";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@open-urbis/map-ui";
import { FaPlus, FaTrash, FaFileInvoiceDollar } from "react-icons/fa";
import {
  ActivityTypeEnum,
  TaxTemplate,
  ActivityTemplate,
  SeiIntegrationActivityConfig,
} from "../../../api/types/schema";
import { StyleContext } from "../../../reducers";
import { SeiDocumentTypeSelector } from "../components/SeiDocumentTypeSelector";
import { ProtocolIntegrations } from "../../../types/global";
import {
  defaultTaxLogic,
  TaxCalculationEditor,
} from "./taxes/TaxCalculationEditor";
import { BillingDocumentEditor } from "./taxes/BillingDocumentEditor";
import { BillingDocumentPreview } from "./taxes/BillingDocumentPreview";
import { Input, Textarea } from "../../../components";

interface TaxActivityEditorProps {
  activity: ActivityTemplate;
  context?: Record<string, any>;
  general: IFormContext;
  onChange: (value: { template: TaxTemplate }) => void;
  /** When set, show SEI document type selector for sync; uses schema integrations as fallback */
  integrationsSei?: ProtocolIntegrations["sei"];
  seiIntegration?: SeiIntegrationActivityConfig;
  onSeiIntegrationChange?: (config: SeiIntegrationActivityConfig | undefined) => void;
}

export const ActivityTaxEditor: React.FC<TaxActivityEditorProps> = ({
  activity,
  context,
  general,
  onChange,
  integrationsSei,
  seiIntegration,
  onSeiIntegrationChange,
}) => {
  const [selectedTaxId, setSelectedTaxId] = useState<string>("");
  const [selectedTab, setSelectedTab] = useState("calculation");
  const styleContext = useContext(StyleContext);

  if (activity.type !== ActivityTypeEnum.TAX) {
    return null;
  }

  const template = activity.template as TaxTemplate;
  const taxes = template.taxes || [];

  const handleChangeTaxField = (field: string, newValue: string) => {
    const newTaxes = taxes.map((tax) =>
      tax.id === selectedTaxId ? { ...tax, [field]: newValue } : tax
    );
    onChange({ template: { ...template, taxes: newTaxes } });
  };

  const handleChangeTaxCalculation = (newLogic: string) => {
    const newTaxes = taxes.map((tax) =>
      tax.id === selectedTaxId
        ? {
            ...tax,
            taxCalculation: {
              ...tax.taxCalculation,
              code: newLogic,
            },
          }
        : tax
    );
    onChange({ template: { ...template, taxes: newTaxes } });
  };

  const handleAddTax = () => {
    const newTax = {
      id: crypto.randomUUID(),
      label: "Nova Taxa",
      documentation: "Descrição da taxa",
      namespace: "tax.new",
      taxCalculation: {
        id: crypto.randomUUID(),
        label: "Novo cálculo de Taxa",
        namespace: "tax.calc.new",
        documentation: "Descrição do cálculo da taxa",
        code: defaultTaxLogic,
      },
      generateInvoiceCallback: {
        id: crypto.randomUUID(),
        callback: {
          id: crypto.randomUUID(),
          label: "Novo callback de Taxa",
          namespace: "tax.callback.new",
          documentation: "Descrição do callback da taxa",
          code: "function call() {}",
        },
      },
      checkPaymentCallback: {
        id: crypto.randomUUID(),
        callback: {
          id: crypto.randomUUID(),
          label: "Novo callback de Pagamento",
          namespace: "tax.callback.payment.new",
          documentation: "Descrição do callback de pagamento da taxa",
          code: "function call() {}",
        },
      },
    };
    onChange({ template: { ...template, taxes: [...taxes, newTax] } });
    setSelectedTaxId(newTax.id);
  };

  const handleRemoveTax = async (id: string) => {
    const response = await confirmation(
      "Tem certeza que deseja remover esta taxa?"
    );

    if (!response) {
      return;
    }

    setSelectedTaxId("");
    onChange({
      template: { ...template, taxes: taxes.filter((tax) => tax.id !== id) },
    });
  };

  const handleChangeBillingTemplate = (newTemplate: string) => {
    const newTaxes = taxes.map((tax) =>
      tax.id === selectedTaxId
        ? { ...tax, billingDocumentTemplate: newTemplate }
        : tax
    );
    onChange({ template: { ...template, taxes: newTaxes } });
  };

  const selectedTax = taxes.find((tax) => tax.id === selectedTaxId);

  return (
    <div className="flex flex-col w-full">
      {integrationsSei?.IdUnidade &&
        integrationsSei?.IdTipoProcedimento &&
        onSeiIntegrationChange != null && (
        <div className="mb-6 p-4 rounded-lg border bg-muted/30">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Sincronização SEI
          </h3>
          <SeiDocumentTypeSelector
            label="Tipo de documento no SEI (boleto)"
            value={seiIntegration?.IdSerie}
            onChange={(idSerie) =>
              onSeiIntegrationChange(
                idSerie != null ? { IdSerie: idSerie } : undefined
              )
            }
            integrationsSei={integrationsSei}
            fallbackKey="TaxDocumentIdSerie"
          />
        </div>
      )}
      <div className="flex mb-8">
        <div className="w-1/4 border-r pr-4">
          <h2
            className="text-xl font-bold mb-4"
            style={{ color: styleContext.state.textColor }}
          >
            Taxas
          </h2>
          <div className="space-y-2">
            {taxes
              .sort((a, b) => a.label.localeCompare(b.label))
              .map((tax) => (
                <div
                  key={tax.id}
                  className={`p-3 border rounded-xl cursor-pointer flex justify-between items-center group transition-colors duration-150`}
                  onClick={() => setSelectedTaxId(tax.id)}
                  style={{
                    backgroundColor:
                      tax.id === selectedTaxId
                        ? styleContext.state.buttonHoverColorWeight === "200"
                          ? "#E5E7EB"
                          : "#374151"
                        : styleContext.state.backgroundColor,
                    borderColor:
                      styleContext.state.buttonHoverColorWeight === "200"
                        ? "#E5E7EB"
                        : "#374151",
                    color: styleContext.state.textColor,
                  }}
                  onMouseEnter={(e) => {
                    if (selectedTaxId !== tax.id) {
                      e.currentTarget.style.backgroundColor =
                        styleContext.state.buttonHoverColorWeight === "200"
                          ? "#F3F4F6"
                          : "#4B5563";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedTaxId !== tax.id) {
                      e.currentTarget.style.backgroundColor =
                        styleContext.state.backgroundColor;
                    }
                  }}
                >
                  <div className="flex flex-col">
                    <div className="font-medium">
                      {tax.label || "Sem título"}
                    </div>
                    <div className="text-sm text-gray-500">
                      {tax.namespace || "Sem namespace"}
                    </div>
                  </div>
                  <IconButton
                    aria-label="Remover taxa"
                    icon={<FaTrash />}
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      handleRemoveTax(tax.id);
                    }}
                    style={{
                      backgroundColor:
                        styleContext.state.buttonHoverColorWeight === "200"
                          ? "#F3F4F6"
                          : "#4B5563",
                      color: styleContext.state.textColor,
                    }}
                  />
                </div>
              ))}
          </div>
          <div className="mt-4">
            <button
              onClick={handleAddTax}
              className="w-full px-4 py-2.5 rounded-lg flex items-center justify-center space-x-2 transition-colors duration-150 font-medium bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <FaPlus size={14} />
              <span>Taxa</span>
            </button>
          </div>
        </div>

        <div className="w-3/4 pl-4">
          {selectedTaxId && selectedTax && (
            <div className="grid grid-cols-2 gap-6">
              <FormControl>
                <FormLabel style={{ color: styleContext.state.textColor }}>
                  ID
                </FormLabel>
                <Tooltip label="Identificador único do tipo de taxa">
                  <Input value={selectedTaxId} size="lg" readOnly />
                </Tooltip>
                <FormHelperText style={{ color: styleContext.state.textColor }}>
                  Identificador único para este tipo de taxa
                </FormHelperText>
              </FormControl>

              <FormControl>
                <FormLabel style={{ color: styleContext.state.textColor }}>
                  Nome
                </FormLabel>
                <Input
                  value={selectedTax.label || ""}
                  onChange={(e) =>
                    handleChangeTaxField("label", e.target.value)
                  }
                  placeholder="Ex: Taxa de Serviço"
                  size="lg"
                />
                <FormHelperText style={{ color: styleContext.state.textColor }}>
                  Nome descritivo para este tipo de taxa
                </FormHelperText>
              </FormControl>

              <FormControl>
                <FormLabel style={{ color: styleContext.state.textColor }}>
                  Namespace
                </FormLabel>
                <Input
                  value={selectedTax.namespace || ""}
                  onChange={(e) =>
                    handleChangeTaxField("namespace", e.target.value)
                  }
                  placeholder="Ex: tax.service"
                  size="lg"
                />
                <FormHelperText style={{ color: styleContext.state.textColor }}>
                  Identificador único para este tipo de taxa
                </FormHelperText>
              </FormControl>

              <FormControl>
                <FormLabel style={{ color: styleContext.state.textColor }}>
                  Documentação
                </FormLabel>
                <Textarea
                  value={selectedTax.documentation || ""}
                  onChange={(e) =>
                    handleChangeTaxField("documentation", e.target.value)
                  }
                  placeholder="Descreva o propósito desta taxa..."
                  size="lg"
                  rows={4}
                />
                <FormHelperText style={{ color: styleContext.state.textColor }}>
                  Descrição detalhada do propósito desta taxa
                </FormHelperText>
              </FormControl>
            </div>
          )}
          {!selectedTaxId && (
            <div className="flex flex-col mt-4 items-center justify-center min-h-[220px] text-gray-500">
              <FaFileInvoiceDollar size={36} className="mb-3 opacity-50" />
              <p
                className="text-lg font-medium mb-1"
                style={{ color: styleContext.state.textColor }}
              >
                Nenhuma taxa selecionada
              </p>
              <p
                className="text-sm mb-4"
                style={{ color: styleContext.state.textColor }}
              >
                Selecione uma taxa da lista ao lado ou crie uma nova
              </p>
              <button
                onClick={handleAddTax}
                className="px-4 py-2.5 rounded-lg flex items-center justify-center space-x-2 transition-colors duration-150 font-medium bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <FaPlus size={14} />
                <span>Taxa</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {selectedTaxId && selectedTax && (
        <div
          style={{ backgroundColor: styleContext.state.backgroundColor }}
          className="rounded-lg"
        >
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList
              className="border-b px-4"
              style={{
                borderColor:
                  styleContext.state.buttonHoverColorWeight === "200"
                    ? "#E5E7EB"
                    : "#374151",
                backgroundColor: "transparent",
              }}
            >
              <TabsTrigger
                value="calculation"
                style={{ color: styleContext.state.textColor }}
              >
                Cálculo da Taxa
              </TabsTrigger>
              <TabsTrigger
                value="document-editor"
                style={{ color: styleContext.state.textColor }}
              >
                Editor do Documento
              </TabsTrigger>
              <TabsTrigger
                value="document-preview"
                style={{ color: styleContext.state.textColor }}
              >
                Prévia do Documento
              </TabsTrigger>
            </TabsList>

            <TabsContent value="calculation">
              <TaxCalculationEditor
                tax={selectedTax}
                context={context}
                general={general}
                styleContext={styleContext}
                onChangeTaxCalculation={handleChangeTaxCalculation}
              />
            </TabsContent>
            <TabsContent value="document-editor">
              <BillingDocumentEditor
                tax={selectedTax}
                styleContext={styleContext}
                onChangeBillingTemplate={handleChangeBillingTemplate}
              />
            </TabsContent>
            <TabsContent value="document-preview">
              <BillingDocumentPreview
                tax={selectedTax}
                styleContext={styleContext}
                context={context}
                general={general}
              />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};
