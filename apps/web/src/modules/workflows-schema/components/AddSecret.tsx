import { useContext, useEffect, useState } from "react";
import { Button, Input, Label, Textarea } from "@open-urbis/map-ui";
import { Loader2 } from "lucide-react";
import { SL } from "../../../components";
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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full mb-24">
      <div className="flex flex-col mx-auto w-4/5 space-y-4">
        <label className="text-2xl font-semibold tracking-tight mb-2 text-foreground">
          Adicionar Segredo
        </label>
        <div id="namespace">
          <Label className="mb-1 block">Chave</Label>
          <Input
            placeholder="common/cpf"
            className="h-10"
            value={newSecretForm?.namespace}
            onChange={(e) =>
              setNewSecretForm({
                ...newSecretForm,
                namespace: e.target.value,
              })
            }
          />
        </div>
        <div id="label">
          <Label className="mb-1 block">Título</Label>
          <Input
            placeholder="Título do segredo"
            className="h-10"
            value={newSecretForm?.label}
            onChange={(e) =>
              setNewSecretForm({
                ...newSecretForm,
                label: e.target.value,
              })
            }
          />
        </div>
        <div id="documentation">
          <Label className="mb-1 block">Descrição</Label>
          <Textarea
            placeholder="Descrição do segredo"
            className="min-h-[100px]"
            value={newSecretForm?.documentation}
            onChange={(e) =>
              setNewSecretForm({
                ...newSecretForm,
                documentation: e.target.value,
              })
            }
          />
        </div>
        <div id="value">
          <Label className="mb-1 block">Valor</Label>
          <Input
            placeholder="Valor do segredo"
            className="h-10"
            value={newSecretForm?.value}
            onChange={(e) =>
              setNewSecretForm({
                ...newSecretForm,
                value: e.target.value,
              })
            }
          />
        </div>
        <div className="fixed bottom-16 right-4 flex space-x-4">
          <Button
            type="button"
            size="sm"
            className="h-10 px-5 rounded-lg shadow-lg flex items-center space-x-2 transition-colors duration-200 bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-80"
            disabled={
              loading ||
              !newSecretForm.label ||
              !newSecretForm.documentation ||
              !newSecretForm.value
            }
            onClick={handleAddSecret}
          >
            <FaPlus size={14} />
            <span>Adicionar</span>{" "}
            <SL bg="primary" className="text-[hsl(var(--primary-foreground))]">S</SL>
          </Button>
        </div>
      </div>
    </div>
  );
};
