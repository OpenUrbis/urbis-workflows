import { getAccessToken } from "../../auth/token";
import React, { useContext, useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Separator,
  Button as DSButton,
  Input as DSInput,
  Select as DSSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Label,
  Checkbox,
} from "@open-urbis/map-ui";
import {
  FaEdit,
  FaSearch,
  FaChevronDown,
  FaChevronRight,
} from "react-icons/fa";
import { Loader2 } from "lucide-react";
import { StyleContext } from "../../reducers";
import { ApiClient } from "../../api";
import { Permission, Role, Group, User } from "../../api/types/iam.dto";
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
  <Badge
    {...props}
    className={`text-[10px] font-medium px-2 py-0.5 rounded-full inline-flex items-center cursor-pointer ${props.className || ""}`}
  >
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
  const [isOpen, setIsOpen] = useState(false);
  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);
  const [formData, setFormData] = useState({
    userId: "",
    groupIds: [] as string[],
    roleIds: [] as string[],
    permissionIds: [] as string[],
    accessLevel: 1, // Default to REGISTERED (1)
  });
  const [activeTab, setActiveTab] = useState("groups");
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
      await api.iam.assignUserAccess(formData);
      snackbar.success("As permissões do usuário foram atualizadas com sucesso.");
      fetchData(); // Refresh the list
      onClose();
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
      const currentIds = (prev as any)[field];
      const newIds = currentIds.includes(id)
        ? currentIds.filter((currentId: string) => currentId !== id)
        : [...currentIds, id];

      return {
        ...prev,
        [field]: newIds,
      };
    });
  };

  const getEffectivePermissions = (user: User): Permission[] => {
    const uniquePermissions = new Map<string, Permission>();

    user.groups.forEach((group) => {
      group.roles.forEach((role) => {
        role.permissions.forEach((permission) => {
          uniquePermissions.set(permission.id, permission);
        });
      });
    });

    user.directRoles.forEach((role) => {
      role.permissions.forEach((permission) => {
        uniquePermissions.set(permission.id, permission);
      });
    });

    user.directPermissions.forEach((permission) => {
      uniquePermissions.set(permission.id, permission);
    });

    return Array.from(uniquePermissions.values());
  };

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

  const groupedPermissions = permissions
    .filter(
      (p) =>
        p.name.toLowerCase().includes(searchText.permissions.toLowerCase()) ||
        p.code.toLowerCase().includes(searchText.permissions.toLowerCase())
    )
    .reduce((acc, permission) => {
      const domain = permission.code.split(":")[0];
      if (!acc[domain]) acc[domain] = [];
      acc[domain].push(permission);
      return acc;
    }, {} as Record<string, Permission[]>);

  const filteredGroupsList = groups.filter(
    (group) =>
      group.name.toLowerCase().includes(searchText.groups.toLowerCase()) ||
      group.description.toLowerCase().includes(searchText.groups.toLowerCase())
  );

  const filteredRolesList = roles.filter(
    (role) =>
      role.name.toLowerCase().includes(searchText.roles.toLowerCase()) ||
      role.description.toLowerCase().includes(searchText.roles.toLowerCase())
  );

  return (
    <div className="flex flex-col space-y-6 mb-20">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-foreground">Acesso de Usuários</h2>
        <div className="relative w-[300px]">
          <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
          <DSInput
            placeholder="Buscar usuários..."
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="h-9 pl-9 bg-background text-foreground border-border focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>
      </div>

      {isLoading && users.length === 0 ? (
        <div className="flex justify-center my-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="ds-table rounded-lg overflow-hidden border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10 bg-muted/40 h-10 px-3"></TableHead>
                <TableHead className="bg-muted/40 h-10 px-4 text-xs font-semibold text-foreground">Nome</TableHead>
                <TableHead className="bg-muted/40 h-10 px-4 text-xs font-semibold text-foreground">Email</TableHead>
                <TableHead className="bg-muted/40 h-10 px-4 text-xs font-semibold text-foreground whitespace-nowrap">Permissões Ativas</TableHead>
                <TableHead className="w-[100px] text-right bg-muted/40 h-10 px-4 text-xs font-semibold text-foreground">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <React.Fragment key={user.id}>
                  <TableRow className="transition-colors duration-200">
                    <TableCell onClick={() => toggleUserExpand(user.id)} className="cursor-pointer text-foreground py-2">
                      {expandedUsers[user.id] ? <FaChevronDown /> : <FaChevronRight />}
                    </TableCell>
                    <TableCell className="font-medium text-foreground py-2">{user.name}</TableCell>
                    <TableCell className="text-muted-foreground py-2">{user.email}</TableCell>
                    <TableCell className="py-2 whitespace-nowrap">
                      <InfoTooltip
                        content={
                          <div className="space-y-2 p-1 text-foreground">
                            <p className="font-bold">Permissões Efetivas:</p>
                            {getEffectivePermissions(user).length > 0 ? (
                              <div className="max-h-[300px] overflow-y-auto space-y-1">
                                {getEffectivePermissions(user).map((permission) => (
                                  <p key={permission.id} className="text-sm">
                                    • <code>{permission.code}</code> {permission.description}
                                  </p>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">Sem permissões</p>
                            )}
                          </div>
                        }
                        showIcon={false}
                      >
                        <Badge variant="outline" className="text-[10px] font-medium inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-primary border-primary/20 cursor-pointer">
                          {getEffectivePermissions(user).length} permissões
                        </Badge>
                      </InfoTooltip>
                    </TableCell>
                    <TableCell className="text-right py-2">
                      <DSButton variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditClick(user)}>
                        <FaEdit size={14} />
                      </DSButton>
                    </TableCell>
                  </TableRow>
                  {expandedUsers[user.id] && (
                    <TableRow className="bg-muted/30">
                      <TableCell colSpan={5} className="p-0">
                        <div className="p-4 border-b border-border">
                          <p className="font-bold text-foreground mb-2">Detalhes de Acesso</p>
                          <Separator className="my-3" />
                          <p className="text-sm text-foreground mb-2">
                            <strong>Nível de Acesso:</strong>{" "}
                            {user.accessLevel === 0 ? "Público" : user.accessLevel === 1 ? "Registrado" : user.accessLevel === 2 ? "Restrito" : user.accessLevel === 3 ? "Confidencial" : "Anônimo"}
                          </p>
                          <p className="text-sm font-medium text-foreground mb-2">Grupos:</p>
                          <div className="flex gap-2 flex-wrap">
                            {user.groups.length > 0 ? user.groups.map((group) => (
                              <Badge key={group.id} variant="outline" className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border-primary/20">
                                {group.name}
                              </Badge>
                            )) : <p className="text-sm text-muted-foreground italic">Nenhum grupo atribuído</p>}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Nenhum usuário encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {isOpen && (
        <SideDrawer
          isOpen={isOpen}
          onClose={handleClose}
          title={selectedUser ? "Editar Acesso de Usuário" : "Novo Acesso de Usuário"}
          width="520px"
          storageKey="iam"
          badge={{ text: `${selectedUser ? getEffectivePermissions(selectedUser).length : 0} permissões`, colorScheme: "blue" }}
          styleContext={styleContext}
        >
          <div className="overflow-y-auto h-full pb-24">
            {selectedUser && (
              <div className="py-4 px-4 border-b border-border">
                <p className="text-base font-medium text-foreground">{selectedUser.name}</p>
                <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
              </div>
            )}
            <div className="p-4 pb-24">
              <div className="mb-6">
                <Label className="mb-2 block text-sm font-medium text-foreground">Nível de Acesso</Label>
                <DSSelect value={String(formData.accessLevel)} onValueChange={(v) => setFormData({ ...formData, accessLevel: parseInt(v) })}>
                  <SelectTrigger className="h-9 w-full bg-background border-border text-foreground">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="z-[2000]">
                    <SelectItem value="0">Público</SelectItem>
                    <SelectItem value="1">Registrado</SelectItem>
                    <SelectItem value="2">Restrito</SelectItem>
                    <SelectItem value="3">Confidencial</SelectItem>
                    <SelectItem value="4">Anônimo</SelectItem>
                  </SelectContent>
                </DSSelect>
              </div>

              <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full justify-start border-b rounded-none bg-transparent h-auto p-0 gap-6">
                  <TabsTrigger value="groups" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2">Grupos</TabsTrigger>
                  <TabsTrigger value="roles" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2">Funções</TabsTrigger>
                  <TabsTrigger value="permissions" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2">Permissões</TabsTrigger>
                </TabsList>

                <div className="mt-4">
                  <TabsContent value="groups">
                    <div className="relative mb-4">
                      <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                      <DSInput placeholder="Buscar grupos..." value={searchText.groups} onChange={(e) => setSearchText({ ...searchText, groups: e.target.value })} className="pl-9 h-9 bg-background border-border text-foreground" />
                    </div>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {filteredGroupsList.map((g) => (
                        <div key={g.id} className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all ${formData.groupIds.includes(g.id) ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/50 border border-transparent"}`} onClick={() => handleCheckboxChange("group", g.id)}>
                          <Checkbox id={`g-${g.id}`} checked={formData.groupIds.includes(g.id)} onCheckedChange={() => handleCheckboxChange("group", g.id)} />
                          <Label htmlFor={`g-${g.id}`} className="flex-1 cursor-pointer">
                            <div className="text-sm font-medium text-foreground">{g.name}</div>
                            <div className="text-xs text-muted-foreground line-clamp-1">{g.description}</div>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="roles">
                    <div className="relative mb-4">
                      <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                      <DSInput placeholder="Buscar funções..." value={searchText.roles} onChange={(e) => setSearchText({ ...searchText, roles: e.target.value })} className="pl-9 h-9 bg-background border-border text-foreground" />
                    </div>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {filteredRolesList.map((r) => (
                        <div key={r.id} className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all ${formData.roleIds.includes(r.id) ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/50 border border-transparent"}`} onClick={() => handleCheckboxChange("role", r.id)}>
                          <Checkbox id={`r-${r.id}`} checked={formData.roleIds.includes(r.id)} onCheckedChange={() => handleCheckboxChange("role", r.id)} />
                          <Label htmlFor={`r-${r.id}`} className="flex-1 cursor-pointer">
                            <div className="text-sm font-medium text-foreground">{r.name}</div>
                            <div className="text-xs text-muted-foreground line-clamp-1">{r.description}</div>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="permissions">
                    <div className="relative mb-4">
                      <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                      <DSInput placeholder="Buscar permissões..." value={searchText.permissions} onChange={(e) => setSearchText({ ...searchText, permissions: e.target.value })} className="pl-9 h-9 bg-background border-border text-foreground" />
                    </div>
                    <div className="space-y-6 max-h-[400px] overflow-y-auto">
                      {Object.entries(groupedPermissions).map(([cat, perms]) => (
                        <div key={cat} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{cat}</span>
                            <Separator className="flex-1" />
                          </div>
                          {perms.map((p) => (
                            <div key={p.id} className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-all ${formData.permissionIds.includes(p.id) ? "bg-primary/10" : "hover:bg-muted/50"}`} onClick={() => handleCheckboxChange("permission", p.id)}>
                              <Checkbox id={`p-${p.id}`} checked={formData.permissionIds.includes(p.id)} onCheckedChange={() => handleCheckboxChange("permission", p.id)} />
                              <Label htmlFor={`p-${p.id}`} className="flex-1 cursor-pointer">
                                <div className="text-sm font-medium text-foreground">{p.name}</div>
                                <div className="text-xs text-muted-foreground"><code>{p.code}</code></div>
                              </Label>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
            <div
              className="absolute bottom-0 left-0 right-0 py-4 px-6 border-t border-border flex justify-end space-x-3 z-10"
              style={{ backgroundColor: styleContext.state.backgroundColor }}
            >
              <DSButton type="button" size="sm" onClick={handleSave} disabled={isLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Atualizar Permissões
              </DSButton>
            </div>
          </div>
        </SideDrawer>
      )}
    </div>
  );
}

export default UserAccess;
