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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@open-urbis/map-ui";
import {
  FaEdit,
  FaPlus,
  FaTrash,
  FaSearch,
  FaChevronDown,
  FaChevronRight,
} from "react-icons/fa";
import { Loader2 } from "lucide-react";
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
    <div className="flex flex-col space-y-6 mb-20">
      <div className="flex justify-between items-center">
        <h2
          className="text-xl font-bold"
          style={{ color: styleContext.state.textColor }}
        >
          Funções
        </h2>
        <DSButton
          type="button"
          size="sm"
          onClick={resetFormAndOpen}
          className="h-9 rounded-lg px-4 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <FaPlus size={14} />
          Nova Função
        </DSButton>
      </div>

      {isLoading && roles.length === 0 ? (
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
                  Permissões
                </TableHead>
                <TableHead className="w-[100px] text-right bg-muted/40 h-10 px-4 text-xs font-semibold tracking-wide text-foreground">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <React.Fragment key={role.id}>
                  <TableRow className="transition-colors duration-200">
                    <TableCell
                      onClick={() => toggleRoleExpand(role.id)}
                      className="cursor-pointer text-foreground py-2"
                    >
                      {expandedRoles[role.id] ? (
                        <FaChevronDown />
                      ) : (
                        <FaChevronRight />
                      )}
                    </TableCell>
                    <TableCell className="font-medium text-foreground py-2">
                      {role.name}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground py-2">
                      {role.description}
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="flex flex-wrap gap-1 max-w-md">
                        {role.permissions.length > 0 ? (
                          role.permissions.slice(0, 2).map((permission) => (
                            <InfoTooltip
                              key={permission.id}
                              content={
                                <div className="space-y-2 text-foreground">
                                  <p className="font-bold">Detalhes da Permissão:</p>
                                  <p className="text-sm"><span className="font-medium">Nome:</span> {permission.name}</p>
                                  <p className="text-sm"><span className="font-medium">Código:</span> {permission.code}</p>
                                  <p className="text-sm"><span className="font-medium">Descrição:</span> {permission.description}</p>
                                </div>
                              }
                              showIcon={false}
                            >
                              <ClickableBadge
                                variant="outline"
                                className="bg-primary/10 text-primary border-primary/20"
                              >
                                {permission.code}
                              </ClickableBadge>
                            </InfoTooltip>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">Sem permissões</span>
                        )}
                        {role.permissions.length > 2 && (
                          <InfoTooltip
                            content={
                              <div className="space-y-2 text-foreground">
                                <p className="font-bold">Permissões adicionais:</p>
                                {role.permissions.slice(2).map((permission) => (
                                  <p key={permission.id} className="text-sm">
                                    • {permission.code} - {permission.name}
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
                              +{role.permissions.length - 2}
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
                          onClick={() => handleEditClick(role)}
                          title="Editar"
                        >
                          <FaEdit size={14} />
                        </DSButton>
                        <DSButton
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteClick(role.id)}
                          title="Excluir"
                        >
                          <FaTrash size={14} />
                        </DSButton>
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedRoles[role.id] && (
                    <TableRow className="bg-muted/30">
                      <TableCell colSpan={5} className="p-0">
                        <div className="p-4 border-b border-border">
                          <div className="flex justify-between items-center mb-2">
                            <p className="font-bold text-foreground">Detalhes da Função</p>
                            <InfoTooltip
                              content={
                                <div className="space-y-2">
                                  <p className="font-bold text-foreground">Permissões efetivas:</p>
                                  <p className="text-xs mb-2 text-muted-foreground">
                                    (Todas as permissões atribuídas a esta função)
                                  </p>
                                  {role.permissions.map((perm) => (
                                    <p key={perm.id} className="text-sm text-foreground">
                                      • {perm.name}
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
                          <Separator className="my-3" />

                          <p className="text-sm font-medium mb-2 text-foreground">
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
                          </p>

                          <p className="text-sm font-medium mb-2 text-foreground">
                            Permissões nesta função:
                          </p>
                          {role.permissions.length > 0 ? (
                            <div className="space-y-2">
                              {role.permissions.map((permission) => (
                                <div
                                  key={permission.id}
                                  className="p-2 bg-background border border-border rounded-md shadow-sm"
                                >
                                  <div className="flex justify-between items-center">
                                    <p className="font-medium text-foreground text-sm">
                                      {permission.name}
                                    </p>
                                    <InfoTooltip
                                      content={
                                        <div className="space-y-2 text-foreground">
                                          <p className="font-bold text-foreground">Detalhes da Permissão:</p>
                                          <p className="text-sm text-foreground"><span className="font-medium">Nome:</span> {permission.name}</p>
                                          <p className="text-sm text-foreground"><span className="font-medium">Código:</span> {permission.code}</p>
                                          <p className="text-sm text-foreground"><span className="font-medium">Descrição:</span> {permission.description}</p>
                                        </div>
                                      }
                                      showIcon={false}
                                    >
                                      <ClickableBadge
                                        variant="outline"
                                        className="bg-primary/10 text-primary border-primary/20"
                                      >
                                        {permission.code}
                                      </ClickableBadge>
                                    </InfoTooltip>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {permission.description}
                                  </p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground italic">
                              Esta função não possui permissões atribuídas.
                            </p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
              {roles.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Nenhuma função encontrada
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
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
          <div className="overflow-y-auto h-full pb-20">
            <div className="p-4 border-b border-border">
              <div className="mb-4">
                <Label className="mb-2 block text-sm font-medium text-foreground">
                  Nome da Função
                </Label>
                <DSInput
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Ex: Administrador de Fluxos"
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
                  placeholder="Descrição detalhada da função..."
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
                    <SelectItem value="4">Anônimo</SelectItem>
                  </SelectContent>
                </DSSelect>
                <p className="mt-1 text-xs text-muted-foreground">
                  Define o nível de acesso desta função
                </p>
              </div>
            </div>

            <div className="p-4">
              <p className="text-sm mb-4 font-medium text-foreground">
                Selecione as permissões para esta função:
              </p>

              <div className="mb-4">
                <div className="relative">
                  <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                  <DSInput
                    placeholder="Buscar permissões..."
                    value={permissionFilter}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPermissionFilter(e.target.value)
                    }
                    className="h-9 pl-9 bg-background text-foreground border-border focus-visible:ring-2 focus-visible:ring-primary"
                  />
                </div>
              </div>

              {Object.entries(groupedPermissions).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <FaSearch size={32} className="mb-4 opacity-60" />
                  <p className="text-lg font-medium mb-1 text-foreground">
                    Nenhuma permissão encontrada
                  </p>
                  <p className="text-sm">Tente buscar com outros termos</p>
                </div>
              ) : (
                <div className="max-h-[400px] overflow-y-auto space-y-6 pr-2">
                  {Object.entries(groupedPermissions).map(
                    ([domain, domainPermissions]) => (
                      <div key={domain} className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{domain}</span>
                          <Separator className="flex-1" />
                        </div>
                        <div className="space-y-2">
                          {domainPermissions.map((permission) => (
                            <div
                              key={permission.id}
                              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                            >
                              <Checkbox
                                id={permission.id}
                                checked={formData.permissionIds.includes(permission.id)}
                                onCheckedChange={() => handlePermissionChange(permission.id)}
                              />
                              <Label
                                htmlFor={permission.id}
                                className="flex-1 cursor-pointer"
                              >
                                <div className="text-sm font-medium text-foreground">{permission.name}</div>
                                <div className="text-xs text-muted-foreground">{permission.code}</div>
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
              <p className="mt-2 text-sm text-muted-foreground">
                Selecionadas: {formData.permissionIds.length} permissões
              </p>
            </div>
          </div>

          <div
            className="absolute bottom-0 left-0 right-0 py-4 px-6 border-t border-border flex justify-end space-x-3 z-10"
            style={{ backgroundColor: styleContext.state.backgroundColor }}
          >
            <DSButton
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={isLoading}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isEdit ? "Atualizar" : "Criar"} Função
            </DSButton>
          </div>
        </SideDrawer>
      )}

      {/* Delete Confirmation Alert Dialog - Removed as we're using window.confirmation instead */}
    </div>
  );
}
