import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@open-urbis/map-ui";
import { FaFolder, FaFolderOpen } from "react-icons/fa";
import { Search } from "lucide-react";
import { IconType } from "react-icons";
import { useContext, useState, useEffect } from "react";
import { StyleContext } from "../../../reducers";
import { Input } from "@open-urbis/map-ui";

export interface TreeItem {
  id: string;
  label: string;
  namespace: string;
  [key: string]: any;
}

export interface DirectoryNode<T extends TreeItem> {
  name: string;
  type: "directory" | "file";
  children: { [key: string]: DirectoryNode<T> };
  items: T[];
}

export interface TreeListProps<T extends TreeItem> {
  items: T[];
  search: string;
  onClick: (item: T) => void;
  icon: IconType;
  iconColor?: string;
  onSearchChange?: (value: string) => void;
  getIcon?: (item: T) => { icon: IconType; color: string };
  selectedId?: string;
}

const createDirectoryTree = <T extends TreeItem>(
  items: T[]
): DirectoryNode<T> => {
  const root: DirectoryNode<T> = {
    name: "root",
    type: "directory",
    children: {},
    items: [],
  };

  items.forEach((item) => {
    const parts = item.namespace.split("/");
    let current = root;

    parts.forEach((part, index) => {
      if (index === parts.length - 1) {
        // Last part is the file
        if (!current.children[part]) {
          current.children[part] = {
            name: part,
            type: "file",
            children: {},
            items: [],
          };
        }
        current.children[part].items.push(item);
      } else {
        // Directory
        if (!current.children[part]) {
          current.children[part] = {
            name: part,
            type: "directory",
            children: {},
            items: [],
          };
        }
        current = current.children[part];
      }
    });
  });

  return root;
};

const hasVisibleChildren = <T extends TreeItem>(
  node: DirectoryNode<T>,
  search: string
): boolean => {
  // Check files in current directory
  const hasVisibleFiles = node.items.some(
    (item) =>
      item.label.toLowerCase().includes(search.toLowerCase()) ||
      item.namespace.toLowerCase().includes(search.toLowerCase())
  );

  // Recursively check subdirectories
  const hasVisibleSubdirectories = Object.values(node.children).some(
    (child) => {
      if (child.type === "file") {
        return child.items.some(
          (item) =>
            item.label.toLowerCase().includes(search.toLowerCase()) ||
            item.namespace.toLowerCase().includes(search.toLowerCase())
        );
      }
      return hasVisibleChildren(child, search);
    }
  );

  return hasVisibleFiles || hasVisibleSubdirectories;
};

export const TreeList = <T extends TreeItem>({
  items,
  search,
  onClick,
  icon: defaultIcon,
  iconColor: defaultIconColor = "blue",
  onSearchChange,
  getIcon,
  selectedId,
}: TreeListProps<T>): JSX.Element => {
  const styleContext = useContext(StyleContext);
  const tree = createDirectoryTree(items);

  return (
    <div className="flex flex-col">
      <div
        className="p-4 border-b "
        style={{
          borderColor:
            styleContext.state.buttonHoverColorWeight === "200"
              ? "#E5E7EB"
              : "#374151",
          backgroundColor: styleContext.state.backgroundColor,
        }}
      >
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
            <Search className="text-muted-foreground" size={16} />
          </div>
          <Input
            placeholder="Buscar..."
            value={search}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="h-10 pl-10"
          />
        </div>
      </div>
      <div className="flex-grow overflow-y-auto p-2">
        <DirectoryView
          node={tree}
          search={search}
          onClick={onClick}
          icon={defaultIcon}
          iconColor={defaultIconColor}
          getIcon={getIcon}
          selectedId={selectedId}
        />
      </div>
    </div>
  );
};

