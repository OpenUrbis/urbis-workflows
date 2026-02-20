import { getAccessToken } from "../../auth/token";
import React, { useContext, useEffect, useState } from "react";
import { HotkeyContext } from "../../reducers/hotkeys.reducer";
import { Badge, Button, Card, CardContent } from "@open-urbis/map-ui";
import { Loader2 } from "lucide-react";
import { FaTrash, FaUserFriends } from "react-icons/fa";
import { LABEL_MAPPER, STATUS_BADGE_VARIANT_MAPPER } from "./MyRepresentation";
import { ApiClient } from "../../api";
import { RepresentativeLink } from "../../api/types/users.dto";

const api = new ApiClient({
  baseURL: import.meta.env.VITE_BACK_END_API || "",
  headers: {
    Authorization: `Bearer ${getAccessToken()}`,
  },
});

export function MyRepresentatives(): JSX.Element {
  const hotkeyContext = useContext(HotkeyContext);
  const [representatives, setRepresentatives] = useState<RepresentativeLink[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  const fetchRepresentatives = async () => {
    try {
      const response = await api.users.getRepresentedLinks();
      setRepresentatives(response.links);
    } catch (error) {
      console.log(error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRepresentatives();
  }, []);

  const handleDeleteLink = async (
    represented: string,
    representative: string,
    link: string
  ) => {
    setLoading(true);
    try {
      await api.users.deleteLink({
        represented,
        representative,
        link,
      });
      await fetchRepresentatives();
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    hotkeyContext.dispatch({
      type: "SET_HOTKEY",
      payload: {},
    });

    return () => {
      hotkeyContext.dispatch({
        type: "UNSET_HOTKEY",
        delete: [],
      });
    };
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold tracking-tight mb-3 text-foreground">
        Meus Representantes
      </h1>

      {loading && (
        <div className="pt-10 text-center flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {!loading && representatives.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-14 h-14 rounded-full mb-3 flex items-center justify-center bg-muted">
            <FaUserFriends size={26} className="text-muted-foreground" />
          </div>
          <p className="text-base font-medium mb-1.5 text-foreground">
            Nenhum representante cadastrado
          </p>
          <p className="text-xs text-muted-foreground">
            Você não possui representantes ativos no momento
          </p>
        </div>
      )}

      {!loading && representatives.length > 0 && (
        <div className="grid gap-4">
          {representatives.map((representative) => (
            <Card
              key={representative.id}
              className="transition-all duration-200"
            >
              <CardContent className="flex flex-col md:flex-row md:items-center md:space-x-6 space-y-4 md:space-y-0 p-6">
                <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">
                        Documento
                      </span>
                      <div className="mt-1 text-base font-semibold text-foreground">
                        {representative.representative}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">
                        Vínculo
                      </span>
                      <div className="mt-1 text-base font-medium text-foreground">
                        {representative.link}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">
                        Emitido em
                      </span>
                      <div className="mt-1 text-sm text-foreground">
                        {new Date(representative.timestamp).toLocaleString(
                          "pt-br"
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">
                        Atualizado em
                      </span>
                      <div className="mt-1 text-sm text-foreground">
                        {new Date(representative.updatedAt).toLocaleString(
                          "pt-br"
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex md:flex-col items-center justify-between md:justify-center space-x-4 md:space-x-0 md:space-y-4 md:min-w-[120px] border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6 mt-4 md:mt-0">
                  <Badge
                    variant={STATUS_BADGE_VARIANT_MAPPER[representative.status] as "default" | "secondary" | "destructive" | "outline"}
                    className="min-w-[100px] justify-center rounded-md px-2 py-1 font-medium"
                  >
                    {LABEL_MAPPER[representative.status]}
                  </Badge>

                  {representative.status !== "CANCELLED" && (
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Remover vínculo"
                      className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-100"
                      onClick={() => {
                        handleDeleteLink(
                          representative.represented,
                          representative.representative,
                          representative.link
                        );
                      }}
                    >
                      <FaTrash size={12} />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
