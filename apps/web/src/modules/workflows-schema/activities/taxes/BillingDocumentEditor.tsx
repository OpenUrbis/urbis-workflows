import React from "react";
import { CodeEditor } from "../../components/CodeEditor";
import { TaxConfig } from "../../../../api/types/schema";

interface BillingDocumentEditorProps {
  tax: TaxConfig;
  styleContext: any;
  onChangeBillingTemplate: (template: string) => void;
}

export const BillingDocumentEditor: React.FC<BillingDocumentEditorProps> = ({
  tax,
  styleContext,
  onChangeBillingTemplate,
}) => {
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
        Edite o template HTML do documento de cobrança. Use a tag{" "}
        {`\${renderBarCode}`} para inserir o código de barras.
      </div>
      <CodeEditor
        value={tax.billingDocumentTemplate ?? ""}
        onChange={onChangeBillingTemplate}
        language="html"
        height="70vh"
      />
    </div>
  );
};
