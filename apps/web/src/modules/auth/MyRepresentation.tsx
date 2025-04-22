import React, { useContext, useEffect, useState } from "react";
import { HotkeyContext } from "../../reducers/hotkeys.reducer";
import { StyleContext } from "../../reducers/style.reducer";
import { IconButton, Spinner, Tag } from "@chakra-ui/react";
import { FaCheck, FaTrash, FaUserFriends } from "react-icons/fa";
import { MdClose } from "react-icons/md";
import { ApiClient } from "../../api";
import { RepresentativeLink } from "../../api/types/users.dto";

const api = new ApiClient({
  baseURL: import.meta.env.VITE_BACK_END_API || "",
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

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
  const styleContext = useContext(StyleContext);
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
    <div className="space-y-6">
      <h1
        className="text-xl md:text-2xl font-medium text-center mb-6"
        style={{ color: styleContext.state.textColor }}
      >
        Minhas Representações
      </h1>
      {loading && (
        <div className="pt-10 text-center">
          <Spinner
            size="xl"
            color={
              styleContext.state.buttonHoverColorWeight === "200"
                ? "yellow.500"
                : "yellow.300"
            }
            thickness="3px"
          />
        </div>
      )}
      {!loading && representations.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <div
            className="w-16 h-16 rounded-full mb-4 flex items-center justify-center"
            style={{
              backgroundColor:
                styleContext.state.buttonHoverColorWeight === "200"
                  ? "#F3F4F6"
                  : "#374151",
            }}
          >
            <FaUserFriends
              size={32}
              style={{
                color:
                  styleContext.state.buttonHoverColorWeight === "200"
                    ? "#6B7280"
                    : "#9CA3AF",
              }}
            />
          </div>
          <p
            className="text-lg font-medium mb-2"
            style={{ color: styleContext.state.textColor }}
          >
            Nenhuma representação cadastrada
          </p>
          <p
            className="text-sm"
            style={{ color: styleContext.state.textColor }}
          >
            Você não possui representações ativas no momento
          </p>
        </div>
      )}
      {!loading && representations.length > 0 && (
        <div className="grid gap-4">
          {representations.map((representation) => (
            <div
              key={representation.id}
              className="flex flex-col md:flex-row md:items-center md:space-x-6 space-y-4 md:space-y-0 border rounded-lg p-6 transition-all duration-200"
              style={{
                borderColor:
                  styleContext.state.buttonHoverColorWeight === "200"
                    ? "#E5E7EB"
                    : "#374151",
                backgroundColor: styleContext.state.backgroundColor,
              }}
            >
              <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div style={{ color: styleContext.state.textColor }}>
                    <span className="text-sm font-medium">Documento</span>
                    <div className="font-bold mt-1">
                      {representation.represented}
                    </div>
                  </div>
                  <div style={{ color: styleContext.state.textColor }}>
                    <span className="text-sm font-medium">Vínculo</span>
                    <div className="font-medium mt-1">
                      {representation.link}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div style={{ color: styleContext.state.textColor }}>
                    <span className="text-sm font-medium">Emitido em</span>
                    <div className="mt-1">
                      {new Date(representation.timestamp).toLocaleString(
                        "pt-br"
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div style={{ color: styleContext.state.textColor }}>
                    <span className="text-sm font-medium">Atualizado em</span>
                    <div className="mt-1">
                      {new Date(representation.updatedAt).toLocaleString(
                        "pt-br"
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex md:flex-col items-center justify-between md:justify-center space-x-4 md:space-x-0 md:space-y-4 md:min-w-[120px] border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6 mt-4 md:mt-0">
                <Tag
                  colorScheme={COLOR_MAPPER[representation.status]}
                  size="md"
                  className="min-w-[100px] text-center"
                  style={{
                    borderRadius: "6px",
                    fontWeight: "500",
                  }}
                >
                  {LABEL_MAPPER[representation.status]}
                </Tag>

                {representation.status === "PENDING" && (
                  <div className="flex items-center space-x-2">
                    <IconButton
                      size="sm"
                      aria-label="Accept link"
                      icon={<FaCheck size={12} />}
                      onClick={() => {
                        handleUpdateStatus(
                          representation.represented,
                          representation.representative,
                          representation.link,
                          "ACCEPTED"
                        );
                      }}
                      style={{
                        backgroundColor:
                          styleContext.state.buttonHoverColorWeight === "200"
                            ? "#DCFCE7"
                            : "#166534",
                        color:
                          styleContext.state.buttonHoverColorWeight === "200"
                            ? "#16A34A"
                            : "#BBF7D0",
                        borderRadius: "6px",
                        transition: "all 0.2s",
                      }}
                      _hover={{
                        backgroundColor:
                          styleContext.state.buttonHoverColorWeight === "200"
                            ? "#BBF7D0"
                            : "#14532D",
                        transform: "translateY(-1px)",
                      }}
                    />
                    <IconButton
                      size="sm"
                      aria-label="Decline link"
                      icon={<MdClose size={14} />}
                      onClick={() => {
                        handleUpdateStatus(
                          representation.represented,
                          representation.representative,
                          representation.link,
                          "DECLINED"
                        );
                      }}
                      style={{
                        backgroundColor:
                          styleContext.state.buttonHoverColorWeight === "200"
                            ? "#FEE2E2"
                            : "#7F1D1D",
                        color:
                          styleContext.state.buttonHoverColorWeight === "200"
                            ? "#DC2626"
                            : "#FCA5A5",
                        borderRadius: "6px",
                        transition: "all 0.2s",
                      }}
                      _hover={{
                        backgroundColor:
                          styleContext.state.buttonHoverColorWeight === "200"
                            ? "#FECACA"
                            : "#991B1B",
                        transform: "translateY(-1px)",
                      }}
                    />
                  </div>
                )}
                {representation.status === "ACCEPTED" && (
                  <IconButton
                    size="sm"
                    aria-label="Cancel link"
                    icon={<FaTrash size={12} />}
                    onClick={() => {
                      handleDeleteLink(
                        representation.represented,
                        representation.representative,
                        representation.link
                      );
                    }}
                    style={{
                      backgroundColor:
                        styleContext.state.buttonHoverColorWeight === "200"
                          ? "#FEE2E2"
                          : "#7F1D1D",
                      color:
                        styleContext.state.buttonHoverColorWeight === "200"
                          ? "#DC2626"
                          : "#FCA5A5",
                      borderRadius: "6px",
                      transition: "all 0.2s",
                    }}
                    _hover={{
                      backgroundColor:
                        styleContext.state.buttonHoverColorWeight === "200"
                          ? "#FECACA"
                          : "#991B1B",
                      transform: "translateY(-1px)",
                    }}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
