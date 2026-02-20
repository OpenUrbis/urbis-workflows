import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { BlockOptions, FieldTypeEnum, IField } from "@open-urbis/types";
import { Input, MaskedInput, SL } from "../../components";
import { HotkeyContext } from "../../reducers/hotkeys.reducer";
import { AuthContext } from "../../reducers/auth.reducer";
import { Field } from "../workflows-schema";

const FormControl = ({ children, ...props }: any) => <div {...props}>{children}</div>;
const FormLabel = ({ children, ...props }: any) => <label {...props}>{children}</label>;
const Spinner = ({ size = "md" }: any) => (
  <Loader2
    className={`mx-auto animate-spin ${size === "xl" ? "h-10 w-10" : size === "lg" ? "h-8 w-8" : "h-5 w-5"}`}
    aria-hidden="true"
  />
);

export function ContestUser(): JSX.Element {
  const hotkeyContext = useContext(HotkeyContext);
  const { signIn } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [document, setDocument] = useState("");
  const [config, setConfig] = useState<IField>();
  const [custom, setCustom] = useState({});
  const [valid, setValid] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const location = useLocation();

  const getDocumentMask = (value: string) => {
    const numericValue = value.replace(/\D/g, "");
    if (numericValue.length <= 11) return "999.999.999-999"; // CPF
    return "99.999.999/9999-99"; // CNPJ
  };

  const fetchUserByDocument = async (document: string) => {
    try {
      const response = await axios.get(
        `${
          import.meta.env.VITE_BACK_END_API
        }/users/api/user/${encodeURIComponent(document)}`
      );

      if (response.data) {
        setEmail(response.data.email);
        setName(response.data.name);
        setCustom(response.data.custom);
      }

      fetchConfig();
    } catch (error) {
      console.log(error);
    }
  };

  const fetchConfig = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACK_END_API}/users/config`
      );

      if (response.data.config?.type === "block") {
        setConfig(response.data.config);
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
    }

    setLoading(false);
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const documentParam = params.get("document");
    if (documentParam) {
      setDocument(documentParam);
      fetchUserByDocument(documentParam);
    }
    
  }, [location]);

  const handleSignUp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setError("");
  };

  useEffect(() => {
    hotkeyContext.dispatch({
      type: "SET_HOTKEY",
      payload: {
        U: (e) => handleSignUp(e),
        E: () => signIn(),
      },
    });

    return () => {
      hotkeyContext.dispatch({
        type: "UNSET_HOTKEY",
        delete: ["U", "E"],
      });
    };
  }, []);

  return (
    <div className="flex flex-wrap justify-center space-x-24 mt-8 xl:mt-16 mb-24">
      <div
        className="flex flex-col mx-6 md:mx-0 justify-center space-y-4"
        style={{ width: window.innerWidth <= 500 ? "auto" : "685px" }}
      >
        <h1 className="text-3xl md:text-6xl font-black mb-2">
          Contestar Cadastro
        </h1>
        <div className="flex flex-col space-y-4">
          <FormControl id="email">
            <FormLabel>E-mail *</FormLabel>
            <Input
              autoFocus
              placeholder="e-mail"
              type={"email"}
              size="lg"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </FormControl>
          <FormControl id="document">
            <FormLabel>CPF ou CPNJ *</FormLabel>
            <MaskedInput
              placeholder="CPF ou CNPJ"
              mask={getDocumentMask(document)}
              value={document}
              onChange={(e) => setDocument(e.target.value)}
              size="lg"
            />
          </FormControl>
          <FormControl id="name">
            <FormLabel>Nome ou razão social *</FormLabel>
            <Input
              size="lg"
              placeholder="Nome ou razão social"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </FormControl>
          {config && (
            <Field
              context={custom}
              validContext={valid}
              general={{}}
              field={config}
              value={custom}
              valid={valid}
              onChange={(value) => setCustom(value)}
              onValidChange={(valid) => setValid(valid)}
            ></Field>
          )}
          {error && <p className="text-red-500">{error}</p>}
          <button
            type="submit"
            onClick={handleSignUp}
            className="bg-yellow-600 hover:bg-yellow-700 text-white text-lg w-full py-3.5 rounded-xl disabled:opacity-80"
            disabled={loading || !email || !document || !name}
          >
            {loading ? (
              <Spinner />
            ) : (
              <>
                Contestar <SL bg="yellow.500">U</SL>
              </>
            )}
          </button>
        </div>
        <div className="text-center pt-4">
          Não deseja contestar mais?{" "}
          <button
            className="cursor-pointer hover:text-yellow-600 text-yellow-500 font-bold"
            onClick={() => signIn()}
          >
            Entrar <SL>E</SL>
          </button>
        </div>
      </div>
    </div>
  );
}
