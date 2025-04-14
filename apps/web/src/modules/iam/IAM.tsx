import React, { useContext, useEffect, useState } from "react";
import { SL } from "../../components/ShortcutLabel";
import { HotkeyContext } from "../../reducers/hotkeys.reducer";
import { StyleContext } from "../../reducers";
import { FaKey, FaUserTag, FaUsers, FaUserShield } from "react-icons/fa";
import { Permissions, Roles, Groups, UserAccess } from ".";

export function IAM(): JSX.Element {
  const styleContext = useContext(StyleContext);
  const hotkeyContext = useContext(HotkeyContext);
  const [subpage, setSubpage] = useState<string>("permissions");

  const menus = [
    {
      name: "Permissões",
      link: "permissions",
      key: "Q",
      icon: <FaKey />,
    },
    {
      name: "Funções",
      link: "roles",
      key: "S",
      icon: <FaUserTag />,
    },
    {
      name: "Grupos",
      link: "groups",
      key: "Z",
      icon: <FaUsers />,
    },
    {
      name: "Acesso de Usuários",
      link: "useraccess",
      key: "W",
      icon: <FaUserShield />,
    },
  ];

  useEffect(() => {
    hotkeyContext.dispatch({
      type: "SET_HOTKEY",
      payload: {
        Q: () => {
          setSubpage("permissions");
        },
        A: () => {
          setSubpage("roles");
        },
        Z: () => {
          setSubpage("groups");
        },
        W: () => {
          setSubpage("useraccess");
        },
      },
    });

    return () => {
      hotkeyContext.dispatch({
        type: "UNSET_HOTKEY",
        delete: ["Q", "A", "Z", "W"],
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col space-y-2 mb-20 px-20">
      <h1 className="text-2xl md:text-3xl font-medium mb-6 text-left">
        Gerenciamento de Acesso (IAM)
      </h1>

      <div
        className="flex flex-grow border rounded-lg overflow-hidden"
        style={{
          borderColor:
            styleContext.state.buttonHoverColorWeight === "200"
              ? "#E5E7EB"
              : "#374151",
        }}
      >
        <div
          className="flex flex-col py-4 w-3/12 border-r"
          style={{
            borderColor:
              styleContext.state.buttonHoverColorWeight === "200"
                ? "#E5E7EB"
                : "#374151",
            backgroundColor: styleContext.state.backgroundColor,
          }}
        >
          {menus.map((menu) => (
            <div
              className={`px-6 py-3 transition-colors duration-150 ${
                subpage === menu.link
                  ? styleContext.state.buttonHoverColorWeight === "200"
                    ? "bg-gray-200"
                    : "bg-gray-700"
                  : styleContext.state.buttonHoverColorWeight === "200"
                    ? "hover:bg-gray-100"
                    : "hover:bg-gray-800"
              }`}
              key={menu.key}
            >
              <button
                onClick={() => setSubpage(menu.link)}
                className="flex justify-between w-full items-center"
                style={{ color: styleContext.state.textColor }}
              >
                <div className="flex items-center space-x-3">
                  {menu.icon}
                  <span>{menu.name}</span>
                </div>
                <SL>{menu.key}</SL>
              </button>
            </div>
          ))}
        </div>
        <div
          className="flex flex-col p-6 w-9/12 overflow-y-auto"
          style={{
            backgroundColor: styleContext.state.backgroundColor,
          }}
        >
          {subpage === "permissions" && <Permissions />}
          {subpage === "roles" && <Roles />}
          {subpage === "groups" && <Groups />}
          {subpage === "useraccess" && <UserAccess />}
        </div>
      </div>
    </div>
  );
}
