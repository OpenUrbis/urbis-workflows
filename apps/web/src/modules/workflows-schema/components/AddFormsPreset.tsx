import { FormControl, FormLabel, Spinner } from "@chakra-ui/react";
import { useContext, useEffect, useState } from "react";
import { Input, Select, SL, Textarea } from "../../../components";
import { HotkeyContext } from "../../../reducers";
import { CreateFormDto, FormTypeEnum } from "../../../api/types/form.dto";
import { FieldTypeEnum, IField } from "@open-urbis/types";
import { FormEditor } from "./FormEditor";
import { StepEditable } from "../form-engine/fields/StepEditable";
import { FaPlus } from "react-icons/fa";

export type AddFormPresetProps = {
  onAddPreset: (preset: Omit<CreateFormDto, "commit">) => void;
};

export const AddFormsPreset: React.FC<AddFormPresetProps> = ({
  onAddPreset,
}): JSX.Element => {
  const hotkeyContext = useContext(HotkeyContext);
  const [loading, setLoading] = useState(false);
  const [newPresetForm, setNewPresetForm] = useState<
    Omit<CreateFormDto, "commit">
  >({
    label: "",
    documentation: "",
    namespace: "",
    type: FormTypeEnum.FIELD,
    form: {
      type: FieldTypeEnum.Preset,
      key: crypto.randomUUID(),
      options: {
        tooltip: "",
      },
      expressions: {},
      block: [],
      preset: [],
    },
  });

  useEffect(() => {
    hotkeyContext.dispatch({
      type: "SET_HOTKEY",
      payload: {
        S: () => {
          if (
            !loading &&
            newPresetForm.label.length > 0 &&
            newPresetForm.namespace.length > 0 &&
            newPresetForm.documentation.length > 0
          ) {
            handleAddPreset();
          }
        },
      },
    });

    return () => {
      hotkeyContext.dispatch({
        type: "UNSET_HOTKEY",
        delete: ["S"],
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newPresetForm, loading]);

  const handleFormTypeChange = (type: FormTypeEnum) => {
    let formConfig: IField = {
      type: FieldTypeEnum.Preset,
      key: crypto.randomUUID(),
      options: {
        tooltip: "",
      },
      expressions: {},
      block: [],
      preset: [],
    };

    setNewPresetForm({
      ...newPresetForm,
      type,
      form: formConfig,
    });
  };

  const handleFormChange = (fields: IField[]) => {
    if (newPresetForm.type === FormTypeEnum.FIELD) {
      // For field type, store in preset array and limit to 1 field
      setNewPresetForm((prev) => ({
        ...prev,
        form: {
          ...prev.form,
          preset: fields.slice(0, 1),
        },
      }));
    } else if (newPresetForm.type === FormTypeEnum.BLOCK) {
      // For block type, store directly in preset array
      setNewPresetForm((prev) => ({
        ...prev,
        form: {
          ...prev.form,
          preset: fields,
        },
      }));
    } else {
      // For step type, use the fields directly as they come from StepEditable
      setNewPresetForm((prev) => ({
        ...prev,
        form: {
          ...prev.form,
          preset: fields,
        },
      }));
    }
  };

  const handleAddPreset = async () => {
    setLoading(true);
    await onAddPreset(newPresetForm);
  };

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <Spinner size="xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full mb-24">
      <div className="flex flex-col mx-auto w-4/5 space-y-4">
        <label className="text-2xl md:text-3xl font-black mb-2">
          Adicionar Formulário
        </label>
        <FormControl id="type">
          <FormLabel>Tipo</FormLabel>
          <Select
            size={"lg"}
            value={newPresetForm.type}
            onChange={(e) =>
              handleFormTypeChange(e.target.value as FormTypeEnum)
            }
          >
            <option value={FormTypeEnum.FIELD}>Campo</option>
            <option value={FormTypeEnum.BLOCK}>Bloco</option>
            <option value={FormTypeEnum.STEP}>Etapa</option>
          </Select>
        </FormControl>
        <FormControl id="namespace">
          <FormLabel>Chave</FormLabel>
          <Input
            placeholder="common/cpf"
            size="lg"
            value={newPresetForm?.namespace}
            onChange={(e) =>
              setNewPresetForm({
                ...newPresetForm,
                namespace: e.target.value,
              })
            }
          />
        </FormControl>
        <FormControl id="label">
          <FormLabel>Título</FormLabel>
          <Input
            placeholder="Título do formulário"
            size="lg"
            value={newPresetForm?.label}
            onChange={(e) =>
              setNewPresetForm({
                ...newPresetForm,
                label: e.target.value,
              })
            }
          />
        </FormControl>
        <FormControl id="documentation">
          <FormLabel>Descrição</FormLabel>
          <Textarea
            placeholder="Descrição do formulário"
            size="lg"
            value={newPresetForm?.documentation}
            onChange={(e) =>
              setNewPresetForm({
                ...newPresetForm,
                documentation: e.target.value,
              })
            }
          />
        </FormControl>
        <div className="border-t pt-4">
          <FormControl>
            <FormLabel className="pb-4">Estrutura do Formulário</FormLabel>
            <div className="mx-auto">
              {newPresetForm.type === FormTypeEnum.STEP ? (
                <StepEditable
                  field={newPresetForm.form.preset ?? []}
                  general={{}}
                  value={{}}
                  valid={{}}
                  onChange={() => {}}
                  onValidChange={() => {}}
                  onConfigChange={handleFormChange}
                />
              ) : (
                <FormEditor
                  fields={newPresetForm.form.preset ?? []}
                  general={{}}
                  onConfigChange={handleFormChange}
                  showPresets={true}
                  showPresetsBlocks={newPresetForm.type !== FormTypeEnum.FIELD}
                  fieldLimitNumber={
                    newPresetForm.type === FormTypeEnum.FIELD ? 1 : 1000
                  }
                />
              )}
            </div>
          </FormControl>
        </div>
        <div className="fixed bottom-16 right-4 flex space-x-4">
          <button
            className="px-6 py-2.5 rounded-lg shadow-lg flex items-center space-x-2 transition-colors duration-200 bg-yellow-600 hover:bg-yellow-700 text-white disabled:opacity-80"
            disabled={
              loading ||
              !newPresetForm.label ||
              !newPresetForm.namespace ||
              !newPresetForm.documentation
            }
            onClick={handleAddPreset}
          >
            <FaPlus size={14} />
            <span>Adicionar</span> <SL bg="yellow.600">S</SL>
          </button>
        </div>
      </div>
    </div>
  );
};
