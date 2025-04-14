import { Editor } from "@monaco-editor/react";
import * as RootMonaco from "monaco-editor";
import * as EditorApi from "monaco-editor/esm/vs/editor/editor.api";
import { useCallback, useContext, useEffect, useState } from "react";
import { isValidJsonStr } from "../../modules/workflows-schema/form-engine/utils/is-valid-json-str";
import { buildDeclarations, IIntellisense } from "./intellisense";
import { buildLinesTxt, isValidExpression } from "./validation-code";
import { StyleContext } from "../../reducers";

interface IAdvancedEditorDTO {
  /** Valor inicial do editor
   * @default '';
   */
  initialValue?: string;

  /** Função chamada quando o editor valida o código e emite os marcadores */
  onValidate?: (markers: RootMonaco.editor.IMarker[]) => void;

  /** Objeto de configuração do Intellisense */
  intellisense?: IIntellisense;

  /** Altura do editor */
  height?: string;

  /** Função chamada quando há uma alteração de texto no editor */
  onChange?: (value: string) => void;

  /** Função de validação personalizada
   *
   * Ao enviar uma mensagem em string ela é exibida e ao devolver nulo o texto é considerado válido
   *
   * @returns
   * Message: string;
   */
  validatorFn?: (value: string) => string | null;
}

export const AdvancedEditor = ({
  initialValue,
  onValidate,
  intellisense,
  onChange: emitChange = () => {},
  height = "30vh",
  validatorFn,
}: IAdvancedEditorDTO) => {
  const styleContext = useContext(StyleContext);

  const [monaco, setMonaco] = useState<typeof EditorApi | undefined>(undefined);
  const [value, setValue] = useState<string>(initialValue ?? "");
  const [internalErrorMessage, setInternalErrorMessage] = useState<
    string | undefined
  >(undefined);
  const [hasError, setHasError] = useState<boolean>(false);

  const onChange = (value: string) => {
    setValue(value);
    emitChange(value);
  };

  const emitMarkers = () => {
    if (onValidate && monaco) onValidate(monaco?.editor?.getModelMarkers({}));
  };

  // Validações internas do editor avançado
  const validateEditor = (error: RootMonaco.editor.IMarker[]) => {
    if (validatorFn) {
      const result = validatorFn(value);

      if (result) {
        setInternalErrorMessage(result);
      } else {
        setInternalErrorMessage(undefined);
        monaco!.editor.removeAllMarkers("typescript");
      }

      return;
    }

    if (isValidJsonStr(value)) {
      monaco!.editor.removeAllMarkers("typescript");
      setHasError(false);
      setInternalErrorMessage(undefined);

      emitMarkers();
      return true;
    }

    const result = isValidExpression(value);
    setHasError(error.length > 0 || !result.valid);

    if (error.length) {
      setInternalErrorMessage(
        `Há um erro no código, por favor verifique ${buildLinesTxt(error)}<br>
        O JSON que esta escrevendo pode estar inválido`
      );

      // emitMarkers();
      // return false;
      return true;
    }

    if (!result.valid) {
      setInternalErrorMessage(result.message);

      emitMarkers();
      return false;
    } else {
      setInternalErrorMessage(undefined);

      emitMarkers();
      return true;
    }
  };

  // Configurar o autocomplete com documentação (Não é possivel colocar essas informações no topo desta forma)
  const configIntellisense = useCallback(() => {
    if (!monaco?.languages?.typescript?.typescriptDefaults) {
      return;
    }

    if (!intellisense?.obj || !intellisense?.docs) {
      return;
    }

    try {
      const declarations = buildDeclarations(intellisense);
      if (!declarations) {
        return;
      }

      return monaco.languages.typescript.typescriptDefaults.addExtraLib(
        declarations
      );
    } catch (error) {
      console.error("Error configuring intellisense:", error);
      return;
    }
  }, [intellisense, monaco]);

  // Configurar snippets para facilitar o dia a dia
  const configSnippets = useCallback(() => {
    if (!monaco) return;

    return monaco.languages.registerCompletionItemProvider("typescript", {
      provideCompletionItems: () => ({
        suggestions: [
          {
            label: "iife",
            kind: monaco.languages.CompletionItemKind.Snippet,
            // eslint-disable-next-line no-template-curly-in-string
            insertText: "(() => {\n    return ${1:message};\n})();",
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation:
              "Função auto invocada para validações de multiplas linhas",
            range: {
              startColumn: 1,
              endColumn: 1,
              endLineNumber: 1,
              startLineNumber: 1,
            },
          },
        ],
      }),
    });
  }, [monaco]);

  // Inicia o editor
  useEffect(() => {
    if (!monaco) return;

    configIntellisense();
    configSnippets();
  }, [configIntellisense, configSnippets, monaco]);

  const renderError = () => {
    const message = internalErrorMessage;
    if (!hasError || !message) return;

    return (
      <>
        <div role="alert" className="w-full">
          <div className="border border-red-400 rounded bg-red-100 px-4 py-3 text-red-700">
            <span dangerouslySetInnerHTML={{ __html: message }}></span>
          </div>
        </div>
      </>
    );
  };

  return (
    <>
      <Editor
        height={height}
        defaultLanguage="typescript"
        defaultValue={initialValue}
        theme={
          styleContext.state.backgroundColor === "#000000"
            ? "vs-dark"
            : "vs-light"
        }
        onChange={(value) => onChange(value ?? "")}
        onValidate={(error) => validateEditor(error)}
        beforeMount={(monaco) => setMonaco(monaco)}
      />
      {renderError()}
    </>
  );
};