const DirectoryView = <T extends TreeItem>({
  node,
  search,
  onClick,
  icon: DefaultIcon,
  iconColor: defaultIconColor = "blue",
  level = 0,
  getIcon,
  selectedId,
}: {
  node: DirectoryNode<T>;
  search: string;
  onClick: (item: T) => void;
  icon: IconType;
  iconColor?: string;
  level?: number;
  getIcon?: (item: T) => { icon: IconType; color: string };
  selectedId?: string;
}) => {
  const styleContext = useContext(StyleContext);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const filteredChildren = Object.entries(node.children)
    .filter(([name, child]) => {
      if (search.trim() === "") return true;

      if (child.type === "file") {
        return child.items.some(
          (item) =>
            item.label.toLowerCase().includes(search.toLowerCase()) ||
            item.namespace.toLowerCase().includes(search.toLowerCase())
        );
      }
      return hasVisibleChildren(child, search);
    })
    .sort(([, a], [, b]) => {
      if (a.type === b.type) return 0;
      return a.type === "directory" ? -1 : 1;
    });

  useEffect(() => {
    // Auto-expand directories when searching
    if (search.trim() !== "") {
      const newExpandedItems = new Set<string>();
      Object.entries(node.children).forEach(([name, child]) => {
        if (child.type === "directory" && hasVisibleChildren(child, search)) {
          newExpandedItems.add(name);
        }
      });
      setExpandedItems(newExpandedItems);
    }
  }, [search, node.children]);

  if (filteredChildren.length === 0) {
    if (search.trim() !== "") {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <Search size={32} className="mb-4 opacity-50" />
          <p className="text-lg font-medium mb-1">
            Nenhuma entidade encontrada
          </p>
          <p className="text-sm">Tente buscar com outros termos</p>
        </div>
      );
    }
    return null;
  }

  const isRootWithOnlyFiles =
    level === 0 && filteredChildren.every(([, child]) => child.type === "file");
  const basePadding = isRootWithOnlyFiles ? 0 : level * 16;

  const handleFolderClick = (name: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(name)) {
        newSet.delete(name);
      } else {
        newSet.add(name);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-1">
      {filteredChildren.map(([name, child]) => (
        <div key={name} className="rounded-lg overflow-hidden">
          {child.type === "directory" ? (
            <>
              <button
                onClick={() => handleFolderClick(name)}
                className={`w-full rounded-lg px-4 py-2 transition-all duration-200 ${
                  styleContext.state.buttonHoverColorWeight === "200"
                    ? "hover:bg-gray-200"
                    : "hover:bg-gray-700"
                }`}
              >
                <span
                  style={{ paddingLeft: `${basePadding}px` }}
                  className="flex items-center justify-between"
                >
                  <span className="flex items-center">
                    {expandedItems.has(name) ? (
                      <FaFolderOpen className="mr-3 text-yellow-500" size={23} />
                    ) : (
                      <FaFolder className="mr-3 text-yellow-500" size={21} />
                    )}
                    <span
                      style={{ color: styleContext.state.textColor }}
                      className="font-medium"
                    >
                      {name}
                    </span>
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {expandedItems.has(name) ? "−" : "+"}
                  </span>
                </span>
              </button>
              {expandedItems.has(name) && (
                <div className="pt-1 pb-2">
                  <DirectoryView
                    node={child}
                    search={search}
                    onClick={onClick}
                    icon={DefaultIcon}
                    iconColor={defaultIconColor}
                    level={level + 1}
                    getIcon={getIcon}
                    selectedId={selectedId}
                  />
                </div>
              )}
            </>
          ) : (
            child.items
              .filter(
                (item) =>
                  search.trim() === "" ||
                  item.label.toLowerCase().includes(search.toLowerCase()) ||
                  item.namespace.toLowerCase().includes(search.toLowerCase())
              )
              .sort((a, b) => a.label.localeCompare(b.label))
              .map((item) => {
                const itemIcon = getIcon
                  ? getIcon(item)
                  : { icon: DefaultIcon, color: defaultIconColor };
                const Icon = itemIcon.icon;
                const isSelected = selectedId === item.id;
                return (
                  <div
                    key={item.id}
                    className="transition-colors duration-150 rounded-lg"
                    style={{
                      paddingLeft: `${isRootWithOnlyFiles ? 16 : (level + 1) * 16}px`,
                      backgroundColor: isSelected
                        ? styleContext.state.buttonHoverColorWeight === "200"
                          ? "#E5E7EB"
                          : "#374151"
                        : hoveredItem === item.id
                          ? styleContext.state.buttonHoverColorWeight === "200"
                            ? "#F3F4F6"
                            : "#4B5563"
                          : "transparent",
                    }}
                    onMouseEnter={() => setHoveredItem(item.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <button
                      onClick={() => onClick(item)}
                      className="flex items-center w-full py-2 px-4 rounded-lg hover:bg-opacity-75"
                    >
                      <div className="flex items-center w-full">
                        <Icon
                          className={`mr-3 text-${itemIcon.color}-500 flex-shrink-0`}
                          size={18}
                        />
                        <div className="flex flex-col flex-grow min-w-0 text-left">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span
                                style={{ color: styleContext.state.textColor }}
                                className="font-medium truncate hover:text-yellow-600 transition-colors duration-200"
                              >
                                {item.label}
                              </span>
                            </TooltipTrigger>
                            {item.label.length > 30 && (
                              <TooltipContent side="top">{item.label}</TooltipContent>
                            )}
                          </Tooltip>
                          {(search.trim() !== "" || item.namespace) && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-sm text-gray-500 dark:text-gray-400 truncate hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200">
                                  {item.namespace}
                                </span>
                              </TooltipTrigger>
                              {item.namespace.length > 40 && (
                                <TooltipContent side="bottom">
                                  {item.namespace}
                                </TooltipContent>
                              )}
                            </Tooltip>
                          )}
                        </div>
                      </div>
                    </button>
                  </div>
                );
              })
          )}
        </div>
      ))}
    </div>
  );
};
