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
  Badge,
  Checkbox,
  Stack,
  Box,
  Text,
  Divider,
  Flex,
  Collapse,
  FormHelperText,
} from "@chakra-ui/react";
import {
  Button as DSButton,
  Input as DSInput,
  Select as DSSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea as DSTextarea,
} from "@open-urbis/map-ui";
import {
  FaEdit,
  FaPlus,
  FaTrash,
  FaChevronDown,
  FaChevronRight,
  FaSearch,
} from "react-icons/fa";
import { StyleContext } from "../../reducers";
import { ApiClient } from "../../api";
import { Role, Group } from "../../api/types/iam.dto";
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

// Badge wrapper component with cursor pointer
const ClickableBadge: React.FC<React.ComponentProps<typeof Badge>> = ({
  children,
  ...props
}) => (
  <Badge {...props} className={`${props.className || ""} cursor-pointer`}>
    {children}
  </Badge>
);

export function Groups(): JSX.Element {
  const styleContext = useContext(StyleContext);
  const hotkeyContext = useContext(HotkeyContext);
  const snackbar = useSnackbar();
  const [groups, setGroups] = useState<Group[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    roleIds: [] as string[],
    accessLevel: 1, // Default to REGISTERED (1)
  });
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {}
  );
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [groupsResponse, rolesResponse] = await Promise.all([
        api.iam.getGroups(),
        api.iam.getRoles(),
      ]);
      setGroups(groupsResponse.groups);
      setRoles(rolesResponse.roles);
    } catch (error) {
      console.error("Error fetching data:", error);
      snackbar.error("Não foi possível carregar os grupos e funções.");
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
      roleIds: [],
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

  const handleRoleChange = (roleId: string) => {
    setFormData((prev) => {
      const newRoleIds = prev.roleIds.includes(roleId)
        ? prev.roleIds.filter((id) => id !== roleId)
        : [...prev.roleIds, roleId];

      return {
        ...prev,
        roleIds: newRoleIds,
      };
    });
  };

  const handleEditClick = (group: Group) => {
    setSelectedGroup(group);
    setFormData({
      name: group.name,
      description: group.description,
      roleIds: group.roles.map((r) => r.id),
      accessLevel: group.accessLevel || 1, // Use existing accessLevel or default to REGISTERED
    });
    setIsEdit(true);
    setIsOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    confirmDelete();
  };

  const toggleGroupExpand = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    const confirmed = await (window as any).confirmation(
      "Tem certeza que deseja excluir este grupo? Esta ação não pode ser desfeita. Os usuários deste grupo perderão as permissões associadas a ele.",
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
        await api.iam.deleteGroup(deleteId);
        setGroups(groups.filter((g) => g.id !== deleteId));
        snackbar.success("O grupo foi excluído com sucesso.");
      } catch (error) {
        console.error("Error deleting group:", error);
        snackbar.error("Não foi possível excluir o grupo.");
      } finally {
        setIsLoading(false);
        setDeleteId(null);
      }
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSave = async () => {
    if (!formData.name) {
      snackbar.warning("O nome do grupo é obrigatório.");
      return;
    }

    setIsLoading(true);
    try {
      if (isEdit && selectedGroup) {
        const updated = await api.iam.updateGroup(selectedGroup.id, formData);
        setGroups(groups.map((g) => (g.id === selectedGroup.id ? updated : g)));
        snackbar.success("O grupo foi atualizado com sucesso.");
      } else {
        const created = await api.iam.createGroup(formData);
        setGroups([...groups, created]);
        snackbar.success("O grupo foi criado com sucesso.");
      }
      setIsOpen(false);
    } catch (error) {
      console.error("Error saving group:", error);
      snackbar.error("Não foi possível salvar o grupo.");
    } finally {
      setIsLoading(false);
    }
  };

  // Count total permissions for each group
  const getTotalPermissions = (group: Group): number => {
    const permissionSet = new Set<string>();

    group.roles.forEach((role) => {
      role.permissions.forEach((permission) => {
        permissionSet.add(permission.id);
      });
    });

    return permissionSet.size;
  };

  // Filter roles by search term
  const filteredRoles = roles.filter(
    (role) =>
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col space-y-6 mb-20">
      <div className="flex justify-between items-center mb-4">
        <h2
          className="text-xl font-bold"
          style={{ color: styleContext.state.textColor }}
        >
          Grupos
        </h2>
        <DSButton
          type="button"
          size="sm"
          onClick={resetFormAndOpen}
          className={`h-9 rounded-lg px-4 gap-2 text-white ${
            styleContext.state.buttonHoverColorWeight === "200"
              ? "bg-teal-500 hover:bg-teal-600"
              : "bg-teal-600 hover:bg-teal-700"
          }`}
        >
          <FaPlus size={14} />
          Novo Grupo
        </DSButton>
      </div>

      {isLoading && groups.length === 0 ? (
        <div className="flex justify-center my-8">
          <Spinner
            size="lg"
            color={
              styleContext.state.buttonHoverColorWeight === "200"
                ? "teal.500"
                : "teal.400"
            }
            thickness="3px"
          />
        </div>
      ) : (
        <div className="ds-table rounded-lg overflow-hidden border border-border bg-card">
          <Table variant="simple" size="sm" className="text-sm">
            <Thead className="text-xs">
              <Tr>
                <Th
                  width="40px"
                  className="bg-muted/40 text-xs font-semibold text-foreground"
                ></Th>
                <Th
                  className="bg-muted/40 text-xs font-semibold text-foreground"
                >
                  Nome
                </Th>
                <Th
                  className="bg-muted/40 text-xs font-semibold text-foreground"
                >
                  Descrição
                </Th>
                <Th
                  className="bg-muted/40 text-xs font-semibold text-foreground"
                >
                  Funções
                </Th>
                <Th
                  width="100px"
                  textAlign="right"
                  className="bg-muted/40 text-xs font-semibold text-foreground"
                >
                  Ações
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {groups.map((group) => (
                <React.Fragment key={group.id}>
                  <Tr
                    className="transition-colors duration-200 hover:bg-muted/50"
                  >
                    <Td
                      onClick={() => toggleGroupExpand(group.id)}
                      className="cursor-pointer text-foreground"
                    >
                      {expandedGroups[group.id] ? (
                        <FaChevronDown />
                      ) : (
                        <FaChevronRight />
                      )}
                    </Td>
                    <Td
                      fontWeight="medium"
                      className="text-foreground"
                    >
                      {group.name}
                    </Td>
                    <Td
                      className="max-w-xs truncate text-muted-foreground"
                    >
                      {group.description}
                    </Td>
                    <Td>
                      <div className="flex flex-wrap gap-1 max-w-md">
                        {group.roles.length > 0 ? (
                          group.roles.slice(0, 3).map((role) => (
                            <InfoTooltip
                              key={role.id}
                              content={
                                <Box>
                                  <Text fontWeight="bold" mb={2}>
                                    Permissões:
                                  </Text>
                                  {role.permissions.map((perm) => (
                                    <Text key={perm.id} mb={1} fontSize="sm">
                                      • <code>{perm.code}</code>
                                      {perm.description &&
                                        ` - ${perm.description}`}
                                    </Text>
                                  ))}
                                </Box>
                              }
                              placement="top"
                              showIcon={false}
                            >
                              <ClickableBadge
                                colorScheme="teal"
                                variant="solid"
                                className="flex items-center py-1 hover:opacity-80 transition-opacity"
                                borderRadius="md"
                                bg={
                                  styleContext.state.buttonHoverColorWeight ===
                                  "200"
                                    ? "teal.100"
                                    : "teal.800"
                                }
                                color={
                                  styleContext.state.buttonHoverColorWeight ===
                                  "200"
                                    ? "teal.800"
                                    : "teal.200"
                                }
                              >
                                <span className="mx-1">{role.name}</span>
                              </ClickableBadge>
                            </InfoTooltip>
                          ))
                        ) : (
                          <Text fontSize="xs" color="gray.500">
                            Sem funções
                          </Text>
                        )}
                        {group.roles.length > 3 && (
                          <InfoTooltip
                            content={
                              <Box>
                                <Text fontWeight="bold" mb={2}>
                                  Funções adicionais:
                                </Text>
                                {group.roles.slice(3).map((role) => (
                                  <Text key={role.id} mb={1} fontSize="sm">
                                    • {role.name}
                                    {role.description &&
                                      ` - ${role.description}`}
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
                              +{group.roles.length - 3}
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
                          onClick={() => handleEditClick(group)}
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
                          onClick={() => handleDeleteClick(group.id)}
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
                      <Collapse in={expandedGroups[group.id] || false}>
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
                              Detalhes do Grupo
                            </Text>
                            <InfoTooltip
                              content={
                                <Box>
                                  <Text fontWeight="bold" mb={2}>
                                    Permissões efetivas:
                                  </Text>
                                  <Text fontSize="xs" mb={2}>
                                    (Combinação de todas as permissões das
                                    funções deste grupo)
                                  </Text>
                                  {Array.from(
                                    new Set(
                                      group.roles.flatMap((role) =>
                                        role.permissions.map((perm) => perm)
                                      )
                                    )
                                  ).map((perm, idx) => (
                                    <Text key={idx} mb={1} fontSize="sm">
                                      • <code>{perm.code}</code>
                                      {perm.description &&
                                        ` - ${perm.description}`}
                                    </Text>
                                  ))}
                                </Box>
                              }
                              placement="top"
                              showIcon={false}
                            >
                              <ClickableBadge
                                colorScheme="teal"
                                py="1"
                                px="2"
                                className="hover:opacity-80 transition-opacity"
                                borderRadius="md"
                                bg={
                                  styleContext.state.buttonHoverColorWeight ===
                                  "200"
                                    ? "teal.100"
                                    : "teal.800"
                                }
                                color={
                                  styleContext.state.buttonHoverColorWeight ===
                                  "200"
                                    ? "teal.800"
                                    : "teal.200"
                                }
                              >
                                {getTotalPermissions(group)} permissões efetivas
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
                            {group.accessLevel === 0
                              ? "Público"
                              : group.accessLevel === 1
                                ? "Registrado"
                                : group.accessLevel === 2
                                  ? "Restrito"
                                  : group.accessLevel === 3
                                    ? "Confidencial"
                                    : "Anônimo"}
                          </Text>

                          <Text
                            fontSize="sm"
                            fontWeight="medium"
                            mb={2}
                            style={{ color: styleContext.state.textColor }}
                          >
                            Funções neste grupo:
                          </Text>
                          {group.roles.length > 0 ? (
                            <Stack spacing={2}>
                              {group.roles.map((role) => (
                                <Box
                                  key={role.id}
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
                                      {role.name}
                                    </Text>
                                    <InfoTooltip
                                      content={
                                        <Box>
                                          <Text fontWeight="bold" mb={2}>
                                            Permissões:
                                          </Text>
                                          {role.permissions.map((perm) => (
                                            <Text
                                              key={perm.id}
                                              mb={1}
                                              fontSize="sm"
                                            >
                                              • <code>{perm.code}</code>
                                              {perm.description &&
                                                ` - ${perm.description}`}
                                            </Text>
                                          ))}
                                        </Box>
                                      }
                                      placement="top"
                                      showIcon={false}
                                    >
                                      <ClickableBadge
                                        colorScheme="orange"
                                        py="1"
                                        px="2"
                                        className="hover:opacity-80 transition-opacity"
                                        borderRadius="md"
                                        bg={
                                          styleContext.state
                                            .buttonHoverColorWeight === "200"
                                            ? "orange.100"
                                            : "orange.800"
                                        }
                                        color={
                                          styleContext.state
                                            .buttonHoverColorWeight === "200"
                                            ? "orange.800"
                                            : "orange.200"
                                        }
                                      >
                                        {role.permissions.length} permissões
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
                                    {role.description}
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
                              Este grupo não possui funções atribuídas.
                            </Text>
                          )}
                        </Box>
                      </Collapse>
                    </Td>
                  </Tr>
                </React.Fragment>
              ))}
              {groups.length === 0 && (
                <Tr>
                  <Td
                    colSpan={5}
                    className="text-center py-4"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    Nenhum grupo encontrado
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        </div>
      )}

      {/* Add/Edit Group Drawer - Using SideDrawer component */}
      {isOpen && (
        <SideDrawer
          isOpen={isOpen}
          onClose={handleClose}
          styleContext={styleContext}
          title={isEdit ? "Editar Grupo" : "Novo Grupo"}
          width="520px"
          storageKey="iam"
          badge={{
            text: `${formData.roleIds.length} funções selecionadas`,
            colorScheme: "teal",
          }}
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
                  Nome do Grupo
                </FormLabel>
                <DSInput
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Ex: Equipe de Aprovação"
                  className="h-11 bg-background text-foreground border-border focus-visible:ring-2 focus-visible:ring-primary"
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
                <DSTextarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Descrição detalhada do grupo..."
                  className="min-h-[112px] bg-background text-foreground border-border focus-visible:ring-2 focus-visible:ring-primary"
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
                <DSSelect
                  value={String(formData.accessLevel)}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      accessLevel: parseInt(value, 10),
                    })
                  }
                >
                  <SelectTrigger className="h-11 w-full bg-background text-foreground border-border">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="z-[2000]">
                    <SelectItem value="0">Público</SelectItem>
                    <SelectItem value="1">Registrado</SelectItem>
                    <SelectItem value="2">Restrito</SelectItem>
                    <SelectItem value="3">Confidencial</SelectItem>
                  </SelectContent>
                </DSSelect>
                <FormHelperText
                  style={{
                    color:
                      styleContext.state.buttonHoverColorWeight === "200"
                        ? "gray.600"
                        : "gray.400",
                  }}
                >
                  Define o nível de acesso necessário para este grupo
                </FormHelperText>
              </FormControl>
            </div>

            <div className="p-4">
              <p
                className="text-sm mb-4 font-medium"
                style={{ color: styleContext.state.textColor }}
              >
                Selecione as funções para este grupo:
              </p>

              <div className="relative mb-4">
                <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <DSInput
                  placeholder="Buscar funções..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSearchTerm(e.target.value)
                  }
                  className="h-11 pl-9 bg-background text-foreground border-border focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>

              {filteredRoles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <FaSearch size={32} className="mb-4 opacity-60" />
                  <p className="text-lg font-medium mb-1 text-foreground">
                    Nenhuma função encontrada
                  </p>
                  <p className="text-sm">Tente buscar com outros termos</p>
                </div>
              ) : (
                <Box maxH="400px" overflowY="auto">
                  <Stack spacing={2}>
                    {filteredRoles.map((role) => (
                      <Box
                        key={role.id}
                        p={3}
                        borderRadius="lg"
                        transition="all 0.2s"
                        cursor="pointer"
                        onClick={() => handleRoleChange(role.id)}
                        style={{
                          backgroundColor: formData.roleIds.includes(role.id)
                            ? styleContext.state.buttonHoverColorWeight ===
                              "200"
                              ? "rgba(20, 184, 166, 0.1)"
                              : "rgba(13, 148, 136, 0.2)"
                            : "transparent",
                        }}
                        _hover={{
                          bg: !formData.roleIds.includes(role.id)
                            ? styleContext.state.buttonHoverColorWeight ===
                              "200"
                              ? "rgba(243, 244, 246, 0.8)"
                              : "rgba(31, 41, 55, 0.5)"
                            : undefined,
                        }}
                      >
                        <div className="flex items-center w-full">
                          <Checkbox
                            isChecked={formData.roleIds.includes(role.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleRoleChange(role.id);
                            }}
                            colorScheme="teal"
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
                              {role.name}
                            </Text>
                            <Flex>
                              <Text
                                fontSize="xs"
                                color={
                                  styleContext.state.buttonHoverColorWeight ===
                                  "200"
                                    ? "gray.600"
                                    : "gray.400"
                                }
                              >
                                {role.permissions.length} permissões
                              </Text>
                              {role.description && (
                                <Text
                                  fontSize="xs"
                                  color={
                                    styleContext.state
                                      .buttonHoverColorWeight === "200"
                                      ? "gray.600"
                                      : "gray.400"
                                  }
                                  className="ml-2"
                                >
                                  • {role.description}
                                </Text>
                              )}
                            </Flex>
                          </div>
                        </div>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              )}
              <Text
                fontSize="sm"
                color={
                  styleContext.state.buttonHoverColorWeight === "200"
                    ? "gray.600"
                    : "gray.400"
                }
                mt={4}
              >
                Selecionadas: {formData.roleIds.length} funções
              </Text>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-background flex justify-end space-x-3 z-10">
            <DSButton
              type="button"
              onClick={handleSave}
              disabled={isLoading}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              {isEdit ? "Atualizar" : "Criar"} Grupo
            </DSButton>
          </div>
        </SideDrawer>
      )}
    </div>
  );
}
