import React, { useContext, useEffect, useState } from "react";
import {
  Button,
  Spinner,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  useDisclosure,
  IconButton,
  Badge,
  Box,
  Text,
  Flex,
  Collapse,
  Input,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Stack,
  Checkbox,
  Divider,
  InputGroup,
  InputLeftElement,
  FormControl,
  FormLabel,
  Select,
  FormHelperText,
} from "@chakra-ui/react";
import {
  FaEdit,
  FaSearch,
  FaChevronDown,
  FaChevronRight,
} from "react-icons/fa";
import { StyleContext } from "../../reducers";
import { ApiClient } from "../../api";
import { Permission, Role, Group, User } from "../../api/types/iam.dto";
import { useSnackbar } from "../../hooks/snackbar";
import InfoTooltip from "../../components/InfoTooltip";
import { SideDrawer } from "../../components/SideDrawer";

const api = new ApiClient({
  baseURL: import.meta.env.VITE_BACK_END_API || "",
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
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

export function UserAccess(): JSX.Element {
  const styleContext = useContext(StyleContext);
  const snackbar = useSnackbar();
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [userFilter, setUserFilter] = useState<string>("");
  const [expandedUsers, setExpandedUsers] = useState<Record<string, boolean>>(
    {}
  );
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [formData, setFormData] = useState({
    userId: "",
    groupIds: [] as string[],
    roleIds: [] as string[],
    permissionIds: [] as string[],
    accessLevel: 1, // Default to REGISTERED (1)
  });
  const [activeTab, setActiveTab] = useState(0);
  const [searchText, setSearchText] = useState({
    groups: "",
    roles: "",
    permissions: "",
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [
        usersResponse,
        groupsResponse,
        rolesResponse,
        permissionsResponse,
      ] = await Promise.all([
        api.iam.getAllUsersIamDetails(),
        api.iam.getGroups(),
        api.iam.getRoles(),
        api.iam.getPermissions(),
      ]);
      setUsers(usersResponse.users);
      setGroups(groupsResponse.groups);
      setRoles(rolesResponse.roles);
      setPermissions(permissionsResponse.permissions);
    } catch (error) {
      console.error("Error fetching data:", error);
      snackbar.error(
        "Não foi possível carregar as informações de acesso dos usuários."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    return () => {
      // Cleanup
    };
    
  }, []);

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(userFilter.toLowerCase()) ||
      user.email.toLowerCase().includes(userFilter.toLowerCase())
  );

  const toggleUserExpand = (userId: string) => {
    setExpandedUsers((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setFormData({
      userId: user.id,
      groupIds: user.groups.map((g) => g.id),
      roleIds: user.directRoles.map((r) => r.id),
      permissionIds: user.directPermissions.map((p) => p.id),
      accessLevel: user.accessLevel || 1, // Use existing accessLevel or default to REGISTERED
    });
    onOpen();
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const updatedUser = await api.iam.assignUserAccess(formData);

      // Update the users list with the updated user
      setUsers(users.map((u) => (u.id === updatedUser.id ? updatedUser : u)));

      snackbar.success(
        "As permissões do usuário foram atualizadas com sucesso."
      );

      handleClose();
    } catch (error) {
      console.error("Error saving user access:", error);
      snackbar.error("Não foi possível atualizar as permissões do usuário.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckboxChange = (
    type: "group" | "role" | "permission",
    id: string
  ) => {
    setFormData((prev) => {
      const field =
        type === "group"
          ? "groupIds"
          : type === "role"
            ? "roleIds"
            : "permissionIds";
      const currentIds = prev[field];
      const newIds = currentIds.includes(id)
        ? currentIds.filter((currentId) => currentId !== id)
        : [...currentIds, id];

      return {
        ...prev,
        [field]: newIds,
      };
    });
  };

  // Filter items based on search
  const filteredGroups = groups.filter(
    (group) =>
      group.name.toLowerCase().includes(searchText.groups.toLowerCase()) ||
      group.description.toLowerCase().includes(searchText.groups.toLowerCase())
  );

  const filteredRoles = roles.filter(
    (role) =>
      role.name.toLowerCase().includes(searchText.roles.toLowerCase()) ||
      role.description.toLowerCase().includes(searchText.roles.toLowerCase())
  );

  const filteredPermissions = permissions.filter(
    (permission) =>
      permission.name
        .toLowerCase()
        .includes(searchText.permissions.toLowerCase()) ||
      permission.code
        .toLowerCase()
        .includes(searchText.permissions.toLowerCase()) ||
      permission.description
        .toLowerCase()
        .includes(searchText.permissions.toLowerCase())
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

  // Calculate effective permissions for a user (from groups + direct roles + direct permissions)
  const getEffectivePermissions = (user: User): Permission[] => {
    const uniquePermissions = new Map<string, Permission>();

    // Add permissions from groups
    user.groups.forEach((group) => {
      group.roles.forEach((role) => {
        role.permissions.forEach((permission) => {
          uniquePermissions.set(permission.id, permission);
        });
      });
    });

    // Add permissions from direct roles
    user.directRoles.forEach((role) => {
      role.permissions.forEach((permission) => {
        uniquePermissions.set(permission.id, permission);
      });
    });

    // Add direct permissions
    user.directPermissions.forEach((permission) => {
      uniquePermissions.set(permission.id, permission);
    });

    return Array.from(uniquePermissions.values());
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

  const handleClose = () => {
    onClose();
  };

  return (
    <div className="flex flex-col space-y-6 mb-20">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold" color={styleContext.state.textColor}>
          Acesso de Usuários
        </h2>
        <div className="relative">
          <InputGroup size="lg" width="300px">
            <InputLeftElement
              pointerEvents="none"
              height="100%"
              children={<FaSearch className="text-gray-400" />}
            />
            <Input
              placeholder="Buscar usuários..."
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
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
                    ? "#8B5CF6"
                    : "#7C3AED",
                boxShadow:
                  styleContext.state.buttonHoverColorWeight === "200"
                    ? "0 0 0 1px #8B5CF6"
                    : "0 0 0 1px #7C3AED",
              }}
            />
          </InputGroup>
        </div>
      </div>

      {isLoading && users.length === 0 ? (
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
                  color={styleContext.state.textColor}
                ></Th>
                <Th
                  className={
                    styleContext.state.buttonHoverColorWeight === "200"
                      ? "bg-gray-100"
                      : "bg-gray-800"
                  }
                  color={styleContext.state.textColor}
                >
                  Nome
                </Th>
                <Th
                  className={
                    styleContext.state.buttonHoverColorWeight === "200"
                      ? "bg-gray-100"
                      : "bg-gray-800"
                  }
                  color={styleContext.state.textColor}
                >
                  Email
                </Th>
                <Th
                  className={
                    styleContext.state.buttonHoverColorWeight === "200"
                      ? "bg-gray-100"
                      : "bg-gray-800"
                  }
                  color={styleContext.state.textColor}
                >
                  Permissões Ativas
                </Th>
                <Th
                  width="100px"
                  textAlign="right"
                  className={
                    styleContext.state.buttonHoverColorWeight === "200"
                      ? "bg-gray-100"
                      : "bg-gray-800"
                  }
                  color={styleContext.state.textColor}
                >
                  Ações
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredUsers.map((user) => (
                <React.Fragment key={user.id}>
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
                      onClick={() => toggleUserExpand(user.id)}
                      className="cursor-pointer"
                    >
                      {expandedUsers[user.id] ? (
                        <FaChevronDown />
                      ) : (
                        <FaChevronRight />
                      )}
                    </Td>
                    <Td
                      fontWeight="medium"
                      color={styleContext.state.textColor}
                    >
                      {user.name}
                    </Td>
                    <Td color={styleContext.state.textColor} opacity={0.9}>
                      {user.email}
                    </Td>
                    <Td>
                      <InfoTooltip
                        content={
                          <Box>
                            <Text fontWeight="bold" mb={2}>
                              Permissões Efetivas:
                            </Text>
                            {getEffectivePermissions(user).length > 0 ? (
                              getEffectivePermissions(user).map(
                                (permission) => (
                                  <Text
                                    key={permission.id}
                                    mb={1}
                                    fontSize="sm"
                                  >
                                    • <code>{permission.code}</code>
                                    {permission.description &&
                                      ` - ${permission.description}`}
                                  </Text>
                                )
                              )
                            ) : (
                              <Text fontSize="sm" color="gray.500">
                                Sem permissões
                              </Text>
                            )}
                          </Box>
                        }
                        placement="top"
                        showIcon={false}
                      >
                        <ClickableBadge
                          colorScheme="orange"
                          variant="solid"
                          className="flex items-center py-1 hover:opacity-80 transition-opacity"
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
                          px={2}
                          py={1}
                        >
                          {getEffectivePermissions(user).length} permissões
                        </ClickableBadge>
                      </InfoTooltip>
                    </Td>
                    <Td textAlign="right">
                      <div className="flex justify-end space-x-2 group">
                        <IconButton
                          aria-label="Edit"
                          icon={<FaEdit />}
                          size="sm"
                          className="opacity-80 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleEditClick(user)}
                          bg={
                            styleContext.state.buttonHoverColorWeight === "200"
                              ? "#F3F4F6"
                              : "#4B5563"
                          }
                          color={styleContext.state.textColor}
                          _hover={{
                            bg:
                              styleContext.state.buttonHoverColorWeight ===
                              "200"
                                ? "#E5E7EB"
                                : "#6B7280",
                          }}
                        />
                      </div>
                    </Td>
                  </Tr>
                  <Tr>
                    <Td colSpan={6} p={0}>
                      <Collapse in={expandedUsers[user.id] || false}>
                        <Box
                          p={4}
                          bg={
                            styleContext.state.buttonHoverColorWeight === "200"
                              ? "gray.50"
                              : "gray.800"
                          }
                          borderBottomWidth="1px"
                          borderColor={
                            styleContext.state.buttonHoverColorWeight === "200"
                              ? "gray.200"
                              : "gray.700"
                          }
                        >
                          <Flex justifyContent="space-between" mb={2}>
                            <Text
                              fontWeight="bold"
                              color={styleContext.state.textColor}
                            >
                              Detalhes de Acesso
                            </Text>
                          </Flex>
                          <Divider mb={3} />

                          <Text
                            fontSize="sm"
                            mb={2}
                            style={{ color: styleContext.state.textColor }}
                          >
                            <strong>Nível de Acesso:</strong>{" "}
                            {user.accessLevel === 0
                              ? "Público"
                              : user.accessLevel === 1
                                ? "Registrado"
                                : user.accessLevel === 2
                                  ? "Restrito"
                                  : user.accessLevel === 3
                                    ? "Confidencial"
                                    : "Anônimo"}
                          </Text>

                          <Text
                            fontSize="sm"
                            fontWeight="medium"
                            mb={2}
                            style={{ color: styleContext.state.textColor }}
                          >
                            Grupos:
                          </Text>
                          {user.groups.length > 0 ? (
                            <Flex gap={2} flexWrap="wrap">
                              {user.groups.map((group) => (
                                <ClickableBadge
                                  key={group.id}
                                  colorScheme="teal"
                                  variant="solid"
                                  className="flex items-center py-1 hover:opacity-80 transition-opacity"
                                  borderRadius="md"
                                  bg={
                                    styleContext.state
                                      .buttonHoverColorWeight === "200"
                                      ? "teal.100"
                                      : "teal.800"
                                  }
                                  color={
                                    styleContext.state
                                      .buttonHoverColorWeight === "200"
                                      ? "teal.800"
                                      : "teal.200"
                                  }
                                  px={2}
                                  py={1}
                                >
                                  {group.name}
                                </ClickableBadge>
                              ))}
                            </Flex>
                          ) : (
                            <Text
                              fontSize="sm"
                              color={
                                styleContext.state.buttonHoverColorWeight ===
                                "200"
                                  ? "gray.500"
                                  : "gray.400"
                              }
                            >
                              Este usuário não pertence a nenhum grupo.
                            </Text>
                          )}
                        </Box>
                      </Collapse>
                    </Td>
                  </Tr>
                </React.Fragment>
              ))}
              {filteredUsers.length === 0 && (
                <Tr>
                  <Td
                    colSpan={6}
                    className="text-center py-8"
                    color={styleContext.state.textColor}
                  >
                    <Text fontSize="md">Nenhum usuário encontrado</Text>
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
          title={
            selectedUser ? "Editar Acesso de Usuário" : "Novo Acesso de Usuário"
          }
          width="520px"
          storageKey="iam"
          badge={{
            text: `${selectedUser ? getEffectivePermissions(selectedUser).length : 0} permissões`,
            colorScheme: "blue",
          }}
        >
          <div className="overflow-y-auto">
            {selectedUser && (
              <div
                className="pt-4 px-4"
                style={{
                  borderColor:
                    styleContext.state.buttonHoverColorWeight === "200"
                      ? "#E5E7EB"
                      : "#374151",
                }}
              >
                <Text
                  fontSize="md"
                  fontWeight="medium"
                  color={styleContext.state.textColor}
                >
                  {selectedUser.name}
                </Text>
                <Text
                  fontSize="sm"
                  color={
                    styleContext.state.buttonHoverColorWeight === "200"
                      ? "gray.600"
                      : "gray.400"
                  }
                >
                  {selectedUser.email}
                </Text>
              </div>
            )}

            <div className="p-4">
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
                  Define o nível de acesso deste usuário
                </FormHelperText>
              </FormControl>

              <Tabs
                isFitted
                variant="enclosed"
                index={activeTab}
                onChange={setActiveTab}
                colorScheme="blue"
                mb={4}
              >
                <TabList
                  className="border-b"
                  style={{
                    borderColor:
                      styleContext.state.buttonHoverColorWeight === "200"
                        ? "#E5E7EB"
                        : "#374151",
                  }}
                >
                  <Tab style={{ color: styleContext.state.textColor }}>
                    Grupos
                  </Tab>
                  <Tab style={{ color: styleContext.state.textColor }}>
                    Funções
                  </Tab>
                  <Tab style={{ color: styleContext.state.textColor }}>
                    Permissões
                  </Tab>
                </TabList>

                <TabPanels className="-mx-4 mt-2">
                  <TabPanel>
                    <div className="mb-4">
                      <InputGroup size="lg">
                        <InputLeftElement
                          pointerEvents="none"
                          height="100%"
                          children={<FaSearch className="text-gray-400" />}
                        />
                        <Input
                          placeholder="Buscar grupos..."
                          value={searchText.groups}
                          onChange={(e) =>
                            setSearchText({
                              ...searchText,
                              groups: e.target.value,
                            })
                          }
                          style={{
                            backgroundColor: styleContext.state.backgroundColor,
                            color: styleContext.state.textColor,
                            borderColor:
                              styleContext.state.buttonHoverColorWeight ===
                              "200"
                                ? "#E5E7EB"
                                : "#374151",
                          }}
                          _hover={{
                            borderColor:
                              styleContext.state.buttonHoverColorWeight ===
                              "200"
                                ? "#D1D5DB"
                                : "#4B5563",
                          }}
                          _focus={{
                            borderColor:
                              styleContext.state.buttonHoverColorWeight ===
                              "200"
                                ? "#14B8A6"
                                : "#0D9488",
                            boxShadow:
                              styleContext.state.buttonHoverColorWeight ===
                              "200"
                                ? "0 0 0 1px #14B8A6"
                                : "0 0 0 1px #0D9488",
                          }}
                        />
                      </InputGroup>
                    </div>

                    {filteredGroups.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                        <FaSearch size={32} className="mb-4 opacity-50" />
                        <p className="text-lg font-medium mb-1">
                          Nenhum grupo encontrado
                        </p>
                        <p className="text-sm">
                          Tente buscar com outros termos
                        </p>
                      </div>
                    ) : (
                      <Stack spacing={2} maxH="500px" overflowY="auto">
                        {filteredGroups.map((group) => (
                          <Box
                            key={group.id}
                            p={3}
                            borderRadius="lg"
                            transition="all 0.2s"
                            cursor="pointer"
                            onClick={() =>
                              handleCheckboxChange("group", group.id)
                            }
                            style={{
                              backgroundColor: formData.groupIds.includes(
                                group.id
                              )
                                ? styleContext.state.buttonHoverColorWeight ===
                                  "200"
                                  ? "rgba(20, 184, 166, 0.1)"
                                  : "rgba(13, 148, 136, 0.2)"
                                : "transparent",
                            }}
                            _hover={{
                              bg: !formData.groupIds.includes(group.id)
                                ? styleContext.state.buttonHoverColorWeight ===
                                  "200"
                                  ? "rgba(243, 244, 246, 0.8)"
                                  : "rgba(31, 41, 55, 0.5)"
                                : undefined,
                            }}
                          >
                            <div className="flex items-center w-full">
                              <Checkbox
                                isChecked={formData.groupIds.includes(group.id)}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleCheckboxChange("group", group.id);
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
                                  {group.name}
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
                                  {group.description}
                                </Text>
                                <Flex mt={1} flexWrap="wrap" gap={1}>
                                  <Badge colorScheme="teal" fontSize="xs">
                                    {group.roles.length} funções
                                  </Badge>
                                  <Badge
                                    colorScheme="orange"
                                    fontSize="xs"
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
                                    {getTotalPermissions(group)} permissões
                                  </Badge>
                                </Flex>
                              </div>
                            </div>
                          </Box>
                        ))}
                      </Stack>
                    )}
                    <Text fontSize="sm" color="gray.500" mt={2}>
                      Selecionados: {formData.groupIds.length} grupos
                    </Text>
                  </TabPanel>

                  <TabPanel>
                    <div className="mb-4">
                      <InputGroup size="lg">
                        <InputLeftElement
                          pointerEvents="none"
                          height="100%"
                          children={<FaSearch className="text-gray-400" />}
                        />
                        <Input
                          placeholder="Buscar funções..."
                          value={searchText.roles}
                          onChange={(e) =>
                            setSearchText({
                              ...searchText,
                              roles: e.target.value,
                            })
                          }
                          style={{
                            backgroundColor: styleContext.state.backgroundColor,
                            color: styleContext.state.textColor,
                            borderColor:
                              styleContext.state.buttonHoverColorWeight ===
                              "200"
                                ? "#E5E7EB"
                                : "#374151",
                          }}
                          _hover={{
                            borderColor:
                              styleContext.state.buttonHoverColorWeight ===
                              "200"
                                ? "#D1D5DB"
                                : "#4B5563",
                          }}
                          _focus={{
                            borderColor:
                              styleContext.state.buttonHoverColorWeight ===
                              "200"
                                ? "#8B5CF6"
                                : "#7C3AED",
                            boxShadow:
                              styleContext.state.buttonHoverColorWeight ===
                              "200"
                                ? "0 0 0 1px #8B5CF6"
                                : "0 0 0 1px #7C3AED",
                          }}
                        />
                      </InputGroup>
                    </div>

                    {filteredRoles.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                        <FaSearch size={32} className="mb-4 opacity-50" />
                        <p className="text-lg font-medium mb-1">
                          Nenhuma função encontrada
                        </p>
                        <p className="text-sm">
                          Tente buscar com outros termos
                        </p>
                      </div>
                    ) : (
                      <Stack spacing={2} maxH="400px" overflowY="auto">
                        {filteredRoles.map((role) => (
                          <Box
                            key={role.id}
                            p={3}
                            borderRadius="lg"
                            transition="all 0.2s"
                            cursor="pointer"
                            onClick={() =>
                              handleCheckboxChange("role", role.id)
                            }
                            style={{
                              backgroundColor: formData.roleIds.includes(
                                role.id
                              )
                                ? styleContext.state.buttonHoverColorWeight ===
                                  "200"
                                  ? "rgba(147, 51, 234, 0.1)"
                                  : "rgba(126, 34, 206, 0.2)"
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
                                  handleCheckboxChange("role", role.id);
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
                                  {role.name}
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
                                  {role.description}
                                </Text>
                                <Flex mt={1} flexWrap="wrap" gap={1}>
                                  <Badge
                                    colorScheme="orange"
                                    fontSize="xs"
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
                                  </Badge>
                                </Flex>
                              </div>
                            </div>
                          </Box>
                        ))}
                      </Stack>
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
                      Selecionadas: {formData.roleIds.length} funções diretas
                    </Text>
                  </TabPanel>

                  <TabPanel>
                    <div className="mb-4">
                      <InputGroup size="lg">
                        <InputLeftElement
                          pointerEvents="none"
                          height="100%"
                          children={<FaSearch className="text-gray-400" />}
                        />
                        <Input
                          placeholder="Buscar permissões..."
                          value={searchText.permissions}
                          onChange={(e) =>
                            setSearchText({
                              ...searchText,
                              permissions: e.target.value,
                            })
                          }
                          style={{
                            backgroundColor: styleContext.state.backgroundColor,
                            color: styleContext.state.textColor,
                            borderColor:
                              styleContext.state.buttonHoverColorWeight ===
                              "200"
                                ? "#E5E7EB"
                                : "#374151",
                          }}
                          _hover={{
                            borderColor:
                              styleContext.state.buttonHoverColorWeight ===
                              "200"
                                ? "#D1D5DB"
                                : "#4B5563",
                          }}
                          _focus={{
                            borderColor:
                              styleContext.state.buttonHoverColorWeight ===
                              "200"
                                ? "#F97316"
                                : "#EA580C",
                            boxShadow:
                              styleContext.state.buttonHoverColorWeight ===
                              "200"
                                ? "0 0 0 1px #F97316"
                                : "0 0 0 1px #EA580C",
                          }}
                        />
                      </InputGroup>
                    </div>

                    {Object.keys(groupedPermissions).length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                        <FaSearch size={32} className="mb-4 opacity-50" />
                        <p className="text-lg font-medium mb-1">
                          Nenhuma permissão encontrada
                        </p>
                        <p className="text-sm">
                          Tente buscar com outros termos
                        </p>
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
                                      handleCheckboxChange(
                                        "permission",
                                        permission.id
                                      )
                                    }
                                    style={{
                                      backgroundColor:
                                        formData.permissionIds.includes(
                                          permission.id
                                        )
                                          ? styleContext.state
                                              .buttonHoverColorWeight === "200"
                                            ? "rgba(249, 115, 22, 0.1)"
                                            : "rgba(234, 88, 12, 0.2)"
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
                                          handleCheckboxChange(
                                            "permission",
                                            permission.id
                                          );
                                        }}
                                        colorScheme="orange"
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
                      diretas
                    </Text>
                  </TabPanel>
                </TabPanels>
              </Tabs>
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
                colorScheme="blue"
                onClick={handleSave}
                isLoading={isLoading}
                size="md"
                bg={
                  styleContext.state.buttonHoverColorWeight === "200"
                    ? "blue.500"
                    : "blue.600"
                }
                _hover={{
                  bg:
                    styleContext.state.buttonHoverColorWeight === "200"
                      ? "blue.600"
                      : "blue.700",
                }}
              >
                {selectedUser ? "Atualizar" : "Criar"} Acesso
              </Button>
            </div>
          </div>
        </SideDrawer>
      )}
    </div>
  );
}
