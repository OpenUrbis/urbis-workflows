import { getAccessToken } from "../../auth/token";
import React, { useContext, useEffect, useState } from "react";
import {
  Button,
  FormControl,
  FormLabel,
  Input,
  Spinner,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Textarea,
  IconButton,
  Badge,
  Checkbox,
  Stack,
  Box,
  Divider,
  Text,
  InputGroup,
  InputLeftElement,
  Flex,
  Collapse,
  Select,
  FormHelperText,
} from "@chakra-ui/react";
import {
  FaEdit,
  FaPlus,
  FaTrash,
  FaSearch,
  FaChevronDown,
  FaChevronRight,
} from "react-icons/fa";
import { StyleContext } from "../../reducers";
import { ApiClient } from "../../api";
import { Permission, Role } from "../../api/types/iam.dto";
import { HotkeyContext } from "../../reducers/hotkeys.reducer";
import { useSnackbar } from "../../hooks/snackbar";
import InfoTooltip from "../../components/InfoTooltip";
import { SideDrawer } from "../../components/SideDrawer";

const api = new ApiClient({
  baseURL: import.meta.env.VITE_BACK_END_API || "",
  headers: {
    Authorization: `Bearer ${getAccessToken()}`,
  },
});

const ClickableBadge: React.FC<React.ComponentProps<typeof Badge>> = ({
  children,
  ...props
}) => (
  <Badge {...props} className={`${props.className || ""} cursor-pointer`}>
    {children}
  </Badge>
);

