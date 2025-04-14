import { Editor, OnValidate } from "@monaco-editor/react";
import debounce from "lodash.debounce";
import { useCallback, useContext, useState, useRef, useEffect } from "react";
import { StyleContext } from "../../../reducers";

export type CodeEditorProps = {
  value: string;
  language?: "json" | "javascript" | "html";
  height?: string;
  onChange: (value: string) => void;
  onValidate?: OnValidate;
  readOnly?: boolean;
};

export const CodeEditor = ({
  value,
  language = "json",
  height,
  onChange,
  onValidate,
  readOnly = false,
}: CodeEditorProps): JSX.Element => {
  const styleContext = useContext(StyleContext);
  const [localValue, setLocalValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);
  const editorRef = useRef<any>(null);

  useEffect(() => {
    if (readOnly) {
      setLocalValue(value);
    }
  }, [value, readOnly]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedOnChange = useCallback(
    debounce((value: string) => {
      onChange(value);
    }, 300),
    [onChange]
  );

  const handleChange = (value: string | undefined) => {
    if (readOnly) return;
    const newValue = value ?? "";
    setLocalValue(newValue);
    debouncedOnChange(newValue);
  };

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
    editor.onDidFocusEditorWidget(() => setIsFocused(true));
    editor.onDidBlurEditorWidget(() => setIsFocused(false));

    // Add keyboard event listener for Escape key
    editor.onKeyDown((e: any) => {
      if (e.browserEvent.key === "Escape") {
        const editorDomNode = editor.getDomNode();
        if (editorDomNode) {
          const textArea = editorDomNode.querySelector("textarea");
          if (textArea) {
            e.stopPropagation();
            textArea.blur();
            setIsFocused(false);
          }
        }
      }
    });
  };

  return (
    <div
      className="rounded-lg border dark:border-gray-700 overflow-hidden"
      style={{
        width: "100%",
        height: height ?? "100vh",
        backgroundColor:
          styleContext.state.backgroundColor === "#000000"
            ? "#1E1E1E"
            : "#FFFFFF",
      }}
    >
      <div className="h-full rounded-lg">
        <Editor
          height="100%"
          defaultLanguage={language}
          value={localValue}
          theme={
            styleContext.state.backgroundColor === "#000000"
              ? "vs-dark"
              : "vs-light"
          }
          onChange={handleChange}
          onValidate={onValidate}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            overviewRulerBorder: false,
            roundedSelection: false,
            padding: { top: 8, bottom: 8 },
            readOnly: readOnly,
            fixedOverflowWidgets: true,
            scrollbar: {
              alwaysConsumeMouseWheel: isFocused,
            },
          }}
          className="rounded-lg"
        />
      </div>
    </div>
  );
};
