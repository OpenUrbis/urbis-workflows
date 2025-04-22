import React, { useContext, useEffect, useState } from "react";
import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  useDisclosure,
  MenuGroup,
} from "@chakra-ui/react";
import { MdContrast } from "react-icons/md";
import { StyleContext } from "./reducers/style.reducer";
import { AuthContext } from "./reducers/auth.reducer";
import {
  HotkeyContext,
  withNoModifiers,
  withNumberInput,
} from "./reducers/hotkeys.reducer";
import { SL } from "./components";
import { BsPerson } from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import { usePermissions } from "./reducers/permission.context";

function AccessibilityMenu(): JSX.Element {
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const { isAuthenticated } = useContext(AuthContext);
  const styleContext = useContext(StyleContext);
  const hotkeyContext = useContext(HotkeyContext);
  const { hasPermission, loading } = usePermissions();

  const [backgroundColor, setBackgroundColor] = useState(
    styleContext.state.backgroundColor
  );
  const [textColor, setTextColor] = useState(styleContext.state.textColor);
  const [buttonHoverColorWeight, setButtonHoverColorWeight] = useState(
    styleContext.state.buttonHoverColorWeight
  );
  const [fontSize, setFontSize] = useState<number>(
    localStorage.getItem("fontSize")
      ? Number(localStorage.getItem("fontSize"))
      : 100
  );

  function handleIncreaseFontSize(): void {
    setFontSize((prevFontSize) => {
      const value = prevFontSize + 5;
      localStorage.setItem("fontSize", value.toString());
      return value;
    });
  }

  function handleDecreaseFontSize(): void {
    setFontSize((prevFontSize) => {
      const value = prevFontSize - 5;
      localStorage.setItem("fontSize", value.toString());
      return value;
    });
  }

  function handleHightConstast(): void {
    setBackgroundColor((prevBackgroundColor) => {
      const newBackgroundColor =
        prevBackgroundColor === "#000000" ? "#f5f5f5" : "#000000";
      localStorage.setItem("backgroundColor", newBackgroundColor);
      return newBackgroundColor;
    });

    setTextColor((prevTextColor) => {
      const newTextColor = prevTextColor === "#ffffff" ? "#000000" : "#ffffff";
      localStorage.setItem("textColor", newTextColor);
      return newTextColor;
    });

    setButtonHoverColorWeight((prevButtonHoverColorWeight) => {
      const newButtonHoverColorWeight =
        prevButtonHoverColorWeight === "800" ? "200" : "800";
      localStorage.setItem("buttonHoverColorWeight", newButtonHoverColorWeight);
      return newButtonHoverColorWeight;
    });
  }

  function handleOpenProfileMenu(): void {
    onOpen();
  }

  async function handleLogout(): Promise<void> {
    const confirmed = await confirmation("Tem certeza que deseja sair?", {
      title: "Sair",
      type: "warning",
      confirmText: "Sair",
      cancelText: "Cancelar",
    });

    if (confirmed) {
      // remove all local storage items
      Object.keys(localStorage).forEach((key) => {
        // exception accessibility settings
        if (
          key !== "textColor" &&
          key !== "backgroundColor" &&
          key !== "fontSize" &&
          key !== "buttonHoverColorWeight"
        )
          localStorage.removeItem(key);
      });
      window.location.href = "/login";
    }
  }

  const allMenuItems = [
    { label: "Perfil", navigateTo: "/profile", shortcut: "P" },
    {
      label: "Sair",
      action: () => {
        handleLogout();
      },
      shortcut: "L",
    },
    { title: "Administrativo", groupTitle: true },
    {
      label: "Formulários",
      navigateTo: "/presets",
      shortcut: "K+1",
      index: 1,
      permission: "form:read:findAll",
    },
    {
      label: "Módulos de Código",
      navigateTo: "/modules",
      shortcut: "K+2",
      index: 2,
      permission: "code-module:read:findAll",
    },
    {
      label: "Variáveis",
      navigateTo: "/variables",
      shortcut: "K+3",
      index: 3,
      permission: "constant-variable:read:findAll",
    },
    {
      label: "Segredos",
      navigateTo: "/secrets",
      shortcut: "K+4",
      index: 4,
      permission: "integration:secrets:findAll",
    },
    {
      label: "Base de dados",
      navigateTo: "/datasets",
      shortcut: "K+5",
      index: 5,
      permission: "datasets:read:findAll",
    },
    {
      label: "Formulário de Cadastro",
      navigateTo: "/sign-up-editor",
      shortcut: "K+6",
      index: 6,
      permission: "user:write:set-custom-user-fields",
    },
    {
      label: "Gerenciamento de Acesso",
      navigateTo: "/iam",
      shortcut: "K+7",
      index: 7,
      permission: "iam:permissions:read:findAll",
    },
  ];

  // Filter menu items based on permissions
  const filteredMenuItems = allMenuItems.filter(
    (item) =>
      item.groupTitle || !item.permission || hasPermission(item.permission)
  );

  // Hide the "Administrativo" group title if there are no admin items
  const hasAdminItems = filteredMenuItems.some(
    (item) => !item.groupTitle && item.index && item.index >= 1
  );

  const menuItemsToDisplay = filteredMenuItems.filter(
    (item) =>
      !item.groupTitle || (item.title === "Administrativo" && hasAdminItems)
  );

  useEffect(() => {
    styleContext.dispatch({
      type: "SET_STYLE",
      payload: { fontSize, backgroundColor, textColor, buttonHoverColorWeight },
    });
  }, [
    backgroundColor,
    buttonHoverColorWeight,
    fontSize,
    styleContext.dispatch,
    textColor,
  ]);

  // Setup hotkeys when permissions are loaded
  useEffect(() => {
    // Only set up hotkeys if authenticated and permissions are loaded
    if (isAuthenticated && !loading) {
      hotkeyContext.dispatch({
        type: "SET_HOTKEY",
        payload: {
          0: withNoModifiers(() => handleHightConstast()),
          "=": withNoModifiers(() => handleIncreaseFontSize()),
          "-": withNoModifiers(() => handleDecreaseFontSize()),
          4: withNoModifiers(() => handleOpenProfileMenu()),
          P: withNoModifiers(() => navigate("/profile")),
          L: withNoModifiers(() => handleLogout()),
          K: withNumberInput((e, index) => {
            const menuItem = filteredMenuItems.find(
              (item) => item.index === index
            );
            if (menuItem) {
              navigate(menuItem.navigateTo as string);
            }
          }),
        },
      });
    }
  }, [loading, isAuthenticated, filteredMenuItems]);

  return (
    <div className="flex space-x-2 md:space-x-4 items-center">
      <button
        title="Autocontraste [0]"
        aria-describedby="Autocontraste"
        className={`flex items-center justify-center hover:bg-gray-${styleContext.state.buttonHoverColorWeight} rounded-xl p-2 h-12 w-12`}
        onClick={handleHightConstast}
      >
        <MdContrast size={24} />
      </button>
      <SL className="ml-2">0</SL>
      <button
        title="Ação de aumentar diminuir do texto [-]"
        aria-describedby="Ação de aumentar diminuir do texto"
        className={`flex items-center justify-center hover:bg-gray-${styleContext.state.buttonHoverColorWeight} rounded-xl p-2 h-12 w-12 text-xl font-bold`}
        onClick={handleDecreaseFontSize}
      >
        A-
      </button>
      <button
        title="Ação de aumentar tamanho do texto [+]"
        aria-describedby="Ação de aumentar tamanho do texto"
        className={`flex items-center justify-center hover:bg-gray-${styleContext.state.buttonHoverColorWeight} rounded-xl p-2 h-12 w-12 text-xl font-bold`}
        onClick={handleIncreaseFontSize}
      >
        A+
      </button>
      {isAuthenticated && window.innerWidth >= 768 && (
        <div className="flex items-center">
          <Menu isOpen={isOpen} onClose={onClose} placement="bottom-end">
            <MenuButton
              as={IconButton}
              aria-label="Options"
              bg="transparent"
              color={textColor === "#000000" ? "black" : "white"}
              icon={<BsPerson size={28} />}
              onClick={onOpen}
              className={`hover:bg-gray-${styleContext.state.buttonHoverColorWeight} rounded-xl h-12 w-12`}
            />

            <MenuList
              zIndex={"overlay"}
              bg={
                styleContext.state.buttonHoverColorWeight === "200"
                  ? "white"
                  : "gray.800"
              }
              maxHeight="300px"
              overflowY="auto"
              boxShadow="lg"
              border="1px solid"
              borderColor={
                styleContext.state.buttonHoverColorWeight === "200"
                  ? "gray.200"
                  : "gray.600"
              }
              py={2}
            >
              {menuItemsToDisplay.map((item, index) =>
                item.groupTitle ? (
                  <MenuGroup
                    key={index}
                    title={item.title}
                    color={
                      styleContext.state.buttonHoverColorWeight === "200"
                        ? "gray.500"
                        : "gray.400"
                    }
                    className="px-4 py-2 text-sm font-medium"
                  />
                ) : (
                  <MenuItem
                    key={index}
                    onClick={() =>
                      item.action
                        ? item.action()
                        : navigate(item.navigateTo as string)
                    }
                    bg={
                      styleContext.state.buttonHoverColorWeight === "200"
                        ? "white"
                        : "gray.800"
                    }
                    _hover={{
                      bg:
                        styleContext.state.buttonHoverColorWeight === "200"
                          ? "gray.100"
                          : "gray.700",
                    }}
                    px={4}
                    py={2}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center space-x-2">
                        {item.label === "Sair" ? (
                          <div className="text-red-500">
                            <BsPerson size={18} />
                          </div>
                        ) : item.label === "Perfil" ? (
                          <div className="text-gray-500">
                            <BsPerson size={18} />
                          </div>
                        ) : null}
                        <span
                          style={{ color: styleContext.state.textColor }}
                          className={`text-base ${item.label === "Sair" ? "text-red-500" : ""}`}
                        >
                          {item.label}
                        </span>
                      </div>
                      <SL
                        className="ml-4"
                        bg={
                          styleContext.state.buttonHoverColorWeight === "200"
                            ? item.label === "Sair"
                              ? "red.100"
                              : "gray.100"
                            : item.label === "Sair"
                              ? "red.900"
                              : "gray.600"
                        }
                      >
                        {item.shortcut}
                      </SL>
                    </div>
                  </MenuItem>
                )
              )}
            </MenuList>
          </Menu>
          <span className="ml-2">
            <SL>4</SL>
          </span>
        </div>
      )}
    </div>
  );
}

export default AccessibilityMenu;
