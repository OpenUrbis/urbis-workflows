import React, { useContext, useEffect, useState } from "react";
import { Spinner } from "@chakra-ui/react";
import { SL } from "../../components";
import { HotkeyContext } from "../../reducers/hotkeys.reducer";
import { ApiClient } from "../../api";
import { useSnackbar } from "../../hooks/snackbar";
import { FieldTypeEnum, IField } from "@open-urbis/types";
import { FieldEditable } from "../workflows-schema/form-engine/FieldEditable";
import { FaSave } from "react-icons/fa";

const api = new ApiClient({
  baseURL: process.env.REACT_APP_BACK_END_API || "",
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, config, hotkeyContext]);

  return (
    <div className="pb-20">
      <div className="flex justify-center sm:px-0 md:px-6 mb-6">
        <div
          className="flex flex-col mx-6 md:mx-0 justify-center"
          style={{ width: window.innerWidth <= 500 ? "100%" : "685px" }}
        >
          {loading && (
            <div className="pt-10 text-center">
              <Spinner size="xl" />
            </div>
          )}
        </div>
      </div>

      {!loading && config && (
        <div className="flex w-full justify-center sm:px-0 md:px-20 mt-4">
          <div
            className="flex flex-col mx-6 md:mx-0 justify-center"
            style={{ width: window.innerWidth <= 500 ? "auto" : "685px" }}
          >
            <h1 className="text-2xl md:text-3xl font-medium mb-6 text-center">
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
        <button
          className="px-6 py-2.5 rounded-lg shadow-lg flex items-center space-x-2 transition-colors duration-200 bg-yellow-600 hover:bg-yellow-700 text-white disabled:opacity-80"
          disabled={loading}
          onClick={handleSave}
        >
          <FaSave size={14} />
          <span>Salvar</span> <SL bg="yellow.600">S</SL>
        </button>
      </div>
    </div>
  );
}
