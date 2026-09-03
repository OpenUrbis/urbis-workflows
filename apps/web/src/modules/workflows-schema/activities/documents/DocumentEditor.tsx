import { IconButton } from "../../../../components";
import { useEffect, useState, useRef, useContext } from "react";
import { FaPlus, FaTrash } from "react-icons/fa";
import { IFormContext } from "@open-urbis/types";
import EditableHeader from "../../../../components/EditableHeader";
import { Map } from "../../form-engine/fields";
import { evalFieldExpression } from "../../form-engine/utils/expressions";
import { FieldOptionEditor } from "../../components/FieldOptionEditor";
import { DocumentLayout } from "../../../../api/types/schema";
import { QRCodeSVG } from "qrcode.react";
import { StyleContext } from "../../../../reducers/style.reducer";
import { useParams } from "react-router-dom";

export type DocumentEditorProps = {
  config: DocumentLayout;
  general: IFormContext;
  context: any;
  onChange: (value: DocumentLayout) => void;
  showPreview?: boolean;
};

export const DocumentEditor = ({
  config,
  general,
  context,
  onChange,
  showPreview = false,
}: DocumentEditorProps): JSX.Element => {
  const { id } = useParams();
  const styleContext = useContext(StyleContext);
  const [form, setForm] = useState<DocumentLayout>(config);
  const qrCodeRef = useRef<SVGSVGElement>(null);

  // Effect to sync with incoming value prop changes
  useEffect(() => {
    setForm(config);
  }, [config]);

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

  if (showPreview) {
    return (
      <div
        className={`p-8 py-24 flex justify-center text-black ${
          styleContext.state.backgroundColor === "#f5f5f5"
            ? "bg-gray-200"
            : "bg-gray-800"
        }`}
      >
        <div className="w-[210mm] h-[297mm] mx-auto bg-white shadow-lg overflow-auto">
          <div className="p-6">
            <header className="flex items-center justify-between space-y-4 mb-6">
              <div>
                <img src={form.logo} width="125px" alt="Logo" />
              </div>
              <div
                className="flex flex-col text-center mx-auto"
                style={{ maxWidth: "300px" }}
              >
                <span className="font-black text-xl">{form.headerTitle}</span>
                <span
                  dangerouslySetInnerHTML={{
                    __html: form.headerDescription,
                  }}
                ></span>
              </div>
              <div>
                <QRCodeSVG
                  ref={qrCodeRef}
                  value={`${window.location.origin}/workflows/${id}`}
                  size={100}
                  level="H"
                  marginSize={0}
                />
              </div>
            </header>

            <main className="flex flex-col space-y-6">
              <div className="flex flex-col justify-center text-center text-lg mb-6">
                <span className="font-bold">{form.title}</span>
                <span>{form.description}</span>
              </div>

              <div>
                {form.blocks &&
                  form.blocks.map((block, index) => (
                    <div key={`block-${index}`} className="mb-6">
                      {block.label && (
                        <div className="font-bold mb-3">{block.label}</div>
                      )}
                      <div className="flex flex-col border">
                        {block?.rows &&
                          block.rows.map((row, rowIndex) => (
                            <div key={`row-${rowIndex}`} className="flex">
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
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-8 py-24 flex justify-center text-black ${
        styleContext.state.backgroundColor === "#f5f5f5"
          ? "bg-gray-200"
          : "bg-gray-800"
      }`}
    >
      <div className="w-[210mm] h-[297mm] mx-auto bg-white shadow-lg overflow-auto">
        <div className="p-6">
          <header className="flex items-center justify-between space-y-4 mb-6">
            <div>
              <img src={form.logo} width="125px" alt="city logo" />
            </div>
            <div
              className="flex flex-col text-center mx-auto"
              style={{ maxWidth: "300px" }}
            >
              <EditableHeader
                value={form.headerTitle}
                onTextChange={(text) =>
                  handleSetDocumentAttr("headerTitle", text)
                }
                className="font-black text-xl"
              />
              <EditableHeader
                value={form.headerDescription}
                onTextChange={(text) =>
                  handleSetDocumentAttr("headerDescription", text)
                }
                className="text-center"
              />
            </div>
            <div>
              <QRCodeSVG
                value={`${window.location.origin}/workflows/${id}`}
                size={100}
                level="H"
                marginSize={0}
              />
            </div>
          </header>

          <main className="flex flex-col space-y-6">
            <div className="flex flex-col justify-center text-center text-lg">
              <EditableHeader
                value={form.title}
                onTextChange={(text) => handleSetDocumentAttr("title", text)}
                className="justify-center text-center font-bold"
              />
              <EditableHeader
                value={form.description}
                onTextChange={(text) =>
                  handleSetDocumentAttr("description", text)
                }
                className="justify-center text-center"
              />
            </div>

            <div>
              {form.blocks?.map((block, blockIndex) => (
                <div key={blockIndex}>
                  <div className="flex items-center space-x-4 font-bold mb-2.5">
                    <div className="font-normal">
                      <FieldOptionEditor
                        general={general}
                        field={{
                          type: "documentMap" as any,
                          key: `block-${blockIndex}`,
                          options: {
                            layers: block.map?.layers,
                            source: block.map?.source as any,
                          },
                          expressions: {},
                        }}
                        onChange={(config) => {
                          form.blocks[blockIndex].map = config.options as any;
                          handleFormChange({
                            ...form,
                            blocks: form.blocks,
                          });
                        }}
                        options={{
                          textColor: "black",
                        }}
                      />
                    </div>

                    <EditableHeader
                      value={block.label}
                      onTextChange={(text) =>
                        handleSetBlockAttr(blockIndex, "label", text)
                      }
                    />
                    <IconButton
                      aria-label="Remove bloco"
                      icon={<FaTrash />}
                      onClick={() => handleRemoveBlock(blockIndex)}
                      size="sm"
                    />
                  </div>
                  <div className="flex flex-col border">
                    {block?.rows.map((row, rowIndex) => (
                      <div
                        key={"row-" + rowIndex}
                        draggable
                        onDragStart={(e) => handleDragRowStart(e, rowIndex)}
                        onDragOver={(e) =>
                          handleDragRowOver(e, rowIndex, blockIndex)
                        }
                        onDrop={handleDropRow}
                        className="flex items-center space-x-4"
                      >
                        <div className="flex w-full">
                          {row.map((col, colIndex) => {
                            return (
                              <div className="flex w-full border">
                                <div className="flex flex-col p-2.5">
                                  <div className="flex items-center space-x-4 text-sm text-gray-600">
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
                                    <IconButton
                                      aria-label="Remove coluna"
                                      icon={<FaTrash />}
                                      onClick={() =>
                                        handleRemoveCol(
                                          blockIndex,
                                          rowIndex,
                                          colIndex
                                        )
                                      }
                                      size="sm"
                                    />
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
                                    <IconButton
                                      aria-label="Add col"
                                      icon={<FaPlus />}
                                      onClick={() =>
                                        handleAddCol(blockIndex, rowIndex)
                                      }
                                      size="sm"
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })}
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
                  <div className="flex items-center space-x-4 justify-center pt-4">
                    <IconButton
                      aria-label="Add row"
                      icon={<FaPlus />}
                      onClick={() => handleAddRow(blockIndex)}
                      size="sm"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center space-x-4 justify-center mt-6">
              <IconButton
                aria-label="Add block"
                icon={<FaPlus />}
                onClick={() => handleAddBlock()}
                size="sm"
              />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
