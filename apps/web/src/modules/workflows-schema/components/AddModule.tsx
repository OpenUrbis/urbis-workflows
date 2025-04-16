import { FormControl, FormLabel } from "@chakra-ui/react";
import { useContext, useEffect, useState } from "react";
import { Input, SL, Textarea } from "../../../components";
import { HotkeyContext } from "../../../reducers";
import { CreateCodeModuleHttpDto } from "../../../api/types/code-modules.dto";
import { CodeEditor } from "./CodeEditor";
import { FaPlus } from "react-icons/fa";

export type AddModuleProps = {
  onAddFunction: (fun: CreateCodeModuleHttpDto) => void;
  fixedButton?: boolean;
};

export const AddModule: React.FC<AddModuleProps> = ({
  onAddFunction,
  fixedButton = true,
}): JSX.Element => {
  const hotkeyContext = useContext(HotkeyContext);
  const [newFunctionForm, setNewFunctionForm] =
    useState<CreateCodeModuleHttpDto>({
      label: "",
      namespace: "",
      documentation: "",
      code: "",
      commit: "",
    });

  useEffect(() => {
    hotkeyContext.dispatch({
      type: "SET_HOTKEY",
      payload: {
        [fixedButton ? "S" : "N"]: () => {
          if (
            newFunctionForm.label.length > 0 &&
            newFunctionForm.documentation.length > 0 &&
            newFunctionForm.code.length > 0
          ) {
            onAddFunction(newFunctionForm);
          }
        },
      },
    });

    return () => {
      hotkeyContext.dispatch({
        type: "UNSET_HOTKEY",
        delete: [fixedButton ? "S" : "N"],
      });
    };
    
  }, [newFunctionForm, fixedButton]);

  const addButton = (
    <button
      className="px-6 py-2.5 rounded-lg shadow-lg flex items-center space-x-2 transition-colors duration-200 bg-yellow-600 hover:bg-yellow-700 text-white disabled:opacity-80"
      disabled={
        !newFunctionForm.label ||
        !newFunctionForm.namespace ||
        !newFunctionForm.documentation ||
        !newFunctionForm.code
      }
      onClick={() => onAddFunction(newFunctionForm)}
    >
      <FaPlus size={14} />
      <span>Adicionar</span> <SL bg="yellow.600">{fixedButton ? "S" : "N"}</SL>
    </button>
  );

  return (
    <div className={`${!fixedButton ? "mb-24" : "w-4/5 mx-auto"}`}>
      <div className="flex flex-col mx-auto w-full mb-8">
        <div className="flex items-start justify-between">
          <label
            className={`${fixedButton ? "text-2xl md:text-3xl" : "text-xl md:text-2xl"} font-black mb-2`}
          >
            Adicionar Módulo de Código
          </label>
        </div>
      </div>

      <FormControl id="namespace">
        <FormLabel>Chave</FormLabel>
        <Input
          placeholder="dir0/dir1/filename"
          size="lg"
          value={newFunctionForm?.namespace}
          onChange={(e) =>
            setNewFunctionForm({
              ...newFunctionForm,
              namespace: e.target.value,
            })
          }
        />
      </FormControl>

      <div className="flex flex-col space-y-4">
        <FormControl id="label">
          <FormLabel>Título</FormLabel>
          <Input
            placeholder="Título do módulo"
            size="lg"
            value={newFunctionForm?.label}
            onChange={(e) =>
              setNewFunctionForm({
                ...newFunctionForm,
                label: e.target.value,
              })
            }
          />
        </FormControl>

        <FormControl id="documentation">
          <FormLabel>Descrição</FormLabel>
          <Textarea
            placeholder="Descrição do módulo"
            size="lg"
            value={newFunctionForm?.documentation}
            onChange={(e) =>
              setNewFunctionForm({
                ...newFunctionForm,
                documentation: e.target.value,
              })
            }
          />
        </FormControl>

        <FormControl id="code">
          <FormLabel>Código</FormLabel>
          <CodeEditor
            height="60vh"
            language="javascript"
            value={newFunctionForm?.code}
            onChange={(value) =>
              setNewFunctionForm({
                ...newFunctionForm,
                code: value,
              })
            }
          />
        </FormControl>

        {!fixedButton && (
          <div className="flex justify-end mt-8">{addButton}</div>
        )}
      </div>

      {fixedButton && (
        <div className="fixed bottom-16 right-4 flex space-x-4">
          {addButton}
        </div>
      )}
    </div>
  );
};
