import React, { useContext } from "react";
import { FormControl, FormLabel, IconButton } from "../../../../components/LegacyUi";
import { FaTrash } from "react-icons/fa";
import EditableHeader from "../../../../components/EditableHeader";
import { CodeModule } from "../../../../api/types/schema";
import { StyleContext } from "../../../../reducers/style.reducer";
import { CodeEditor } from "../../components/CodeEditor";
import { Input } from "../../../../components";

interface CodeModuleEditorProps {
  codeModule: CodeModule;
  onUpdate: (updates: Partial<CodeModule>) => void;
  onRemove: () => void;
  isGlobal?: boolean;
}

export const CodeModuleEditor: React.FC<CodeModuleEditorProps> = ({
  codeModule,
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
            value={codeModule.label || ""}
            onTextChange={
              isGlobal ? () => {} : (text) => onUpdate({ label: text })
            }
            className="text-xl font-bold"
            style={{ color: styleContext.state.textColor }}
            readOnly={isGlobal}
          />
          <EditableHeader
            value={codeModule.documentation || ""}
            onTextChange={
              isGlobal ? () => {} : (text) => onUpdate({ documentation: text })
            }
            className="text-gray-600"
            readOnly={isGlobal}
          />
        </div>
        <IconButton
          aria-label="Remove code module"
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
          value={codeModule.namespace || ""}
          onChange={(e) => onUpdate({ namespace: e.target.value })}
          isDisabled={isGlobal}
        />
      </FormControl>

      <FormControl>
        <FormLabel>Código</FormLabel>
        <CodeEditor
          key={`code-editor-${codeModule.id || codeModule.namespace}`}
          height="60vh"
          language="javascript"
          value={codeModule.code || ""}
          onChange={(value) => onUpdate({ code: value })}
          readOnly={isGlobal}
        />
      </FormControl>
    </div>
  );
};