export function Roles(): JSX.Element {
  const styleContext = useContext(StyleContext);
  const hotkeyContext = useContext(HotkeyContext);
  const snackbar = useSnackbar();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    permissionIds: [] as string[],
    accessLevel: 1, // Default to REGISTERED (1)
  });
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [permissionFilter, setPermissionFilter] = useState<string>("");
  const [expandedRoles, setExpandedRoles] = useState<Record<string, boolean>>(
    {}
  );

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [rolesResponse, permissionsResponse] = await Promise.all([
        api.iam.getRoles(),
        api.iam.getPermissions(),
      ]);
      setRoles(rolesResponse.roles);
      setPermissions(permissionsResponse.permissions);
    } catch (error) {
      console.error("Error fetching data:", error);
      snackbar.error("Não foi possível carregar as funções e permissões.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

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
      description: "",
      permissionIds: [],
      accessLevel: 1, // Default to REGISTERED
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

  const handlePermissionChange = (permissionId: string) => {
    setFormData((prev) => {
      const newPermissionIds = prev.permissionIds.includes(permissionId)
        ? prev.permissionIds.filter((id) => id !== permissionId)
        : [...prev.permissionIds, permissionId];

      return {
        ...prev,
        permissionIds: newPermissionIds,
      };
    });
  };

  const handleEditClick = (role: Role) => {
    setSelectedRole(role);
    setFormData({
      name: role.name,
      description: role.description,
      permissionIds: role.permissions.map((p) => p.id),
      accessLevel: role.accessLevel || 1, // Use existing accessLevel or default to REGISTERED
    });
    setIsEdit(true);
    setIsOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    confirmDelete();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    const confirmed = await (window as any).confirmation(
      "Tem certeza que deseja excluir esta função? Esta ação não pode ser desfeita. Os grupos que utilizam esta função perderão as permissões associadas a ela.",
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
        await api.iam.deleteRole(deleteId);
        setRoles(roles.filter((r) => r.id !== deleteId));
        snackbar.success("A função foi excluída com sucesso.");
      } catch (error) {
        console.error("Error deleting role:", error);
        snackbar.error("Não foi possível excluir a função.");
      } finally {
        setIsLoading(false);
        setDeleteId(null);
      }
    }
  };

  const handleSave = async () => {
    if (!formData.name) {
      snackbar.warning("O nome da função é obrigatório.");
      return;
    }

    setIsLoading(true);
    try {
      if (isEdit && selectedRole) {
        const updated = await api.iam.updateRole(selectedRole.id, formData);
        setRoles(roles.map((r) => (r.id === selectedRole.id ? updated : r)));
        snackbar.success("A função foi atualizada com sucesso.");
      } else {
        const created = await api.iam.createRole(formData);
        setRoles([...roles, created]);
        snackbar.success("A função foi criada com sucesso.");
      }
      setIsOpen(false);
    } catch (error) {
      console.error("Error saving role:", error);
      snackbar.error("Não foi possível salvar a função.");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPermissions = permissions.filter(
    (p) =>
      p.name.toLowerCase().includes(permissionFilter.toLowerCase()) ||
      p.code.toLowerCase().includes(permissionFilter.toLowerCase()) ||
      p.description.toLowerCase().includes(permissionFilter.toLowerCase())
  );

  // Group permissions by domain for better organization
  const groupedPermissions = filteredPermissions.reduce(
    (acc, permission) => {
      const domain = permission.code.split(":")[0];
      if (!acc[domain]) {
        acc[domain] = [];
      }
      acc[domain].push(permission);
      return acc;
    },
    {} as Record<string, Permission[]>
  );

  const handleClose = () => {
    setIsOpen(false);
  };

  const toggleRoleExpand = (roleId: string) => {
    setExpandedRoles((prev) => ({
      ...prev,
      [roleId]: !prev[roleId],
    }));
  };

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2
          className="text-xl font-bold"
          style={{ color: styleContext.state.textColor }}
        >
          Funções
        </h2>
        <Button
          leftIcon={<FaPlus />}
          colorScheme="purple"
          onClick={resetFormAndOpen}
          size="sm"
          bg={
            styleContext.state.buttonHoverColorWeight === "200"
              ? "purple.500"
              : "purple.600"
          }
          _hover={{
            bg:
              styleContext.state.buttonHoverColorWeight === "200"
                ? "purple.600"
                : "purple.700",
          }}
          color="white"
        >
          Nova Função
        </Button>
      </div>

      {isLoading && roles.length === 0 ? (
        <div className="flex justify-center my-8">
          <Spinner
            size="lg"
            color={
              styleContext.state.buttonHoverColorWeight === "200"
                ? "purple.500"
                : "purple.400"
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
          <Table variant="simple" size="md">
            <Thead>
              <Tr>
                <Th
                  width="40px"
                  className={
                    styleContext.state.buttonHoverColorWeight === "200"
                      ? "bg-gray-100"
                      : "bg-gray-800"
                  }
                  style={{ color: styleContext.state.textColor }}
                ></Th>
                <Th
                  className={
                    styleContext.state.buttonHoverColorWeight === "200"
                      ? "bg-gray-100"
                      : "bg-gray-800"
                  }
                  style={{ color: styleContext.state.textColor }}
                >
                  Nome
                </Th>
                <Th
                  className={
                    styleContext.state.buttonHoverColorWeight === "200"
                      ? "bg-gray-100"
                      : "bg-gray-800"
                  }
                  style={{ color: styleContext.state.textColor }}
                >
                  Descrição
                </Th>
                <Th
                  className={
                    styleContext.state.buttonHoverColorWeight === "200"
                      ? "bg-gray-100"
                      : "bg-gray-800"
                  }
                  style={{ color: styleContext.state.textColor }}
                >
                  Permissões
                </Th>
                <Th
                  width="100px"
                  textAlign="right"
                  className={
                    styleContext.state.buttonHoverColorWeight === "200"
                      ? "bg-gray-100"
                      : "bg-gray-800"
                  }
                  style={{ color: styleContext.state.textColor }}
                >
                  Ações
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {roles.map((role) => (
                <React.Fragment key={role.id}>
                  <Tr
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
                      onClick={() => toggleRoleExpand(role.id)}
                      className="cursor-pointer"
                    >
                      {expandedRoles[role.id] ? (
                        <FaChevronDown />
                      ) : (
                        <FaChevronRight />
                      )}
                    </Td>
                    <Td
                      fontWeight="medium"
                      style={{ color: styleContext.state.textColor }}
                    >
                      {role.name}
                    </Td>
                    <Td
                      className="max-w-xs truncate"
                      style={{
                        color: styleContext.state.textColor,
                        opacity: 0.9,
                      }}
                    >
                      {role.description}
                    </Td>
                    <Td>
                      <div className="flex flex-wrap gap-1 max-w-md">
                        {role.permissions.length > 0 ? (
                          role.permissions.slice(0, 2).map((permission) => (
                            <InfoTooltip
                              key={permission.id}
                              content={
                                <Box>
                                  <Text fontWeight="bold" mb={2}>
                                    Detalhes da Permissão:
                                  </Text>
                                  <Text mb={1} fontSize="sm">
                                    Nome: {permission.name}
                                  </Text>
                                  <Text mb={1} fontSize="sm">
                                    Código: {permission.code}
                                  </Text>
                                  <Text mb={1} fontSize="sm">
                                    Descrição: {permission.description}
                                  </Text>
                                </Box>
                              }
                              placement="top"
                              showIcon={false}
                            >
                              <ClickableBadge
                                colorScheme="purple"
                                variant="solid"
                                className="flex items-center py-1 hover:opacity-80 transition-opacity"
                                borderRadius="md"
                                bg={
                                  styleContext.state.buttonHoverColorWeight ===
                                  "200"
                                    ? "purple.100"
                                    : "purple.800"
                                }
                                color={
                                  styleContext.state.buttonHoverColorWeight ===
                                  "200"
                                    ? "purple.800"
                                    : "purple.200"
                                }
                              >
                                <span className="mx-1">{permission.code}</span>
                              </ClickableBadge>
                            </InfoTooltip>
                          ))
                        ) : (
                          <Text fontSize="xs" color="gray.500">
                            Sem permissões
                          </Text>
                        )}
                        {role.permissions.length > 2 && (
                          <InfoTooltip
                            content={
                              <Box>
                                <Text fontWeight="bold" mb={2}>
                                  Permissões adicionais:
                                </Text>
                                {role.permissions.slice(2).map((permission) => (
                                  <Text
                                    key={permission.id}
                                    mb={1}
                                    fontSize="sm"
                                  >
                                    • {permission.code} - {permission.name}
                                  </Text>
                                ))}
                              </Box>
                            }
                            placement="top"
                            showIcon={false}
                          >
                            <ClickableBadge
                              colorScheme="gray"
                              py="1"
                              px="2"
                              className="hover:opacity-80 transition-opacity"
                              borderRadius="md"
                              bg={
                                styleContext.state.buttonHoverColorWeight ===
                                "200"
                                  ? "gray.200"
                                  : "gray.600"
                              }
                              color={
                                styleContext.state.buttonHoverColorWeight ===
                                "200"
                                  ? "gray.700"
                                  : "gray.200"
                              }
                            >
                              +{role.permissions.length - 2}
                            </ClickableBadge>
                          </InfoTooltip>
                        )}
                      </div>
                    </Td>
                    <Td textAlign="right">
                      <div className="flex justify-end space-x-2 group">
                        <IconButton
                          aria-label="Edit"
                          icon={<FaEdit />}
                          size="sm"
                          className="opacity-80 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleEditClick(role)}
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
                          onClick={() => handleDeleteClick(role.id)}
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
                  <Tr>
                    <Td colSpan={5} p={0}>
                      <Collapse in={expandedRoles[role.id] || false}>
                        <Box
                          p={4}
                          bg={
                            styleContext.state.buttonHoverColorWeight === "200"
                              ? "gray.50"
                              : "gray.800"
                          }
                          borderBottomWidth="1px"
                          borderBottomColor={
                            styleContext.state.buttonHoverColorWeight === "200"
                              ? "#E5E7EB"
                              : "#374151"
                          }
                        >
                          <Flex justifyContent="space-between" mb={2}>
                            <Text
                              fontWeight="bold"
                              style={{ color: styleContext.state.textColor }}
                            >
                              Detalhes da Função
                            </Text>
                            <InfoTooltip
                              content={
                                <Box>
                                  <Text fontWeight="bold" mb={2}>
                                    Permissões efetivas:
                                  </Text>
                                  <Text fontSize="xs" mb={2}>
                                    (Todas as permissões atribuídas a esta
                                    função)
                                  </Text>
                                  {role.permissions.map((perm) => (
                                    <Text key={perm.id} mb={1} fontSize="sm">
                                      • {perm.name}
                                    </Text>
                                  ))}
                                </Box>
                              }
                              placement="top"
                              showIcon={false}
                            >
                              <ClickableBadge
                                colorScheme="purple"
                                py="1"
                                px="2"
                                className="hover:opacity-80 transition-opacity"
                                borderRadius="md"
                                bg={
                                  styleContext.state.buttonHoverColorWeight ===
                                  "200"
                                    ? "purple.100"
                                    : "purple.800"
                                }
                                color={
                                  styleContext.state.buttonHoverColorWeight ===
                                  "200"
                                    ? "purple.800"
                                    : "purple.200"
                                }
                              >
                                {role.permissions.length} permissões
                              </ClickableBadge>
                            </InfoTooltip>
                          </Flex>
                          <Divider mb={3} />

                          <Text
                            fontSize="sm"
                            fontWeight="medium"
                            mb={2}
                            style={{ color: styleContext.state.textColor }}
                          >
                            <strong>Nível de Acesso:</strong>{" "}
                            {role.accessLevel === 0
                              ? "Público"
                              : role.accessLevel === 1
                                ? "Registrado"
                                : role.accessLevel === 2
                                  ? "Restrito"
                                  : role.accessLevel === 3
                                    ? "Confidencial"
                                    : "Anônimo"}
                          </Text>

                          <Text
                            fontSize="sm"
                            fontWeight="medium"
                            mb={2}
                            style={{ color: styleContext.state.textColor }}
                          >
                            Permissões nesta função:
                          </Text>
                          {role.permissions.length > 0 ? (
                            <Stack spacing={2}>
                              {role.permissions.map((permission) => (
                                <Box
                                  key={permission.id}
                                  p={2}
                                  bg={
                                    styleContext.state
                                      .buttonHoverColorWeight === "200"
                                      ? "white"
                                      : "gray.700"
                                  }
                                  borderWidth="1px"
                                  borderRadius="md"
                                  borderColor={
                                    styleContext.state
                                      .buttonHoverColorWeight === "200"
                                      ? "#E5E7EB"
                                      : "#4B5563"
                                  }
                                >
                                  <Flex
                                    justifyContent="space-between"
                                    alignItems="center"
                                  >
                                    <Text
                                      fontWeight="medium"
                                      style={{
                                        color: styleContext.state.textColor,
                                      }}
                                    >
                                      {permission.name}
                                    </Text>
                                    <InfoTooltip
                                      content={
                                        <Box>
                                          <Text fontWeight="bold" mb={2}>
                                            Detalhes da Permissão:
                                          </Text>
                                          <Text mb={1} fontSize="sm">
                                            Nome: {permission.name}
                                          </Text>
                                          <Text mb={1} fontSize="sm">
                                            Código: {permission.code}
                                          </Text>
                                          <Text mb={1} fontSize="sm">
                                            Descrição: {permission.description}
                                          </Text>
                                        </Box>
                                      }
                                      placement="top"
                                      showIcon={false}
                                    >
                                      <ClickableBadge
                                        colorScheme="purple"
                                        py="1"
                                        px="2"
                                        className="hover:opacity-80 transition-opacity"
                                        borderRadius="md"
                                        bg={
                                          styleContext.state
                                            .buttonHoverColorWeight === "200"
                                            ? "purple.100"
                                            : "purple.800"
                                        }
                                        color={
                                          styleContext.state
                                            .buttonHoverColorWeight === "200"
                                            ? "purple.800"
                                            : "purple.200"
                                        }
                                      >
                                        {permission.code}
                                      </ClickableBadge>
                                    </InfoTooltip>
                                  </Flex>
                                  <Text
                                    fontSize="sm"
                                    color={
                                      styleContext.state
                                        .buttonHoverColorWeight === "200"
                                        ? "gray.600"
                                        : "gray.400"
                                    }
                                    mt={1}
                                  >
                                    {permission.description}
                                  </Text>
                                </Box>
                              ))}
                            </Stack>
                          ) : (
                            <Text
                              fontSize="sm"
                              color={
                                styleContext.state.buttonHoverColorWeight ===
                                "200"
                                  ? "gray.600"
                                  : "gray.400"
                              }
                            >
                              Esta função não possui permissões atribuídas.
                            </Text>
                          )}
                        </Box>
                      </Collapse>
                    </Td>
                  </Tr>
                </React.Fragment>
              ))}
              {roles.length === 0 && (
                <Tr>
                  <Td
                    colSpan={5}
                    className="text-center py-4"
                    style={{ color: styleContext.state.textColor }}
                  >
                    Nenhuma função encontrada
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        </div>
      )}

      {/* Replace custom drawer implementation with SideDrawer component */}
      {isOpen && (
        <SideDrawer
          isOpen={isOpen}
          onClose={handleClose}
          styleContext={styleContext}
          title={isEdit ? "Editar Função" : "Nova Função"}
          width="520px"
          storageKey="iam"
          badge={{
            text: `${formData.permissionIds.length} permissões selecionadas`,
            colorScheme: "purple",
          }}
        >
          <div className="overflow-y-auto">
            <div
              className="p-4 border-b"
              style={{
                borderColor:
                  styleContext.state.buttonHoverColorWeight === "200"
                    ? "#E5E7EB"
                    : "#374151",
              }}
            >
              <FormControl id="name" mb={4} isRequired>
                <FormLabel
                  style={{
                    color: styleContext.state.textColor,
                    fontWeight: "medium",
                  }}
                >
                  Nome da Função
                </FormLabel>
                <Input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Ex: Administrador de Fluxos"
                  borderRadius="md"
                  borderWidth="1px"
                  py={3}
                  size="lg"
                  style={{
                    backgroundColor: styleContext.state.backgroundColor,
                    color: styleContext.state.textColor,
                    borderColor:
                      styleContext.state.buttonHoverColorWeight === "200"
                        ? "#E5E7EB"
                        : "#374151",
                  }}
                  _hover={{
                    borderColor:
                      styleContext.state.buttonHoverColorWeight === "200"
                        ? "#D1D5DB"
                        : "#4B5563",
                  }}
                  _focus={{
                    borderColor:
                      styleContext.state.buttonHoverColorWeight === "200"
                        ? "#3182CE"
                        : "#4299E1",
                    boxShadow:
                      styleContext.state.buttonHoverColorWeight === "200"
                        ? "0 0 0 1px #3182CE"
                        : "0 0 0 1px #4299E1",
                  }}
                />
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
                <Textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Descrição detalhada da função..."
                  borderRadius="md"
                  borderWidth="1px"
                  size="lg"
                  style={{
                    backgroundColor: styleContext.state.backgroundColor,
                    color: styleContext.state.textColor,
                    borderColor:
                      styleContext.state.buttonHoverColorWeight === "200"
                        ? "#E5E7EB"
                        : "#374151",
                  }}
                  _hover={{
                    borderColor:
                      styleContext.state.buttonHoverColorWeight === "200"
                        ? "#D1D5DB"
                        : "#4B5563",
                  }}
                  _focus={{
                    borderColor:
                      styleContext.state.buttonHoverColorWeight === "200"
                        ? "#3182CE"
                        : "#4299E1",
                    boxShadow:
                      styleContext.state.buttonHoverColorWeight === "200"
                        ? "0 0 0 1px #3182CE"
                        : "0 0 0 1px #4299E1",
                  }}
                />
              </FormControl>

              <FormControl id="accessLevel" mb={4}>
                <FormLabel
                  style={{
                    color: styleContext.state.textColor,
                    fontWeight: "medium",
                  }}
                >
                  Nível de Acesso
                </FormLabel>
                <Select
                  name="accessLevel"
                  value={formData.accessLevel}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      accessLevel: parseInt(e.target.value),
                    })
                  }
                  size="lg"
                  style={{
                    backgroundColor: styleContext.state.backgroundColor,
                    color: styleContext.state.textColor,
                    borderColor:
                      styleContext.state.buttonHoverColorWeight === "200"
                        ? "#E5E7EB"
                        : "#374151",
                  }}
                >
                  <option value={0}>Público</option>
                  <option value={1}>Registrado</option>
                  <option value={2}>Restrito</option>
                  <option value={3}>Confidencial</option>
                  <option value={4}>Anônimo</option>
                </Select>
                <FormHelperText
                  style={{
                    color:
                      styleContext.state.buttonHoverColorWeight === "200"
                        ? "gray.600"
                        : "gray.400",
                  }}
                >
                  Define o nível de acesso desta função
                </FormHelperText>
              </FormControl>
            </div>

            <div className="p-4">
              <p
                className="text-sm mb-4 font-medium"
                style={{ color: styleContext.state.textColor }}
              >
                Selecione as permissões para esta função:
              </p>

              <div className="mb-4">
                <div
                  className="relative"
                  style={{
                    color: styleContext.state.textColor,
                  }}
                >
                  <InputGroup size="lg">
                    <InputLeftElement
                      pointerEvents="none"
                      height="100%"
                      children={<FaSearch className="text-gray-400" />}
                    />
                    <Input
                      placeholder="Buscar permissões..."
                      value={permissionFilter}
                      onChange={(e) => setPermissionFilter(e.target.value)}
                      style={{
                        backgroundColor: styleContext.state.backgroundColor,
                        color: styleContext.state.textColor,
                        borderColor:
                          styleContext.state.buttonHoverColorWeight === "200"
                            ? "#E5E7EB"
                            : "#374151",
                      }}
                      _hover={{
                        borderColor:
                          styleContext.state.buttonHoverColorWeight === "200"
                            ? "#D1D5DB"
                            : "#4B5563",
                      }}
                      _focus={{
                        borderColor:
                          styleContext.state.buttonHoverColorWeight === "200"
                            ? "#3182CE"
                            : "#4299E1",
                        boxShadow:
                          styleContext.state.buttonHoverColorWeight === "200"
                            ? "0 0 0 1px #3182CE"
                            : "0 0 0 1px #4299E1",
                      }}
                    />
                  </InputGroup>
                </div>
              </div>

              {Object.entries(groupedPermissions).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <FaSearch size={32} className="mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-1">
                    Nenhuma permissão encontrada
                  </p>
                  <p className="text-sm">Tente buscar com outros termos</p>
                </div>
              ) : (
                <Box maxH="400px" overflowY="auto">
                  {Object.entries(groupedPermissions).map(
                    ([category, permissions]) => (
                      <Box key={category} mb={4}>
                        <Text
                          fontWeight="bold"
                          mb={2}
                          color={styleContext.state.textColor}
                        >
                          {category}
                        </Text>
                        <Stack spacing={2}>
                          {permissions.map((permission) => (
                            <Box
                              key={permission.id}
                              p={3}
                              borderRadius="lg"
                              transition="all 0.2s"
                              cursor="pointer"
                              onClick={() =>
                                handlePermissionChange(permission.id)
                              }
                              style={{
                                backgroundColor:
                                  formData.permissionIds.includes(permission.id)
                                    ? styleContext.state
                                        .buttonHoverColorWeight === "200"
                                      ? "rgba(139, 92, 246, 0.1)"
                                      : "rgba(124, 58, 237, 0.2)"
                                    : "transparent",
                              }}
                              _hover={{
                                bg: !formData.permissionIds.includes(
                                  permission.id
                                )
                                  ? styleContext.state
                                      .buttonHoverColorWeight === "200"
                                    ? "rgba(243, 244, 246, 0.8)"
                                    : "rgba(31, 41, 55, 0.5)"
                                  : undefined,
                              }}
                            >
                              <div className="flex items-center w-full">
                                <Checkbox
                                  isChecked={formData.permissionIds.includes(
                                    permission.id
                                  )}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    handlePermissionChange(permission.id);
                                  }}
                                  colorScheme="purple"
                                  size="lg"
                                  className="mr-3"
                                  borderRadius="md"
                                  onClick={(e) => e.stopPropagation()}
                                  sx={{
                                    "span.chakra-checkbox__control": {
                                      borderRadius: "0.375rem",
                                    },
                                  }}
                                />
                                <div className="flex-1">
                                  <Text
                                    fontWeight="medium"
                                    color={styleContext.state.textColor}
                                  >
                                    {permission.name}
                                  </Text>
                                  <Text
                                    fontSize="xs"
                                    color={
                                      styleContext.state
                                        .buttonHoverColorWeight === "200"
                                        ? "gray.600"
                                        : "gray.400"
                                    }
                                  >
                                    <code>{permission.code}</code>
                                    {permission.description &&
                                      ` - ${permission.description}`}
                                  </Text>
                                </div>
                              </div>
                            </Box>
                          ))}
                        </Stack>
                        <Divider my={2} />
                      </Box>
                    )
                  )}
                </Box>
              )}
              <Text
                fontSize="sm"
                color={
                  styleContext.state.buttonHoverColorWeight === "200"
                    ? "gray.600"
                    : "gray.400"
                }
                mt={2}
              >
                Selecionadas: {formData.permissionIds.length} permissões
              </Text>
            </div>
          </div>

          <div
            className="absolute bottom-0 left-0 right-0 p-4 border-t flex justify-end space-x-3 z-10"
            style={{
              borderColor:
                styleContext.state.buttonHoverColorWeight === "200"
                  ? "#E5E7EB"
                  : "#374151",
              backgroundColor: styleContext.state.backgroundColor,
            }}
          >
            <Button
              colorScheme="purple"
              onClick={handleSave}
              isLoading={isLoading}
              size="md"
              bg={
                styleContext.state.buttonHoverColorWeight === "200"
                  ? "purple.500"
                  : "purple.600"
              }
              _hover={{
                bg:
                  styleContext.state.buttonHoverColorWeight === "200"
                    ? "purple.600"
                    : "purple.700",
              }}
            >
              {isEdit ? "Atualizar" : "Criar"} Função
            </Button>
          </div>
        </SideDrawer>
      )}

      {/* Delete Confirmation Alert Dialog - Removed as we're using window.confirmation instead */}
    </div>
  );
}
