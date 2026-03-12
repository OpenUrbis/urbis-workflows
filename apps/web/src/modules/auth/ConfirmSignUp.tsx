import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { FormControl, FormLabel, Spinner } from "@chakra-ui/react";
import { Input, SL } from "../../components";
import { HotkeyContext } from "../../reducers/hotkeys.reducer";

export function ConfirmSignUp(): JSX.Element {
  const hotkeyContext = useContext(HotkeyContext);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const emailParam = params.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [location]);

  const handleConfirm = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACK_END_API}/users/confirm-sign-up`,
        {
          email,
          code,
        }
      );

      if (response.status === 201) {
        navigate("/login");
      }
    } catch (error: any) {
      setError("Verifique se o código de confirmação está correto.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    hotkeyContext.dispatch({
      type: "SET_HOTKEY",
      payload: {
        U: (e) => handleConfirm(e),
      },
    });

    return () => {
      hotkeyContext.dispatch({
        type: "UNSET_HOTKEY",
        delete: ["U"],
      });
    };
  }, []);

  return (
    <div className="flex flex-wrap justify-center space-x-24 mt-8 xl:mt-16 mb-24">
      <div
        className="flex flex-col mx-6 md:mx-0 justify-center space-y-4"
        style={{ width: window.innerWidth <= 500 ? "auto" : "512px" }}
      >
        <h1 className="text-3xl md:text-6xl font-black mb-2">
          Confirme seu cadastro
        </h1>
        <form className="flex flex-col space-y-4" onSubmit={handleConfirm}>
          <FormControl id="email">
            <FormLabel>E-mail *</FormLabel>
            <Input
              type={"email"}
              size="lg"
              value={email}
              readOnly
              bg="gray.200"
            />
          </FormControl>
          <FormControl id="code">
            <FormLabel>Código de Confirmação *</FormLabel>
            <Input
              autoFocus
              placeholder="Código de confirmação"
              type={"text"}
              size="lg"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </FormControl>
          {error && <p className="text-red-500">{error}</p>}
          <p className="text-sm font-bold">
            Foi enviado um código de confirmação no e-mail cadastrado. Caso não
            recebeu aguarde um momento e verifique a caixa de Spam.
          </p>
          <button
            type="submit"
            className="bg-yellow-600 hover:bg-yellow-700 text-white text-lg w-full py-3.5 rounded-xl disabled:opacity-80"
            disabled={loading || !code}
          >
            {loading ? (
              <Spinner />
            ) : (
              <>
                Confirmar <SL bg="yellow.500">U</SL>
              </>
            )}
          </button>
        </form>
      </div>
      <div className="hidden md:flex">
        {/* <img src={} style={{ height: "460px" }} alt="" /> */}
      </div>
    </div>
  );
}
