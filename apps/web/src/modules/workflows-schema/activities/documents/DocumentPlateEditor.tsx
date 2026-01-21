import { IconButton, Tooltip } from "@chakra-ui/react";
import { IFormContext } from "@open-urbis/types";
import { useEffect, useState, useContext, useRef } from "react";
import { FaMinus, FaPlus, FaTrash, FaUndo } from "react-icons/fa";
import EditableHeader from "../../../../components/EditableHeader";
import { Map } from "../../form-engine/fields";
import { evalFieldExpression } from "../../form-engine/utils/expressions";
import { FieldOptionEditor } from "../../components/FieldOptionEditor";
import { DocumentLayout } from "../../../../api/types/schema";
import { QRCodeSVG } from "qrcode.react";
import { StyleContext } from "../../../../reducers/style.reducer";
import { useParams } from "react-router-dom";

export type PlateEditorProps = {
  config: DocumentLayout;
  general: IFormContext;
  context: any;
  onChange: (value: DocumentLayout) => void;
  showPreview?: boolean;
};

export const DocumentPlateEditor = ({
  config,
  general,
  context,
  onChange,
  showPreview = false,
}: PlateEditorProps): JSX.Element => {
  const { id } = useParams();
  const styleContext = useContext(StyleContext);
  const [form, setForm] = useState<DocumentLayout>(config);
  const [zoom, setZoom] = useState(25);
  const qrCodeRef = useRef<SVGSVGElement>(null);

  // Effect to sync with incoming value prop changes
  useEffect(() => {
    setForm(config);
  }, [config]);

  // Effect to update page dimensions when zoom changes
  useEffect(() => {
    // This will trigger a re-render with updated pageWrapperStyle dimensions
  }, [zoom]);

  const handleFormChange = (newForm: DocumentLayout) => {
    setForm(newForm);
    onChange(newForm);
  };

  const handleRemoveBlock = (index: number) => {
    form.blocks?.splice(index, 1);
    handleFormChange({
      ...form,
      blocks: form.blocks,
    });
  };

  const handleAddBlock = () => {
    handleFormChange({
      ...form,
      blocks: [
        ...form.blocks,
        {
          label: "Titulo do bloco",
          rows: [],
        },
      ],
    });
  };

  const handleSetDocumentAttr = (
    key: "headerTitle" | "headerDescription" | "title" | "description" | "logo",
    value: string
  ) => {
    handleFormChange({
      ...form,
      [key]: value,
    });
  };

  const handleSetBlockAttr = (index: number, key: "label", value: string) => {
    form.blocks[index][key] = value;
    handleFormChange({
      ...form,
      blocks: form.blocks,
    });
  };

  const handleAddRow = (index: number) => {
    form.blocks[index].rows.push([
      { label: "Insira a etiqueta", value: "Insira o valor" },
    ]);
    handleFormChange({
      ...form,
      blocks: form.blocks,
    });
  };

  const handleAddCol = (blockIndex: number, rowIndex: number) => {
    form.blocks[blockIndex].rows[rowIndex].push({
      label: "Insira a etiqueta",
      value: "Insira o valor",
    });
    handleFormChange({
      ...form,
      blocks: form.blocks,
    });
  };

  const handleRemoveCol = (
    blockIndex: number,
    rowIndex: number,
    colIndex: number
  ) => {
    form.blocks[blockIndex].rows[rowIndex].splice(colIndex, 1);

    if (form.blocks[blockIndex].rows[rowIndex].length === 0) {
      form.blocks[blockIndex].rows.splice(rowIndex, 1);
    }

    handleFormChange({
      ...form,
      blocks: form.blocks,
    });
  };

  const handleSetColAttr = (
    blockIndex: number,
    rowIndex: number,
    colIndex: number,
    key: "label" | "value",
    value: string
  ) => {
    form.blocks[blockIndex].rows[rowIndex][colIndex][key] = value;
    handleFormChange({
      ...form,
      blocks: form.blocks,
    });
  };

  const [draggingRowIndex, setDraggingRowIndex] = useState<number | null>(null);

  const handleDragRowStart = (
    e: React.DragEvent<HTMLDivElement>,
    index: number
  ) => {
    setDraggingRowIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragRowOver = (
    e: React.DragEvent<HTMLDivElement>,
    index: number,
    rowIndex: number
  ) => {
    e.preventDefault();
    if (draggingRowIndex === null) return;

    let newIndex = draggingRowIndex < index ? index + 1 : index;

    newIndex =
      newIndex > form.blocks[rowIndex].rows.length
        ? form.blocks[rowIndex].rows.length
        : newIndex;

    if (draggingRowIndex !== newIndex) {
      const itemToMove = form.blocks[rowIndex].rows.splice(
        draggingRowIndex,
        1
      )[0];

      if (draggingRowIndex < newIndex) {
        newIndex--;
      }

      form.blocks[rowIndex].rows.splice(newIndex, 0, itemToMove);

      handleFormChange({
        ...form,
        blocks: form.blocks,
      });
      setDraggingRowIndex(newIndex);
    }
  };

  const handleDropRow = (e: React.DragEvent<HTMLDivElement>) => {
    setDraggingRowIndex(null);
  };

  // Outer container style
  const outerContainerStyle: React.CSSProperties = {
    height: "100vh",
    overflow: "auto",
    boxSizing: "border-box",
    background:
      styleContext?.state?.backgroundColor === "#f5f5f5"
        ? "#e5e5e5"
        : "#4a5568",
    padding: "20px",
    position: "relative",
    // These properties help with zooming
    display: "flex",
  };

  // A0 page wrapper style to handle the zoom and fit content
  const pageWrapperStyle: React.CSSProperties = {
    width: `${3179 * (Math.max(10, zoom) / 100)}px`, // Zoomed width
    height: `${4492 * (Math.max(10, zoom) / 100)}px`, // Zoomed height
    position: "relative",
    overflow: "visible",
  };

  // A0 page content container that will be directly inside the outer container
  const a0PageStyle: React.CSSProperties = {
    // Standard A0 dimensions: 841mm × 1189mm (33.1in × 46.8in)
    // At 96 DPI (standard web resolution), this translates to approximately:
    width: "3179px", // 33.1 inches * 96 DPI
    height: "4492px", // 46.8 inches * 96 DPI
    boxSizing: "border-box",
    backgroundColor: "white",
    transform: `scale(${Math.max(10, zoom) / 100})`,
    transformOrigin: "top left",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    position: "absolute",
    top: 0,
    left: 0,
    // Ensure content stays within bounds
    padding: "0",
    overflow: "hidden",
  };

  const zoomControlsStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    marginBottom: "8px",
    padding: "8px",
    backgroundColor:
      styleContext?.state?.backgroundColor === "#f5f5f5"
        ? "#f9f9f9"
        : "#2d3748",
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

  if (showPreview) {
    return (
      <div
        className={`p-8 pt-8 pb-24 flex flex-col justify-center text-black ${
          styleContext?.state?.backgroundColor === "#f5f5f5"
            ? "bg-gray-200"
            : "bg-gray-800"
        }`}
      >
        <div style={zoomControlsStyle}>
          <Tooltip label="Diminuir zoom">
            <IconButton
              aria-label="Zoom out"
              icon={<FaMinus />}
              onClick={() => setZoom(Math.max(10, zoom - 5))}
              size="md"
            />
          </Tooltip>
          <div className="px-3 py-2 bg-white rounded-md font-medium">
            {zoom}%
          </div>
          <Tooltip label="Aumentar zoom">
            <IconButton
              aria-label="Zoom in"
              icon={<FaPlus />}
              onClick={() => setZoom(Math.min(120, zoom + 5))}
              size="md"
            />
          </Tooltip>
          <Tooltip label="Resetar zoom">
            <IconButton
              aria-label="Reset zoom"
              icon={<FaUndo />}
              onClick={() => setZoom(25)}
              size="md"
            />
          </Tooltip>
        </div>

        <div className="flex justify-center w-full mt-8">
          <div className="text-black" style={outerContainerStyle}>
            <div style={pageWrapperStyle}>
              <div style={a0PageStyle}>
                <header className="flex flex-col py-40 px-40">
                  <div className="flex space-x-40">
                    <img src={form.logo} width="400px" alt="City Logo" />
                    <div className="flex flex-col">
                      <div className="font-black text-8xl mb-6">
                        {form.headerTitle}
                      </div>
                      <div className="text-6xl">{form.headerDescription}</div>
                    </div>
                  </div>
                </header>

                <main className="flex flex-col space-y-10 px-40">
                  <div className="flex items-center space-x-40">
                    <div style={qrCodeContainerStyle}>
                      <QRCodeSVG
                        ref={qrCodeRef}
                        value={`${window.location.origin}/workflows/${id}`}
                        size={755}
                        level="H"
                        marginSize={0}
                      />
                    </div>
                    <div className="flex flex-col space-y-20 font-bold text-4xl w-full">
                      <div
                        className="justify-center text-center"
                        style={{ fontSize: "9rem", lineHeight: "1.1" }}
                      >
                        {form.title}
                      </div>
                      <div className="justify-center text-center text-8xl">
                        {form.description}
                      </div>
                    </div>
                  </div>

                  <div className="flex-col space-y-6 font-bold text-5xl">
                    {form.blocks.map((block, blockIndex) => (
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
                          <div className="flex justify-center pt-6">
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
                          {block.rows.map((row, rowIndex) => (
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
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-8 pt-8 pb-24 flex flex-col justify-center text-black ${
        styleContext?.state?.backgroundColor === "#f5f5f5"
          ? "bg-gray-200"
          : "bg-gray-800"
      }`}
    >
      <div style={zoomControlsStyle}>
        <Tooltip label="Diminuir zoom">
          <IconButton
            aria-label="Zoom out"
            icon={<FaMinus />}
            onClick={() => setZoom(Math.max(10, zoom - 5))}
            size="md"
          />
        </Tooltip>
        <div className="px-3 py-2 bg-white rounded-md font-medium">{zoom}%</div>
        <Tooltip label="Aumentar zoom">
          <IconButton
            aria-label="Zoom in"
            icon={<FaPlus />}
            onClick={() => setZoom(Math.min(120, zoom + 5))}
            size="md"
          />
        </Tooltip>
        <Tooltip label="Resetar zoom">
          <IconButton
            aria-label="Reset zoom"
            icon={<FaUndo />}
            onClick={() => setZoom(25)}
            size="md"
          />
        </Tooltip>
      </div>

      <div className="flex justify-center w-full mt-8">
        <div className="text-black" style={outerContainerStyle}>
          <div style={pageWrapperStyle}>
            <div style={a0PageStyle}>
              <header className="flex flex-col py-40 px-40">
                <div className="flex space-x-40">
                  <img src={form.logo} width="400px" alt="city logo" />
                  <div className="flex flex-col space-y-6">
                    <EditableHeader
                      value={form.headerTitle}
                      onTextChange={(text) =>
                        handleSetDocumentAttr("headerTitle", text)
                      }
                      className="font-black text-8xl"
                    />
                    <EditableHeader
                      value={form.headerDescription}
                      onTextChange={(text) =>
                        handleSetDocumentAttr("headerDescription", text)
                      }
                      className="text-6xl"
                    />
                  </div>
                </div>
              </header>

              <main className="flex flex-col space-y-10 px-40">
                <div className="flex items-center space-x-40">
                  <div style={qrCodeContainerStyle}>
                    <QRCodeSVG
                      ref={qrCodeRef}
                      value={`${window.location.origin}/workflows/${id}`}
                      size={755}
                      level="H"
                      marginSize={0}
                    />
                  </div>
                  <div className="flex flex-col space-y-20 font-bold text-4xl w-full">
                    <EditableHeader
                      value={form.title}
                      onTextChange={(text) =>
                        handleSetDocumentAttr("title", text)
                      }
                      className="justify-center text-center"
                      style={{ fontSize: "9rem", lineHeight: "1.1" }}
                    />
                    <EditableHeader
                      value={form.description}
                      onTextChange={(text) =>
                        handleSetDocumentAttr("description", text)
                      }
                      className="justify-center text-center text-8xl"
                    />
                  </div>
                </div>

                <div className="flex-col space-y-6 font-bold text-5xl">
                  {form &&
                    form.blocks.map((block, blockIndex) => (
                      <div key={`block-${blockIndex}`}>
                        <div className="flex items-center space-x-4 font-bold pt-16 mb-10">
                          <div className="font-normal">
                            <FieldOptionEditor
                              general={general}
                              field={{
                                type: "documentMap" as any,
                                key: `block-${blockIndex}`,
                                options: {
                                  layers: block.map?.layers,
                                  source: block.map?.source,
                                },
                                expressions: {},
                              }}
                              onChange={(config) => {
                                form.blocks[blockIndex].map =
                                  config.options as any;
                                handleFormChange({
                                  ...form,
                                  blocks: form.blocks,
                                });
                              }}
                              options={{ iconSize: 42 }}
                            />
                          </div>

                          <EditableHeader
                            value={form.blocks[blockIndex].label}
                            onTextChange={(text) =>
                              handleSetBlockAttr(blockIndex, "label", text)
                            }
                          />
                          <div className="cursor-pointer p-4 bg-gray-300 rounded-xl">
                            <FaTrash
                              onClick={() => handleRemoveBlock(blockIndex)}
                              size={42}
                            />
                          </div>
                        </div>
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
                              key={"row-" + rowIndex}
                              draggable
                              onDragStart={(e) =>
                                handleDragRowStart(e, rowIndex)
                              }
                              onDragOver={(e) =>
                                handleDragRowOver(e, rowIndex, blockIndex)
                              }
                              onDrop={handleDropRow}
                              className="flex items-center space-x-4"
                            >
                              <div className="flex space-x-10 w-full">
                                {row.map((col, colIndex) => {
                                  return (
                                    <div
                                      key={`col-${colIndex}`}
                                      className="flex w-full"
                                    >
                                      <div className="flex flex-col space-y-6">
                                        <div className="flex items-center space-x-4 text-gray-500">
                                          <EditableHeader
                                            value={col.label}
                                            onTextChange={(text) =>
                                              handleSetColAttr(
                                                blockIndex,
                                                rowIndex,
                                                colIndex,
                                                "label",
                                                text
                                              )
                                            }
                                          />
                                          <div className="cursor-pointer text-black p-4 bg-gray-300 rounded-xl">
                                            <FaTrash
                                              onClick={() =>
                                                handleRemoveCol(
                                                  blockIndex,
                                                  rowIndex,
                                                  colIndex
                                                )
                                              }
                                              size={42}
                                            />
                                          </div>
                                        </div>
                                        <EditableHeader
                                          value={col.value}
                                          onTextChange={(text) =>
                                            handleSetColAttr(
                                              blockIndex,
                                              rowIndex,
                                              colIndex,
                                              "value",
                                              text
                                            )
                                          }
                                        />
                                      </div>
                                      {colIndex + 1 === row.length && (
                                        <div className="space-x-2 ml-auto mb-auto">
                                          <div className="cursor-pointer p-4 bg-gray-300 rounded-xl">
                                            <FaPlus
                                              onClick={() =>
                                                handleAddCol(
                                                  blockIndex,
                                                  rowIndex
                                                )
                                              }
                                              size={42}
                                            />
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center space-x-4 justify-center pt-4">
                          <div className="cursor-pointer p-4 bg-gray-300 rounded-xl">
                            <FaPlus
                              onClick={() => handleAddRow(blockIndex)}
                              size={42}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                </div>

                <div className="flex items-center space-x-4 justify-center mt-6">
                  <div className="cursor-pointer p-4 bg-gray-300 rounded-xl">
                    <FaPlus onClick={() => handleAddBlock()} size={42} />
                  </div>
                </div>
              </main>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
