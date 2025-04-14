import { FormControl, FormLabel } from "@chakra-ui/react";
import { useContext, useEffect, useState } from "react";
import { Input, SL, Select, Textarea } from "../../../components";
import { HotkeyContext } from "../../../reducers";
import {
  ConstantTypeEnum,
  CreateConstantVariableHttpDto,
} from "../../../api/types/constant-variables.dto";
import { CodeEditor } from "./CodeEditor";
import DynamicTable from "./DynamicTable";
import { FaPlus } from "react-icons/fa";

export type AddEnvironmentProps = {
  onAddEnvironment: (environment: CreateConstantVariableHttpDto) => void;
  fixedButton?: boolean;
};

export const AddEnvironment: React.FC<AddEnvironmentProps> = ({
  onAddEnvironment,
  fixedButton = true,
}): JSX.Element => {
  const hotkeyContext = useContext(HotkeyContext);
  const [newEnvironmentForm, setNewEnvironmentForm] =
    useState<CreateConstantVariableHttpDto>({
      label: "",
      documentation: "",
      namespace: "",
      type: ConstantTypeEnum.STRING,
      value: "",
      commit: "",
    });

  useEffect(() => {
    hotkeyContext.dispatch({
      type: "SET_HOTKEY",
      payload: {
        [fixedButton ? "S" : "N"]: () => {
          if (
            (newEnvironmentForm.label || "").length > 0 &&
            (newEnvironmentForm.documentation || "").length > 0 &&
            newEnvironmentForm.type &&
            (newEnvironmentForm.namespace || "").length > 0 &&
            (newEnvironmentForm.value || "").length > 0
          ) {
            onAddEnvironment({
              ...newEnvironmentForm,
              commit: "Adicionando nova variável de ambiente",
            });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newEnvironmentForm, fixedButton]);

  const isValueValid = (value: any, type: ConstantTypeEnum): boolean => {
    if (value === undefined || value === null) return false;
    switch (type) {
      case ConstantTypeEnum.STRING:
        return value.toString().length > 0;
      case ConstantTypeEnum.NUMBER:
        return !isNaN(Number(value));
      case ConstantTypeEnum.BOOLEAN:
        return (
          typeof value === "boolean" || value === "true" || value === "false"
        );
      case ConstantTypeEnum.DATE:
        return value.toString().length > 0;
      case ConstantTypeEnum.OBJECT:
        return (
          typeof value === "object" ||
          (typeof value === "string" && value.length > 0)
        );
      case ConstantTypeEnum.TABLE:
        return value?.headers?.length > 0 && value?.rows?.length > 0;
      default:
        return false;
    }
  };

  const addButton = (
    <button
      className="px-6 py-2.5 rounded-lg shadow-lg flex items-center space-x-2 transition-colors duration-200 bg-yellow-600 hover:bg-yellow-700 text-white disabled:opacity-80 cursor-pointer"
      disabled={
        !newEnvironmentForm.label ||
        !newEnvironmentForm.documentation ||
        !newEnvironmentForm.namespace ||
        newEnvironmentForm.type === undefined ||
        !isValueValid(newEnvironmentForm.value, newEnvironmentForm.type)
      }
      onClick={() =>
        onAddEnvironment({
          ...newEnvironmentForm,
          commit: "Adicionando nova variável de ambiente",
        })
      }
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
            Adicionar Variável
          </label>
        </div>
      </div>

      <div className="flex flex-col space-y-4">
        <FormControl id="namespace">
          <FormLabel>Chave</FormLabel>
          <Input
            placeholder="dir0/dir1/filename"
            size="lg"
            value={newEnvironmentForm?.namespace}
            onChange={(e) =>
              setNewEnvironmentForm({
                ...newEnvironmentForm,
                namespace: e.target.value,
              })
            }
          />
        </FormControl>

        <FormControl id="label">
          <FormLabel>Título</FormLabel>
          <Input
            placeholder="Título da variável de ambiente"
            size="lg"
            value={newEnvironmentForm?.label}
            onChange={(e) =>
              setNewEnvironmentForm({
                ...newEnvironmentForm,
                label: e.target.value,
              })
            }
          />
        </FormControl>

        <FormControl id="documentation">
          <FormLabel>Descrição</FormLabel>
          <Textarea
            placeholder="Descrição da variável de ambiente"
            size="lg"
            value={newEnvironmentForm?.documentation}
            onChange={(e) =>
              setNewEnvironmentForm({
                ...newEnvironmentForm,
                documentation: e.target.value,
              })
            }
          />
        </FormControl>

        <FormControl id="type">
          <FormLabel>Tipo</FormLabel>
          <Select
            placeholder="Tipo da variável de ambiente"
            size="lg"
            value={newEnvironmentForm?.type}
            onChange={(e) =>
              setNewEnvironmentForm({
                ...newEnvironmentForm,
                type: Number(e.target.value) as ConstantTypeEnum,
              })
            }
          >
            <option value={ConstantTypeEnum.STRING}>Texto</option>
            <option value={ConstantTypeEnum.NUMBER}>Número</option>
            <option value={ConstantTypeEnum.BOOLEAN}>Booleano</option>
            <option value={ConstantTypeEnum.DATE}>Data</option>
            <option value={ConstantTypeEnum.OBJECT}>Objeto</option>
            <option value={ConstantTypeEnum.TABLE}>Tabela</option>
          </Select>
        </FormControl>

        <EnvironmentValueForm
          value={newEnvironmentForm?.value}
          type={newEnvironmentForm?.type}
          setValue={(value: any) => {
            setNewEnvironmentForm({
              ...newEnvironmentForm,
              value,
            });
          }}
        />

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

export function EnvironmentValueForm({
  value,
  type,
  setValue,
  isDisabled = false,
}: {
  value: any;
  type: ConstantTypeEnum;
  setValue: (value: any) => void;
  isDisabled?: boolean;
}): JSX.Element {
  const convertValue = (value: any, type: ConstantTypeEnum): any => {
    switch (type) {
      case ConstantTypeEnum.STRING:
        return value;
      case ConstantTypeEnum.NUMBER:
        if (value === "" || value === null || value === undefined) return 0;
        const num = Number(value);
        return isNaN(num) ? 0 : num;
      case ConstantTypeEnum.BOOLEAN:
        return value === "true";
      case ConstantTypeEnum.DATE:
        return value;
      case ConstantTypeEnum.OBJECT:
        try {
          return typeof value === "string" ? JSON.parse(value) : value;
        } catch (e) {
          return {};
        }
      case ConstantTypeEnum.TABLE:
        return value;
      default:
        return value;
    }
  };

  const handleValueChange = (value: any) => {
    const convertedValue = convertValue(value, type);
    setValue(convertedValue);
  };

  return (
    <FormControl id="value">
      <FormLabel>Valor</FormLabel>
      {type === ConstantTypeEnum.STRING && (
        <Textarea
          placeholder="Valor da variável de ambiente"
          size="lg"
          value={value}
          onChange={(e) => handleValueChange(e.target.value)}
          isDisabled={isDisabled}
        />
      )}
      {type === ConstantTypeEnum.NUMBER && (
        <Input
          placeholder="Valor numérico"
          size="lg"
          type="number"
          value={value}
          onChange={(e) => {
            handleValueChange(
              e.target.value.trim() === "" ? "" : Number(e.target.value)
            );
          }}
          isDisabled={isDisabled}
        />
      )}
      {type === ConstantTypeEnum.BOOLEAN && (
        <Select
          size="lg"
          placeholder="Selecione um valor"
          value={value?.toString()}
          onChange={(e) => handleValueChange(e.target.value)}
          isDisabled={isDisabled}
        >
          <option value="true">Verdadeiro</option>
          <option value="false">Falso</option>
        </Select>
      )}
      {type === ConstantTypeEnum.DATE && (
        <Input
          type="date"
          size="lg"
          value={value}
          onChange={(e) => handleValueChange(e.target.value)}
          isDisabled={isDisabled}
        />
      )}
      {type === ConstantTypeEnum.OBJECT && (
        <CodeEditor
          value={
            typeof value !== "string" ? JSON.stringify(value) : (value ?? "{}")
          }
          onChange={(value) => {
            handleValueChange(value);
          }}
          language="json"
          height="50vh"
          readOnly={isDisabled}
        />
      )}
      {type === ConstantTypeEnum.TABLE && (
        <DynamicTable
          value={value}
          onChange={isDisabled ? () => {} : handleValueChange}
          isDisabled={isDisabled}
        />
      )}
    </FormControl>
  );
}
