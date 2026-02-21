import React, { useContext, useEffect, useState } from "react";
import { HotkeyContext, withNoModifiers } from "./reducers/hotkeys.reducer";
import { GlobalHotKeys } from "react-hotkeys";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "./reducers/auth.reducer";
import { UrbisHeader } from "@open-urbis/map-ui";
import { Button } from "@open-urbis/map-ui/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@open-urbis/map-ui/ui/dropdown-menu";
import { usePermissions } from "./reducers/permission.context";

function Header(): JSX.Element {
  const { isAuthenticated, user, signIn, signOut } = useContext(AuthContext);
  const hotkeyContext = useContext(HotkeyContext);
  const { hasPermission, loading } = usePermissions();
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(() =>
    document.documentElement.classList.contains("dark"),
  );

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
      permission: "workflow:read:findAll",
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
  ];

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

  // Setup hotkeys when permissions are loaded
  useEffect(() => {
    // Only set up hotkeys if authenticated and permissions are loaded
    if (isAuthenticated && !loading) {
      // Only set hotkeys for items the user has permission to access
      const hotkeyMap: Record<string, any> = {};

      filteredNavItems.forEach((item) => {
        if (item.shortcut && !item.mobile) {
          hotkeyMap[item.shortcut] = withNoModifiers(() =>
            handleRedirect(item.path),
          );
        }
      });

      hotkeyContext.dispatch({
        type: "SET_HOTKEY",
        payload: hotkeyMap,
      });
    }
  }, [loading, filteredNavItems, isAuthenticated]);

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
      <div onClickCapture={handleInternalNavCapture}>
        <UrbisHeader
          key={`urbis-header-${isDarkMode ? "dark" : "light"}`}
          logoSrc={isDarkMode ? "/logo_escuro.svg" : "/logo.png"}
          logoAlt="Logotipo da Prefeitura de São Paulo"
          logoHref="https://viabiliza.urbis.prefeitura.sp.gov.br"
          badgeText="Viabiliza"
          menuItems={
            isAuthenticated
              ? filteredNavItems
                  .filter((item) => !item.mobile)
                  .map((item) => ({
                    label: item.label,
                    href: item.path,
                    active: window.location.pathname === item.path,
                  }))
              : []
          }
          isAuthenticated={isAuthenticated}
          user={user ?? undefined}
          onLogin={signIn}
          onLogout={handleLogout}
          rightSlot={
            <div className="hidden md:flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="cursor-pointer h-9 rounded-full px-4"
                onClick={() => navigate("/document-validate")}
              >
                Consultar documento
              </Button>

              {isAuthenticated && administrativeItems.length > 0 ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="cursor-pointer h-9 rounded-full px-4"
                    >
                      Administração
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64 bg-popover">
                    <DropdownMenuLabel>Administrativo</DropdownMenuLabel>
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
            </div>
          }
        />
      </div>
    </>
  );
}

export default Header;
