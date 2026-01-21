import React, { useState, useEffect, useCallback } from "react";
import {
  FormControl,
  FormLabel,
  FormHelperText,
  Badge,
  Stack,
  Text,
  Box,
  Checkbox,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Tabs,
  Spinner,
  Center,
} from "@chakra-ui/react";
import { FaLock, FaSearch, FaTimes } from "react-icons/fa";
import { User, Role, Group } from "../../../api/types/iam.dto";
import { IamApiClient } from "../../../api/clients/iam.client";
import InfoTooltip from "../../../components/InfoTooltip";
import { SideDrawer } from "../../../components/SideDrawer";

const iamClient = new IamApiClient({
  baseURL: import.meta.env.VITE_BACK_END_API || "",
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
  },
});

type EntityWithPermission = {
  id: string;
  name: string;
  access: "read" | "write";
};

export interface PermissionsSelectorProps {
  permissions?: {
    users?: EntityWithPermission[];
    roles?: EntityWithPermission[];
    groups?: EntityWithPermission[];
  };
  onChange: (permissions: {
    users: EntityWithPermission[];
    roles: EntityWithPermission[];
    groups: EntityWithPermission[];
  }) => void;
  styleContext: any;
  title?: string;
  helperText?: string;
  parentDrawerId?: string;
  showBorder?: boolean;
}

