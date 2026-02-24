import { getAccessToken } from "../../auth/token";
import React, { useContext, useEffect, useState } from "react";
import { SL } from "../../components";
import { HotkeyContext } from "../../reducers/hotkeys.reducer";
import { ApiClient } from "../../api";
import { useSnackbar } from "../../hooks/snackbar";
import { FieldTypeEnum, IField } from "@open-urbis/types";
import { FieldEditable } from "../workflows-schema/form-engine/FieldEditable";
import { FaSave } from "react-icons/fa";
import { Button } from "@open-urbis/map-ui";
import { Loader2 } from "lucide-react";

const api = new ApiClient({
  baseURL: import.meta.env.VITE_BACK_END_API || "",
  headers: {
    Authorization: `Bearer ${getAccessToken()}`,
  },
});

export function SignUpEditor(): JSX.Element {
  const [config, setConfig] = useState<IField>();
  const [general, setGeneral] = useState<any>({});
  const [context, setContext] = useState<any>({});
  const [valid, setValid] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const hotkeyContext = useContext(HotkeyContext);
  const snackbar = useSnackbar();

  const fetchConfig = async () => {
    try {
      const response = await api.users.getCustomUserFields();
      const user = await api.users.getProfile();
      if (response.config?.type === "block") {
        setConfig(response.config);
        setGeneral({ $user: user });
      } else {
        setConfig({
          type: FieldTypeEnum.Block,
          key: "user",
          block: [],
          options: {
            hideEditMenu: true,
          },
          expressions: {},
        });
        setGeneral({ $user: user });
      }
    } catch (error) {
      console.error(error);
      snackbar.error("Erro ao carregar configurações");
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!config) return;

    setLoading(true);
    try {
      await api.users.setCustomUserFields({ config });
      snackbar.success("Configurações salvas com sucesso");
    } catch (error) {
      console.error(error);
      snackbar.error("Erro ao salvar configurações");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchConfig();
    
  }, []);

  useEffect(() => {
    hotkeyContext.dispatch({
      type: "SET_HOTKEY",
      payload: {
        S: () => !loading && handleSave(),
      },
    });

    return () => {
      hotkeyContext.dispatch({
        type: "UNSET_HOTKEY",
        delete: ["S"],
      });
    };
    
  }, [loading, config, hotkeyContext]);

  return (
    <div className="pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {loading && (
        <div className="pt-10 text-center flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {!loading && config && (
        <div className="flex w-full justify-center mt-4">
          <div className="flex flex-col w-full max-w-[685px]">
            <h1 className="text-2xl font-semibold tracking-tight mb-6 text-center text-foreground">
              Formulário de cadastro de usuários
            </h1>
            <FieldEditable
              context={context}
              validContext={valid}
              general={general}
              field={config}
              value={context}
              valid={valid}
              onChange={(value) => setContext(value)}
              onValidChange={(valid) => setValid(valid)}
              onConfigChange={(field: IField) => {
                setConfig(field);
              }}
              onRemove={() => {}}
            />
          </div>
        </div>
      )}

      <div className="fixed bottom-16 right-4 flex space-x-4">
        <Button
          type="button"
          size="sm"
          className="h-10 px-5 rounded-lg shadow-lg flex items-center space-x-2 transition-colors duration-200 bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-80"
          disabled={loading}
          onClick={handleSave}
        >
          <FaSave size={14} />
          <span>Salvar</span>{" "}
          <SL bg="primary" className="text-[hsl(var(--primary-foreground))]">S</SL>
        </Button>
      </div>
    </div>
  );
}
