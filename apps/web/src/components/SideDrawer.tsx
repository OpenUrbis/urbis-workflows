import React, {
  useState,
  useEffect,
  useRef,
  ReactNode,
  useCallback,
} from "react";
import { createPortal } from "react-dom";
import { FaTimes } from "react-icons/fa";

// Global drawer management
const drawerStateSetters: { [id: string]: (isOpen: boolean) => void } = {};
let currentOpenDrawers: string[] = [];
let lastClosedDrawerId: string | null = null;

export interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string | ReactNode;
  children: ReactNode;
  styleContext: any;
  width?: string;
  badge?: {
    text: string;
    colorScheme?: string;
    color?: {
      bg?: string;
      text?: string;
    };
  };
  storageKey?: string;
  parentDrawerId?: string;
  id?: string;
  disableOffset?: boolean;
}

export const SideDrawer: React.FC<SideDrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  styleContext,
  width = "33%",
  badge,
  storageKey = "config",
  parentDrawerId,
  id,
  disableOffset = false,
}) => {
  const generatedDrawerId = React.useId();
  const drawerId = id || generatedDrawerId;
  const drawerRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);

  // Extract numeric value and unit from width prop
  const getWidthValue = (width: string) => {
    const numericWidth = width.match(/^(\d+)(px|%|rem|em|vh|vw)?$/);
    if (numericWidth) {
      return {
        value: parseInt(numericWidth[1]),
        unit: numericWidth[2] || "px",
      };
    }
    return { value: 33, unit: "%" };
  };

  // Generate a stable storage key from title or custom storageKey
  const getStorageKey = () => {
    // If custom storageKey is provided, use it
    if (storageKey) return `sideDrawer_${storageKey}_width`;

    // If title is a string, use it to generate a unique key
    if (typeof title === "string") {
      const sanitizedTitle = title.toLowerCase().replace(/\s+/g, "_");
      return `sideDrawer_${sanitizedTitle}_width`;
    }

    // Use the drawer ID as a unique identifier if no better option
    return `sideDrawer_${drawerId}_width`;
  };

  const drawerStorageKey = getStorageKey();

  // Get the stored width from localStorage or use default
  const getInitialWidth = () => {
    const storedWidth = localStorage.getItem(drawerStorageKey);
    if (storedWidth) {
      return storedWidth;
    }
    return width;
  };

  const initialWidth = getInitialWidth();
  const { value: defaultWidthValue, unit: widthUnit } =
    getWidthValue(initialWidth);

  // State for the current drawer width
  const [drawerWidth, setDrawerWidth] = useState<number>(defaultWidthValue);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);

  // Calculate min and max width constraints
  const minWidth = getWidthValue(width).value;
  const maxWidth = minWidth * 2;

  // Handle drawer open/close logic and global drawer management
  useEffect(() => {
    // Only run this effect when isOpen changes
    if (isOpen) {
      // If this drawer has a parent, make sure it's in the currentOpenDrawers
      if (parentDrawerId && !currentOpenDrawers.includes(parentDrawerId)) {
        console.warn("Parent drawer not found in open drawers");
      }

      // Add this drawer to open drawers
      if (!currentOpenDrawers.includes(drawerId)) {
        // If no parent, remove any existing drawers except the parent
        if (!parentDrawerId) {
          // Close all drawers that aren't parents
          const currentDrawersToClose = [...currentOpenDrawers];
          currentDrawersToClose.forEach((id) => {
            if (drawerStateSetters[id] && id !== parentDrawerId) {
              drawerStateSetters[id](false);
            }
          });
          currentOpenDrawers = parentDrawerId ? [parentDrawerId] : [];
        }
        currentOpenDrawers.push(drawerId);
      }

      // Register the setter for this drawer
      drawerStateSetters[drawerId] = (state: boolean) => {
        if (!state) onClose();
      };

      // If this drawer was the last one closed, clear that reference
      if (lastClosedDrawerId === drawerId) {
        lastClosedDrawerId = null;
      }

      // Handle escape key to close
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onClose();
          e.stopPropagation();
        }
      };
      window.addEventListener("keydown", handleKeyDown);

      return () => {
        window.removeEventListener("keydown", handleKeyDown);
      };
    } else {
      // When drawer is being closed
      if (currentOpenDrawers.includes(drawerId)) {
        // Only clear globals if this drawer is in the current ones
        lastClosedDrawerId = drawerId;
        currentOpenDrawers = currentOpenDrawers.filter((id) => id !== drawerId);
        delete drawerStateSetters[drawerId];

        // If this drawer has child drawers, close them too
        Object.keys(drawerStateSetters).forEach((id) => {
          // If the drawer state setter still exists but the drawer isn't in currentOpenDrawers
          if (drawerStateSetters[id] && !currentOpenDrawers.includes(id)) {
            drawerStateSetters[id](false);
            delete drawerStateSetters[id];
          }
        });
      }
    }
  }, [isOpen, drawerId, onClose, parentDrawerId]);

  // Ensure cleanup on component unmount, separate from the isOpen state
  useEffect(() => {
    // Return cleanup function for component unmount
    return () => {
      if (currentOpenDrawers.includes(drawerId)) {
        currentOpenDrawers = currentOpenDrawers.filter((id) => id !== drawerId);
        delete drawerStateSetters[drawerId];
      }
    };
  }, [drawerId]);

  // Reset drawer width when opening
  useEffect(() => {
    if (isOpen) {
      // Get the stored width from localStorage or use default
      const storedWidth = localStorage.getItem(drawerStorageKey);
      if (storedWidth) {
        const { value, unit } = getWidthValue(storedWidth);
        // Only update if the units match to avoid conversion issues
        if (unit === widthUnit) {
          setDrawerWidth(value);
        } else {
          setDrawerWidth(defaultWidthValue);
        }
      } else {
        setDrawerWidth(defaultWidthValue);
      }
    }
  }, [isOpen, defaultWidthValue, widthUnit, drawerStorageKey]);

  // Handle mouse down to start dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setStartX(e.clientX);
    setStartWidth(drawerWidth);

    // Apply cursor to all elements to ensure consistent experience
    document.documentElement.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";
  };

  // Save width preference to localStorage
  const saveWidthPreference = useCallback(
    (value: number) => {
      localStorage.setItem(drawerStorageKey, `${value}${widthUnit}`);
    },
    [drawerStorageKey, widthUnit]
  );

  // Handle mouse move during dragging
  useEffect(() => {
    let lastAnimationFrame: number | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      // Cancel any pending animation frame to avoid queuing multiple updates
      if (lastAnimationFrame !== null) {
        cancelAnimationFrame(lastAnimationFrame);
      }

      // Schedule update on next animation frame for smoother performance
      lastAnimationFrame = requestAnimationFrame(() => {
        // The approach depends on whether we're using percentage or absolute units
        let newWidth: number;

        if (widthUnit === "%") {
          // For percentage-based widths, calculate based on window width
          // Calculate the distance from right edge of window to mouse position
          const distanceFromRight = window.innerWidth - e.clientX;

          // Convert to percentage of window width
          const widthPercentage = (distanceFromRight / window.innerWidth) * 100;

          // Apply min/max constraints
          newWidth = Math.max(minWidth, Math.min(maxWidth, widthPercentage));
        } else {
          // For absolute units (px, rem, etc.), use delta approach
          const deltaX = e.clientX - startX;
          newWidth = Math.max(
            minWidth,
            Math.min(maxWidth, startWidth - deltaX)
          );
        }

        setDrawerWidth(newWidth);
        lastAnimationFrame = null;
      });
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (lastAnimationFrame !== null) {
        cancelAnimationFrame(lastAnimationFrame);
      }

      setIsDragging(false);
      document.documentElement.style.cursor = "";
      document.body.style.userSelect = "";

      // Apply appropriate rounding based on unit type
      let roundedWidth: number;

      if (widthUnit === "%") {
        // For percentages, round to nearest 0.5%
        roundedWidth = Math.round(drawerWidth * 2) / 2;
      } else {
        // For pixel values, round to nearest 10px
        roundedWidth = Math.round(drawerWidth / 10) * 10;
      }

      setDrawerWidth(roundedWidth);

      // Save the width preference to localStorage
      saveWidthPreference(roundedWidth);
    };

    // Also handle cases where mouse leaves the window
    const handleMouseLeave = (e: MouseEvent) => {
      if (
        isDragging &&
        (e.clientY <= 0 ||
          e.clientY >= window.innerHeight ||
          e.clientX <= 0 ||
          e.clientX >= window.innerWidth)
      ) {
        handleMouseUp(e);
      }
    };

    if (isDragging) {
      // Use capture phase to ensure we get the events before other handlers
      document.addEventListener("mousemove", handleMouseMove, {
        capture: true,
        passive: true,
      });
      document.addEventListener("mouseup", handleMouseUp, { capture: true });
      document.addEventListener("mouseleave", handleMouseLeave, {
        capture: true,
      });

      // Prevent text selection during drag
      document.body.classList.add("select-none");
    }

    return () => {
      if (lastAnimationFrame !== null) {
        cancelAnimationFrame(lastAnimationFrame);
      }
      document.removeEventListener("mousemove", handleMouseMove, {
        capture: true,
      });
      document.removeEventListener("mouseup", handleMouseUp, { capture: true });
      document.removeEventListener("mouseleave", handleMouseLeave, {
        capture: true,
      });
      document.body.classList.remove("select-none");
    };
  }, [
    isDragging,
    startX,
    startWidth,
    minWidth,
    maxWidth,
    drawerWidth,
    widthUnit,
    saveWidthPreference,
  ]);

  if (!isOpen) return null;

  // Calculate the right offset based on if disabled
  const rightOffset = disableOffset ? "0" : "0rem";

  return createPortal(
    <React.Fragment>
      {/* Overlay for dragging */}
      {isDragging && (
        <div
          className="fixed inset-0 bg-black bg-opacity-10 z-[1300] cursor-ew-resize"
          onClick={() => setIsDragging(false)}
        />
      )}

      <div
        ref={drawerRef}
        className="fixed top-0 h-full z-[1400] focus:outline-none"
        style={{
          width: `${drawerWidth}${widthUnit}`,
          right: rightOffset,
        }}
        tabIndex={-1}
      >
        {/* Resize handle */}
        <div
          ref={dragHandleRef}
          className="absolute left-0 top-0 w-3 h-full cursor-ew-resize z-10 group flex items-center justify-center hover:bg-black hover:bg-opacity-5 select-none"
          onMouseDown={handleMouseDown}
          style={{
            touchAction: "none",
          }}
        >
          {/* Drag handle bar */}
          <div
            className={`w-[3px] rounded-full transition-all duration-200 ${
              isDragging
                ? "opacity-100 shadow-sm"
                : "opacity-40 group-hover:opacity-90"
            }`}
            style={{
              backgroundColor:
                styleContext.state.buttonHoverColorWeight === "200"
                  ? "#9CA3AF"
                  : "#6B7280",
              height: isDragging ? "100px" : "32px",
            }}
          />

          {/* Additional visual indicators for drag handle */}
          <div
            className={`absolute left-1/2 transform -translate-x-1/2 flex flex-col items-center space-y-1 ${
              isDragging ? "opacity-100" : "opacity-0 group-hover:opacity-70"
            } transition-opacity duration-150`}
          >
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-1 h-1 rounded-full bg-current"
                style={{
                  color:
                    styleContext.state.buttonHoverColorWeight === "200"
                      ? "#9CA3AF"
                      : "#6B7280",
                }}
              />
            ))}
          </div>
        </div>

        <div
          className={`h-full flex flex-col group ${isDragging ? "pointer-events-none" : ""}`}
          style={{
            backgroundColor: styleContext.state.backgroundColor,
            borderLeft: `1px solid ${
              styleContext.state.buttonHoverColorWeight === "200"
                ? "#E5E7EB"
                : "#374151"
            }`,
            boxShadow:
              styleContext.state.buttonHoverColorWeight === "200"
                ? "-4px 0 10px rgba(0, 0, 0, 0.05)"
                : "-4px 0 10px rgba(0, 0, 0, 0.2)",
            transition: isDragging ? "none" : "width 0.1s ease",
            animation: "none",
          }}
        >
          <div
            className="flex flex-col px-4 py-4 border-b"
            style={{
              borderColor:
                styleContext.state.buttonHoverColorWeight === "200"
                  ? "#E5E7EB"
                  : "#374151",
              color: styleContext.state.textColor,
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="text-lg font-bold">
                  {typeof title === "string" ? title : title}
                </div>
                {badge && (
                  <div
                    className={`px-2 py-0.5 rounded-full ${
                      badge.color
                        ? `${badge.color.bg} ${badge.color.text}`
                        : `bg-${badge.colorScheme}-100 text-${badge.colorScheme}-800`
                    }`}
                  >
                    <span className="text-[10px] font-medium">{badge.text}</span>
                  </div>
                )}
              </div>

              <button
                onClick={onClose}
                className="hover:bg-opacity-10 rounded p-1.5 transition-colors duration-150 ml-auto"
                style={{
                  color:
                    styleContext.state.buttonHoverColorWeight === "200"
                      ? "#6B7280"
                      : "#9CA3AF",
                  backgroundColor:
                    styleContext.state.buttonHoverColorWeight === "200"
                      ? "rgba(107, 114, 128, 0.1)"
                      : "rgba(156, 163, 175, 0.1)",
                }}
                aria-label="Close"
              >
                <FaTimes size={12} />
              </button>
            </div>
          </div>
          <div className="pb-6 overflow-y-auto h-[calc(100%-73px)] text-foreground">
            {children}
          </div>
        </div>

        {/* Resize indicator tooltip */}
        {isDragging && (
          <div
            className="fixed px-3 py-1.5 text-xs font-medium bg-gray-800 text-white rounded-md shadow-md pointer-events-none z-[1500] opacity-80"
            style={{
              bottom: "16px",
              right: `${drawerWidth / 2}${widthUnit}`,
              transform: "translateX(50%)",
            }}
          >
            <div className="flex items-center space-x-2">
              <span>
                {widthUnit === "%"
                  ? drawerWidth.toFixed(1) // 1 decimal place for percentages
                  : Math.round(drawerWidth)}
                {widthUnit}
              </span>
              <span className="text-gray-400">|</span>
              <span className="text-gray-400 text-[10px]">
                Min: {widthUnit === "%" ? minWidth.toFixed(1) : minWidth}
                {widthUnit}
              </span>
              <span className="text-gray-400 text-[10px]">
                Max: {widthUnit === "%" ? maxWidth.toFixed(1) : maxWidth}
                {widthUnit}
              </span>
            </div>
          </div>
        )}
      </div>
    </React.Fragment>,
    document.body
  );
};

export default SideDrawer;
