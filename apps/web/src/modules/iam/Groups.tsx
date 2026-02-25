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
  Checkbox,
  Separator,
  Button as DSButton,
  Input as DSInput,
  Select as DSSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea as DSTextarea,
  Label,
} from "@open-urbis/map-ui";
import {
  FaEdit,
  FaPlus,
  FaTrash,
  FaChevronDown,
  FaChevronRight,
  FaSearch,
} from "react-icons/fa";
import { Loader2 } from "lucide-react";
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
  <Badge
    {...props}
    className={`text-[10px] font-medium px-2 py-0.5 rounded-full inline-flex items-center cursor-pointer ${props.className || ""}`}
  >
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
      <div className="flex justify-between items-center h-10">
        <h2
          className="text-lg font-bold text-foreground m-0 leading-none"
          style={{ color: styleContext.state.textColor }}
        >
          Grupos
        </h2>
        <DSButton
          type="button"
          onClick={resetFormAndOpen}
          className="h-8 rounded-lg px-4 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <FaPlus size={14} />
          Novo Grupo
        </DSButton>
      </div>

      {isLoading && groups.length === 0 ? (
        <div className="flex justify-center my-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="ds-table rounded-lg overflow-hidden border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10 bg-muted/40 h-10 px-3"></TableHead>
                <TableHead className="bg-muted/40 h-10 px-4 text-xs font-semibold tracking-wide text-foreground">
                  Nome
                </TableHead>
                <TableHead className="bg-muted/40 h-10 px-4 text-xs font-semibold tracking-wide text-foreground">
                  Descrição
                </TableHead>
                <TableHead className="bg-muted/40 h-10 px-4 text-xs font-semibold tracking-wide text-foreground">
                  Funções
                </TableHead>
                <TableHead className="w-[100px] text-right bg-muted/40 h-10 px-4 text-xs font-semibold tracking-wide text-foreground">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map((group) => (
                <React.Fragment key={group.id}>
                  <TableRow className="transition-colors duration-200">
                    <TableCell
                      onClick={() => toggleGroupExpand(group.id)}
                      className="cursor-pointer text-foreground py-2"
                    >
                      {expandedGroups[group.id] ? (
                        <FaChevronDown />
                      ) : (
                        <FaChevronRight />
                      )}
                    </TableCell>
                    <TableCell className="font-medium text-foreground py-2">
                      {group.name}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground py-2">
                      {group.description}
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="flex flex-wrap gap-1 max-w-md">
                        {group.roles.length > 0 ? (
                          group.roles.slice(0, 3).map((role) => (
                            <InfoTooltip
                              key={role.id}
                              content={
                                <div className="space-y-2 text-foreground">
                                  <p className="font-bold text-foreground">Permissões:</p>
                                  {role.permissions.map((perm) => (
                                    <p key={perm.id} className="text-sm text-foreground">
                                      • <code className="bg-muted px-1 rounded text-foreground">{perm.code}</code>
                                      {perm.description && ` - ${perm.description}`}
                                    </p>
                                  ))}
                                </div>
                              }
                              showIcon={false}
                            >
                              <ClickableBadge
                                variant="outline"
                                className="bg-primary/10 text-primary border-primary/20"
                              >
                                {role.name}
                              </ClickableBadge>
                            </InfoTooltip>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">Sem funções</span>
                        )}
                        {group.roles.length > 3 && (
                          <InfoTooltip
                            content={
                              <div className="space-y-2 text-foreground">
                                <p className="font-bold text-foreground">Funções adicionais:</p>
                                {group.roles.slice(3).map((role) => (
                                  <p key={role.id} className="text-sm text-foreground">
                                    • {role.name}
                                    {role.description && ` - ${role.description}`}
                                  </p>
                                ))}
                              </div>
                            }
                            showIcon={false}
                          >
                            <ClickableBadge
                              variant="secondary"
                              className="bg-muted text-muted-foreground border-transparent"
                            >
                              +{group.roles.length - 3}
                            </ClickableBadge>
                          </InfoTooltip>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right py-2">
                      <div className="flex justify-end space-x-2 group">
                        <DSButton
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => handleEditClick(group)}
                          title="Editar"
                        >
                          <FaEdit size={14} />
                        </DSButton>
                        <DSButton
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteClick(group.id)}
                          title="Excluir"
                        >
                          <FaTrash size={14} />
                        </DSButton>
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedGroups[group.id] && (
                    <TableRow className="bg-muted/30">
                      <TableCell colSpan={5} className="p-0">
                        <div className="p-4 border-b border-border">
                          <div className="flex justify-between items-center mb-2">
                            <p className="font-bold text-foreground">Detalhes do Grupo</p>
                            <InfoTooltip
                              content={
                                <div className="space-y-2 text-foreground">
                                  <p className="font-bold text-foreground">Permissões efetivas:</p>
                                  <p className="text-xs mb-2 text-muted-foreground">
                                    (Combinação de todas as permissões das funções deste grupo)
                                  </p>
                                  {Array.from(
                                    new Set(
                                      group.roles.flatMap((role) =>
                                        role.permissions.map((perm) => perm)
                                      )
                                    )
                                  ).map((perm, idx) => (
                                    <p key={idx} className="text-sm text-foreground">
                                      • <code className="bg-muted px-1 rounded text-foreground">{perm.code}</code>
                                      {perm.description && ` - ${perm.description}`}
                                    </p>
                                  ))}
                                </div>
                              }
                              showIcon={false}
                            >
                              <ClickableBadge
                                variant="outline"
                                className="bg-primary/10 text-primary border-primary/20"
                              >
                                {getTotalPermissions(group)} permissões efetivas
                              </ClickableBadge>
                            </InfoTooltip>
                          </div>
                          <Separator className="my-3" />

                          <p className="text-sm font-medium mb-2 text-foreground">
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
                          </p>

                          <p className="text-sm font-medium mb-2 text-foreground">
                            Funções neste grupo:
                          </p>
                          {group.roles.length > 0 ? (
                            <div className="space-y-2">
                              {group.roles.map((role) => (
                                <div
                                  key={role.id}
                                  className="p-2 bg-background border border-border rounded-md shadow-sm"
                                >
                                  <div className="flex justify-between items-center">
                                    <p className="font-medium text-foreground text-sm">
                                      {role.name}
                                    </p>
                                    <InfoTooltip
                                      content={
                                        <div className="space-y-2 text-foreground">
                                          <p className="font-bold text-foreground">Permissões:</p>
                                          {role.permissions.map((perm) => (
                                            <p key={perm.id} className="text-sm text-foreground">
                                              • <code className="bg-muted px-1 rounded text-foreground">{perm.code}</code>
                                              {perm.description && ` - ${perm.description}`}
                                            </p>
                                          ))}
                                        </div>
                                      }
                                      showIcon={false}
                                    >
                                      <ClickableBadge
                                        variant="outline"
                                        className="bg-primary/10 text-primary border-primary/20"
                                      >
                                        {role.permissions.length} permissões
                                      </ClickableBadge>
                                    </InfoTooltip>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {role.description}
                                  </p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground italic">
                              Este grupo não possui funções atribuídas.
                            </p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
              {groups.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Nenhum grupo encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
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
          <div className="overflow-y-auto h-full pb-24">
            <div className="p-4 pb-24 border-b border-border">
              <div className="mb-4">
                <Label className="mb-2 block text-sm font-medium text-foreground">
                  Nome do Grupo
                </Label>
                <DSInput
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Ex: Equipe de Aprovação"
                  className="h-9 bg-background text-foreground border-border focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>

              <div className="mb-4">
                <Label className="mb-2 block text-sm font-medium text-foreground">
                  Descrição
                </Label>
                <DSTextarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Descrição detalhada do grupo..."
                  className="min-h-[112px] bg-background text-foreground border-border focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>

              <div className="mb-4">
                <Label className="mb-2 block text-sm font-medium text-foreground">
                  Nível de Acesso
                </Label>
                <DSSelect
                  value={String(formData.accessLevel)}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      accessLevel: parseInt(value, 10),
                    })
                  }
                >
                  <SelectTrigger className="h-9 w-full bg-background text-foreground border-border">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="z-[2000]">
                    <SelectItem value="0">Público</SelectItem>
                    <SelectItem value="1">Registrado</SelectItem>
                    <SelectItem value="2">Restrito</SelectItem>
                    <SelectItem value="3">Confidencial</SelectItem>
                  </SelectContent>
                </DSSelect>
                <p className="mt-1 text-xs text-muted-foreground">
                  Define o nível de acesso necessário para este grupo
                </p>
              </div>
            </div>

            <div className="p-4">
              <p className="text-sm mb-4 font-medium text-foreground">
                Selecione as funções para este grupo:
              </p>

              <div className="relative mb-4">
                <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                <DSInput
                  placeholder="Buscar funções..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSearchTerm(e.target.value)
                  }
                  className="h-9 pl-9 bg-background text-foreground border-border focus-visible:ring-2 focus-visible:ring-primary"
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
                <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
                  {filteredRoles.map((role) => (
                    <div
                      key={role.id}
                      className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all ${
                        formData.roleIds.includes(role.id)
                          ? "bg-primary/10 border border-primary/20"
                          : "hover:bg-muted/50 border border-transparent"
                      }`}
                      onClick={() => handleRoleChange(role.id)}
                    >
                      <Checkbox
                        id={role.id}
                        checked={formData.roleIds.includes(role.id)}
                        onCheckedChange={() => handleRoleChange(role.id)}
                        className="!rounded-none shrink-0"
                      />
                      <Label
                        htmlFor={role.id}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="text-sm font-medium text-foreground leading-tight">{role.name}</div>
                        <div className="text-xs text-muted-foreground">{role.description}</div>
                        <div className="flex mt-1 gap-1">
                          <Badge variant="outline" className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border-primary/20">
                            {role.permissions.length} permissões
                          </Badge>
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-4 text-xs text-muted-foreground">
                Selecionadas: {formData.roleIds.length} funções
              </p>
            </div>
          </div>

          <div
            className="absolute bottom-0 left-0 right-0 h-16 px-6 border-t border-border flex items-center justify-end space-x-3 z-10"
            style={{ backgroundColor: styleContext.state.backgroundColor }}
          >
            <DSButton
              type="button"
              onClick={handleSave}
              disabled={isLoading}
              className="h-8 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isEdit ? "Atualizar" : "Criar"} Grupo
            </DSButton>
          </div>
        </SideDrawer>
      )}
    </div>
  );
}
