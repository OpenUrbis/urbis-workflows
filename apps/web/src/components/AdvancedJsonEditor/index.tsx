import { Editor } from "@monaco-editor/react";
import { useEffect, useState } from "react";
import { FaTimes } from "react-icons/fa";
import { IconButton } from "../LegacyUi";
import {
  isValidJsonAny,
  isValidJsonStr,
} from "../../modules/workflows-schema/form-engine/utils/is-valid-json-str";
import { JsonViewer } from "../JsonViewer";
import { onEditFn } from "../JsonViewer/index.dto";
import { IEditorControl } from "./index.dto";
import "./style.css";

export interface IAdvancedJsonEditorProp {
  data: any;
  onChange?: (data: any) => void;
}

export const AdvancedJsonEditor = (props: IAdvancedJsonEditorProp) => {
  const { data, onChange } = props;

  const [tabIndex, setTabIndex] = useState(0);
  const [editors, setEditors] = useState<IEditorControl[]>([]);
  const [internalData, setInternalData] = useState<any>(data);

  const onEdit: onEditFn = (value: any, path: string[]) => {
    const indexOpenend = editors.findIndex(
      (editor) => JSON.stringify(editor.path) === JSON.stringify(path)
    );
    if (indexOpenend >= 0) return setTabIndex(indexOpenend);

    const newEditor: IEditorControl = {
      value: isValidJsonAny(value) ? JSON.stringify(value) : value,
      path,
      id: window.self.crypto.randomUUID(),
    };

    setEditors((arr) => [...arr, newEditor]);
  };

  const closeTab = (id: string) =>
    setEditors((v) => v.filter((b) => b.id !== id));

  const changeEditor = (value: string, path: string[]) => {
    try {
      if (!path.length) return setInternalData(value);

      let setObjString = `data`;

      path.forEach((element) => {
        setObjString += `["${element}"]`;
      });

      setObjString += ` = ${isValidJsonStr(value) ? value : "'" + value + "'"}`;

      // eslint-disable-next-line no-new-func
      const func = new Function("data", `${setObjString}; return data;`);
      const newValue = { ...func(internalData) };

      setInternalData(newValue);
    } catch (err) {
      console.error("Error when set", err);
    }
  };

  const renderTabs = () => {
    if (!editors.length)
      return (
        <div className="no-selected">
          Selecione no visualizador de JSON a esquerda para editar
        </div>
      );

    return (
      <div className="flex flex-col h-full">
        <div className="flex flex-wrap gap-1 border-b px-2 py-1">
          {editors.map((editor, i) => {
            const isActive = tabIndex === i;
            return (
              <button
                key={editor.id}
                type="button"
                onClick={() => setTabIndex(i)}
                className={`inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm ${
                  isActive ? "bg-muted" : "hover:bg-muted/50"
                }`}
              >
                <span className="tab-name">
                  {editor.path.length
                    ? ["root", ...editor.path].join(".")
                    : "root"}
                </span>
                <IconButton
                  aria-label="Close tab"
                  onClick={(e: any) => {
                    e.stopPropagation();
                    closeTab(editor.id);
                  }}
                  className="h-6 w-6"
                  icon={<FaTimes />}
                />
              </button>
            );
          })}
        </div>

        <div className="flex-1">
          {editors.map((editor, index) => {
            if (index !== tabIndex) return null;
            return (
              <Editor
                key={editor.id}
                height="80vh"
                defaultLanguage="json"
                defaultValue={editor.value}
                theme="vs-dark"
                onChange={(value) => changeEditor(value ?? "", editor.path)}
                beforeMount={(monaco) =>
                  setEditors((editors) => {
                    editors[index].monaco = monaco;
                    return editors;
                  })
                }
              />
            );
          })}
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (onChange) onChange(internalData);
  }, [internalData, onChange]);

  return (
    <div className="advanced-json-editor">
      <div className="json">
        <JsonViewer data={internalData} onEdit={onEdit} />
      </div>
      <div className="editor">{renderTabs()}</div>
    </div>
  );
};
