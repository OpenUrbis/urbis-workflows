import React, { useContext, useEffect, useState } from "react";
import { SL } from "../../components/ShortcutLabel";
import { HotkeyContext } from "../../reducers/hotkeys.reducer";
import { StyleContext } from "../../reducers";
import { MyRepresentations } from "./MyRepresentation";
import { MyRepresentatives } from "./MyRepresentatives";
import { FaUserFriends, FaUserPlus } from "react-icons/fa";

export function Profile(): JSX.Element {
  const styleContext = useContext(StyleContext);
  const hotkeyContext = useContext(HotkeyContext);
  const [subpage, setSubpage] = useState<string>("myrepresentations");

  const menus = [
    {
      name: "Minhas representações",
      link: "myrepresentations",
      key: "1",
      icon: <FaUserFriends />,
    },
    {
      name: "Meus representantes",
      link: "myrepresentatives",
      key: "2",
      icon: <FaUserPlus />,
    },
  ];

  useEffect(() => {
    hotkeyContext.dispatch({
      type: "SET_HOTKEY",
      payload: {
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
        delete: ["A", "Z"],
      });
    };
    
  }, []);

  return (
    <div className="flex flex-col space-y-2 mb-20 px-20">
      <h1 className="text-2xl md:text-3xl font-medium mb-6 text-left">
        Representações
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
          {subpage === "myrepresentations" && <MyRepresentations />}
          {subpage === "myrepresentatives" && <MyRepresentatives />}
        </div>
      </div>
    </div>
  );
}
