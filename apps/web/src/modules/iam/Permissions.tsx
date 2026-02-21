import { getAccessToken } from "../../auth/token";
import React, { useContext, useEffect, useState } from "react";
import {
  FormControl,
  FormLabel,
  Spinner,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  IconButton,
  Tooltip,
  Badge,
} from "@chakra-ui/react";
import {
  Button as DSButton,
  Input as DSInput,
  Textarea as DSTextarea,
} from "@open-urbis/map-ui";
import { FaEdit, FaPlus, FaTrash } from "react-icons/fa";
import { StyleContext } from "../../reducers";
import { ApiClient } from "../../api";
import { Permission } from "../../api/types/iam.dto";
import { HotkeyContext } from "../../reducers/hotkeys.reducer";
import { useSnackbar } from "../../hooks/snackbar";
import { SideDrawer } from "../../components/SideDrawer";

const api = new ApiClient({
  baseURL: import.meta.env.VITE_BACK_END_API || "",
  headers: {
    Authorization: `Bearer ${getAccessToken()}`,
  },
});

export function Permissions(): JSX.Element {
  const styleContext = useContext(StyleContext);
  const hotkeyContext = useContext(HotkeyContext);
  const snackbar = useSnackbar();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedPermission, setSelectedPermission] =
    useState<Permission | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
  });
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchPermissions = async () => {
    setIsLoading(true);
    try {
      const response = await api.iam.getPermissions();
      // Sort permissions by code
      const sortedPermissions = [...response.permissions].sort((a, b) =>
        a.code.localeCompare(b.code)
      );
      setPermissions(sortedPermissions);
    } catch (error) {
      console.error("Error fetching permissions:", error);
      snackbar.error("Não foi possível carregar a lista de permissões.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();

    hotkeyContext.dispatch({
      type: "SET_HOTKEY",
      payload: {
        N: () => {
          resetFormAndOpen();
        },
      },
    });

    return () => {
      hotkeyContext.dispatch({
        type: "UNSET_HOTKEY",
        delete: ["N"],
      });
    };
    
  }, []);

  const resetFormAndOpen = () => {
    setFormData({
      name: "",
      code: "",
      description: "",
    });
    setIsEdit(false);
    setIsOpen(true);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleEditClick = (permission: Permission) => {
    setSelectedPermission(permission);
    setFormData({
      name: permission.name,
      code: permission.code,
      description: permission.description,
    });
    setIsEdit(true);
    setIsOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    confirmDelete();
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    const confirmed = await (window as any).confirmation(
      "Tem certeza que deseja excluir esta permissão? Esta ação não pode ser desfeita. As funções que utilizam esta permissão podem ser afetadas.",
      {
        title: "Confirmar Exclusão",
        type: "warning",
        confirmText: "Excluir",
        cancelText: "Cancelar",
      }
    );

    if (confirmed) {
      setIsLoading(true);
      try {
        await api.iam.deletePermission(deleteId);
        setPermissions(permissions.filter((p) => p.id !== deleteId));
        snackbar.success("A permissão foi excluída com sucesso.");
      } catch (error) {
        console.error("Error deleting permission:", error);
        snackbar.error("Não foi possível excluir a permissão.");
      } finally {
        setIsLoading(false);
        setDeleteId(null);
      }
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.code) {
      snackbar.warning("Nome e código são campos obrigatórios.");
      return;
    }

    setIsLoading(true);
    try {
      if (isEdit && selectedPermission) {
        const updated = await api.iam.updatePermission(
          selectedPermission.id,
          formData
        );
        setPermissions(
          permissions.map((p) => (p.id === selectedPermission.id ? updated : p))
        );
        snackbar.success("A permissão foi atualizada com sucesso.");
      } else {
        const created = await api.iam.createPermission(formData);
        setPermissions([...permissions, created]);
        snackbar.success("A permissão foi criada com sucesso.");
      }
      setIsOpen(false);
    } catch (error) {
      console.error("Error saving permission:", error);
      snackbar.error("Não foi possível salvar a permissão.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col space-y-6 mb-20">
      <div className="flex justify-between items-center mb-4">
        <h2
          className="text-xl font-bold"
          style={{ color: styleContext.state.textColor }}
        >
          Permissões
        </h2>
        <DSButton
          type="button"
          size="sm"
          onClick={resetFormAndOpen}
          className={`h-9 rounded-lg px-4 gap-2 text-white ${
            styleContext.state.buttonHoverColorWeight === "200"
              ? "bg-orange-500 hover:bg-orange-600"
              : "bg-orange-600 hover:bg-orange-700"
          }`}
        >
          <FaPlus size={14} />
          Nova Permissão
        </DSButton>
      </div>

      {isLoading && permissions.length === 0 ? (
        <div className="flex justify-center my-8">
          <Spinner
            size="lg"
            color={
              styleContext.state.buttonHoverColorWeight === "200"
                ? "orange.500"
                : "orange.400"
            }
            thickness="3px"
          />
        </div>
      ) : (
        <div
          className="rounded-lg overflow-hidden border"
          style={{
            backgroundColor: styleContext.state.backgroundColor,
            borderColor:
              styleContext.state.buttonHoverColorWeight === "200"
                ? "#E5E7EB"
                : "#374151",
          }}
        >
          <div className="overflow-x-auto w-full">
            <Table
              variant="simple"
              size="sm"
              className="text-sm"
              style={{ tableLayout: "fixed", width: "100%" }}
            >
              <Thead className="text-xs">
                <Tr>
                  <Th
                    className={
                      `${
                        styleContext.state.buttonHoverColorWeight === "200"
                          ? "bg-gray-100"
                          : "bg-gray-800"
                      } text-xs font-semibold`
                    }
                    style={{
                      color: styleContext.state.textColor,
                      width: "20%",
                      minWidth: "150px",
                    }}
                  >
                    Nome
                  </Th>
                  <Th
                    className={
                      `${
                        styleContext.state.buttonHoverColorWeight === "200"
                          ? "bg-gray-100"
                          : "bg-gray-800"
                      } text-xs font-semibold`
                    }
                    style={{
                      color: styleContext.state.textColor,
                      width: "25%",
                      minWidth: "180px",
                    }}
                  >
                    Código
                  </Th>
                  <Th
                    className={
                      `${
                        styleContext.state.buttonHoverColorWeight === "200"
                          ? "bg-gray-100"
                          : "bg-gray-800"
                      } text-xs font-semibold`
                    }
                    style={{
                      color: styleContext.state.textColor,
                      width: "45%",
                    }}
                  >
                    Descrição
                  </Th>
                  <Th
                    className={
                      `${
                        styleContext.state.buttonHoverColorWeight === "200"
                          ? "bg-gray-100"
                          : "bg-gray-800"
                      } text-xs font-semibold`
                    }
                    style={{
                      color: styleContext.state.textColor,
                      width: "10%",
                      minWidth: "100px",
                      textAlign: "right",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Ações
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {permissions.map((permission) => (
                  <Tr
                    key={permission.id}
                    className="transition-colors duration-200"
                    _hover={{
                      bg:
                        styleContext.state.buttonHoverColorWeight === "200"
                          ? "gray.50"
                          : "gray.700",
                    }}
                    style={{
                      backgroundColor: styleContext.state.backgroundColor,
                    }}
                  >
                    <Td
                      fontWeight="medium"
                      style={{
                        color: styleContext.state.textColor,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <Tooltip
                        label={permission.name}
                        placement="top"
                        hasArrow
                        bg={
                          styleContext.state.buttonHoverColorWeight === "200"
                            ? "gray.700"
                            : "gray.200"
                        }
                        color={
                          styleContext.state.buttonHoverColorWeight === "200"
                            ? "white"
                            : "gray.800"
                        }
                      >
                        <div className="truncate">{permission.name}</div>
                      </Tooltip>
                    </Td>
                    <Td
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <Tooltip
                        label={permission.code}
                        placement="top"
                        hasArrow
                        bg={
                          styleContext.state.buttonHoverColorWeight === "200"
                            ? "gray.700"
                            : "gray.200"
                        }
                        color={
                          styleContext.state.buttonHoverColorWeight === "200"
                            ? "white"
                            : "gray.800"
                        }
                      >
                        <Badge
                          colorScheme="orange"
                          variant="solid"
                          py="1"
                          px="2"
                          className="hover:opacity-80 transition-opacity truncate max-w-full inline-block"
                          borderRadius="md"
                          bg={
                            styleContext.state.buttonHoverColorWeight === "200"
                              ? "orange.100"
                              : "orange.800"
                          }
                          color={
                            styleContext.state.buttonHoverColorWeight === "200"
                              ? "orange.800"
                              : "orange.200"
                          }
                        >
                          {permission.code}
                        </Badge>
                      </Tooltip>
                    </Td>
                    <Td
                      style={{
                        color: styleContext.state.textColor,
                        opacity: 0.9,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <Tooltip
                        label={permission.description || "Sem descrição"}
                        placement="top"
                        hasArrow
                        bg={
                          styleContext.state.buttonHoverColorWeight === "200"
                            ? "gray.700"
                            : "gray.200"
                        }
                        color={
                          styleContext.state.buttonHoverColorWeight === "200"
                            ? "white"
                            : "gray.800"
                        }
                      >
                        <div className="cursor-help truncate">
                          {permission.description || "Sem descrição"}
                        </div>
                      </Tooltip>
                    </Td>
                    <Td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      <div className="flex justify-end space-x-2 group">
                        <IconButton
                          aria-label="Edit"
                          icon={<FaEdit />}
                          size="sm"
                          className="opacity-80 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleEditClick(permission)}
                          style={{
                            backgroundColor:
                              styleContext.state.buttonHoverColorWeight ===
                              "200"
                                ? "#F3F4F6"
                                : "#4B5563",
                            color: styleContext.state.textColor,
                          }}
                        />
                        <IconButton
                          aria-label="Delete"
                          icon={<FaTrash />}
                          size="sm"
                          className="opacity-80 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDeleteClick(permission.id)}
                          style={{
                            backgroundColor:
                              styleContext.state.buttonHoverColorWeight ===
                              "200"
                                ? "#F3F4F6"
                                : "#4B5563",
                            color: styleContext.state.textColor,
                          }}
                        />
                      </div>
                    </Td>
                  </Tr>
                ))}
                {permissions.length === 0 && (
                  <Tr>
                    <Td
                      colSpan={4}
                      className="text-center py-4"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      Nenhuma permissão encontrada
                    </Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          </div>
        </div>
      )}

      {/* Replace custom drawer implementation with SideDrawer component */}
      {isOpen && (
        <SideDrawer
          isOpen={isOpen}
          onClose={handleClose}
          styleContext={styleContext}
          title={isEdit ? "Editar Permissão" : "Nova Permissão"}
          width="520px"
          storageKey="iam"
          badge={
            isEdit
              ? {
                  text: selectedPermission?.code || "",
                  colorScheme: "orange",
                }
              : undefined
          }
        >
          <div className="overflow-y-auto">
            <div className="p-4 border-b border-border">
              <FormControl id="name" mb={4} isRequired>
                <FormLabel
                  style={{
                    color: styleContext.state.textColor,
                    fontWeight: "medium",
                  }}
                >
                  Nome da Permissão
                </FormLabel>
                <DSInput
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Ex: Visualizar Fluxos de Trabalho"
                  className="h-11 bg-background text-foreground border-border focus-visible:ring-2 focus-visible:ring-primary"
                />
              </FormControl>

              <FormControl id="code" mb={4} isRequired>
                <FormLabel
                  style={{
                    color: styleContext.state.textColor,
                    fontWeight: "medium",
                  }}
                >
                  Código
                </FormLabel>
                <DSInput
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  placeholder="Ex: workflow:read:*"
                  className="h-11 bg-background text-foreground border-border focus-visible:ring-2 focus-visible:ring-primary"
                />
                <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Formato: dominio:tipo_operacao:acao (use * para curingas)
                </div>
              </FormControl>

              <FormControl id="description" mb={4}>
                <FormLabel
                  style={{
                    color: styleContext.state.textColor,
                    fontWeight: "medium",
                  }}
                >
                  Descrição
                </FormLabel>
                <DSTextarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Descrição detalhada da permissão..."
                  className="min-h-[112px] bg-background text-foreground border-border focus-visible:ring-2 focus-visible:ring-primary"
                />
              </FormControl>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-background flex justify-end space-x-3 z-10">
            <DSButton
              type="button"
              onClick={handleSave}
              disabled={isLoading}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {isEdit ? "Atualizar" : "Criar"} Permissão
            </DSButton>
          </div>
        </SideDrawer>
      )}
    </div>
  );
}
