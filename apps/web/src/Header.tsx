import React, { useContext, useEffect, useState } from "react";
import { HotkeyContext, withNoModifiers } from "./reducers/hotkeys.reducer";
import { GlobalHotKeys } from "react-hotkeys";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "./reducers/auth.reducer";
import { UrbisHeader, Button } from "@open-urbis/map-ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@open-urbis/map-ui";
import { usePermissions } from "./reducers/permission.context";

const APP_MENU_ITEMS: { label: string; href: string; active?: boolean }[] = [
  { label: "Mosaico", href: "https://urbis.prefeitura.sp.gov.br" },
  { label: "Mapa", href: "https://mapa.urbis.prefeitura.sp.gov.br" },
  {
    label: "Dados Abertos",
    href: "https://dadosabertos.urbis.prefeitura.sp.gov.br",
  },
  { label: "Doc. técnica", href: "https://docs.urbis.prefeitura.sp.gov.br/" },
  {
    label: "Legis",
    href: "https://docs.urbis.prefeitura.sp.gov.br/docs/legis",
  },
];

const DROPDOWN_CONTENT_Z = "z-[2100]";

function Header(): JSX.Element {
  const { isAuthenticated, user, signIn, signOut } = useContext(AuthContext);
  const hotkeyContext = useContext(HotkeyContext);
  const { hasPermission, loading } = usePermissions();
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(() =>
    document.documentElement.classList.contains("dark"),
  );
  const [viabilizaMenuOpen, setViabilizaMenuOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const displayName =
    user?.socialName || user?.name || user?.email || "Usuário";
  const initials =
    (user?.socialName || user?.name || user?.email || "")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "U";

  const navItems = [
    {
      path: "/workflows-schema",
      label: "Assuntos",
      shortcut: "1",
      permission: "workflow-schema:read:findAll",
    },
    {
      path: "/workflows",
      label: "Pedidos",
      shortcut: "2",
    },
    {
      path: "/acceptances",
      label: "Assinaturas",
      shortcut: "3",
      permission: "workflow:read:findAll",
    },
    {
      path: "/datasets",
      label: "Base de dados",
      mobile: true,
      permission: "dataset:read:findAll",
    },
    {
      path: "/secrets",
      label: "Segredos",
      mobile: true,
      permission: "integration:secrets:findAll",
    },
    {
      path: "/presets",
      label: "Formulários",
      mobile: true,
      permission: "form:read:findAll",
    },
    {
      path: "/modules",
      label: "Módulos de Código",
      mobile: true,
      permission: "code-module:read:findAll",
    },
    {
      path: "/variables",
      label: "Variáveis",
      mobile: true,
      permission: "constant-variable:read:findAll",
    },
    {
      path: "/sign-up-editor",
      label: "Formulário de Cadastro",
      mobile: true,
      permission: "user:write:set-custom-user-fields",
    },
    {
      path: "/iam",
      label: "Gerenciamento de Acesso",
      mobile: true,
      permission: "iam:permissions:read:findAll",
    },
    {
      path: "/dashboard",
      label: "Estatísticas",
      mobile: true,
      permission: "dashboard:read:workflowOverview",
    },
    {
      path: "/admin-panel",
      label: "Painel Administrativo",
      mobile: true,
      permission: "dashboard:read:workflowOverview",
    },
  ];

  const canViewAllWorkflows = hasPermission("workflow:read:findAll");

  // Filter navItems based on permissions
  const filteredNavItems = navItems.filter(
    (item) => !item.permission || hasPermission(item.permission),
  );
  const administrativeItems = [
    { path: "/representations", label: "Representações" },
    ...filteredNavItems
      .filter((item) => item.mobile)
      .map((item) => ({ path: item.path, label: item.label })),
  ];

  const canViewWorkflows = hasPermission("workflow:read:findAll");
  const canViewWorkflowSchemas = hasPermission("workflow-schema:read:findAll");

  function handleRedirect(path: string) {
    navigate(path);
  }

  function handleLogout(): void {
    signOut();
  }

  function handleInternalNavCapture(event: React.MouseEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement | null;
    const anchor = target?.closest("a") as HTMLAnchorElement | null;
    if (!anchor) return;

    const href = anchor.getAttribute("href");
    if (!href || !href.startsWith("/")) return;

    event.preventDefault();
    navigate(href);
  }

  // Setup hotkeys: 1 = Viabiliza, 2 = Administração, 3 = menu do usuário; user uses arrow keys to select
  useEffect(() => {
    if (isAuthenticated && !loading) {
      const hotkeyMap: Record<string, any> = {
        "1": withNoModifiers(() => setViabilizaMenuOpen(true)),
        "2": withNoModifiers(() => setAdminMenuOpen(true)),
        "3": withNoModifiers(() => setUserMenuOpen(true)),
      };
      hotkeyContext.dispatch({
        type: "SET_HOTKEY",
        payload: hotkeyMap,
      });
    }
  }, [loading, isAuthenticated]);

  useEffect(() => {
    const root = document.documentElement;
    const syncTheme = () => setIsDarkMode(root.classList.contains("dark"));

    syncTheme();

    const observer = new MutationObserver(syncTheme);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <GlobalHotKeys
        keyMap={hotkeyContext.state.hotkeyKeyMap}
        handlers={hotkeyContext.state.hotkeyHandlers}
        allowChanges={true}
      />
      <div
        className="relative z-[2000]"
        onClickCapture={handleInternalNavCapture}
      >
        <UrbisHeader
          logoSrc={isDarkMode ? "/logo_escuro.svg" : "/logo.png"}
          logoAlt="Logotipo da Prefeitura de São Paulo"
          logoHref="https://viabiliza.urbis.prefeitura.sp.gov.br"
          badgeText="Viabiliza"
          menuItems={APP_MENU_ITEMS.map((item) => ({
            label: item.label,
            href: item.href,
            active: !!item.active,
          }))}
          isAuthenticated={false}
          user={undefined}
          onLogin={signIn}
          onLogout={undefined}
          showLogin={!isAuthenticated}
          rightSlot={
            <div className="hidden md:flex items-center gap-2">
              <DropdownMenu
                open={viabilizaMenuOpen}
                onOpenChange={setViabilizaMenuOpen}
              >
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="cursor-pointer h-9 rounded-full px-4"
                  >
                    Viabiliza
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className={`w-64 bg-popover ${DROPDOWN_CONTENT_Z}`}
                >
                  <DropdownMenuLabel>Navegação (1)</DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {isAuthenticated && canViewWorkflowSchemas ? (
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onSelect={(event) => {
                        event.preventDefault();
                        navigate("/workflows-schema");
                      }}
                    >
                      Assuntos
                    </DropdownMenuItem>
                  ) : null}

                  {isAuthenticated ? (
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onSelect={(event) => {
                        event.preventDefault();
                        navigate("/workflows");
                      }}
                    >
                      Pedidos
                    </DropdownMenuItem>
                  ) : null}

                  {isAuthenticated && canViewAllWorkflows ? (
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onSelect={(event) => {
                        event.preventDefault();
                        navigate("/workflows/all");
                      }}
                    >
                      Relatório
                    </DropdownMenuItem>
                  ) : null}

                  {isAuthenticated && canViewWorkflows ? (
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onSelect={(event) => {
                        event.preventDefault();
                        navigate("/acceptances");
                      }}
                    >
                      Assinaturas
                    </DropdownMenuItem>
                  ) : null}

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    className="cursor-pointer"
                    onSelect={(event) => {
                      event.preventDefault();
                      navigate("/document-validate");
                    }}
                  >
                    Consultar documento
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {isAuthenticated && administrativeItems.length > 0 ? (
                <DropdownMenu
                  open={adminMenuOpen}
                  onOpenChange={setAdminMenuOpen}
                >
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="cursor-pointer h-9 rounded-full px-4"
                    >
                      Administração
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className={`w-64 bg-popover ${DROPDOWN_CONTENT_Z}`}
                  >
                    <DropdownMenuLabel>Administrativo (2)</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {administrativeItems.map((item) => (
                      <DropdownMenuItem
                        key={item.path}
                        className="cursor-pointer"
                        onSelect={(event) => {
                          event.preventDefault();
                          navigate(item.path);
                        }}
                      >
                        {item.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}

              {isAuthenticated ? (
                <DropdownMenu
                  open={userMenuOpen}
                  onOpenChange={setUserMenuOpen}
                >
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 rounded-full h-9 px-3 shrink-0"
                      aria-haspopup="menu"
                      aria-label="Abrir menu do usuário"
                    >
                      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-600 text-white text-[10px] font-bold">
                        {initials}
                      </span>
                      <span className="hidden md:inline text-sm font-medium max-w-[140px] truncate">
                        {displayName}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className={`w-72 bg-popover ${DROPDOWN_CONTENT_Z}`}
                  >
                    <DropdownMenuLabel>Menu do usuário (3)</DropdownMenuLabel>
                    <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                      {displayName}
                    </DropdownMenuLabel>
                    {user?.email && user.email !== displayName ? (
                      <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                        {user.email}
                      </DropdownMenuLabel>
                    ) : null}
                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      className="cursor-pointer"
                      onSelect={(event) => {
                        event.preventDefault();
                        window.location.href =
                          "https://conta.urbis.prefeitura.sp.gov.br";
                      }}
                    >
                      Minha conta
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      className="cursor-pointer"
                      onSelect={(event) => {
                        event.preventDefault();
                        signOut();
                      }}
                    >
                      Sair
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />
                    <div className="px-2 py-1.5 text-[11px] text-muted-foreground select-none">
                      Versão: {`${import.meta.env.VITE_VERSION}`}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
            </div>
          }
        />
      </div>
    </>
  );
}

export default Header;
