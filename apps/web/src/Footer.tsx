import React, { useContext, useEffect } from "react";
import { StyleContext } from "./reducers/style.reducer";
import { HotkeyContext } from "./reducers/hotkeys.reducer";
import { useNavigate } from "react-router-dom";
import { SL } from "./components";

function Footer(): JSX.Element {
  const { state } = useContext(StyleContext);
  const hotkeyContext = useContext(HotkeyContext);
  const navigate = useNavigate();

  useEffect(() => {
    hotkeyContext.dispatch({
      type: "SET_HOTKEY",
      payload: {
        D: () => navigate("/document-validate"),
      },
    });
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  return (
    <footer
      className="fixed bottom-0 mx-auto w-full text-center py-4 px-6"
      style={{ backgroundColor: state.backgroundColor, zIndex: 1000 }}
    >
      {window.innerWidth > 768 && (
        <div className="flex space-x-4 flex-wrap">
          <div
            className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm transition-colors duration-200 cursor-pointer ${
              state.buttonHoverColorWeight === "200"
                ? "text-gray-600 bg-gray-100"
                : "text-gray-400 bg-gray-800"
            }`}
            onClick={() => navigate("/document-validate")}
          >
            <span>Consultar documento</span>
            <SL
              bg={
                state.buttonHoverColorWeight === "200"
                  ? "gray.200"
                  : "gray.700"
              }
            >
              D
            </SL>
          </div>
          <div
            className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm transition-colors duration-200 cursor-pointer ${
              state.buttonHoverColorWeight === "200"
                ? "text-gray-600 bg-gray-100"
                : "text-gray-400 bg-gray-800"
            }`}
            onClick={() =>
              (window.location.href = process.env.REACT_APP_MAP as string)
            }
          >
            <span>Consultar mapa</span>
          </div>
          <div className="flex-grow"></div>
          <div className={`text-sm ${
            state.buttonHoverColorWeight === "200"
              ? "text-gray-500"
              : "text-gray-400"
          }`}>
            Versão: {`${process.env.REACT_APP_VERSION}`}
          </div>
        </div>
      )}
    </footer>
  );
}

export default Footer;
