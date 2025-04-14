import React, { useContext, useEffect, useState } from "react";
import { HotkeyContext } from "../../reducers/hotkeys.reducer";
import { IconButton, Spinner, Tag } from "@chakra-ui/react";
import { FaTrash, FaUserFriends } from "react-icons/fa";
import { COLOR_MAPPER, LABEL_MAPPER } from "./MyRepresentation";
import { ApiClient } from "../../api";
import { RepresentativeLink } from "../../api/types/users.dto";
import { StyleContext } from "../../reducers/style.reducer";

const api = new ApiClient({
  baseURL: process.env.REACT_APP_BACK_END_API || "",
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

export function MyRepresentatives(): JSX.Element {
  const hotkeyContext = useContext(HotkeyContext);
  const styleContext = useContext(StyleContext);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <h1
        className="text-xl md:text-2xl font-medium text-center mb-6"
        style={{ color: styleContext.state.textColor }}
      >
        Meus Representantes
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

      {!loading && representatives.length === 0 && (
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
            Nenhum representante cadastrado
          </p>
          <p
            className="text-sm"
            style={{ color: styleContext.state.textColor }}
          >
            Você não possui representantes ativos no momento
          </p>
        </div>
      )}

      {!loading && representatives.length > 0 && (
        <div className="grid gap-4">
          {representatives.map((representative) => (
            <div
              key={representative.id}
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
                      {representative.representative}
                    </div>
                  </div>
                  <div style={{ color: styleContext.state.textColor }}>
                    <span className="text-sm font-medium">Vínculo</span>
                    <div className="font-medium mt-1">
                      {representative.link}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div style={{ color: styleContext.state.textColor }}>
                    <span className="text-sm font-medium">Emitido em</span>
                    <div className="mt-1">
                      {new Date(representative.timestamp).toLocaleString(
                        "pt-br"
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div style={{ color: styleContext.state.textColor }}>
                    <span className="text-sm font-medium">Atualizado em</span>
                    <div className="mt-1">
                      {new Date(representative.updatedAt).toLocaleString(
                        "pt-br"
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex md:flex-col items-center justify-between md:justify-center space-x-4 md:space-x-0 md:space-y-4 md:min-w-[120px] border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6 mt-4 md:mt-0">
                <Tag
                  colorScheme={COLOR_MAPPER[representative.status]}
                  size="md"
                  className="min-w-[100px] text-center"
                  style={{
                    borderRadius: "6px",
                    fontWeight: "500",
                  }}
                >
                  {LABEL_MAPPER[representative.status]}
                </Tag>

                {representative.status !== "CANCELLED" && (
                  <IconButton
                    size="sm"
                    aria-label="Remove link"
                    icon={<FaTrash size={12} />}
                    onClick={() => {
                      handleDeleteLink(
                        representative.represented,
                        representative.representative,
                        representative.link
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
