import { getAccessToken } from "../../auth/token";
import { useContext, useEffect, useState } from "react";
import axios from "axios";
import {
  FormControl,
  FormLabel,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
  Spinner,
  useDisclosure,
} from "@chakra-ui/react";
import { Input, SL, Select } from "../../components";
import { HotkeyContext, StyleContext } from "../../reducers";
import { AuthContext } from "../../reducers/auth.reducer";
import { useNavigate } from "react-router-dom";
import { MdCheckCircle, MdOutlineError } from "react-icons/md";

export function DocumentValidate(): JSX.Element {
  const styleContext = useContext(StyleContext);
  const hotkeyContext = useContext(HotkeyContext);
  const { signIn } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [valid, setValid] = useState(false);
  const navigate = useNavigate();

  const [hash, setHash] = useState("");
  const [protocolId, setProtocolId] = useState("");
  const [documentType, setDocumentType] = useState("");
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    hotkeyContext.dispatch({
      type: "SET_HOTKEY",
      payload: {
        E: () => signIn(),
        V: () => hash && protocolId && documentType && handleValidate(),
      },
    });

    return () => {
      hotkeyContext.dispatch({
        type: "UNSET_HOTKEY",
        delete: ["E", "V"],
      });
    };
  }, []);

  const handleValidate = async (e?: React.FormEvent) => {
    e?.preventDefault();

    setLoading(true);
    setValid(false);
    setError("");

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACK_END_API}/protocols/checksum/${protocolId}`,
        {
          documentType,
          checksum: hash,
        }
      );

      if (response.status === 201 && response.data.same) {
        setValid(true);
      } else {
        setError(
          "O documento inserido não é o atual ou não foi gerado pela plataforma, ou as informações inseridas estão incorretas."
        );
      }
    } catch (error: any) {
      setError(
        "Algum erro ocorreu ao tentar consultar o documento, tente novamente."
      );
    } finally {
      setLoading(false);
    }

    onOpen();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event?.target?.files?.[0];
    if (!file) {
      console.log("No file selected.");
      return;
    }

    const hash = await generateSHA256(file);

    setHash(hash);
  };

  const generateSHA256 = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();

    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);

    return bufferToHex(hashBuffer);
  };

  const bufferToHex = (buffer: ArrayBuffer) => {
    const byteArray = new Uint8Array(buffer);
    return Array.from(byteArray, (byte) =>
      byte.toString(16).padStart(2, "0")
    ).join("");
  };

  return (
    <div className="flex flex-wrap justify-center space-x-24 mt-8 xl:mt-16 mb-24">
      <div
        className="flex flex-col mx-6 md:mx-0 justify-center space-y-4"
        style={{ width: window.innerWidth <= 500 ? "auto" : "582px" }}
      >
        <h1 className="text-3xl md:text-6xl font-black mb-2">
          Consultar <span className="text-red-500">Documento</span>
        </h1>
        <FormControl id="protocolId">
          <FormLabel>Identificador do protocolo</FormLabel>
          <Input
            placeholder="Identificador do Protocolo"
            size="lg"
            value={protocolId}
            onChange={(e) => setProtocolId(e.target.value.trim())}
          />
        </FormControl>
        <FormControl id="documentType">
          <FormLabel>Tipo do documento</FormLabel>
          <Select
            placeholder="Tipo do documento"
            size="lg"
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
          >
            <option key="document-type-license" value="document">
              Documento
            </option>
            <option key="document-type-license" value="plate">
              Placa
            </option>
            <option key="document-type-license" value="tax">
              Boleto
            </option>
          </Select>
        </FormControl>
        <FormControl id="upload">
          <FormLabel>Anexe o documento</FormLabel>
          <div className="border border-gray-200 rounded-lg py-2 px-4 mb-4 flex justify-between items-center">
            Código: {hash}
          </div>

          <label
            htmlFor="document-uploader"
            className={`bg-red-600 hover:bg-red-700 text-white text-lg w-full py-2 rounded-xl cursor-pointer text-center block`}
          >
            Documento
          </label>
          <input
            id="document-uploader"
            multiple={false}
            type="file"
            accept="*/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </FormControl>
        <button
          type="submit"
          className="bg-yellow-600 hover:bg-yellow-700 text-white text-lg w-full py-3.5 rounded-xl disabled:opacity-80"
          onClick={handleValidate}
          disabled={!hash || !protocolId || !documentType}
        >
          {loading ? (
            <Spinner />
          ) : (
            <>
              Verificar <SL bg="yellow.500">V</SL>
            </>
          )}
        </button>
        {!getAccessToken() && (
          <div className="text-center pt-4">
            Quer entrar no sistema?{" "}
            <button
              className="cursor-pointer hover:text-yellow-600 text-yellow-500 font-bold"
              onClick={() => signIn()}
            >
              Entrar <SL>E</SL>
            </button>
          </div>
        )}
      </div>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent
          className="px-4 py-10"
          style={{ minWidth: 400 }}
          bg={styleContext.state.backgroundColor}
        >
          <ModalCloseButton />
          <ModalBody overflowY="auto" wordBreak="break-word">
            <div className="flex justify-center mb-6">
              {valid && <MdCheckCircle size="64" color="green" />}
              {error && <MdOutlineError size="64" color="red" />}
            </div>
            <div className="flex text-center">
              {error && <p className="text-lg font-bold">{error}</p>}
              {valid && (
                <p className="text-lg font-bold">
                  O documento inserido é válido e está de acordo com o protocolo
                  informado.
                </p>
              )}
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}
