import { useLocation, useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import {
  ActivityTypeEnum,
  DocumentTemplate,
  DocumentConfig,
} from "../../../api/types/schema";
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

export const DocumentCustomPrint = (): JSX.Element => {
  const { id, documentId } = useParams();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const version = searchParams.get("version");
  const [documentCustom, setDocumentCustom] = useState<DocumentConfig>();
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
            (doc) => doc.id === documentId && doc.type === "custom"
          );
          if (foundDocument) {
            selectedDocumentConfig = foundDocument;
            break;
          }
        }
      } else {
        // Use the first custom document from the first document activity
        for (const activity of documentActivities) {
          const documentTemplate = activity.template as DocumentTemplate;
          if (!documentTemplate.documents) continue;

          const foundDocument = documentTemplate.documents.find(
            (doc) => doc.type === "custom"
          );
          if (foundDocument) {
            selectedDocumentConfig = foundDocument;
            break;
          }
        }
      }

      if (!selectedDocumentConfig) {
        console.error("No custom document found in the activity template");
        return;
      }

      // Create a copy of the document to modify the QR code
      const documentWithQRCode = {
        ...selectedDocumentConfig,
        layout: selectedDocumentConfig.layout
          ? {
              ...selectedDocumentConfig.layout,
              qrcode: `${window.location.origin}/workflows/${id}${version ? `?version=${version}` : ""}`,
              // Ensure required properties have default values
              logo: selectedDocumentConfig.layout.logo || "/logo_name.png",
              headerTitle:
                selectedDocumentConfig.layout.headerTitle ||
                "Prefeitura de São Paulo",
              headerDescription:
                selectedDocumentConfig.layout.headerDescription ||
                "Secretaria de Governo Municipal",
              title: selectedDocumentConfig.layout.title || "Documento",
              description: selectedDocumentConfig.layout.description || "",
              blocks: selectedDocumentConfig.layout.blocks || [],
            }
          : {
              qrcode: `${window.location.origin}/workflows/${id}${version ? `?version=${version}` : ""}`,
              logo: "/logo_name.png",
              headerTitle: "Prefeitura de São Paulo",
              headerDescription: "Secretaria de Governo Municipal",
              title: "Documento",
              description: "",
              blocks: [],
            },
      };

      setDocumentCustom(documentWithQRCode);

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

  if (documentCustom && documentCustom.layout) {
    return (
      <div id={isAllLoaded ? "waitNoMore" : undefined} style={pdfPageStyle}>
        <div style={watermarkStyle}>
          {WORKFLOW_STATUS_WATERMARK[status] ?? ""}
        </div>

        <header className="flex items-center space-y-4 p-6">
          <div>
            <img
              src={documentCustom.layout.logo}
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
              {documentCustom.layout.headerTitle}
            </span>
            <span
              dangerouslySetInnerHTML={{
                __html: documentCustom.layout.headerDescription || "",
              }}
            ></span>
          </div>
          <div>
            <QRCodeSVG
              ref={qrCodeRef}
              value={documentCustom.layout.qrcode}
              size={100}
              level="H"
              marginSize={0}
            />
          </div>
        </header>

        <main className="flex flex-col space-y-4 px-6">
          <div className="flex flex-col justify-center text-center text-lg mb-6">
            <span className="font-bold">{documentCustom.layout.title}</span>
            <span>{documentCustom.layout.description}</span>
          </div>

          {/* Render the custom HTML template */}
          <div
            className="mt-8"
            dangerouslySetInnerHTML={{
              __html: evalFieldExpression(
                `\`${documentCustom.template || ""}\``,
                context,
                general,
                {}
              ),
            }}
          />
        </main>
      </div>
    );
  } else {
    return <></>;
  }
};
