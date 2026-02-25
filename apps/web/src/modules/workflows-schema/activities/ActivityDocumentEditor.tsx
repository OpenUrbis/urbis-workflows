import React, { useState, useContext } from "react";
import {
  FormControl,
  FormHelperText,
  FormLabel,
  IconButton,
  Tooltip,
} from "../../../components";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@open-urbis/map-ui";
import { IFormContext } from "@open-urbis/types";
import { DocumentEditor } from "./documents/DocumentEditor";
import { DocumentPlateEditor } from "./documents/DocumentPlateEditor";
import { DocumentCustomEditor } from "./documents/DocumentCustomEditor";
import DocumentCertificateEditor from "./documents/DocumentCertificateEditor";
import {
  DocumentConfig,
  DocumentTemplateType,
} from "../../../api/types/schema";
import { FaPlus, FaTrash, FaFileAlt } from "react-icons/fa";
import { StyleContext } from "../../../reducers";
import { useParams } from "react-router-dom";
import { Input, Select, Textarea } from "../../../components";

export type ActivityDocumentEditorProps = {
  documents: DocumentConfig[];
  general: IFormContext;
  onChange: (documents: DocumentConfig[]) => void;
};

export const ActivityDocumentEditor = ({
  documents,
  general,
  onChange,
}: ActivityDocumentEditorProps): JSX.Element => {
  const { id } = useParams<{ id: string }>();
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>("");
  const [selectedTab, setSelectedTab] = useState("editor");
  const isPreview = selectedTab === "preview";
  const styleContext = useContext(StyleContext);

  // Generate QR code URL based on the current workflow
  const getQRCodeUrl = (documentId: string) => {
    const baseUrl = window.location.origin;
    const isNewWorkflow = id === "new";

    if (isNewWorkflow) {
      return `${baseUrl}/workflows-schema`;
    } else {
      return `${baseUrl}/workflows-schema/${id}`;
    }
  };

  const handleContentChange = (docId: string, content: any) => {
    const newDocs = documents.map((doc) =>
      doc.id === docId ? { ...doc, layout: content } : doc
    );
    onChange(newDocs);
  };

  const handleAddDocument = () => {
    const newDocId = crypto.randomUUID();
    const newDoc: DocumentConfig = {
      id: newDocId,
      type: "document" as DocumentTemplateType,
      label: "Novo Documento",
      documentation: "Descrição do documento",
      layout: {
        logo: "/logo_name.png",
        headerTitle: "Prefeitura de São Paulo",
        headerDescription: "Secretaria de Governo Municipal",
        qrcode: getQRCodeUrl(newDocId),
        title: "Novo Documento",
        description: "Descrição do documento",
        blocks: [],
      },
      options: {
        showPreview: true,
        allowDownload: true,
        allowPrint: true,
      },
    };

    onChange([...documents, newDoc]);
    setSelectedDocumentId(newDoc.id);
  };

  const handleRemoveDocument = async (id: string) => {
    if (documents.length === 0) return;

    const confirmDelete = await confirmation(
      "Tem certeza que deseja remover este documento?"
    );

    if (!confirmDelete) return;

    onChange(documents.filter((doc) => doc.id !== id));
    setSelectedDocumentId("");
  };

  const handleChangeDocumentField = (field: string, newValue: string) => {
    const newDocs = documents.map((doc) =>
      doc.id === selectedDocumentId ? { ...doc, [field]: newValue } : doc
    );
    onChange(newDocs);
  };

  const handleChangeDocumentType = (newType: DocumentTemplateType) => {
    const newDocs = documents.map((doc) =>
      doc.id === selectedDocumentId ? { ...doc, type: newType } : doc
    );
    onChange(newDocs);
  };

  const renderTemplateEditor = (doc: DocumentConfig) => {
    // Update QR code URL for the document
    const docWithUpdatedQR = {
      ...doc,
      layout: doc.layout
        ? {
            ...doc.layout,
            qrcode: getQRCodeUrl(doc.id),
          }
        : undefined,
    };

    switch (doc.type) {
      case "document":
        return (
          <DocumentEditor
            config={
              docWithUpdatedQR.layout || {
                logo: "/logo_name.png",
                headerTitle: "Prefeitura de São Paulo",
                headerDescription: "Secretaria de Governo Municipal",
                qrcode: getQRCodeUrl(doc.id),
                title: "Novo Documento",
                description: "Descrição do documento",
                blocks: [],
              }
            }
            general={general}
            context={{}}
            onChange={(content) => handleContentChange(doc.id, content)}
            showPreview={isPreview}
          />
        );
      case "plate":
        return (
          <DocumentPlateEditor
            config={
              docWithUpdatedQR.layout || {
                logo: "/logo_name.png",
                headerTitle: "Prefeitura de São Paulo",
                headerDescription: "Secretaria de Governo Municipal",
                qrcode: getQRCodeUrl(doc.id),
                title: "Novo Documento",
                description: "Descrição do documento",
                blocks: [],
              }
            }
            general={general}
            context={{}}
            onChange={(content) => handleContentChange(doc.id, content)}
            showPreview={isPreview}
          />
        );
      case "custom":
        return (
          <DocumentCustomEditor
            doc={doc}
            value={doc}
            onChange={(value) => {
              const newDocs = documents.map((d) =>
                d.id === doc.id ? value : d
              );
              onChange(newDocs);
            }}
            showPreview={isPreview}
          />
        );
        case "certificate": 
      return (
        <DocumentCertificateEditor
          doc={doc}
          value={doc}
          onChange={(value) => {
            const newDocs = documents.map((d) =>
              d.id === doc.id ? value : d
            );
            onChange(newDocs);
          }}
          showPreview={isPreview}
        />
      );
      default:
        return <div>Template type not supported</div>;
    }
  };

  return (
    <div className="flex flex-col w-full">
      <div className="flex mb-8">
        <div className="w-1/4 border-r pr-4">
          <h2
            className="text-xl font-bold mb-4"
            style={{ color: styleContext.state.textColor }}
          >
            Documentos
          </h2>
          <div className="space-y-2">
            {documents
              .sort((a, b) => a.label.localeCompare(b.label))
              .map((doc) => (
                <div
                  key={doc.id}
                  className={`p-3 border rounded-xl cursor-pointer flex justify-between items-center group transition-colors duration-150`}
                  onClick={() => setSelectedDocumentId(doc.id)}
                  style={{
                    backgroundColor:
                      doc.id === selectedDocumentId
                        ? styleContext.state.buttonHoverColorWeight === "200"
                          ? "#E5E7EB"
                          : "#374151"
                        : styleContext.state.backgroundColor,
                    borderColor:
                      styleContext.state.buttonHoverColorWeight === "200"
                        ? "#E5E7EB"
                        : "#374151",
                    color: styleContext.state.textColor,
                  }}
                  onMouseEnter={(e) => {
                    if (selectedDocumentId !== doc.id) {
                      e.currentTarget.style.backgroundColor =
                        styleContext.state.buttonHoverColorWeight === "200"
                          ? "#F3F4F6"
                          : "#4B5563";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedDocumentId !== doc.id) {
                      e.currentTarget.style.backgroundColor =
                        styleContext.state.backgroundColor;
                    }
                  }}
                >
                  <div className="flex flex-col">
                    <div className="font-medium">
                      {doc.label || "Sem título"}
                    </div>
                    <div
                      className="text-sm"
                      style={{
                        color:
                          styleContext.state.buttonHoverColorWeight === "200"
                            ? "#6B7280"
                            : "#9CA3AF",
                      }}
                    >
                      {doc.type}
                    </div>
                  </div>
                  <IconButton
                    aria-label="Remover documento"
                    icon={<FaTrash />}
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveDocument(doc.id);
                    }}
                    style={{
                      backgroundColor:
                        styleContext.state.buttonHoverColorWeight === "200"
                          ? "#F3F4F6"
                          : "#4B5563",
                      color: styleContext.state.textColor,
                    }}
                  />
                </div>
              ))}
          </div>
          <div className="mt-4">
            <button
              onClick={handleAddDocument}
              className="w-full px-4 py-2.5 rounded-lg flex items-center justify-center space-x-2 transition-colors duration-150 font-medium bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <FaPlus size={14} />
              <span>Documento</span>
            </button>
          </div>
        </div>

        <div className="w-3/4 pl-4">
          {!selectedDocumentId && (
            <div className="flex flex-col mt-4 items-center justify-center min-h-[220px] text-gray-500">
              <FaFileAlt size={36} className="mb-3 opacity-50" />
              <p
                className="text-lg font-medium mb-1"
                style={{ color: styleContext.state.textColor }}
              >
                Nenhum documento selecionado
              </p>
              <p
                className="text-sm mb-4"
                style={{ color: styleContext.state.textColor }}
              >
                Selecione um documento da lista ao lado ou crie um novo
              </p>
              <button
                onClick={handleAddDocument}
                className="px-4 py-2.5 rounded-lg flex items-center justify-center space-x-2 transition-colors duration-150 font-medium bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <FaPlus size={14} />
                <span>Documento</span>
              </button>
            </div>
          )}
          {selectedDocumentId &&
            documents.find((doc) => doc.id === selectedDocumentId) && (
              <div className="grid grid-cols-2 gap-6">
                <FormControl>
                  <FormLabel style={{ color: styleContext.state.textColor }}>
                    ID
                  </FormLabel>
                  <Tooltip label="Identificador único do documento">
                    <Input
                      value={selectedDocumentId}
                      size="lg"
                      readOnly
                      className="cursor-not-allowed"
                    />
                  </Tooltip>
                  <FormHelperText
                    style={{ color: styleContext.state.textColor }}
                  >
                    Identificador único para este documento
                  </FormHelperText>
                </FormControl>

                <FormControl>
                  <FormLabel style={{ color: styleContext.state.textColor }}>
                    Tipo
                  </FormLabel>
                  <Select
                    value={
                      documents.find((doc) => doc.id === selectedDocumentId)
                        ?.type
                    }
                    onChange={(e) =>
                      handleChangeDocumentType(
                        e.target.value as DocumentTemplateType
                      )
                    }
                    size="lg"
                  >
                    <option value="document">Documento</option>
                    <option value="plate">Placa</option>
                    <option value="custom">Personalizado</option>
                    <option value="certificate">Certidão</option> 
                  </Select>
                  <FormHelperText
                    style={{ color: styleContext.state.textColor }}
                  >
                    Tipo de documento a ser gerado
                  </FormHelperText>
                </FormControl>

                <FormControl>
                  <FormLabel style={{ color: styleContext.state.textColor }}>
                    Nome
                  </FormLabel>
                  <Input
                    value={
                      documents.find((doc) => doc.id === selectedDocumentId)
                        ?.label || ""
                    }
                    onChange={(e) =>
                      handleChangeDocumentField("label", e.target.value)
                    }
                    placeholder="Ex: Documento de Autorização"
                    size="lg"
                  />
                  <FormHelperText
                    style={{ color: styleContext.state.textColor }}
                  >
                    Nome descritivo para este documento
                  </FormHelperText>
                </FormControl>

                <FormControl>
                  <FormLabel style={{ color: styleContext.state.textColor }}>
                    Documentação
                  </FormLabel>
                  <Textarea
                    value={
                      documents.find((doc) => doc.id === selectedDocumentId)
                        ?.documentation || ""
                    }
                    onChange={(e) =>
                      handleChangeDocumentField("documentation", e.target.value)
                    }
                    placeholder="Descreva o propósito deste documento..."
                    size="lg"
                    rows={4}
                  />
                  <FormHelperText
                    style={{ color: styleContext.state.textColor }}
                  >
                    Descrição detalhada do propósito deste documento
                  </FormHelperText>
                </FormControl>
              </div>
            )}
        </div>
      </div>

      {selectedDocumentId &&
        documents.find((doc) => doc.id === selectedDocumentId) && (
          <div
            style={{ backgroundColor: styleContext.state.backgroundColor }}
            className="rounded-lg"
          >
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList
                className="border-b px-4"
                style={{
                  borderColor:
                    styleContext.state.buttonHoverColorWeight === "200"
                      ? "#E5E7EB"
                      : "#374151",
                  backgroundColor: "transparent",
                }}
              >
                <TabsTrigger
                  value="editor"
                  style={{ color: styleContext.state.textColor }}
                >
                  Editor
                </TabsTrigger>
                <TabsTrigger
                  value="preview"
                  style={{ color: styleContext.state.textColor }}
                >
                  Prévia
                </TabsTrigger>
              </TabsList>

              <TabsContent value="editor">
                {renderTemplateEditor(
                  documents.find((doc) => doc.id === selectedDocumentId)!
                )}
              </TabsContent>
              <TabsContent value="preview">
                {renderTemplateEditor(
                  documents.find((doc) => doc.id === selectedDocumentId)!
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
    </div>
  );
};
