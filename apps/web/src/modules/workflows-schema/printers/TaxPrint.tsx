import { useLocation, useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { IFormContext } from "@open-urbis/types";
import JsBarcode from "jsbarcode";
import { evalFieldExpression } from "../form-engine/utils/expressions";
import { ApiClient } from "../../../api";
import { WorkflowVersionResponse } from "../../../api/types/workflows-schema.dto";
import { FindOneWorkflowResponse } from "../../../api/types/workflows.dto";
import { ActivityTypeEnum, TaxTemplate } from "../../../api/types/schema";

const apiClient = new ApiClient({
  baseURL: process.env.REACT_APP_BACK_END_API || "",
  headers: {
    authorization: `Bearer ${localStorage.getItem("token") || ""}`,
  },
});

export const TaxPrint = (): JSX.Element => {
  const { id, taxId } = useParams();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const version = searchParams.get("version");
  const [processedTemplate, setProcessedTemplate] = useState("");
  const [taxCalculationResult, setTaxCalculationResult] = useState<any>({});
  const [context, setContext] = useState<any>({});
  const [general, setGeneral] = useState<IFormContext>();
  const [isBarcodeLoaded, setIsBarcodeLoaded] = useState(false);
  const [selectedTax, setSelectedTax] = useState<any>(null);
  const [barcodeData, setBarcodeData] = useState({
    barcodeValue: "",
    typeableLine: "",
  });
  const barcodeContainerRef = useRef<HTMLDivElement>(null);

  const fetchWorkflow = async () => {
    try {
      if (!id) return;

      let response: WorkflowVersionResponse | FindOneWorkflowResponse;

      if (version) {
        // Fetch specific version
        response = await apiClient.workflowsSchema.findOneVersion(id, version);
      } else {
        // Fetch latest version
        response = await apiClient.workflows.findOneApi(id);
      }

      // Find tax activities in the schema
      const taxActivities = response.schema.activities.filter(
        (activity) => activity.type === ActivityTypeEnum.TAX
      );

      if (taxActivities.length === 0) {
        console.error("No tax activities found in the workflow");
        return;
      }

      // Find the specific tax by taxId or use the first one
      let selectedTaxConfig;

      if (taxId) {
        // Look for the specific tax in all tax activities
        for (const activity of taxActivities) {
          const taxTemplate = activity.template as TaxTemplate;
          if (!taxTemplate.taxes) continue;

          const foundTax = taxTemplate.taxes.find((tax) => tax.id === taxId);
          if (foundTax) {
            selectedTaxConfig = foundTax;
            break;
          }
        }
      } else {
        // Use the first tax from the first tax activity
        const firstTaxActivity = taxActivities[0];
        const taxTemplate = firstTaxActivity.template as TaxTemplate;
        selectedTaxConfig = taxTemplate.taxes?.[0];
      }

      if (!selectedTaxConfig) {
        console.error("No tax found in the tax activity");
        return;
      }

      setSelectedTax(selectedTaxConfig);

      // Set context and general data
      if ("value" in response) {
        // It's a FindOneWorkflowResponse
        setContext(response.value || {});
        setGeneral({
          $data: response.value || {},
          $modules: {},
          $variables: {},
          $user: undefined,
          $state: "view",
          $tree: {},
        });
      } else {
        // It's a WorkflowVersionResponse
        setContext({});
        setGeneral({
          $data: {},
          $modules: {},
          $variables: {},
          $user: undefined,
          $state: "view",
          $tree: {},
        });
      }
    } catch (e) {
      console.error("Error fetching workflow:", e);
    }
  };

  // Process tax calculation and prepare barcode data
  useEffect(() => {
    if (!selectedTax || !context || !general) return;

    // Process tax calculation
    try {
      const functionBody = selectedTax.taxCalculation?.code?.match(
        /function\s+calculateTax\s*\([^)]*\)\s*{([\s\S]*)}/
      )?.[1];

      if (!functionBody) {
        setTaxCalculationResult({});
      } else {
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
          context,
          general?.$data ?? {},
          general?.$modules ?? {},
          general?.$user ?? {},
          general?.$variables ?? {},
          general?.$state ?? ""
        );

        setTaxCalculationResult(result);
      }
    } catch (error: any) {
      console.error("Error calculating tax:", error);
      setTaxCalculationResult({});
    }

    // Prepare barcode data with fixed value
    try {
      // Create a valid mock barcode with 44 digits (required for ITF format)
      const formattedValue = (685)
        .toFixed(2)
        .replace(".", "")
        .padStart(10, "0");

      // Mock barcode data with fixed values for preview
      // Format: Bank(3) + Currency(1) + DV(1) + Factor(4) + Value(10) + Free field(25)
      // Make sure the total length is 44 digits (even number required for ITF)
      const mockBarcodeData = `34191${formattedValue}12345678901234567890123456`;

      // Mock typeable line for display
      // Format: AAABC.DEFGG HHHHH.IJKLM NNNNN.OPQRS T UUUUVVVVVVVVVV
      const mockTypeableLine = `34191.12345 67890.123456 78901.234567 1 ${formattedValue}`;

      setBarcodeData({
        barcodeValue: mockBarcodeData,
        typeableLine: mockTypeableLine,
      });
    } catch (error) {
      console.log("Error preparing barcode data:", error);
    }
  }, [selectedTax, context, general]);

  // Process template with tax calculation data
  useEffect(() => {
    if (!selectedTax || !taxCalculationResult || !general) return;

    try {
      const template = selectedTax.billingDocumentTemplate ?? "";

      if (taxCalculationResult) {
        try {
          const result = evalFieldExpression(
            `\`${template?.replace(
              /\${renderBarCode}/g,
              '<div id="barcode-container"></div>'
            )}\``,
            { ...context, $tax: taxCalculationResult },
            general,
            {}
          );

          setProcessedTemplate(result ?? "");
        } catch (error) {
          console.log(`Error evaluating expression ${template}:`, error);
        }
      }
    } catch (error) {
      console.log("Error processing template:", error);
      setProcessedTemplate(
        `<div class="error">Erro ao processar o template: ${error}</div>`
      );
    }
  }, [selectedTax, taxCalculationResult, context, general]);

  // Render barcode after the template is processed
  useEffect(() => {
    if (barcodeData.barcodeValue && processedTemplate) {
      setTimeout(() => {
        const barcodeContainer = document.getElementById("barcode-container");
        if (barcodeContainer) {
          try {
            // Clear previous content
            barcodeContainer.innerHTML = "";

            // Add a wrapper div for centering
            const wrapperDiv = document.createElement("div");
            wrapperDiv.style.display = "flex";
            wrapperDiv.style.flexDirection = "column";
            wrapperDiv.style.alignItems = "center";
            wrapperDiv.style.justifyContent = "center";
            wrapperDiv.style.width = "100%";
            wrapperDiv.style.margin = "20px 0";
            barcodeContainer.appendChild(wrapperDiv);

            // Create SVG element for barcode
            const svgElement = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "svg"
            );
            wrapperDiv.appendChild(svgElement);

            // For ITF format, ensure we have an even number of digits
            // and all characters are numeric
            let barcodeValue = barcodeData.barcodeValue;

            // Ensure all characters are numeric
            barcodeValue = barcodeValue.replace(/[^0-9]/g, "");

            // Add a leading zero if needed to make it even length
            if (barcodeValue.length % 2 !== 0) {
              barcodeValue = "0" + barcodeValue;
            }

            // Try CODE128 format which is more flexible
            JsBarcode(svgElement, barcodeValue, {
              format: "CODE128",
              width: 2,
              height: 80,
              displayValue: false,
              margin: 10,
            });

            // Add barcode number below
            const barcodeNumber = document.createElement("div");
            barcodeNumber.className = "barcode-number";
            barcodeNumber.textContent = barcodeData.typeableLine;
            barcodeNumber.style.textAlign = "center";
            barcodeNumber.style.width = "100%";
            barcodeNumber.style.marginTop = "10px";
            barcodeNumber.style.fontFamily = "monospace";
            barcodeNumber.style.fontSize = "14px";
            wrapperDiv.appendChild(barcodeNumber);

            setIsBarcodeLoaded(true);
          } catch (error) {
            console.error("Error generating barcode:", error);

            // If CODE128 fails, try a fallback to CODE39 which is very reliable
            try {
              // Clear previous content
              barcodeContainer.innerHTML = "";

              // Add a wrapper div for centering
              const wrapperDiv = document.createElement("div");
              wrapperDiv.style.display = "flex";
              wrapperDiv.style.flexDirection = "column";
              wrapperDiv.style.alignItems = "center";
              wrapperDiv.style.justifyContent = "center";
              wrapperDiv.style.width = "100%";
              wrapperDiv.style.margin = "20px 0";
              barcodeContainer.appendChild(wrapperDiv);

              const svgElement = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "svg"
              );
              wrapperDiv.appendChild(svgElement);

              JsBarcode(
                svgElement,
                barcodeData.typeableLine.replace(/\s/g, ""),
                {
                  format: "CODE39",
                  width: 1.5,
                  height: 80,
                  displayValue: false,
                  margin: 10,
                }
              );

              // Add barcode number below
              const barcodeNumber = document.createElement("div");
              barcodeNumber.className = "barcode-number";
              barcodeNumber.textContent = barcodeData.typeableLine;
              barcodeNumber.style.textAlign = "center";
              barcodeNumber.style.width = "100%";
              barcodeNumber.style.marginTop = "10px";
              barcodeNumber.style.fontFamily = "monospace";
              barcodeNumber.style.fontSize = "14px";
              wrapperDiv.appendChild(barcodeNumber);

              setIsBarcodeLoaded(true);
            } catch (fallbackError) {
              // Display error message in the container if all attempts fail
              barcodeContainer.innerHTML = `
                <div style="color: red; text-align: center; padding: 20px;">
                  <p>Erro ao gerar código de barras</p>
                  <p style="font-size: 12px;">${error}</p>
                </div>
              `;
              setIsBarcodeLoaded(true); // Set to true even on error to allow printing
            }
          }
        }
      }, 100); // Small delay to ensure the DOM is ready
    }
  }, [processedTemplate, barcodeData]);

  useEffect(() => {
    fetchWorkflow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, version, taxId]);

  const element = document.querySelector("div.enabled");

  if (element) {
    element.parentNode?.removeChild(element);
  }

  const pdfPageStyle: React.CSSProperties = {
    minWidth: "794px",
    minHeight: "1123px",
    overflow: "auto",
    boxSizing: "border-box",
    backgroundColor: "white",
  };

  const watermarkStyle: React.CSSProperties = {
    position: "absolute",
    width: "100%",
    height: "100%",
    top: 0,
    left: 0,
    pointerEvents: "none",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "5em",
    color: "rgba(200, 200, 200, 0.5)",
    transform: "rotate(-45deg)",
    zIndex: 9999,
  };

  const WORKFLOW_STATUS_WATERMARK: any = {
    WAITING_ACCEPTANCE: "AGUARDANDO ACEITE",
    WAITING_TAX_PAYMENT: "AGUARDANDO PAGAMENTO",
    APOSTILLED: "APOSTILADO",
  };

  // Get the status from the context if available
  const documentStatus = context?.status || "";

  const isAllLoaded = isBarcodeLoaded;

  if (!selectedTax) {
    return <></>;
  }

  return (
    <div id={isAllLoaded ? "waitNoMore" : undefined} style={pdfPageStyle}>
      <div style={watermarkStyle}>
        {WORKFLOW_STATUS_WATERMARK[documentStatus] ?? ""}
      </div>

      <main className="flex flex-col space-y-4 px-6">
        <div dangerouslySetInnerHTML={{ __html: processedTemplate }} />
        <div ref={barcodeContainerRef} style={{ display: "none" }}></div>
      </main>
    </div>
  );
};
