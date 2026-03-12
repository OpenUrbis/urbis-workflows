import { useContext, useState } from "react";
import { FieldTypeEnum, IField, IFormContext } from "@open-urbis/types";
import { FieldEditable } from "../form-engine/FieldEditable";
import { FaPlus, FaTrash, FaSignature } from "react-icons/fa";
import {
  IconButton,
  FormControl,
  FormLabel,
  Tooltip,
  FormHelperText,
} from "@chakra-ui/react";
import { SignatureConfig } from "../../../api/types/schema";
import { StyleContext } from "../../../reducers";
import { Input, Textarea } from "../../../components";

export type SignatureEditorProps = {
  signatures: SignatureConfig[];
  general: IFormContext;
  onChange: (value: SignatureConfig[]) => void;
};

export const ActivitySignatureEditor = ({
  signatures,
  general,
  onChange,
}: SignatureEditorProps): JSX.Element => {
  const [selectedSignatureId, setSelectedSignatureId] = useState<string>("");
  const [value, setValue] = useState<any>({});
  const [valid, setValid] = useState<any>({});
  const styleContext = useContext(StyleContext);

  const handleSignatureChange = (value: IField) => {
    const newSignatures = signatures.map((sig) =>
      sig.id === selectedSignatureId ? { ...sig, form: value } : sig
    );
    onChange(newSignatures);
  };

  const handleChangeSignatureField = (field: string, newValue: string) => {
    const newSignatures = signatures.map((sig) =>
      sig.id === selectedSignatureId ? { ...sig, [field]: newValue } : sig
    );
    onChange(newSignatures);
  };

  const handleAddSignature = () => {
    const newSignature: SignatureConfig = {
      id: crypto.randomUUID(),
      label: "Novo Tipo de Assinatura",
      documentation: "Descrição do tipo de assinatura",
      namespace: "signatures.new",
      form: {
        type: FieldTypeEnum.Block,
        key: "root",
        options: {
          hideEditMenu: true,
        },
        block: [],
        expressions: {},
      },
    };
    onChange([...signatures, newSignature]);
    setSelectedSignatureId(newSignature.id);
  };

  const handleRemoveSignature = async (id: string) => {
    const response = await confirmation(
      "Tem certeza que deseja remover este formulário de assinatura?"
    );

    if (!response) {
      return;
    }

    setSelectedSignatureId("");
    onChange(signatures.filter((sig) => sig.id !== id));
  };

  return (
    <div className="flex w-full">
      <div className="w-1/4 border-r pr-4">
        <h2
          className="text-xl font-bold mb-4"
          style={{ color: styleContext.state.textColor }}
        >
          Assinaturas
        </h2>
        <div className="space-y-2">
          {signatures
            .sort((a, b) => a.label.localeCompare(b.label))
            .map((signature) => (
              <div
                key={signature.id}
                className={`p-3 border rounded cursor-pointer flex justify-between items-center group transition-colors duration-150`}
                onClick={() => setSelectedSignatureId(signature.id)}
                style={{
                  backgroundColor:
                    signature.id === selectedSignatureId
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
                  if (selectedSignatureId !== signature.id) {
                    e.currentTarget.style.backgroundColor =
                      styleContext.state.buttonHoverColorWeight === "200"
                        ? "#F3F4F6"
                        : "#4B5563";
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedSignatureId !== signature.id) {
                    e.currentTarget.style.backgroundColor =
                      styleContext.state.backgroundColor;
                  }
                }}
              >
                <div className="flex flex-col">
                  <div className="font-medium">
                    {signature.label || "Sem título"}
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
                    {signature.namespace || "Sem namespace"}
                  </div>
                </div>
                <IconButton
                  aria-label="Remover tipo de assinatura"
                  icon={<FaTrash />}
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveSignature(signature.id);
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
            onClick={handleAddSignature}
            className="w-full px-4 py-2.5 rounded-lg flex items-center justify-center space-x-2 transition-colors duration-150 font-medium"
            style={{
              backgroundColor:
                styleContext.state.buttonHoverColorWeight === "200"
                  ? "#ca8a04"
                  : "#854d0e",
              color: "#ffffff",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor =
                styleContext.state.buttonHoverColorWeight === "200"
                  ? "#a16207"
                  : "#713f12";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor =
                styleContext.state.buttonHoverColorWeight === "200"
                  ? "#ca8a04"
                  : "#854d0e";
            }}
          >
            <FaPlus size={14} />
            <span>Assinatura</span>
          </button>
        </div>
      </div>

      <div className="w-3/4 pl-4">
        {selectedSignatureId &&
          signatures.find((sig) => sig.id === selectedSignatureId) && (
            <div className="mb-8">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <FormControl>
                  <FormLabel style={{ color: styleContext.state.textColor }}>
                    ID
                  </FormLabel>
                  <Tooltip label="Identificador único do tipo de assinatura">
                    <Input value={selectedSignatureId} size="lg" readOnly />
                  </Tooltip>
                  <FormHelperText
                    style={{ color: styleContext.state.textColor }}
                  >
                    Identificador único para este tipo de assinatura
                  </FormHelperText>
                </FormControl>

                <FormControl>
                  <FormLabel style={{ color: styleContext.state.textColor }}>
                    Nome
                  </FormLabel>
                  <Input
                    value={
                      signatures.find((sig) => sig.id === selectedSignatureId)
                        ?.label || ""
                    }
                    onChange={(e) =>
                      handleChangeSignatureField("label", e.target.value)
                    }
                    placeholder="Ex: Assinatura do Responsável"
                    size="lg"
                  />
                  <FormHelperText
                    style={{ color: styleContext.state.textColor }}
                  >
                    Nome descritivo para este tipo de assinatura
                  </FormHelperText>
                </FormControl>

                <FormControl>
                  <FormLabel style={{ color: styleContext.state.textColor }}>
                    Namespace
                  </FormLabel>
                  <Input
                    value={
                      signatures.find((sig) => sig.id === selectedSignatureId)
                        ?.namespace || ""
                    }
                    onChange={(e) =>
                      handleChangeSignatureField("namespace", e.target.value)
                    }
                    placeholder="Ex: signatures.responsible"
                    size="lg"
                  />
                  <FormHelperText
                    style={{ color: styleContext.state.textColor }}
                  >
                    Identificador único para este tipo de assinatura
                  </FormHelperText>
                </FormControl>

                <FormControl>
                  <FormLabel style={{ color: styleContext.state.textColor }}>
                    Documentação
                  </FormLabel>
                  <Textarea
                    value={
                      signatures.find((sig) => sig.id === selectedSignatureId)
                        ?.documentation || ""
                    }
                    onChange={(e) =>
                      handleChangeSignatureField(
                        "documentation",
                        e.target.value
                      )
                    }
                    placeholder="Descreva o propósito deste tipo de assinatura..."
                    size="lg"
                    rows={4}
                  />
                  <FormHelperText
                    style={{ color: styleContext.state.textColor }}
                  >
                    Descrição detalhada do propósito desta assinatura
                  </FormHelperText>
                </FormControl>
              </div>

              <div className="border-t pt-6">
                <div
                  className="font-medium mb-4"
                  style={{ color: styleContext.state.textColor }}
                >
                  Campos do Formulário
                </div>
                {signatures.find((sig) => sig.id === selectedSignatureId)
                  ?.form && (
                  <FieldEditable
                    context={value}
                    validContext={valid}
                    general={general}
                    field={
                      signatures.find((sig) => sig.id === selectedSignatureId)!
                        .form!
                    }
                    value={value}
                    valid={valid}
                    onChange={setValue}
                    onValidChange={setValid}
                    onConfigChange={handleSignatureChange}
                    onRemove={() => {}}
                  />
                )}
              </div>
            </div>
          )}
        {!selectedSignatureId && (
          <div className="flex flex-col mt-6 items-center justify-center h-full text-gray-500">
            <FaSignature size={48} className="mb-4 opacity-50" />
            <p
              className="text-xl font-medium mb-2"
              style={{ color: styleContext.state.textColor }}
            >
              Nenhuma assinatura selecionada
            </p>
            <p
              className="text-sm mb-6"
              style={{ color: styleContext.state.textColor }}
            >
              Selecione uma assinatura da lista ao lado ou crie uma nova
            </p>
            <button
              onClick={handleAddSignature}
              className="px-4 py-2.5 rounded-lg flex items-center justify-center space-x-2 transition-colors duration-150 font-medium"
              style={{
                backgroundColor:
                  styleContext.state.buttonHoverColorWeight === "200"
                    ? "#ca8a04"
                    : "#854d0e",
                color: "#ffffff",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  styleContext.state.buttonHoverColorWeight === "200"
                    ? "#a16207"
                    : "#713f12";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor =
                  styleContext.state.buttonHoverColorWeight === "200"
                    ? "#ca8a04"
                    : "#854d0e";
              }}
            >
              <FaPlus size={14} />
              <span>Assinatura</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
