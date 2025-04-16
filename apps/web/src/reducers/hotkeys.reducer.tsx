import React, { createContext, useReducer } from "react";

// Singleton to handle prefix locking
class HotkeyPrefixLocker {
  private static instance: HotkeyPrefixLocker;
  private activePrefix: string | null = null;

  private constructor() {}

  static getInstance(): HotkeyPrefixLocker {
    if (!HotkeyPrefixLocker.instance) {
      HotkeyPrefixLocker.instance = new HotkeyPrefixLocker();
    }
    return HotkeyPrefixLocker.instance;
  }

  setPrefix(prefix: string | null): void {
    this.activePrefix = prefix;
  }

  getPrefix(): string | null {
    return this.activePrefix;
  }

  isLocked(): boolean {
    return this.activePrefix !== null;
  }
}

type Keys =
  | "0"
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "A"
  | "B"
  | "C"
  | "D"
  | "E"
  | "F"
  | "G"
  | "H"
  | "I"
  | "J"
  | "K"
  | "L"
  | "M"
  | "N"
  | "O"
  | "P"
  | "Q"
  | "R"
  | "S"
  | "T"
  | "U"
  | "V"
  | "W"
  | "X"
  | "Y"
  | "Z"
  | "="
  | "-"
  | "down"
  | "up"
  | "left"
  | "right";

interface HotkeyState {
  hotkeyKeyMap: { [k in Keys]?: string | string[] };
  hotkeyHandlers: { [k in Keys]?: () => void };
}

interface HotkeyAction {
  type: string;
  payload?: { [k in Keys]?: (e?: React.FormEvent) => void };
  delete?: Keys[];
}

interface HotkeyContextProps {
  state: HotkeyState;
  dispatch: React.Dispatch<HotkeyAction>;
}

const initialState: HotkeyState = {
  hotkeyKeyMap: {},
  hotkeyHandlers: {},
};

const HotkeyContext = createContext<HotkeyContextProps>({
  state: initialState,
  dispatch: () => null,
});

const hotkeyReducer = (
  state: HotkeyState,
  action: HotkeyAction
): HotkeyState => {
  switch (action.type) {
    case "SET_HOTKEY": {
      const hotkeyKeyMap: { [k in Keys]?: string | string[] } = {};

      Object.keys(action.payload ?? {}).forEach((key) => {
        hotkeyKeyMap[key as Keys] = key.toLocaleLowerCase();
      });

      return {
        hotkeyKeyMap: {
          ...state.hotkeyKeyMap,
          ...hotkeyKeyMap,
        },
        hotkeyHandlers: {
          ...state.hotkeyHandlers,
          ...action.payload,
        },
      };
    }
    case "UNSET_HOTKEY": {
      const newState = { ...state };
      action.delete?.forEach((key) => {
        delete newState.hotkeyKeyMap[key];
        delete newState.hotkeyHandlers[key];
      });
      return newState;
    }
    default: {
      return state;
    }
  }
};

const HotkeyProvider = ({ children }: any) => {
  const [state, dispatch] = useReducer(hotkeyReducer, initialState);

  return (
    <HotkeyContext.Provider value={{ state, dispatch }}>
      {children}
    </HotkeyContext.Provider>
  );
};

const withNoModifiers = (handler: (event?: React.FormEvent) => void) => {
  return (event: any) => {
    // Check if there's an active prefix lock
    if (HotkeyPrefixLocker.getInstance().isLocked()) {
      return;
    }

    if (event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) {
      return;
    }

    handler(event);
  };
};

const withNumberInput = (
  handler: (event?: React.FormEvent<Element>, index?: number) => void
) => {
  return (event?: React.FormEvent<Element>) => {
    if (!event) return;

    if (
      (event as any).shiftKey ||
      (event as any).ctrlKey ||
      (event as any).altKey ||
      (event as any).metaKey
    ) {
      return;
    }

    const prefixLocker = HotkeyPrefixLocker.getInstance();
    if (!prefixLocker.isLocked()) {
      const initialEvent = event;
      prefixLocker.setPrefix("number");

      const handleNumberInput = (e: KeyboardEvent) => {
        try {
          document.removeEventListener("keydown", handleNumberInput);
        } catch (error) {
          // Ignore errors from removing event listener
        }

        // If it's not a number key, just clear the lock and return
        const digit = e.key.match(/^[0-9]$/);
        if (!digit) {
          prefixLocker.setPrefix(null);
          return;
        }

        // Call the handler with both the original event and the number
        handler(initialEvent, parseInt(digit[0]));
        // Clear the lock after handling the number
        prefixLocker.setPrefix(null);
      };

      document.addEventListener("keydown", handleNumberInput, { once: true });
    }
  };
};

export { HotkeyContext, HotkeyProvider, withNoModifiers, withNumberInput };
