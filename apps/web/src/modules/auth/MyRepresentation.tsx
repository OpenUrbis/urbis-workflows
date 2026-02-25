import { getAccessToken } from "../../auth/token";
import React, { useContext, useEffect, useState } from "react";
import { HotkeyContext } from "../../reducers/hotkeys.reducer";
import { Badge, Button, Card, CardContent } from "@open-urbis/map-ui";
import { FaCheck, FaTrash, FaUserFriends } from "react-icons/fa";
import { MdClose } from "react-icons/md";
import { ApiClient } from "../../api";
import { RepresentativeLink } from "../../api/types/users.dto";
import { Spinner } from "../../components";

const api = new ApiClient({
  baseURL: import.meta.env.VITE_BACK_END_API || "",
  headers: {
    Authorization: `Bearer ${getAccessToken()}`,
  },
});

export const STATUS_BADGE_VARIANT_MAPPER = {
  PENDING: "secondary",
  ACCEPTED: "default",
  DECLINED: "destructive",
  CANCELLED: "destructive",
};

// Backward-compatible export used by legacy screens still relying on Chakra Tag colorScheme
export const COLOR_MAPPER = {
  PENDING: "gray",
  ACCEPTED: "green",
  DECLINED: "red",
  CANCELLED: "red",
};

export const LABEL_MAPPER = {
  PENDING: "Pendente",
  ACCEPTED: "Aceito",
  DECLINED: "Recusado",
  CANCELLED: "Cancelado",
};

export function MyRepresentations(): JSX.Element {
  const hotkeyContext = useContext(HotkeyContext);
  const [representations, setRepresentations] = useState<RepresentativeLink[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  const fetchRepresentations = async () => {
    try {
      const response = await api.users.getRepresentativesLinks();
      setRepresentations(response.links);
    } catch (error) {
      console.log(error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRepresentations();
  }, []);

  const handleUpdateStatus = async (
    represented: string,
    representative: string,
    link: string,
    newStatus: "PENDING" | "ACCEPTED" | "DECLINED" | "CANCELLED"
  ) => {
    setLoading(true);
    try {
      await api.users.updateLinkStatus({
        represented,
        representative,
        link,
        newStatus,
      });
      await fetchRepresentations();
    } catch (error) {
      console.log(error);
    }
  };

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
      await fetchRepresentations();
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
    <div className="flex flex-col space-y-8 mb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold mt-4 tracking-tight text-foreground">
        Minhas Representações
      </h1>
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Spinner size="xl" />
        </div>
      )}
      {!loading && representations.length === 0 && (
        <div className="flex flex-col justify-center h-[calc(100vh-300px)] text-left">
          <div className="w-14 h-14 rounded-full mb-3 flex items-center justify-center bg-muted">
            <FaUserFriends size={26} className="text-muted-foreground" />
          </div>
          <p className="text-lg font-medium mb-1.5 text-foreground">
            Nenhuma representação cadastrada
          </p>
          <p className="text-sm text-muted-foreground">
            Você não possui representações ativas no momento
          </p>
        </div>
      )}
      {!loading && representations.length > 0 && (
        <div className="grid gap-4">
          {representations.map((representation) => (
            <Card
              key={representation.id}
              className="rounded-2xl border border-border bg-card text-card-foreground transition-all duration-200"
            >
              <CardContent className="flex flex-col md:flex-row md:items-center md:space-x-6 space-y-4 md:space-y-0 p-6">
                <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">
                        Documento
                      </span>
                      <div className="mt-1 text-sm font-semibold text-foreground">
                        {representation.represented}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">
                        Vínculo
                      </span>
                      <div className="mt-1 text-sm font-medium text-foreground">
                        {representation.link}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">
                        Emitido em
                      </span>
                      <div className="mt-1 text-sm text-foreground">
                      {new Date(representation.timestamp).toLocaleString(
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
                      {new Date(representation.updatedAt).toLocaleString(
                        "pt-br"
                      )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex md:flex-col items-center justify-between md:justify-center space-x-4 md:space-x-0 md:space-y-4 md:min-w-[120px] border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6 mt-4 md:mt-0">
                <Badge
                  variant={STATUS_BADGE_VARIANT_MAPPER[representation.status] as "default" | "secondary" | "destructive" | "outline"}
                  className="min-w-[100px] justify-center rounded-md px-2 py-1 font-medium"
                >
                  {LABEL_MAPPER[representation.status]}
                </Badge>

                {representation.status === "PENDING" && (
                  <div className="flex items-center space-x-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Aceitar vínculo"
                      className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100"
                      onClick={() => {
                        handleUpdateStatus(
                          representation.represented,
                          representation.representative,
                          representation.link,
                          "ACCEPTED"
                        );
                      }}
                    >
                      <FaCheck size={12} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Recusar vínculo"
                      className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-100"
                      onClick={() => {
                        handleUpdateStatus(
                          representation.represented,
                          representation.representative,
                          representation.link,
                          "DECLINED"
                        );
                      }}
                    >
                      <MdClose size={14} />
                    </Button>
                  </div>
                )}
                {representation.status === "ACCEPTED" && (
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Cancelar vínculo"
                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-100"
                    onClick={() => {
                      handleDeleteLink(
                        representation.represented,
                        representation.representative,
                        representation.link
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
