import React, { createContext, useEffect, useReducer } from "react";

interface StyleState {
  fontSize: number;
  buttonHoverColorWeight: "200" | "800";
  textColor: "#000000" | "#ffffff";
  backgroundColor: "#f5f5f5" | "#000000";
}

interface StyleContextProps {
  state: StyleState;
  dispatch: React.Dispatch<any>;
}

function getInitialState(): StyleState {
  const rootIsDark = document.documentElement.classList.contains("dark");
  const storedWeight = localStorage.getItem("buttonHoverColorWeight");
  const isDarkMode =
    storedWeight === "800"
      ? true
      : storedWeight === "200"
        ? false
        : rootIsDark;

  return {
    fontSize: localStorage.getItem("fontSize")
      ? Number(localStorage.getItem("fontSize"))
      : 100,
    buttonHoverColorWeight: isDarkMode ? "800" : "200",
    textColor: isDarkMode ? "#ffffff" : "#000000",
    backgroundColor: isDarkMode ? "#000000" : "#f5f5f5",
  };
}

const initialState: StyleState = getInitialState();

const StyleContext = createContext<StyleContextProps>({
  state: initialState,
  dispatch: () => null,
});

const styleReducer = (
  state: StyleState,
  action: { type: string; payload: any }
) => {
  switch (action.type) {
    case "SET_STYLE":
      return { ...state, ...action.payload };
    default:
      return state;
  }
};

const StyleProvider = ({ children }: any) => {
  const [state, dispatch] = useReducer(styleReducer, initialState);

  useEffect(() => {
    const isDarkMode = state.buttonHoverColorWeight === "800";
    const root = document.documentElement;

    root.classList.toggle("dark", isDarkMode);
    root.style.colorScheme = isDarkMode ? "dark" : "light";

    localStorage.setItem("buttonHoverColorWeight", state.buttonHoverColorWeight);
    localStorage.setItem("textColor", state.textColor);
    localStorage.setItem("backgroundColor", state.backgroundColor);
    localStorage.setItem("fontSize", state.fontSize.toString());
  }, [
    state.backgroundColor,
    state.buttonHoverColorWeight,
    state.fontSize,
    state.textColor,
  ]);

  return (
    <StyleContext.Provider value={{ state, dispatch }}>
      {children}
    </StyleContext.Provider>
  );
};

export { StyleContext, StyleProvider };
