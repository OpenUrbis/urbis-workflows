import React, { useContext, useEffect, useState } from "react";
import {
  Button,
  Badge,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@open-urbis/map-ui";
import { StyleContext } from "../../../reducers";
import { Spinner } from "../../../components";

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

  const stageBadgeClassMapper: { [key: string]: string } = {
    development: "bg-muted text-muted-foreground",
    staging: "bg-yellow-100 text-yellow-800",
    production: "bg-green-100 text-green-800",
  };

  return (
    <div>
      {loading ? (
        <Spinner />
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-2"
              style={{ backgroundColor: styleContext.state.backgroundColor }}
            >
              <Badge variant="secondary" className="rounded-full">
              v{currentVersion.version}
              </Badge>
              {currentVersion.stage && (
                <Badge
                  variant="outline"
                  className={`rounded-full border-0 ${stageBadgeClassMapper[currentVersion.stage]}`}
                >
                  {stageMapper[currentVersion.stage].label}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80 max-h-[260px] overflow-y-auto" align="end">
            {versions
              .sort(
                (a, b) =>
                  new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
              )
              .map((version: any) => (
                <TooltipProvider key={version.version}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuItem
                        onClick={() => handleSelect(version)}
                        className={`font-normal gap-2 ${
                          version.version === currentVersion.version
                            ? "bg-blue-100 text-blue-900 focus:bg-blue-100"
                            : ""
                        }`}
                      >
                        <Badge
                          variant={
                            version.version === currentVersion.version
                              ? "default"
                              : "secondary"
                          }
                          className="rounded-full"
                        >
                          v{version.version}
                        </Badge>
                        <span className="truncate max-w-[140px]">
                          {version.commitMessage?.slice(0, 25)}
                          {version.commitMessage?.length > 25 ? "..." : ""}
                        </span>
                        {(version.stage === "staging" ||
                          version.stage === "production") && (
                          <Badge
                            variant="outline"
                            className={`ml-auto rounded-full border-0 ${stageBadgeClassMapper[version?.stage]}`}
                          >
                            {stageMapper[version?.stage]?.label}
                          </Badge>
                        )}
                      </DropdownMenuItem>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-[320px]">
                      {(version.commitMessage ?? "") +
                        ` (Data: ${new Date(version.timestamp).toLocaleString(
                          "pt-br"
                        )} - Autor: ${version.createdBy})`}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};
