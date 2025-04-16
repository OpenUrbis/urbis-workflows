import { useLocation, useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import {
  DocumentLayout,
  ActivityTypeEnum,
  DocumentTemplate,
} from "../../../api/types/schema";
import { Map } from "../form-engine/fields";
import { evalFieldExpression } from "../form-engine/utils/expressions";
import { ApiClient } from "../../../api";
import { WorkflowVersionResponse } from "../../../api/types/workflows-schema.dto";
import { FindOneWorkflowResponse } from "../../../api/types/workflows.dto";
import { QRCodeSVG } from "qrcode.react";

const apiClient = new ApiClient({
  baseURL: process.env.REACT_APP_BACK_END_API || "",
  headers: {
    authorization: `Bearer ${localStorage.getItem("token") || ""}`,
  },
});

export const DocumentPrint = (): JSX.Element => {
  const { id, documentId } = useParams();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const version = searchParams.get("version");
  const [documentPrint, setDocumentPrint] = useState<DocumentLayout>();
  const [status, setStatus] = useState<any>({});
  const [context, setContext] = useState<any>({});
  const [general, setGeneral] = useState<any>({});
  const [isQRCodeLoaded, setQRCodeLoaded] = useState(false);
  const [isLogoLoaded, setLogoLoaded] = useState(false);
  const qrCodeRef = useRef<SVGSVGElement>(null);

  // Effect to handle QR code loading
  useEffect(() => {
    if (qrCodeRef.current) {
      // QR code is rendered as SVG, so it's loaded immediately
      setQRCodeLoaded(true);
    }
    
  }, [qrCodeRef.current]);

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

      // Find all document activities in the schema
      const documentActivities = response.schema.activities.filter(
        (activity) => activity.type === ActivityTypeEnum.DOCUMENT
      );

      if (documentActivities.length === 0) {
        console.error("No document activities found in the workflow");
        return;
      }

      // Find the specific document by documentId or use the first one
      let selectedDocumentConfig;

      if (documentId) {
        // Look for the specific document in all document activities
        for (const activity of documentActivities) {
          const documentTemplate = activity.template as DocumentTemplate;
          if (!documentTemplate.documents) continue;

          const foundDocument = documentTemplate.documents.find(
            (doc) => doc.id === documentId
          );
          if (foundDocument) {
            selectedDocumentConfig = foundDocument;
            break;
          }
        }
      } else {
        // Use the first document from the first document activity
        const firstDocumentActivity = documentActivities[0];
        const documentTemplate =
          firstDocumentActivity.template as DocumentTemplate;
        selectedDocumentConfig = documentTemplate.documents?.[0];
      }

      if (!selectedDocumentConfig || !selectedDocumentConfig.layout) {
        console.error("No document layout found in the activity template");
        return;
      }

      // Create a copy of the layout to modify the QR code
      const layoutWithQRCode = {
        ...selectedDocumentConfig.layout,
        qrcode: `${window.location.origin}/workflows/${id}${version ? `?version=${version}` : ""}`,
      };

      setDocumentPrint(layoutWithQRCode);

      // Handle different response types
      if ("value" in response) {
        // It's a FindOneWorkflowResponse
        setStatus(version ? "APOSTILLED" : response.value?.status || "");
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
        setStatus("APOSTILLED");
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

  useEffect(() => {
    fetchWorkflow();
    
  }, [id, version, documentId]);

  const isAllLoaded = isQRCodeLoaded && isLogoLoaded;

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

  const element = document.querySelector("div.enabled");

  if (element) {
    element.parentNode?.removeChild(element);
  }

  const WORKFLOW_STATUS_WATERMARK: any = {
    WAITING_ACCEPTANCE: "AGUARDANDO ACEITE",
    WAITING_TAX_PAYMENT: "AGUARDANDO PAGAMENTO",
    APOSTILLED: "APOSTILADO",
  };

  if (documentPrint) {
    return (
      <div id={isAllLoaded ? "waitNoMore" : undefined} style={pdfPageStyle}>
        <div style={watermarkStyle}>
          {WORKFLOW_STATUS_WATERMARK[status] ?? ""}
        </div>
        <header className="flex items-center space-y-4 p-6">
          <div>
            <img
              src={documentPrint.logo}
              width="125px"
              alt="city logo"
              onLoad={() => setLogoLoaded(true)}
            />
          </div>
          <div
            className="flex flex-col text-center mx-auto"
            style={{ maxWidth: "300px" }}
          >
            <span className="font-black text-xl">
              {documentPrint.headerTitle}
            </span>
            <span
              dangerouslySetInnerHTML={{
                __html: documentPrint.headerDescription,
              }}
            ></span>
          </div>
          <div>
            <QRCodeSVG
              ref={qrCodeRef}
              value={documentPrint.qrcode}
              size={100}
              level="H"
              marginSize={0}
              onLoad={() => setQRCodeLoaded(true)}
            />
          </div>
        </header>

        <main className="flex flex-col space-y-4 px-6">
          <div className="flex flex-col justify-center text-center text-lg">
            <span className="font-bold">{documentPrint.title}</span>
            <span>{documentPrint.description}</span>
          </div>

          <div>
            {documentPrint &&
              documentPrint.blocks.map((block, index) => (
                <div key={`block-${index}`} className="mb-6">
                  {block.label && (
                    <div className="flex items-center space-x-4 font-bold mb-2.5">
                      {block.label}
                    </div>
                  )}
                  <div className="flex flex-col border">
                    {block?.rows.map((row, rowIndex) => (
                      <div
                        key={`row-${rowIndex}`}
                        className="flex items-center space-x-4"
                      >
                        <div className="flex w-full">
                          {row.map((col, colIndex) => (
                            <div
                              key={`col-${colIndex}`}
                              className="flex w-full border"
                            >
                              <div className="flex flex-col p-2.5 w-full">
                                <label className="text-sm text-gray-600">
                                  {col.label}
                                </label>
                                <span
                                  dangerouslySetInnerHTML={{
                                    __html: evalFieldExpression(
                                      `\`${col.value}\``,
                                      context,
                                      general,
                                      {}
                                    ),
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  {block.map?.source && (
                    <div className="flex justify-center pt-6">
                      <Map
                        fieldKey={"map"}
                        options={{
                          label: "",
                          layers: block.map.layers,
                          width: block.map.width ?? "300px",
                          height: block.map.height ?? "300px",
                          table: false,
                          zoomControl: false,
                          hideHeader: true,
                        }}
                        value={evalFieldExpression(
                          block.map.source,
                          context,
                          general,
                          {}
                        )}
                      />
                    </div>
                  )}
                </div>
              ))}
          </div>
        </main>
      </div>
    );
  } else {
    return <></>;
  }
};
