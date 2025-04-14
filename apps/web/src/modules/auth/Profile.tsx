import React, { useContext, useEffect, useState } from "react";
import { SL } from "../../components/ShortcutLabel";
import { HotkeyContext } from "../../reducers/hotkeys.reducer";
import { MyData } from "./MyData";
import { StyleContext } from "../../reducers";
import { MyRepresentations } from "./MyRepresentation";
import { MyRepresentatives } from "./MyRepresentatives";
import { FaUser, FaUserFriends, FaUserPlus } from "react-icons/fa";

export function Profile(): JSX.Element {
  const styleContext = useContext(StyleContext);
  const hotkeyContext = useContext(HotkeyContext);
  const [subpage, setSubpage] = useState<string>("mydata");

  const menus = [
    { name: "Meus dados", link: "mydata", key: "1", icon: <FaUser /> },
    {
      name: "Minhas representações",
      link: "myrepresentations",
      key: "2",
      icon: <FaUserFriends />,
    },
    {
      name: "Meus representantes",
      link: "myrepresentatives",
      key: "3",
      icon: <FaUserPlus />,
    },
  ];

  useEffect(() => {
    hotkeyContext.dispatch({
      type: "SET_HOTKEY",
      payload: {
        Q: () => {
          setSubpage("mydata");
        },
        A: () => {
          setSubpage("myrepresentations");
        },
        Z: () => {
          setSubpage("myrepresentatives");
        },
      },
    });

    return () => {
      hotkeyContext.dispatch({
        type: "UNSET_HOTKEY",
        delete: ["Q", "A", "Z"],
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col space-y-2 mb-20 px-20">
      <h1 className="text-2xl md:text-3xl font-medium mb-6 text-left">
        Meu Perfil
      </h1>

      <div className="flex flex-grow border rounded-lg overflow-hidden">
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
        <div className="flex flex-col p-6 w-9/12 overflow-y-auto">
          {subpage === "mydata" && <MyData />}
          {subpage === "myrepresentations" && <MyRepresentations />}
          {subpage === "myrepresentatives" && <MyRepresentatives />}
        </div>
      </div>
    </div>
  );
}
