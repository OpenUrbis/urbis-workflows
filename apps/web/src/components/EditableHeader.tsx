import React, {
  useState,
  CSSProperties,
  useContext,
  useRef,
  useEffect,
} from "react";
import { FaPencilAlt } from "react-icons/fa";
import { StyleContext } from "../reducers/style.reducer";
import { CodeViewerModal } from "../modules/workflows-schema/components/CodeViewerModal";

interface EditableHeaderProps {
  html?: string;
  value?: string;
  onTextChange?: (newText: string) => void;
  className?: string;
  style?: CSSProperties;
  readOnly?: boolean;
}

const EditableHeader: React.FC<EditableHeaderProps> = ({
  html,
  value,
  onTextChange,
  className,
  style,
  readOnly,
}) => {
  const styleContext = useContext(StyleContext);
  const [isEditing, setIsEditing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentValue, setCurrentValue] = useState(value || "");
  const contentRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    setCurrentValue(value || "");
  }, [value]);

  const handleBlur = (e: React.FocusEvent<HTMLElement>) => {
    setIsEditing(false);
    if (!html) {
      const newText = contentRef.current?.innerText || "";
      if (onTextChange) {
        if (newText.trim().length === 0) {
          setCurrentValue("Clique para editar");
          onTextChange("Clique para editar");
        } else {
          setCurrentValue(newText);
          onTextChange(newText);
        }
      }
    }
  };

  const handleClick = () => {
    if (html && !readOnly) {
      setIsModalOpen(true);
    }
    setIsEditing(true);
  };

  const handleFocus = () => {
    setIsEditing(true);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLHeadingElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  };

  const handleModalSave = ({ code }: { code: string }) => {
    if (onTextChange) {
      onTextChange(code);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  const containerStyle = `relative ${readOnly ? "" : "cursor-pointer"} ${className || ""}`;
  const emptyStyle = "text-gray-400 italic min-w-[140px]";
  const nonEmptyStyle = "";
  const editingStyle =
    "outline-none border-b-2 border-primary focus:border-primary";

  return (
    <div>
      {html && (
        <div className={containerStyle}>
          <div className="relative inline-block group">
            <h1
              contentEditable={false}
              onClick={handleClick}
              className={`${html?.length === 0 || !html ? emptyStyle : nonEmptyStyle} ${isEditing ? editingStyle : ""}`}
              style={style}
              dangerouslySetInnerHTML={{
                __html: html ?? "Clique para editar",
              }}
            />
            {!readOnly && (
              <div
                className={`absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center ${
                  isEditing ? "hidden" : ""
                }`}
              >
                <div
                  className="rounded-full p-2 transition-colors duration-200"
                  style={{
                    backgroundColor:
                      styleContext.state.buttonHoverColorWeight === "200"
                        ? "rgb(0 0 0 / 0.1)"
                        : "rgb(255 255 255 / 0.15)",
                  }}
                >
                  <FaPencilAlt
                    size={14}
                    style={{
                      color:
                        styleContext.state.buttonHoverColorWeight === "200"
                          ? "rgb(0 0 0 / 0.6)"
                          : "rgb(255 255 255 / 0.8)",
                    }}
                  />
                </div>
              </div>
            )}
          </div>
          <CodeViewerModal
            isOpen={isModalOpen}
            onClose={handleModalClose}
            title="Editar o bloco de texto"
            code={html}
            language="html"
            onSave={handleModalSave}
            readOnly={false}
          />
        </div>
      )}
      {!html && (
        <div className={containerStyle}>
          <div className="relative inline-block group">
            <h1
              ref={contentRef}
              contentEditable={!readOnly}
              onBlur={handleBlur}
              onFocus={handleFocus}
              onPaste={handlePaste}
              onKeyDown={handleKeyDown}
              className={`${!currentValue || currentValue.length === 0 || currentValue === "Clique para editar" ? emptyStyle : nonEmptyStyle} ${isEditing ? editingStyle : ""}`}
              style={style}
              suppressContentEditableWarning
            >
              {currentValue}
            </h1>
            {!readOnly && (
              <div
                className={`absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center ${
                  isEditing ? "hidden" : ""
                }`}
              >
                <div
                  className="rounded-full p-2 transition-colors duration-200"
                  style={{
                    backgroundColor:
                      styleContext.state.buttonHoverColorWeight === "200"
                        ? "rgb(0 0 0 / 0.7)"
                        : "rgb(255 255 255 / 0.9)",
                  }}
                >
                  <FaPencilAlt
                    size={14}
                    style={{
                      color:
                        styleContext.state.buttonHoverColorWeight === "200"
                          ? "rgb(255 255 255 / 0.6)"
                          : "rgb(0 0 0 / 0.4)",
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EditableHeader;
