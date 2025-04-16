import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FormControl,
  FormLabel,
  InputGroup,
  InputRightElement,
  IconButton,
  Spinner,
} from "@chakra-ui/react";
import { BlockOptions, FieldTypeEnum, IField } from "@open-urbis/types";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { Input, SL, MaskedInput } from "../../components";
import { HotkeyContext } from "../../reducers/hotkeys.reducer";
import { Field } from "../workflows-schema";
import { ApiClient } from "../../api";
import { useSnackbar } from "../../hooks/snackbar";

const api = new ApiClient({
  baseURL: process.env.REACT_APP_BACK_END_API || "",
});

export function SignUp(): JSX.Element {
  const hotkeyContext = useContext(HotkeyContext);
  const snackbar = useSnackbar();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [document, setDocument] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [config, setConfig] = useState<IField>();
  const [custom, setCustom] = useState({});
  const [valid, setValid] = useState({});
  const [error, setError] = useState("");
  const [documentAlreadyExists, setDocumentAlreadyExists] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const toggleShowPassword = () => setShowPassword(!showPassword);

  const fetchConfig = async () => {
    try {
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
      console.error("Error fetching user config:", error);
      snackbar.error("Erro ao carregar configurações");
    }
    setLoading(false);
  };

  const handleSignUp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setDocumentAlreadyExists(false);
    setError("");

    try {
      if (password !== confirmPassword) {
        setError("As senhas não correspondem.");
        setLoading(false);
        return;
      }

      await api.users.signUp({
        email,
        password,
        name,
        document,
        custom,
      });

      navigate("/confirm-sign-up?email=" + email);
    } catch (error: any) {
      if (error.message?.includes("InvalidPasswordException")) {
        setError("A senha não atende os requisitos mínimos.");
      } else if (error.message?.includes("UsernameExistsException")) {
        setError("O e-mail já está cadastrado.");
      } else if (error.message === "User already exists") {
        setDocumentAlreadyExists(true);
      } else {
        setError(
          "Verfique se o e-mail já está cadastrado ou se as senhas são iguais e atendem os requisitos mínimos."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const getDocumentMask = (value: string) => {
    const numericValue = value.replace(/\D/g, "");
    if (numericValue.length <= 11) return "999.999.999-999"; // CPF
    return "99.999.999/9999-99"; // CNPJ
  };

  useEffect(() => {
    fetchConfig();

    hotkeyContext.dispatch({
      type: "SET_HOTKEY",
      payload: {
        U: (e) => handleSignUp(e),
        E: () => navigate("/sign-in"),
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
          Bem vindo! <span className="text-red-500">Cidadão</span>
        </h1>
        <div className="flex flex-col space-y-4">
          <FormControl id="email">
            <FormLabel>E-mail *</FormLabel>
            <Input
              placeholder="e-mail"
              type={"email"}
              size="lg"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </FormControl>
          <FormControl id="password">
            <FormLabel>Senha *</FormLabel>
            <InputGroup size="lg">
              <Input
                size="lg"
                placeholder="senha"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <InputRightElement>
                <IconButton
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  icon={showPassword ? <FaEyeSlash /> : <FaEye />}
                  variant="ghost"
                  onClick={toggleShowPassword}
                />
              </InputRightElement>
            </InputGroup>
          </FormControl>
          <FormControl id="confirmPassword">
            <FormLabel>Confirmar Senha *</FormLabel>
            <InputGroup size="lg">
              <Input
                size="lg"
                placeholder="confirmar senha"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <InputRightElement>
                <IconButton
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  icon={showPassword ? <FaEyeSlash /> : <FaEye />}
                  variant="ghost"
                  onClick={toggleShowPassword}
                />
              </InputRightElement>
            </InputGroup>
          </FormControl>
          <p className="text-sm font-bold">
            A senha deve conter pelo menos: 8 caracteres
          </p>
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
          {documentAlreadyExists && (
            <p>
              O documento <b>{document}</b> já foi cadastrado. Caso deseje
              contestar esse cadastro preencha o seguinte{" "}
              <span
                onClick={() =>
                  navigate(
                    "/contest-user?document=" + encodeURIComponent(document)
                  )
                }
                className="cursor-pointer font-bold text-blue-600"
              >
                formulário
              </span>
            </p>
          )}
          <button
            type="submit"
            onClick={handleSignUp}
            className="bg-yellow-600 hover:bg-yellow-700 text-white text-lg w-full py-3.5 rounded-xl disabled:opacity-80"
            disabled={
              loading ||
              !email ||
              !password ||
              !confirmPassword ||
              !document ||
              !name
            }
          >
            {loading ? (
              <Spinner />
            ) : (
              <>
                Registrar <SL bg="yellow.500">U</SL>
              </>
            )}
          </button>
        </div>
        <div className="text-center pt-4">
          Já possui cadastro?{" "}
          <button
            className="cursor-pointer hover:text-yellow-600 text-yellow-500 font-bold"
            onClick={() => navigate("/login")}
          >
            Entrar <SL>E</SL>
          </button>
        </div>
      </div>
      <div className="hidden md:flex justify-center mt-16">
        {/* <img src={} style={{ height: "460px" }} alt="" /> */}
      </div>
    </div>
  );
}