export const PermissionsSelector: React.FC<PermissionsSelectorProps> = ({
  permissions,
  onChange,
  styleContext,
  title = "Permissões de Acesso",
  helperText = "Defina quais usuários, papéis e grupos têm permissão para ler ou escrever nesta atividade",
  parentDrawerId,
  showBorder = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [tabIndex, setTabIndex] = useState(0);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  // Generate a stable ID for this drawer based on parent + title
  const permissionsDrawerId = React.useMemo(
    () =>
      `${parentDrawerId ? parentDrawerId + "-" : ""}permissions-${title.replace(/\s+/g, "-").toLowerCase()}`,
    [parentDrawerId, title]
  );

  // Use useCallback to memoize the fetchEntities function
  const fetchEntities = useCallback(async () => {
    setLoading(true);

    try {
      const [usersResponse, rolesResponse, groupsResponse] = await Promise.all([
        iamClient.getAllUsersIamDetails(),
        iamClient.getRoles(),
        iamClient.getGroups(),
      ]);

      setUsers(usersResponse.users);
      setRoles(rolesResponse.roles);
      setGroups(groupsResponse.groups);
    } catch (error) {
      console.error("Failed to fetch entities:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch users, roles, and groups when the drawer opens
  useEffect(() => {
    if (isOpen) {
      fetchEntities();
    }
  }, [isOpen, fetchEntities]);

  // Filter entities based on search term
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRoles = roles.filter(
    (role) =>
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredGroups = groups.filter(
    (group) =>
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpen = () => {
    setIsOpen(true);
    setSearchTerm("");
    setTabIndex(0);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleToggleUser = (user: User, access: "read" | "write" | null) => {
    const existingIndex = permissions?.users?.findIndex(
      (u) => u.id === user.id
    );
    const newUsers = [...(permissions?.users || [])];

    if (existingIndex !== undefined && existingIndex >= 0) {
      // If already exists with same access, remove it
      if (
        access === null ||
        permissions?.users?.[existingIndex].access === access
      ) {
        newUsers.splice(existingIndex, 1);
      } else {
        // Otherwise update the access
        newUsers[existingIndex] = { ...newUsers[existingIndex], access };
      }
    } else if (access !== null) {
      // Add new user with access (only if access is not null)
      newUsers.push({ id: user.id, name: user.name, access });
    }

    onChange({
      users: newUsers,
      roles: permissions?.roles || [],
      groups: permissions?.groups || [],
    });
  };

  const handleToggleRole = (role: Role, access: "read" | "write" | null) => {
    const existingIndex = permissions?.roles?.findIndex(
      (r) => r.id === role.id
    );
    const newRoles = [...(permissions?.roles || [])];

    if (existingIndex !== undefined && existingIndex >= 0) {
      // If already exists with same access, remove it
      if (
        access === null ||
        permissions?.roles?.[existingIndex].access === access
      ) {
        newRoles.splice(existingIndex, 1);
      } else {
        // Otherwise update the access
        newRoles[existingIndex] = { ...newRoles[existingIndex], access };
      }
    } else if (access !== null) {
      // Add new role with access (only if access is not null)
      newRoles.push({ id: role.id, name: role.name, access });
    }

    onChange({
      users: permissions?.users || [],
      roles: newRoles,
      groups: permissions?.groups || [],
    });
  };

  const handleToggleGroup = (group: Group, access: "read" | "write" | null) => {
    const existingIndex = permissions?.groups?.findIndex(
      (g) => g.id === group.id
    );
    const newGroups = [...(permissions?.groups || [])];

    if (existingIndex !== undefined && existingIndex >= 0) {
      // If already exists with same access, remove it
      if (
        access === null ||
        permissions?.groups?.[existingIndex].access === access
      ) {
        newGroups.splice(existingIndex, 1);
      } else {
        // Otherwise update the access
        newGroups[existingIndex] = { ...newGroups[existingIndex], access };
      }
    } else if (access !== null) {
      // Add new group with access (only if access is not null)
      newGroups.push({ id: group.id, name: group.name, access });
    }

    onChange({
      users: permissions?.users || [],
      roles: permissions?.roles || [],
      groups: newGroups,
    });
  };

  const getUserAccess = (userId: string): "read" | "write" | null => {
    const user = permissions?.users?.find((u) => u.id === userId);
    return user ? user.access : null;
  };

  const getRoleAccess = (roleId: string): "read" | "write" | null => {
    const role = permissions?.roles?.find((r) => r.id === roleId);
    return role ? role.access : null;
  };

  const getGroupAccess = (groupId: string): "read" | "write" | null => {
    const group = permissions?.groups?.find((g) => g.id === groupId);
    return group ? group.access : null;
  };

  const renderEntityItem = (
    entity: { id: string; name: string },
    getAccess: (id: string) => "read" | "write" | null,
    handleToggle: (entity: any, access: "read" | "write" | null) => void
  ) => {
    const access = getAccess(entity.id);

    return (
      <Box
        key={entity.id}
        p={3}
        borderRadius="lg"
        _hover={{
          bg:
            styleContext.state.buttonHoverColorWeight === "200"
              ? "rgba(243, 244, 246, 0.8)"
              : "rgba(31, 41, 55, 0.5)",
        }}
        className="flex items-center justify-between cursor-pointer transition-colors duration-150"
        style={{
          backgroundColor: access
            ? styleContext.state.buttonHoverColorWeight === "200"
              ? "rgba(20, 184, 166, 0.1)"
              : "rgba(13, 148, 136, 0.2)"
            : "transparent",
          color: styleContext.state.textColor,
        }}
      >
        <Text fontWeight="medium">{entity.name}</Text>
        <Stack direction="row" spacing={4}>
          <Checkbox
            isChecked={access === "read" || access === "write"}
            onChange={() => {
              if (access === "read") {
                // If read is already checked, uncheck it
                // Explicitly cast null to any to avoid type errors
                handleToggle(entity, null as any);
              } else {
                // Otherwise check it
                handleToggle(entity, "read");
              }
            }}
            colorScheme="teal"
            size="lg"
            borderRadius="md"
            className="mr-3"
            sx={{
              "span.chakra-checkbox__control": {
                borderRadius: "0.375rem",
              },
            }}
          >
            Leitura
          </Checkbox>
          <Checkbox
            isChecked={access === "write"}
            onChange={() => {
              if (access === "write") {
                // If write is already checked, change to read only
                handleToggle(entity, "read");
              } else {
                // Otherwise check it (which includes read access)
                handleToggle(entity, "write");
              }
            }}
            colorScheme="teal"
            borderRadius="md"
            size="lg"
            className="mr-3"
            sx={{
              "span.chakra-checkbox__control": {
                borderRadius: "0.375rem",
              },
            }}
          >
            Escrita
          </Checkbox>
        </Stack>
      </Box>
    );
  };

  const totalPermissions =
    (permissions?.users?.length || 0) +
    (permissions?.roles?.length || 0) +
    (permissions?.groups?.length || 0);

  return (
    <>
      <FormControl>
        <FormLabel style={{ color: styleContext.state.textColor }}>
          {title}
        </FormLabel>
        <div
          className={`${showBorder ? "border rounded-lg p-4" : ""}`}
          style={{
            color: styleContext.state.textColor,
            borderColor:
              styleContext.state.buttonHoverColorWeight === "200"
                ? "#E5E7EB"
                : "#374151",
          }}
        >
          <div className="flex flex-wrap gap-2 mb-3">
            {(permissions?.users?.length || 0) === 0 &&
            (permissions?.roles?.length || 0) === 0 &&
            (permissions?.groups?.length || 0) === 0 ? (
              <div className="text-sm opacity-75 py-1">
                Nenhuma permissão definida
              </div>
            ) : (
              <>
                {permissions?.users?.slice(0, 3).map((user) => (
                  <Badge
                    key={user.id}
                    colorScheme={"teal"}
                    variant="solid"
                    className="flex items-center gap-1 py-1"
                    borderRadius="md"
                  >
                    <span className="ml-1 flex-1">
                      {user.name} ({user.access === "write" ? "E" : "L"})
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onChange({
                          users:
                            permissions?.users?.filter(
                              (u) => u.id !== user.id
                            ) || [],
                          roles: permissions?.roles || [],
                          groups: permissions?.groups || [],
                        });
                      }}
                      className="flex-shrink-0 hover:bg-opacity-10 rounded p-1 transition-colors duration-150"
                      style={{
                        color: "white",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "rgba(255, 255, 255, 0.1)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                      aria-label="Remove"
                    >
                      <FaTimes size={10} />
                    </button>
                  </Badge>
                ))}
                {(permissions?.users?.length || 0) > 3 && (
                  <div className="relative group">
                    <InfoTooltip
                      content={
                        <Box>
                          <Text fontWeight="bold" mb={2}>
                            Usuários adicionais:
                          </Text>
                          {(permissions?.users?.length || 0) > 3 &&
                            permissions?.users?.slice(3).map((user) => (
                              <Text key={user.id} mb={1} fontSize="sm">
                                • {user.name} (
                                {user.access === "write" ? "E" : "L"})
                              </Text>
                            ))}
                        </Box>
                      }
                      placement="top"
                      showIcon={false}
                    >
                      <Badge
                        colorScheme="gray"
                        py="1"
                        px="2"
                        className="hover:opacity-80 transition-opacity cursor-pointer"
                        borderRadius="md"
                        bg={
                          styleContext.state.buttonHoverColorWeight === "200"
                            ? "gray.200"
                            : "gray.600"
                        }
                        color={
                          styleContext.state.buttonHoverColorWeight === "200"
                            ? "gray.700"
                            : "gray.200"
                        }
                      >
                        +{(permissions?.users?.length || 0) - 3}
                      </Badge>
                    </InfoTooltip>
                  </div>
                )}
                {permissions?.roles?.slice(0, 3).map((role) => (
                  <Badge
                    key={role.id}
                    colorScheme={"teal"}
                    variant="solid"
                    className="flex items-center gap-1 py-1"
                    borderRadius="md"
                  >
                    <span className="ml-1 flex-1">
                      {role.name} ({role.access === "write" ? "E" : "L"})
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onChange({
                          users: permissions?.users || [],
                          roles:
                            permissions?.roles?.filter(
                              (r) => r.id !== role.id
                            ) || [],
                          groups: permissions?.groups || [],
                        });
                      }}
                      className="flex-shrink-0 hover:bg-opacity-10 rounded p-1 transition-colors duration-150"
                      style={{
                        color: "white",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "rgba(255, 255, 255, 0.1)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                      aria-label="Remove"
                    >
                      <FaTimes size={10} />
                    </button>
                  </Badge>
                ))}
                {(permissions?.roles?.length || 0) > 3 && (
                  <div className="relative group">
                    <InfoTooltip
                      content={
                        <Box>
                          <Text fontWeight="bold" mb={2}>
                            Papéis adicionais:
                          </Text>
                          {(permissions?.roles?.length || 0) > 3 &&
                            permissions?.roles?.slice(3).map((role) => (
                              <Text key={role.id} mb={1} fontSize="sm">
                                • {role.name} (
                                {role.access === "write" ? "E" : "L"})
                              </Text>
                            ))}
                        </Box>
                      }
                      placement="top"
                      showIcon={false}
                    >
                      <Badge
                        colorScheme="gray"
                        py="1"
                        px="2"
                        className="hover:opacity-80 transition-opacity cursor-pointer"
                        borderRadius="md"
                        bg={
                          styleContext.state.buttonHoverColorWeight === "200"
                            ? "gray.200"
                            : "gray.600"
                        }
                        color={
                          styleContext.state.buttonHoverColorWeight === "200"
                            ? "gray.700"
                            : "gray.200"
                        }
                      >
                        +{(permissions?.roles?.length || 0) - 3}
                      </Badge>
                    </InfoTooltip>
                  </div>
                )}
                {permissions?.groups?.slice(0, 3).map((group) => (
                  <Badge
                    key={group.id}
                    colorScheme={"teal"}
                    variant="solid"
                    className="flex items-center gap-1 py-1"
                    borderRadius="md"
                  >
                    <span className="ml-1 flex-1">
                      {group.name} ({group.access === "write" ? "E" : "L"})
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onChange({
                          users: permissions?.users || [],
                          roles: permissions?.roles || [],
                          groups:
                            permissions?.groups?.filter(
                              (g) => g.id !== group.id
                            ) || [],
                        });
                      }}
                      className="flex-shrink-0 hover:bg-opacity-10 rounded p-1 transition-colors duration-150"
                      style={{
                        color: "white",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "rgba(255, 255, 255, 0.1)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                      aria-label="Remove"
                    >
                      <FaTimes size={10} />
                    </button>
                  </Badge>
                ))}
                {(permissions?.groups?.length || 0) > 3 && (
                  <div className="relative group">
                    <InfoTooltip
                      content={
                        <Box>
                          <Text fontWeight="bold" mb={2}>
                            Grupos adicionais:
                          </Text>
                          {(permissions?.groups?.length || 0) > 3 &&
                            permissions?.groups?.slice(3).map((group) => (
                              <Text key={group.id} mb={1} fontSize="sm">
                                • {group.name} (
                                {group.access === "write" ? "E" : "L"})
                              </Text>
                            ))}
                        </Box>
                      }
                      placement="top"
                      showIcon={false}
                    >
                      <Badge
                        colorScheme="gray"
                        py="1"
                        px="2"
                        className="hover:opacity-80 transition-opacity cursor-pointer"
                        borderRadius="md"
                        bg={
                          styleContext.state.buttonHoverColorWeight === "200"
                            ? "gray.200"
                            : "gray.600"
                        }
                        color={
                          styleContext.state.buttonHoverColorWeight === "200"
                            ? "gray.700"
                            : "gray.200"
                        }
                      >
                        +{(permissions?.groups?.length || 0) - 3}
                      </Badge>
                    </InfoTooltip>
                  </div>
                )}
              </>
            )}
          </div>
          <button
            onClick={handleOpen}
            className={`flex items-center px-4 py-3 rounded-lg transition-colors duration-150 w-full ${
              isOpen
                ? styleContext.state.buttonHoverColorWeight === "200"
                  ? "bg-gray-200 border-gray-300"
                  : "bg-gray-700 border-gray-600"
                : styleContext.state.buttonHoverColorWeight === "200"
                  ? "bg-gray-100 hover:bg-gray-200 border-gray-200"
                  : "bg-gray-800 hover:bg-gray-700 border-gray-700"
            } border`}
            style={{ color: styleContext.state.textColor }}
          >
            <div className="flex items-center space-x-2 w-full">
              <div
                className={`p-2 rounded-lg ${
                  styleContext.state.buttonHoverColorWeight === "200"
                    ? "bg-teal-100"
                    : "bg-teal-900"
                }`}
              >
                <FaLock
                  className={
                    styleContext.state.buttonHoverColorWeight === "200"
                      ? "text-teal-600"
                      : "text-teal-300"
                  }
                  size={16}
                />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-medium">
                  {totalPermissions > 0
                    ? `Gerenciar Permissões (${totalPermissions})`
                    : "Adicionar Permissões"}
                </span>
                <span className="text-xs opacity-70">
                  Defina quem pode ler ou escrever nesta atividade
                </span>
              </div>
            </div>
          </button>
        </div>
        <FormHelperText style={{ color: styleContext.state.textColor }}>
          {helperText}
        </FormHelperText>
      </FormControl>

      {isOpen && (
        <SideDrawer
          isOpen={isOpen}
          onClose={handleClose}
          styleContext={styleContext}
          title="Gerenciar Permissões"
          badge={{
            text: `${(permissions?.users?.length || 0) + (permissions?.roles?.length || 0) + (permissions?.groups?.length || 0)} definidas`,
            colorScheme: "blue",
          }}
          parentDrawerId={parentDrawerId}
          id={permissionsDrawerId}
          disableOffset={true}
        >
          <div className="p-4">
            <div className="relative">
              <input
                placeholder="Buscar usuários, papéis ou grupos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 text-base transition-colors duration-200 border rounded-lg"
                style={{
                  backgroundColor: styleContext.state.backgroundColor,
                  color: styleContext.state.textColor,
                  borderColor:
                    styleContext.state.buttonHoverColorWeight === "200"
                      ? "#E5E7EB"
                      : "#374151",
                }}
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
            </div>
            <p
              className="text-sm mt-4 font-medium"
              style={{ color: styleContext.state.textColor }}
            >
              Selecione as entidades que possuem permissão para ler ou escrever
              nesta atividade:
            </p>
          </div>

          {loading ? (
            <Center py={10}>
              <Spinner />
            </Center>
          ) : (
            <Tabs
              isFitted
              variant="enclosed"
              index={tabIndex}
              onChange={setTabIndex}
              colorScheme="teal"
            >
              <TabList
                className="mx-4"
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
                  Usuários
                </Tab>
              </TabList>

              <TabPanels>
                <TabPanel>
                  {/* Groups Content */}
                  <div>
                    {filteredGroups.length === 0 ? (
                      <div
                        className="p-4 text-center rounded-lg"
                        style={{
                          backgroundColor:
                            styleContext.state.buttonHoverColorWeight === "200"
                              ? "rgba(243, 244, 246, 0.5)"
                              : "rgba(31, 41, 55, 0.3)",
                          color: styleContext.state.textColor,
                        }}
                      >
                        {searchTerm
                          ? "Nenhum grupo encontrado"
                          : "Nenhum grupo disponível"}
                      </div>
                    ) : (
                      <Stack spacing={2}>
                        {filteredGroups.map((group) =>
                          renderEntityItem(
                            group,
                            getGroupAccess,
                            handleToggleGroup
                          )
                        )}
                      </Stack>
                    )}
                  </div>
                </TabPanel>
                <TabPanel>
                  {/* Roles Content */}
                  <div>
                    {filteredRoles.length === 0 ? (
                      <div
                        className="p-4 text-center rounded-lg"
                        style={{
                          backgroundColor:
                            styleContext.state.buttonHoverColorWeight === "200"
                              ? "rgba(243, 244, 246, 0.5)"
                              : "rgba(31, 41, 55, 0.3)",
                          color: styleContext.state.textColor,
                        }}
                      >
                        {searchTerm
                          ? "Nenhuma função encontrada"
                          : "Nenhuma função disponível"}
                      </div>
                    ) : (
                      <Stack spacing={2}>
                        {filteredRoles.map((role) =>
                          renderEntityItem(
                            role,
                            getRoleAccess,
                            handleToggleRole
                          )
                        )}
                      </Stack>
                    )}
                  </div>
                </TabPanel>
                <TabPanel>
                  {/* Users Content */}
                  <div>
                    {filteredUsers.length === 0 ? (
                      <div
                        className="p-4 text-center rounded-lg"
                        style={{
                          backgroundColor:
                            styleContext.state.buttonHoverColorWeight === "200"
                              ? "rgba(243, 244, 246, 0.5)"
                              : "rgba(31, 41, 55, 0.3)",
                          color: styleContext.state.textColor,
                        }}
                      >
                        {searchTerm
                          ? "Nenhum usuário encontrado"
                          : "Nenhum usuário disponível"}
                      </div>
                    ) : (
                      <Stack spacing={2}>
                        {filteredUsers.map((user) =>
                          renderEntityItem(
                            user,
                            getUserAccess,
                            handleToggleUser
                          )
                        )}
                      </Stack>
                    )}
                  </div>
                </TabPanel>
              </TabPanels>
            </Tabs>
          )}
        </SideDrawer>
      )}
    </>
  );
};
