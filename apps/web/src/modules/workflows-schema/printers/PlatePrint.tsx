import { useLocation, useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { Map } from "../form-engine/fields";
import { evalFieldExpression } from "../form-engine/utils/expressions";
import {
  DocumentLayout,
  ActivityTypeEnum,
  DocumentTemplate,
} from "../../../api/types/schema";
import { ApiClient } from "../../../api";
import { WorkflowVersionResponse } from "../../../api/types/workflows-schema.dto";
import { FindOneWorkflowResponse } from "../../../api/types/workflows.dto";
import { QRCodeSVG } from "qrcode.react";

const apiClient = new ApiClient({
  baseURL: import.meta.env.VITE_BACK_END_API || "",
  headers: {
    apiKey: localStorage.getItem("apiKey") || "",
  },
});

export const PlatePrint = (): JSX.Element => {
  const { id, plateId } = useParams();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const version = searchParams.get("version");
  const [plate, setPlate] = useState<DocumentLayout>();
  const [status, setStatus] = useState<any>({});
  const [context, setContext] = useState<any>({});
  const [general, setGeneral] = useState<any>({});
  const [isQRCodeLoaded, setQRCodeLoaded] = useState(false);
  const [isLogoLoaded, setLogoLoaded] = useState(false);
  const qrCodeRef = useRef<SVGSVGElement>(null);

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

      // Find all document activities in the schema that can be used as plates
      const documentActivities = response.schema.activities.filter(
        (activity) => activity.type === ActivityTypeEnum.DOCUMENT
      );

      if (documentActivities.length === 0) {
        console.error("No document activities found in the workflow");
        return;
      }

      // Find the specific plate by plateId or use the first one
      let selectedPlateConfig;

      if (plateId) {
        // Look for the specific plate in all document activities
        for (const activity of documentActivities) {
          const documentTemplate = activity.template as DocumentTemplate;
          if (!documentTemplate.documents) continue;

          const foundPlate = documentTemplate.documents.find(
            (doc) => doc.id === plateId && doc.type === "plate"
          );
          if (foundPlate) {
            selectedPlateConfig = foundPlate;
            break;
          }
        }
      } else {
        // Use the first plate from the first document activity
        for (const activity of documentActivities) {
          const documentTemplate = activity.template as DocumentTemplate;
          if (!documentTemplate.documents) continue;

          const foundPlate = documentTemplate.documents.find(
            (doc) => doc.type === "plate"
          );
          if (foundPlate) {
            selectedPlateConfig = foundPlate;
            break;
          }
        }
      }

      if (!selectedPlateConfig || !selectedPlateConfig.layout) {
        console.error("No plate layout found in the activity template");
        return;
      }

      // Create a copy of the layout to modify the QR code
      const layoutWithQRCode = {
        ...selectedPlateConfig.layout,
        qrcode: `${window.location.origin}/workflows/${id}${version ? `?version=${version}` : ""}`,
      };

      setPlate(layoutWithQRCode);

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
    
  }, []);

  // Set QR code as loaded when the component is rendered
  useEffect(() => {
    if (plate && qrCodeRef.current) {
      setQRCodeLoaded(true);
    }
  }, [plate, qrCodeRef]);

  const isAllLoaded = isQRCodeLoaded && isLogoLoaded;

  // A0 page wrapper style to handle the content
  const pageWrapperStyle: React.CSSProperties = {
    position: "relative",
    overflow: "visible",
  };

  // A0 page content container with standard A0 dimensions
  const pdfPageStyle: React.CSSProperties = {
    // Standard A0 dimensions: 841mm × 1189mm (33.1in × 46.8in)
    // At 96 DPI (standard web resolution), this translates to approximately:
    width: "3179px", // 33.1 inches * 96 DPI
    height: "4492px", // 46.8 inches * 96 DPI
    boxSizing: "border-box",
    backgroundColor: "white",
    position: "absolute",
    top: 0,
    left: 0,
    padding: "0",
    overflow: "hidden",
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

  // QR code container style
  const qrCodeContainerStyle: React.CSSProperties = {
    minWidth: "755px",
    minHeight: "755px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: "8px",
  };

  const element = document.querySelector("div.enabled");

  if (element) {
    element.parentNode?.removeChild(element);
  }

  const PROTOCOL_STATUS_WATERMARK: any = {
    WAITING_ACCEPTANCE: "AGUARDANDO ASSINATURA",
    WAITING_TAX_PAYMENT: "AGUARDANDO PAGAMENTO",
    APOSTILLED: "APOSTILADO",
  };

  if (plate) {
    return (
      <div style={pageWrapperStyle}>
        <div id={isAllLoaded ? "waitNoMore" : undefined} style={pdfPageStyle}>
          <div style={watermarkStyle}>
            {PROTOCOL_STATUS_WATERMARK[status] ?? ""}
          </div>

          <header className="flex flex-col py-40 px-40">
            <div className="flex space-x-40">
              <img
                src={plate.logo}
                width="400px"
                alt="city logo"
                onLoad={() => setLogoLoaded(true)}
              />
              <div className="flex flex-col space-y-6">
                <div className="font-black text-8xl mb-6">
                  {plate.headerTitle}
                </div>
                <div className="text-6xl">{plate.headerDescription}</div>
              </div>
            </div>
          </header>
          <main className="flex flex-col space-y-10 px-40">
            <div className="flex items-center space-x-40">
              <div style={qrCodeContainerStyle}>
                <QRCodeSVG
                  value={plate.qrcode}
                  size={755}
                  ref={qrCodeRef}
                  bgColor={"#ffffff"}
                  fgColor={"#000000"}
                  level={"H"}
                  includeMargin={true}
                />
              </div>
              <div className="flex flex-col space-y-20 font-bold text-4xl w-full">
                <div
                  className="justify-center text-center"
                  style={{ fontSize: "9rem", lineHeight: 1.1 }}
                >
                  {plate.title}
                </div>
                <div className="justify-center text-center text-8xl">
                  {plate.description}
                </div>
              </div>
            </div>
            <div className="text-left text-6xl font-bold mt-6">
              Para mais informações,
              <br /> acesse o QR Code acima
            </div>
            <div className="flex-col space-y-6 font-bold text-5xl">
              {plate &&
                plate.blocks.map((block, blockIndex) => (
                  <div
                    key={`block-${blockIndex}`}
                    className="flex-col space-y-12"
                  >
                    {block.label && (
                      <div className="flex items-center space-x-4 font-bold pt-16 mb-10">
                        {block.label}
                      </div>
                    )}
                    {block.map?.source && (
                      <div className="flex justify-center">
                        <Map
                          fieldKey={"map"}
                          options={{
                            label: "",
                            layers: block.map.layers,
                            width: block.map.width ?? "750px",
                            height: block.map.height ?? "750px",
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
                    <div className="flex flex-col space-y-12">
                      {block?.rows.map((row, rowIndex) => (
                        <div
                          key={`row-${rowIndex}`}
                          className="flex items-center space-x-4"
                        >
                          <div className="flex space-x-10 w-full">
                            {row.map((col, colIndex) => (
                              <div
                                key={`col-${colIndex}`}
                                className="flex w-full"
                              >
                                <div className="flex flex-col space-y-6">
                                  <div className="flex items-center space-x-4 text-gray-500">
                                    {col.label}
                                  </div>
                                  <div
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
                  </div>
                ))}
            </div>
          </main>
        </div>
      </div>
    );
  } else {
    return <></>;
  }
};
