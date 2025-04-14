import EditableHeader from "../../../../components/EditableHeader";
import { DocumentConfig } from "../../../../api/types/schema";
import { useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { useContext, useRef } from "react";
import { StyleContext } from "../../../../reducers/style.reducer";

export type DocumentCustomEditorProps = {
  doc: DocumentConfig;
  onChange: (value: any) => void;
  value: any;
  showPreview?: boolean;
};

export const DocumentCustomEditor = ({
  doc,
  onChange,
  value,
  showPreview = false,
}: DocumentCustomEditorProps): JSX.Element => {
  const { id } = useParams<{ id: string }>();
  const styleContext = useContext(StyleContext);
  const qrCodeRef = useRef<SVGSVGElement>(null);

  // Generate QR code URL based on the current workflow
  const getQRCodeUrl = () => {
    const baseUrl = window.location.origin;
    const isNewWorkflow = id === "new";

    if (isNewWorkflow) {
      return `${baseUrl}/workflows-schema`;
    } else {
      return `${baseUrl}/workflows-schema/${id}`;
    }
  };

  return (
    <div
      className={`p-8 py-24 flex justify-center text-black ${
        styleContext?.state?.backgroundColor === "#f5f5f5"
          ? "bg-gray-200"
          : "bg-gray-800"
      }`}
    >
      <div className="w-[210mm] h-[297mm] mx-auto bg-white shadow-lg overflow-auto">
        <div className="p-6">
          {!showPreview && (
            <div className="flex flex-col space-y-4">
              <header className="flex items-center justify-between space-y-4 mb-6">
                <div>
                  <img src={doc.layout?.logo} width="125px" alt="city logo" />
                </div>
                <div
                  className="flex flex-col text-center mx-auto"
                  style={{ maxWidth: "300px" }}
                >
                  <EditableHeader
                    value={doc.layout?.headerTitle || "Prefeitura de São Paulo"}
                    onTextChange={(text: string) => {
                      if (!doc.layout) {
                        doc.layout = {
                          logo: "/logo_name.png",
                          headerTitle: text,
                          headerDescription: "Secretaria de Governo Municipal",
                          qrcode: getQRCodeUrl(),
                          title: "Novo Documento",
                          description: "Descrição do documento",
                          blocks: [],
                        };
                      } else {
                        doc.layout.headerTitle = text;
                      }
                      onChange({ ...value });
                    }}
                    className="font-black text-xl"
                  />
                  <EditableHeader
                    value={
                      doc.layout?.headerDescription ||
                      "Secretaria de Governo Municipal"
                    }
                    onTextChange={(text: string) => {
                      if (!doc.layout) {
                        doc.layout = {
                          logo: "/logo_name.png",
                          headerTitle: "Prefeitura de São Paulo",
                          headerDescription: text,
                          qrcode: getQRCodeUrl(),
                          title: "Novo Documento",
                          description: "Descrição do documento",
                          blocks: [],
                        };
                      } else {
                        doc.layout.headerDescription = text;
                      }
                      onChange({ ...value });
                    }}
                    className="text-center"
                  />
                </div>
                <div>
                  <QRCodeSVG
                    ref={qrCodeRef}
                    value={doc.layout?.qrcode || getQRCodeUrl()}
                    size={100}
                    level="H"
                    marginSize={0}
                  />
                </div>
              </header>

              <main className="flex flex-col" style={{ marginTop: "0px" }}>
                <div className="flex flex-col justify-center text-center text-lg">
                  <EditableHeader
                    value={doc.layout?.title || "Novo Documento"}
                    onTextChange={(text: string) => {
                      if (!doc.layout) {
                        doc.layout = {
                          logo: "/logo_name.png",
                          headerTitle: "Prefeitura de São Paulo",
                          headerDescription: "Secretaria de Governo Municipal",
                          qrcode: getQRCodeUrl(),
                          title: text,
                          description: "Descrição do documento",
                          blocks: [],
                        };
                      } else {
                        doc.layout.title = text;
                      }
                      onChange({ ...value });
                    }}
                    className="justify-center text-center font-bold"
                  />
                  <EditableHeader
                    value={doc.layout?.description || "Descrição do documento"}
                    onTextChange={(text: string) => {
                      if (!doc.layout) {
                        doc.layout = {
                          logo: "/logo_name.png",
                          headerTitle: "Prefeitura de São Paulo",
                          headerDescription: "Secretaria de Governo Municipal",
                          qrcode: getQRCodeUrl(),
                          title: "Novo Documento",
                          description: text,
                          blocks: [],
                        };
                      } else {
                        doc.layout.description = text;
                      }
                      onChange({ ...value });
                    }}
                    className="justify-center text-center"
                  />
                </div>

                <div className="mb-4 mt-8">
                  <h3 className="text-lg font-medium mb-2">Editor HTML</h3>
                  <textarea
                    value={doc.template || ""}
                    onChange={(e) => {
                      doc.template = e.target.value;
                      onChange({ ...value });
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
                  <img src={doc.layout?.logo} width="125px" alt="city logo" />
                </div>
                <div
                  className="flex flex-col text-center mx-auto"
                  style={{ maxWidth: "300px" }}
                >
                  <span className="font-black text-xl">
                    {doc.layout?.headerTitle}
                  </span>
                  <span
                    dangerouslySetInnerHTML={{
                      __html: doc.layout?.headerDescription || "",
                    }}
                  ></span>
                </div>
                <div>
                  <QRCodeSVG
                    ref={qrCodeRef}
                    value={doc.layout?.qrcode || getQRCodeUrl()}
                    size={100}
                    level="H"
                    marginSize={0}
                  />
                </div>
              </header>

              <main className="flex flex-col space-y-6">
                <div className="flex flex-col justify-center text-center text-lg mb-6">
                  <span className="font-bold">{doc.layout?.title}</span>
                  <span>{doc.layout?.description}</span>
                </div>

                <div
                  className="mt-8"
                  dangerouslySetInnerHTML={{ __html: doc.template || "" }}
                />
              </main>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
