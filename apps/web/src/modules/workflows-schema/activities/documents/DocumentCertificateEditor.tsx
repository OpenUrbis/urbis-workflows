import EditableHeader from "../../../../components/EditableHeader";
import { DocumentConfig } from "../../../../api/types/schema";
import { useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { useContext, useRef } from "react";
import { StyleContext } from "../../../../reducers/style.reducer";

import DPHLogo from "../../../../assets/DPH.png";

export type DocumentCertificateEditorProps = {
  doc?: DocumentConfig;
  onChange?: (value: any) => void;
  value?: any;
  showPreview?: boolean;
};

// Tipo auxiliar: força que layout exista
type DocumentWithLayout = DocumentConfig & {
  layout: NonNullable<DocumentConfig["layout"]>;
};

// Documento padrão
const defaultDoc: DocumentWithLayout = {
  id: "debug-document",
  type: "document",
  label: "Documento de teste",
  documentation: "",
  layout: {
    logo: "/logo_name.png",
    headerTitle: "Prefeitura de São Paulo",
    headerDescription: "Secretaria de Governo Municipal",
    qrcode: "",
    title: "Novo Documento",
    description: "Descrição do documento",
    blocks: [],
  },
  template: "<p>Conteúdo do documento</p>",
};

const DocumentCertificateEditor = ({
  doc,
  onChange,
  value,
  showPreview = false,
}: DocumentCertificateEditorProps): JSX.Element => {
  const { id } = useParams<{ id: string }>();
  const styleContext = useContext(StyleContext);
  const qrCodeRef = useRef<SVGSVGElement>(null);

  function getQRCodeUrl() {
    const baseUrl = window.location.origin;
    const isNewWorkflow = id === "new";
    return isNewWorkflow
      ? `${baseUrl}/workflows-schema`
      : `${baseUrl}/workflows-schema/${id ?? "new"}`;
  }

  const safeDoc: DocumentWithLayout = {
    ...defaultDoc,
    ...(doc ?? {}),
    layout: {
      ...defaultDoc.layout,
      ...(doc?.layout ?? {}),
      qrcode: doc?.layout?.qrcode || getQRCodeUrl(),
    },
  };

  const safeOnChange = onChange ?? (() => {});
  const safeValue = value ?? {};

  return (
    <div
      className={`p-8 py-24 flex justify-center text-black ${
        styleContext?.state?.backgroundColor === "#f5f5f5"
          ? "bg-gray-200"
          : "bg-gray-800"
      }`}
    >
      <div className="w-[210mm] h-[297mm] mx-auto bg-white shadow-lg overflow-auto relative">
        <div className="p-6 pb-24">
          {!showPreview && (
            <div className="flex flex-col space-y-4">
              {/* Cabeçalho */}
              <header className="flex items-center justify-between space-y-4 mb-6">
                <div>
                  <img src={safeDoc.layout.logo} width="125px" alt="city logo" />
                </div>
                <div
                  className="flex flex-col text-center mx-auto"
                  style={{ maxWidth: "300px" }}
                >
                  <EditableHeader
                    value={safeDoc.layout.headerTitle || "Prefeitura de São Paulo"}
                    onTextChange={(text: string) => {
                      safeDoc.layout.headerTitle = text;
                      safeOnChange({ ...safeValue });
                    }}
                    className="font-black text-xl"
                  />
                  <EditableHeader
                    value={safeDoc.layout.headerDescription || "Secretaria de Governo Municipal"}
                    onTextChange={(text: string) => {
                      safeDoc.layout.headerDescription = text;
                      safeOnChange({ ...safeValue });
                    }}
                    className="text-center"
                  />
                </div>
                <div>
                  <QRCodeSVG
                    ref={qrCodeRef}
                    value={safeDoc.layout.qrcode || getQRCodeUrl()}
                    size={100}
                    level="H"
                    marginSize={0}
                  />
                </div>
                
              </header>

              {/* Corpo */}
              <main className="flex flex-col" style={{ marginTop: "0px" }}>
                <div className="flex flex-col justify-center text-center text-lg">
                  <EditableHeader
                    value={safeDoc.layout.title || "Novo Documento"}
                    onTextChange={(text: string) => {
                      safeDoc.layout.title = text;
                      safeOnChange({ ...safeValue });
                    }}
                    className="justify-center text-center font-bold"
                  />
                  <EditableHeader
                    value={safeDoc.layout.description || "Descrição do documento"}
                    onTextChange={(text: string) => {
                      safeDoc.layout.description = text;
                      safeOnChange({ ...safeValue });
                    }}
                    className="justify-center text-center"
                  />
                </div>

                <div className="mb-4 mt-8">
                  <h3 className="text-lg font-medium mb-2">Editor HTML</h3>
                  <textarea
                    value={safeDoc.template || ""}
                    onChange={(e) => {
                      safeDoc.template = e.target.value;
                      safeOnChange({ ...safeValue });
                    }}
                    className="w-full h-48 p-2 border rounded font-mono text-sm"
                  />
                </div>
              </main>
            </div>
          )}

          {showPreview && (
            <div className="flex flex-col">
              <header className="flex items-center justify-between space-y-4 mb-6">
                <div>
                  <img src={safeDoc.layout.logo} width="125px" alt="city logo" />
                </div>
                <div
                  className="flex flex-col text-center mx-auto"
                  style={{ maxWidth: "300px" }}
                >
                  <span className="font-black text-xl">
                    {safeDoc.layout.headerTitle}
                  </span>
                  <span
                    dangerouslySetInnerHTML={{
                      __html: safeDoc.layout.headerDescription || "",
                    }}
                  />
                </div>
                <div>
                  <QRCodeSVG
                    ref={qrCodeRef}
                    value={safeDoc.layout.qrcode || getQRCodeUrl()}
                    size={100}
                    level="H"
                    marginSize={0}
                  />
                </div>
              </header>

              <main className="flex flex-col space-y-6">
                <div className="flex flex-col justify-center text-center text-lg mb-6">
                  <span className="font-bold">{safeDoc.layout.title}</span>
                  <span>{safeDoc.layout.description}</span>
                </div>

                <div
                  className="mt-8"
                  dangerouslySetInnerHTML={{ __html: safeDoc.template || "" }}
                />
              </main>
            </div>
          )}
        </div>

        {/* Rodapé fixo */}
        <footer className="absolute bottom-0 left-0 right-0 border-t px-6 py-3 text-xs text-gray-600 bg-white">
          <div className="flex items-center justify-between gap-4 w-full">
            {/* Logo DPH */}
            <div className="flex items-center">
              <img
                src={DPHLogo}
                alt="DPH"
                className="h-[115px] object-contain opacity-70"
                style={{ filter: "grayscale(100%)" }}
              />
            </div>

            {/* Endereço */}
            <div className="text-center text-xs leading-snug">
              Rua Líbero Badaró, 346 - Centro <br />
              CEP: 01002-010 <br />
              (11) 3397-0000
            </div>

            {/* CONPRESP */}
               <span className="font-bold text-lg text-gray-700">CONPRESP</span> 
          </div>
        </footer>
      </div>
    </div>
  );
};

export default DocumentCertificateEditor;