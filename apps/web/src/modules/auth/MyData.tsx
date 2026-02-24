import { getAccessToken } from "../../auth/token";
import React, { useContext, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { FaSave } from "react-icons/fa";
import { BlockOptions, FieldTypeEnum, IField } from "@open-urbis/types";
import { SL } from "../../components/ShortcutLabel";
import { HotkeyContext } from "../../reducers/hotkeys.reducer";
import { StyleContext } from "../../reducers/style.reducer";
import { Field } from "../workflows-schema";
import { ApiClient } from "../../api";
import { UserProfileResponse } from "../../api/types/users.dto";
import { Input, MaskedInput } from "../../components";

const FormControl = ({ children, ...props }: any) => <div {...props}>{children}</div>;
const FormLabel = ({ children, ...props }: any) => <label {...props}>{children}</label>;
const Spinner = ({ size = "md" }: any) => (
  <Loader2
    className={`mx-auto animate-spin ${size === "xl" ? "h-10 w-10" : size === "lg" ? "h-8 w-8" : "h-5 w-5"}`}
    aria-hidden="true"
  />
);

const api = new ApiClient({
  baseURL: import.meta.env.VITE_BACK_END_API || "",
  headers: {
    Authorization: `Bearer ${getAccessToken()}`,
  },
});

export function MyData(): JSX.Element {
  const hotkeyContext = useContext(HotkeyContext);
  const styleContext = useContext(StyleContext);
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [config, setConfig] = useState<IField>();
  const [general, setGeneral] = useState<any>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingConfig, setIsLoadingConfig] = useState<boolean>(false);
  const [editProfile, setEditProfile] = useState<UserProfileResponse | null>(
    null
  );
  const [valid, setValid] = useState<any>({});

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await api.users.getProfile();
        setEditProfile(data);
        setGeneral({ $user: data });
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchConfig = async () => {
      try {
        setIsLoadingConfig(true);
        const response = await api.users.getCustomUserFields();

        if (response.config?.type === "block") {
          setConfig(response.config);
        } else {
          setConfig({
            type: FieldTypeEnum.Block,
            key: "user",
            block: [],
            options: {
              hideEditMenu: true,
            } as BlockOptions,
            expressions: {},
          });
        }
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoadingConfig(false);
      }
    };

    fetchData();
    fetchConfig();
  }, []);

  const getDocumentMask = (value: string) => {
    const numericValue = value?.replace(/\D/g, "") ?? "";
    if (numericValue.length <= 11) return "999.999.999-999"; // CPF
    return "99.999.999/9999-99"; // CNPJ
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditProfile((prev) => {
      if (!prev) return null;
      return { ...prev, [name]: value };
    });
  };

  const handleSave = async () => {
    if (!editProfile) return;

    try {
      setIsLoading(true);
      await api.users.updateProfile({
        name: editProfile.name,
        custom: editProfile.custom,
      });

      setProfile(editProfile);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    hotkeyContext.dispatch({
      type: "SET_HOTKEY",
      payload: {
        S: handleSave,
      },
    });

    return () => {
      hotkeyContext.dispatch({
        type: "UNSET_HOTKEY",
        delete: ["S"],
      });
    };
    
  }, [profile, editProfile]);

  return (
    <div className="relative min-h-[80vh]">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center pt-10 space-y-4">
          <Spinner
            size="xl"
            color={
              styleContext.state.buttonHoverColorWeight === "200"
                ? "yellow.500"
                : "yellow.300"
            }
            thickness="3px"
          />
          <span style={{ color: styleContext.state.textColor }}>
            Salvando dados...
          </span>
        </div>
      ) : (
        <>
          <div className="space-y-6">
            <h1
              className="text-xl md:text-2xl font-medium text-center mb-6"
              style={{ color: styleContext.state.textColor }}
            >
              Meus Dados
            </h1>
            <div className="flex flex-col space-y-4">
              <FormControl id="id">
                <FormLabel style={{ color: styleContext.state.textColor }}>
                  ID
                </FormLabel>
                <Input
                  placeholder="ID"
                  type="text"
                  size="lg"
                  value={editProfile?.id}
                  readOnly
                />
              </FormControl>
              <FormControl id="email">
                <FormLabel style={{ color: styleContext.state.textColor }}>
                  E-mail
                </FormLabel>
                <Input
                  placeholder="e-mail"
                  type="email"
                  size="lg"
                  value={editProfile?.email}
                  readOnly
                />
              </FormControl>

              <FormControl id="document">
                <FormLabel style={{ color: styleContext.state.textColor }}>
                  CPF ou CPNJ *
                </FormLabel>
                <MaskedInput
                  placeholder="CPF ou CNPJ"
                  mask={getDocumentMask(editProfile?.document ?? "")}
                  value={editProfile?.document ?? ""}
                  onChange={handleInputChange}
                  name="document"
                  size="lg"
                  readOnly
                />
              </FormControl>

              <FormControl id="name">
                <FormLabel style={{ color: styleContext.state.textColor }}>
                  Nome ou razão social *
                </FormLabel>
                <Input
                  size="lg"
                  placeholder="Nome ou razão social"
                  name="name"
                  value={editProfile?.name}
                  onChange={handleInputChange}
                />
              </FormControl>

              {isLoadingConfig && (
                <div className="flex justify-center items-center">
                  <Spinner
                    size="lg"
                    color={
                      styleContext.state.buttonHoverColorWeight === "200"
                        ? "primary"
                        : "primary"
                    }
                  />
                </div>
              )}
              {config && (
                <Field
                  context={editProfile?.custom}
                  validContext={valid}
                  general={general}
                  field={config}
                  value={editProfile?.custom}
                  valid={valid}
                  onChange={(value) =>
                    setEditProfile((prev) => {
                      if (!prev) return null;
                      return {
                        ...prev,
                        custom: value,
                      };
                    })
                  }
                  onValidChange={(valid) => setValid(valid)}
                />
              )}
            </div>
          </div>

          <div className="fixed bottom-16 right-4 flex space-x-4">
            <button
              onClick={handleSave}
              className="px-6 py-2.5 rounded-lg shadow-lg flex items-center space-x-2 transition-colors duration-200 bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-80"
              disabled={isLoading}
            >
              <FaSave size={14} />
              <span>Salvar</span>{" "}
              <SL bg="primary" className="text-[hsl(var(--primary-foreground))]">S</SL>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
