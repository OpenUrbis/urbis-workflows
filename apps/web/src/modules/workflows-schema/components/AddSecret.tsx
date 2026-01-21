import { FormControl, FormLabel, Spinner } from "@chakra-ui/react";
import { useContext, useEffect, useState } from "react";
import { Input, SL, Textarea } from "../../../components";
import { HotkeyContext } from "../../../reducers";
import { CreateSecretHttpDto } from "../../../api/types/integrations.dto";
import { FaPlus } from "react-icons/fa";

export type AddSecretProps = {
  onAddSecret: (secret: Partial<CreateSecretHttpDto>) => void;
};

export const AddSecret: React.FC<AddSecretProps> = ({
  onAddSecret,
}): JSX.Element => {
  const hotkeyContext = useContext(HotkeyContext);
  const [loading, setLoading] = useState(false);
  const [newSecretForm, setNewSecretForm] = useState<
    Partial<CreateSecretHttpDto>
  >({
    label: "",
    documentation: "",
    namespace: "",
    value: "",
  });

  useEffect(() => {
    hotkeyContext.dispatch({
      type: "SET_HOTKEY",
      payload: {
        S: () => {
          if (
            !loading &&
            (newSecretForm.label || "").length > 0 &&
            (newSecretForm.documentation || "").length > 0 &&
            (newSecretForm.value || "").length > 0
          ) {
            handleAddSecret();
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
    
  }, [newSecretForm, loading]);

  const handleAddSecret = async () => {
    setLoading(true);
    await onAddSecret(newSecretForm);
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
          Adicionar Segredo
        </label>
        <FormControl id="namespace">
          <FormLabel>Chave</FormLabel>
          <Input
            placeholder="common/cpf"
            size="lg"
            value={newSecretForm?.namespace}
            onChange={(e) =>
              setNewSecretForm({
                ...newSecretForm,
                namespace: e.target.value,
              })
            }
          />
        </FormControl>
        <FormControl id="label">
          <FormLabel>Título</FormLabel>
          <Input
            placeholder="Título do segredo"
            size="lg"
            value={newSecretForm?.label}
            onChange={(e) =>
              setNewSecretForm({
                ...newSecretForm,
                label: e.target.value,
              })
            }
          />
        </FormControl>
        <FormControl id="documentation">
          <FormLabel>Descrição</FormLabel>
          <Textarea
            placeholder="Descrição do segredo"
            size="lg"
            value={newSecretForm?.documentation}
            onChange={(e) =>
              setNewSecretForm({
                ...newSecretForm,
                documentation: e.target.value,
              })
            }
          />
        </FormControl>
        <FormControl id="value">
          <FormLabel>Valor</FormLabel>
          <Input
            placeholder="Valor do segredo"
            size="lg"
            value={newSecretForm?.value}
            onChange={(e) =>
              setNewSecretForm({
                ...newSecretForm,
                value: e.target.value,
              })
            }
          />
        </FormControl>
        <div className="fixed bottom-16 right-4 flex space-x-4">
          <button
            className="px-6 py-2.5 rounded-lg shadow-lg flex items-center space-x-2 transition-colors duration-200 bg-yellow-600 hover:bg-yellow-700 text-white disabled:opacity-80"
            disabled={
              loading ||
              !newSecretForm.label ||
              !newSecretForm.documentation ||
              !newSecretForm.value
            }
            onClick={handleAddSecret}
          >
            <FaPlus size={14} />
            <span>Adicionar</span> <SL bg="yellow.600">S</SL>
          </button>
        </div>
      </div>
    </div>
  );
};
