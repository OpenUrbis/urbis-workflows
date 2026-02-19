import React, { useContext, useEffect } from "react";
import { MdMenu } from "react-icons/md";
import logo from "./assets/logo.png";
import { StyleContext } from "./reducers/style.reducer";
import { HotkeyContext, withNoModifiers } from "./reducers/hotkeys.reducer";
import { GlobalHotKeys } from "react-hotkeys";
import {
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  Flex,
  IconButton,
  useDisclosure,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import AccessibilityMenu from "./AccessibilityMenu";
import { AuthContext } from "./reducers/auth.reducer";

const ACCOUNTS_URL = import.meta.env.VITE_ACCOUNTS_URL || "http://localhost:4200";
import { SL } from "./components";
import { usePermissions } from "./reducers/permission.context";

function Header(): JSX.Element {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isAuthenticated, signIn, signOut } = useContext(AuthContext);
  const styleContext = useContext(StyleContext);
  const hotkeyContext = useContext(HotkeyContext);
  const { hasPermission, loading } = usePermissions();
  const navigate = useNavigate();

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
    (item) => !item.permission || hasPermission(item.permission)
  );

  function handleRedirectHome() {
    navigate("/");

    if (isOpen) {
      onClose();
    }
  }

  function handleRedirect(path: string) {
    navigate(path);
  }

  function handleRedirectProfile() {
    window.location.href = `${ACCOUNTS_URL}/profile`;

    if (isOpen) {
      onClose();
    }
  }

  function handleLogout(): void {
    signOut();
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
            handleRedirect(item.path)
          );
        }
      });

      hotkeyContext.dispatch({
        type: "SET_HOTKEY",
        payload: hotkeyMap,
      });
    }
  }, [loading, filteredNavItems, isAuthenticated]);

  return (
    <>
      <style>
        {`
          html { 
            font-size: ${styleContext.state.fontSize}%; 
          } 
          body {
            color: ${styleContext.state.textColor}; 
            background-color: ${styleContext.state.backgroundColor}; 
          }
        `}
      </style>
      <GlobalHotKeys
        keyMap={hotkeyContext.state.hotkeyKeyMap}
        handlers={hotkeyContext.state.hotkeyHandlers}
        allowChanges={true}
      />
      <header>
        <div className="mb-6 px-4 sm:px-6 md:px-8 lg:px-24 py-4 md:py-6 flex items-center">
          {window.innerWidth >= 640 && (
            <div className="flex-shrink-0 mr-6">
              <img
                className="cursor-pointer"
                onClick={handleRedirectHome}
                src={logo}
                alt=""
                style={{ height: "50px", maxHeight: "70px" }}
              />
            </div>
          )}
          <div className="flex-1 flex items-center justify-between">
            <div className="flex flex-wrap gap-2 md:gap-3 lg:gap-4">
              {isAuthenticated && (
                <>
                  {filteredNavItems
                    .filter((item) => !item.mobile)
                    .map((item) => (
                      <div
                        key={item.path}
                        onClick={() => handleRedirect(item.path)}
                        className={`relative inline-flex items-center px-2.5 sm:px-3 md:px-4 py-1.5 md:py-2 rounded-full border text-sm md:text-base transition-colors duration-200 font-medium cursor-pointer ${
                          window.location.pathname === item.path
                            ? styleContext.state.buttonHoverColorWeight ===
                              "200"
                              ? "bg-gray-200 text-gray-800 border-gray-300"
                              : "bg-gray-700 text-gray-200 border-gray-600"
                            : styleContext.state.buttonHoverColorWeight ===
                                "200"
                              ? "text-gray-600 hover:bg-gray-100 border-gray-200"
                              : "text-gray-400 hover:bg-gray-700 border-gray-700"
                        }`}
                        style={{
                          display:
                            window.innerWidth >= 640 ? "inline-flex" : "none",
                        }}
                      >
                        <span className="whitespace-nowrap">{item.label}</span>
                        <SL
                          className="ml-1.5 md:ml-2"
                          size="sm"
                          bg={
                            styleContext.state.buttonHoverColorWeight === "200"
                              ? window.location.pathname === item.path
                                ? "gray.200"
                                : "gray.100"
                              : window.location.pathname === item.path
                                ? "gray.700"
                                : "gray.600"
                          }
                        >
                          {item.shortcut}
                        </SL>
                      </div>
                    ))}
                </>
              )}
            </div>
            {window.innerWidth >= 640 && (
              <div className="flex-shrink-0 flex items-center gap-3">
                {!isAuthenticated && (
                  <button
                    onClick={() => signIn()}
                    className="inline-flex items-center px-4 py-2 rounded-full border text-sm font-medium transition-colors duration-200 cursor-pointer border-yellow-500 text-yellow-600 hover:bg-yellow-50"
                  >
                    Entrar
                  </button>
                )}
                <AccessibilityMenu />
              </div>
            )}
          </div>
          {window.innerWidth < 640 && (
            <IconButton
              aria-label="Open menu"
              icon={<MdMenu size={24} />}
              variant="outline"
              onClick={onOpen}
            />
          )}
        </div>

        {window.innerWidth < 640 && (
          <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
            <DrawerContent
              className="p-8"
              style={{
                backgroundColor: styleContext.state.backgroundColor,
              }}
            >
              <DrawerBody>
                <Flex justifyContent="flex-end">
                  <DrawerCloseButton size="lg" />
                </Flex>
                <div className="flex flex-col font-bold justify-center text-center space-y-6">
                  {filteredNavItems.map((item) => (
                    // eslint-disable-next-line
                    <a
                      key={item.path}
                      href="#"
                      onClick={() => handleRedirect(item.path)}
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
                <div className="font-bold pt-6">Opções de acessibilidade</div>
                <AccessibilityMenu />
                <div className="text-center absolute bottom-0 ml-10 mb-6">
                  <div className="flex flex-col justify-center text-center space-y-6">
                    {isAuthenticated ? (
                      <>
                        {/* eslint-disable-next-line */}
                        <a
                          className="font-bold"
                          href="#"
                          onClick={handleRedirectProfile}
                        >
                          Perfil
                        </a>
                        {/* eslint-disable-next-line */}
                        <a
                          className="font-bold"
                          href="#"
                          onClick={handleLogout}
                        >
                          Sair
                        </a>
                      </>
                    ) : (
                      <a
                        className="font-bold text-yellow-500 cursor-pointer"
                        href="#"
                        onClick={() => signIn()}
                      >
                        Entrar
                      </a>
                    )}
                    <div className="text-xs">Versão mvp-0.0.0</div>
                  </div>
                </div>
              </DrawerBody>
            </DrawerContent>
          </Drawer>
        )}
      </header>
    </>
  );
}

export default Header;
