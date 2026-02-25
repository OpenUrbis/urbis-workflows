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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Button as DSButton,
  Input as DSInput,
  Textarea as DSTextarea,
  Label,
} from "@open-urbis/map-ui";
import { FaEdit, FaPlus, FaTrash } from "react-icons/fa";
import { Loader2 } from "lucide-react";
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
      <div className="flex justify-between items-center">
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
          className="h-9 rounded-lg px-4 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <FaPlus size={14} />
          Nova Permissão
        </DSButton>
      </div>

      {isLoading && permissions.length === 0 ? (
        <div className="flex justify-center my-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="ds-table rounded-lg overflow-hidden border border-border bg-card">
          <div className="overflow-x-auto w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="bg-muted/40 text-xs font-semibold text-foreground h-10"
                    style={{ width: "20%", minWidth: "150px" }}
                  >
                    Nome
                  </TableHead>
                  <TableHead
                    className="bg-muted/40 text-xs font-semibold text-foreground h-10"
                    style={{ width: "25%", minWidth: "180px" }}
                  >
                    Código
                  </TableHead>
                  <TableHead
                    className="bg-muted/40 text-xs font-semibold text-foreground h-10"
                    style={{ width: "45%" }}
                  >
                    Descrição
                  </TableHead>
                  <TableHead
                    className="bg-muted/40 text-xs font-semibold text-foreground h-10 text-right"
                    style={{
                      width: "10%",
                      minWidth: "100px",
                    }}
                  >
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissions.map((permission) => (
                  <TableRow
                    key={permission.id}
                    className="transition-colors duration-200"
                  >
                    <TableCell
                      className="font-medium text-foreground py-2"
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="truncate cursor-default">{permission.name}</div>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            {permission.name}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell
                      className="py-2"
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge
                              variant="outline"
                              className="text-[10px] font-medium px-2 py-0.5 rounded-full truncate max-w-full inline-flex items-center bg-primary/10 text-primary border-primary/20"
                            >
                              {permission.code}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            {permission.code}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell
                      className="text-muted-foreground py-2"
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="cursor-help truncate">
                              {permission.description || "Sem descrição"}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            {permission.description || "Sem descrição"}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="text-right py-2">
                      <div className="flex justify-end space-x-2 group">
                        <DSButton
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => handleEditClick(permission)}
                          title="Editar"
                        >
                          <FaEdit size={14} />
                        </DSButton>
                        <DSButton
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteClick(permission.id)}
                          title="Excluir"
                        >
                          <FaTrash size={14} />
                        </DSButton>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {permissions.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Nenhuma permissão encontrada
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
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
                  colorScheme: "blue",
                }
              : undefined
          }
        >
          <div className="overflow-y-auto h-full pb-20">
            <div className="p-4 border-b border-border">
              <div className="mb-4">
                <Label
                  className="mb-2 block text-sm font-medium text-foreground"
                >
                  Nome da Permissão
                </Label>
                <DSInput
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Ex: Visualizar Fluxos de Trabalho"
                  className="h-9 bg-background text-foreground border-border focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>

              <div className="mb-4">
                <Label
                  className="mb-2 block text-sm font-medium text-foreground"
                >
                  Código
                </Label>
                <DSInput
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  placeholder="Ex: workflow:read:*"
                  className="h-9 bg-background text-foreground border-border focus-visible:ring-2 focus-visible:ring-primary"
                />
                <div className="mt-1 text-xs text-muted-foreground">
                  Formato: dominio:tipo_operacao:acao (use * para curingas)
                </div>
              </div>

              <div className="mb-4">
                <Label
                  className="mb-2 block text-sm font-medium text-foreground"
                >
                  Descrição
                </Label>
                <DSTextarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Descrição detalhada da permissão..."
                  className="min-h-[112px] bg-background text-foreground border-border focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>
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
              {isEdit ? "Atualizar" : "Criar"} Permissão
            </DSButton>
          </div>
        </SideDrawer>
      )}
    </div>
  );
}
