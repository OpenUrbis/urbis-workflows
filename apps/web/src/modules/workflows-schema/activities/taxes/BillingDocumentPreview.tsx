import React, { useEffect, useRef, useState } from "react";
import { TaxConfig } from "../../../../api/types/schema";
import JsBarcode from "jsbarcode";
import { IFormContext } from "@open-urbis/types";
import { evalFieldExpression } from "../../form-engine/utils/expressions";

interface BillingDocumentPreviewProps {
  tax: TaxConfig;
  styleContext: any;
  context?: Record<string, any>;
  general?: IFormContext;
}

export const BillingDocumentPreview: React.FC<BillingDocumentPreviewProps> = ({
  tax,
  styleContext,
  context,
  general,
}) => {
  const [processedTemplate, setProcessedTemplate] = useState("");
  const [taxCalculationResult, setTaxCalculationResult] = useState<any>({});
  const barcodeContainerRef = useRef<HTMLDivElement>(null);
  const [barcodeData, setBarcodeData] = useState({
    barcodeValue: "",
    typeableLine: "",
  });

  // Process tax calculation and prepare barcode data
  useEffect(() => {
    // Process tax calculation
    try {
      const functionBody = tax.taxCalculation?.code?.match(
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
  }, [tax, context, general]);

  // Process template with tax calculation data
  useEffect(() => {
    if (!taxCalculationResult) return;

    try {
      const template = tax.billingDocumentTemplate ?? "";

      if (taxCalculationResult) {
        try {
          if (general) {
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
          }
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
  }, [tax, taxCalculationResult, context, general]);

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
            } catch (fallbackError) {
              // Display error message in the container if all attempts fail
              barcodeContainer.innerHTML = `
                <div style="color: red; text-align: center; padding: 20px;">
                  <p>Erro ao gerar código de barras</p>
                  <p style="font-size: 12px;">${error}</p>
                </div>
              `;
            }
          }
        }
      }, 100); // Small delay to ensure the DOM is ready
    }
  }, [processedTemplate, barcodeData]);

  const pdfPageStyle: React.CSSProperties = {
    minWidth: "794px",
    minHeight: "1123px",
    overflow: "auto",
    boxSizing: "border-box",
    backgroundColor: "white",
  };

  return (
    <div
      className={`p-8 py-24 flex justify-center text-black ${
        styleContext.state.backgroundColor === "#f5f5f5"
          ? "bg-gray-200"
          : "bg-gray-800"
      }`}
    >
      <div className="w-[794px] mx-auto bg-white text-black shadow-lg">
        <div style={pdfPageStyle}>
          <div dangerouslySetInnerHTML={{ __html: processedTemplate }} />
          <div ref={barcodeContainerRef} style={{ display: "none" }}></div>
        </div>
      </div>
    </div>
  );
};
