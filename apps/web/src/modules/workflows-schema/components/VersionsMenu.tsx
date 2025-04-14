import React, { useContext, useEffect, useState } from "react";
import {
  Button,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Tag,
  Tooltip,
  Spinner,
} from "@chakra-ui/react";
import { StyleContext } from "../../../reducers";

interface VersionsMenuProps {
  versions: {
    id: string;
    version: number;
    commitMessage: string;
    timestamp: string;
    createdBy: string;
    stage?: string;
  }[];
  defaultVersion: {
    version: number;
    stage?: string;
  };
  callback: (version: number, stage?: string) => void;
  loading?: boolean;
}

export const VersionsMenu: React.FC<VersionsMenuProps> = ({
  versions,
  defaultVersion,
  callback,
  loading = false,
}) => {
  const [currentVersion, setCurrentVersion] = useState(defaultVersion);

  const handleSelect = (version: any) => {
    setCurrentVersion({ version: version.version, stage: version.stage });
    callback(version.version, version.stage);
  };

  useEffect(() => {
    setCurrentVersion(defaultVersion);
  }, [versions, defaultVersion]);

  const styleContext = useContext(StyleContext);
  const stageMapper: { [key: string]: { label: string; color: string } } = {
    development: { label: "desenvolvimento", color: "gray" },
    staging: { label: "homologação", color: "yellow" },
    production: { label: "produção", color: "green" },
  };
  return (
    <div>
      {loading ? (
        <Spinner size="sm" style={{ color: styleContext.state.textColor }} />
      ) : (
        <Menu>
          <MenuButton as={Button} style={{ backgroundColor: styleContext.state.backgroundColor, color: styleContext.state.textColor }}>
            <Tag colorScheme="blue" size="md" borderRadius="full">
              v{currentVersion.version}
            </Tag>
            {currentVersion.stage && (
              <Tag
                className="ml-2"
                colorScheme={stageMapper[currentVersion.stage].color}
              >
                {stageMapper[currentVersion.stage].label}
              </Tag>
            )}
          </MenuButton>
          <MenuList
            maxH="200px"
            overflowY="auto"
            zIndex={10000}
            bg={styleContext.state.backgroundColor}
          >
            {versions
              .sort(
                (a, b) =>
                  new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
              )
              .map((version: any) => (
                <Tooltip
                  key={version.version}
                  label={
                    (version.commitMessage ?? "") +
                    ` (Data: ${new Date(version.timestamp).toLocaleString(
                      "pt-br"
                    )} - Autor: ${version.createdBy})`
                  }
                  placement="right"
                  bg={styleContext.state.backgroundColor}
                  color={styleContext.state.textColor}
                >
                  <MenuItem
                    onClick={() => handleSelect(version)}
                    bg={
                      version.version === currentVersion.version
                        ? styleContext.state.buttonHoverColorWeight === "200" ? "#dbeafe" : "#1e40af"
                        : styleContext.state.backgroundColor
                    }
                    _hover={{
                      bg: version.version === currentVersion.version
                        ? styleContext.state.buttonHoverColorWeight === "200" ? "#bfdbfe" : "#1e3a8a"
                        : styleContext.state.buttonHoverColorWeight === "200" ? "#f3f4f6" : "#1f2937"
                    }}
                    className="font-normal"
                    style={{ color: styleContext.state.textColor }}
                  >
                    <Tag
                      colorScheme={
                        version.version === currentVersion.version
                          ? "blue"
                          : "gray"
                      }
                      size="sm"
                      borderRadius="full"
                      className="mr-2"
                    >
                      v{version.version}
                    </Tag>
                    {version.commitMessage?.slice(0, 25)}
                    {version.commitMessage?.length > 25 ? "..." : ""}
                    {(version.stage === "staging" ||
                      version.stage === "production") && (
                      <Tag
                        className="ml-2"
                        colorScheme={stageMapper[version?.stage]?.color}
                      >
                        {stageMapper[version?.stage]?.label}
                      </Tag>
                    )}
                  </MenuItem>
                </Tooltip>
              ))}
          </MenuList>
        </Menu>
      )}
    </div>
  );
};
