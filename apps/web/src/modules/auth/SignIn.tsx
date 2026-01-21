import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FormControl, FormLabel, Spinner } from "@chakra-ui/react";
import { Input, SL } from "../../components";
import { HotkeyContext } from "../../reducers/hotkeys.reducer";
import city from "../../assets/city.png";

export function SignIn(): JSX.Element {
  const hotkeyContext = useContext(HotkeyContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACK_END_API}/users/sign-in`,
        {
          email,
          password,
        }
      );
      if (response.status === 201) {
        localStorage.setItem(
          "token",
          response.data.AuthenticationResult.AccessToken
        );

        window.location.href = import.meta.env.VITE_MAP as string;
      }
    } catch (error: any) {
      setError("Nome de usuário ou senha incorreto");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    hotkeyContext.dispatch({
      type: "SET_HOTKEY",
      payload: {
        E: (e) => handleLogin(e),
        U: (e) => {
          e?.preventDefault();
          navigate("/sign-up");
        },
        R: (e) => {
          e?.preventDefault();
          navigate("/forget-password");
        },
      },
    });

    return () => {
      hotkeyContext.dispatch({
        type: "UNSET_HOTKEY",
        delete: ["E", "U", "R"],
      });
    };
  }, []);

  return (
    <div className="flex flex-wrap justify-center space-x-24 mt-8 xl:mt-16 mb-24">
      <div
        className="flex flex-col mx-6 md:mx-0 justify-center space-y-4"
        style={{ width: window.innerWidth <= 500 ? "auto" : "582px" }}
      >
        <h1 className="text-3xl md:text-6xl font-black mb-2">
          Bem vindo! <span className="text-red-500">Cidadão</span>
        </h1>
        <div>
          <form className="flex flex-col space-y-4" onSubmit={handleLogin}>
            <FormControl id="email">
              <FormLabel>E-mail</FormLabel>
              <Input
                placeholder="e-mail"
                type={"email"}
                size="lg"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </FormControl>
            <FormControl id="password">
              <FormLabel>Senha</FormLabel>
              <Input
                placeholder="senha"
                type={"password"}
                size="lg"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </FormControl>
            {error && <p className="text-red-500">{error}</p>}
            {/* eslint-disable-next-line */}
            <a
              className="cursor-pointer text-left hover:text-yellow-600 text-yellow-500 font-bold"
              onClick={() => navigate("/forget-password")}
            >
              Recuperar senha <SL>R</SL>
            </a>
            <button
              type="submit"
              className="bg-yellow-600 hover:bg-yellow-700 text-white text-lg w-full py-3.5 rounded-xl disabled:opacity-80"
              disabled={loading || !email || !password}
            >
              {loading ? (
                <Spinner />
              ) : (
                <>
                  Entrar <SL bg="yellow.500">E</SL>
                </>
              )}
            </button>
          </form>
        </div>
        <div className="text-center pt-4">
          Não possui cadastro? {/* eslint-disable-next-line */}
          <a
            className="cursor-pointer hover:text-yellow-600 text-yellow-500 font-bold"
            onClick={() => navigate("/sign-up")}
          >
            Realizar cadastro <SL>U</SL>
          </a>
        </div>
      </div>
      <div className="hidden lg:flex justify-center z-50">
        <img src={city} style={{ height: "460px" }} alt="" />
      </div>
    </div>
  );
}
