import React from "react";
import { FormControl, FormLabel, IconButton } from "../../../../components/LegacyUi";
import { FaTrash } from "react-icons/fa";
import EditableHeader from "../../../../components/EditableHeader";
import {
  ConstantVariable,
  ConstantTypeEnum,
} from "../../../../api/types/schema";
import { StyleContext } from "../../../../reducers/style.reducer";
import { useContext } from "react";
import { EnvironmentValueForm } from "../../components/AddEnvironment";
import { Input } from "../../../../components";

interface ConstantEditorProps {
  constant: ConstantVariable;
  onUpdate: (updates: Partial<ConstantVariable>) => void;
  onRemove: () => void;
  isGlobal?: boolean;
}

const getConstantTypeLabel = (type: ConstantTypeEnum): string => {
  switch (type) {
    case ConstantTypeEnum.STRING:
      return "Texto";
    case ConstantTypeEnum.NUMBER:
      return "Número";
    case ConstantTypeEnum.BOOLEAN:
      return "Booleano";
    case ConstantTypeEnum.DATE:
      return "Data";
    case ConstantTypeEnum.OBJECT:
      return "Objeto";
    case ConstantTypeEnum.TABLE:
      return "Tabela";
    default:
      return "Desconhecido";
  }
};

export const ConstantEditor: React.FC<ConstantEditorProps> = ({
  constant,
  onUpdate,
  onRemove,
  isGlobal = false,
}) => {
  const styleContext = useContext(StyleContext);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex-grow">
          <EditableHeader
            value={constant.label || ""}
            onTextChange={
              isGlobal ? () => {} : (text) => onUpdate({ label: text })
            }
            className="text-xl font-bold"
            style={{ color: styleContext.state.textColor }}
            readOnly={isGlobal}
          />
          <EditableHeader
            value={constant.documentation || ""}
            onTextChange={
              isGlobal ? () => {} : (text) => onUpdate({ documentation: text })
            }
            className="text-gray-600"
            readOnly={isGlobal}
          />
        </div>
        <IconButton
          aria-label="Remove constant"
          icon={<FaTrash />}
          style={{
            color:
              styleContext.state.buttonHoverColorWeight === "200"
                ? "#dc2626"
                : "#fca5a5",
            backgroundColor: "transparent",
          }}
          onClick={onRemove}
        />
      </div>
      <FormControl>
        <FormLabel>Chave</FormLabel>
        <Input
          value={constant.namespace || ""}
          onChange={(e) => onUpdate({ namespace: e.target.value })}
          isDisabled={isGlobal}
        />
      </FormControl>
      <FormControl>
        <FormLabel>Tipo</FormLabel>
        <Input value={getConstantTypeLabel(constant.type!)} isDisabled />
      </FormControl>
      {constant.type && (
        <EnvironmentValueForm
          value={constant.value}
          type={constant.type}
          setValue={(value) => onUpdate({ value })}
          isDisabled={isGlobal}
        />
      )}
    </div>
  );
};
