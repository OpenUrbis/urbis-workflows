import { getAccessToken } from "../../auth/token";
import { useContext, useEffect, useState } from "react";
import axios from "axios";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@open-urbis/map-ui";
import { SL } from "../../components";
import { HotkeyContext } from "../../reducers";
import { AuthContext } from "../../reducers/auth.reducer";
import { CircleCheckBig, CircleX, Loader2 } from "lucide-react";

export function DocumentValidate(): JSX.Element {
  const hotkeyContext = useContext(HotkeyContext);
  const { signIn } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [valid, setValid] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const [hash, setHash] = useState("");
  const [protocolId, setProtocolId] = useState("");
  const [documentType, setDocumentType] = useState("");

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
        },
      );

      if (response.status === 201 && response.data.same) {
        setValid(true);
      } else {
        setError(
          "O documento inserido não é o atual ou não foi gerado pela plataforma, ou as informações inseridas estão incorretas.",
        );
      }
    } catch (error: any) {
      setError(
        "Algum erro ocorreu ao tentar consultar o documento, tente novamente.",
      );
    } finally {
      setLoading(false);
    }

    setIsOpen(true);
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
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
      byte.toString(16).padStart(2, "0"),
    ).join("");
  };

  const resultMessage = valid
    ? "O documento inserido é válido e está de acordo com o protocolo informado."
    : error;

  return (
    <div className="mx-auto mt-8 mb-24 w-full max-w-2xl px-4">
      <Card className="border-border shadow-none">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold tracking-tight">
            Consultar Documento
          </CardTitle>
          <CardDescription>
            Verifique a autenticidade informando protocolo, tipo e arquivo.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="protocolId">Identificador do protocolo</Label>
            <Input
              id="protocolId"
              placeholder="Identificador do protocolo"
              value={protocolId}
              onChange={(e) => setProtocolId(e.target.value.trim())}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="documentType">Tipo do documento</Label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger id="documentType">
                <SelectValue placeholder="Tipo do documento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="document">Documento</SelectItem>
                <SelectItem value="plate">Placa</SelectItem>
                <SelectItem value="tax">Boleto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="document-uploader">Anexe o documento</Label>
            <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm break-all">
              <span className="font-medium">Código:</span> {hash || "—"}
            </div>

            <Button type="button" variant="outline" className="w-full" asChild>
              <label htmlFor="document-uploader" className="cursor-pointer">
                Selecionar documento
              </label>
            </Button>

            <input
              id="document-uploader"
              multiple={false}
              type="file"
              accept="*/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <Button
            type="submit"
            className="w-full gap-2"
            onClick={handleValidate}
            disabled={!hash || !protocolId || !documentType || loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                Verificar <SL bg="yellow.500">V</SL>
              </>
            )}
          </Button>

          {!getAccessToken() && (
            <p className="text-center text-sm text-muted-foreground">
              Quer entrar no sistema?{" "}
              <button
                className="cursor-pointer font-semibold text-primary hover:underline"
                onClick={() => signIn()}
              >
                Entrar <SL>E</SL>
              </button>
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex justify-center mb-2">
              {valid ? (
                <CircleCheckBig className="h-16 w-16 text-green-600" />
              ) : (
                <CircleX className="h-16 w-16 text-red-600" />
              )}
            </div>
            <DialogTitle className="text-center">
              {valid ? "Documento válido" : "Não foi possível validar"}
            </DialogTitle>
            <DialogDescription className="text-center text-sm leading-relaxed">
              {resultMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
