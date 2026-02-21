import React, { useContext, useEffect, useState } from "react";
import { SL } from "../../components/ShortcutLabel";
import { HotkeyContext } from "../../reducers/hotkeys.reducer";
import { Button, Card } from "@open-urbis/map-ui";
import { FaKey, FaUserTag, FaUsers, FaUserShield } from "react-icons/fa";
import { Permissions, Roles, Groups, UserAccess } from ".";

export function IAM(): JSX.Element {
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
    
  }, []);

  return (
    <div className="flex flex-col space-y-2 mb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold mt-4 mb-6 tracking-tight text-foreground">
        Gerenciamento de Acesso (IAM)
      </h1>

      <Card
        className="flex flex-grow border rounded-lg overflow-hidden border-border bg-card text-card-foreground"
      >
        <div className="flex flex-col py-4 w-3/12 border-r border-border bg-card">
          {menus.map((menu) => (
            <div
              className="px-3 py-1"
              key={menu.key}
            >
              <Button
                type="button"
                variant="ghost"
                onClick={() => setSubpage(menu.link)}
                className={`flex justify-between w-full items-center h-auto px-4 py-2.5 font-normal text-foreground rounded-full transition-colors duration-150 ${
                  subpage === menu.link
                    ? "bg-emerald-300/60 dark:bg-emerald-500/30"
                    : "hover:bg-emerald-300/45 dark:hover:bg-emerald-500/25"
                }`}
              >
                <div className="flex items-center space-x-3">
                  {menu.icon}
                  <span className="text-sm font-medium">{menu.name}</span>
                </div>
                <SL>{menu.key}</SL>
              </Button>
            </div>
          ))}
        </div>
        <div className="flex flex-col p-6 w-9/12 overflow-y-auto bg-background text-foreground">
          {subpage === "permissions" && <Permissions />}
          {subpage === "roles" && <Roles />}
          {subpage === "groups" && <Groups />}
          {subpage === "useraccess" && <UserAccess />}
        </div>
      </Card>
    </div>
  );
}
