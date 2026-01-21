import {
  IconButton,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from "@chakra-ui/react";
import { Editor } from "@monaco-editor/react";
import { useEffect, useState } from "react";
import { FaTimes } from "react-icons/fa";
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
      <Tabs
        variant="enclosed"
        index={tabIndex}
        onChange={(i) => {
          setTabIndex(i);
        }}
      >
        <TabList>
          {editors.map((editor) => (
            <Tab key={editor.id}>
              <span className="tab-name">
                {editor.path.length
                  ? ["root", ...editor.path].join(".")
                  : "root"}
              </span>
              <IconButton
                size={"xs"}
                aria-label="Copy item"
                onClick={() => closeTab(editor.id)}
              >
                <FaTimes />
              </IconButton>
            </Tab>
          ))}
        </TabList>
        <TabPanels>
          {editors.map((editor, index) => (
            <TabPanel key={editor.id} padding={0}>
              <Editor
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
            </TabPanel>
          ))}
        </TabPanels>
      </Tabs>
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
