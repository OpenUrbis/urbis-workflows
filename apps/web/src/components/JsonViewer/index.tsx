import { Button, Tooltip } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { FaMinus, FaPlus } from "react-icons/fa";
import { IJsonViewerProps } from "./index.dto";
import { JsonViewerItem } from "./JsonViewerItem";
import "./style.css";

export const JsonViewer = (props: IJsonViewerProps): React.JSX.Element => {
  const { levelOpen = 0, data, onEdit } = props;
  const [levelOpened, setLevelOpened] = useState<number>(0);

  const maxLevelOpen = () => {
    const checker = (objOrArr: any | any[], internalCount: number): number => {
      if (Array.isArray(objOrArr)) {
        return mapArray(objOrArr, internalCount);
      }

      if (objOrArr instanceof Object) {
        return mapObject(objOrArr, internalCount);
      }

      return internalCount;
    };

    const mapArray = (arr: any[], internalCount: number): number => {
      internalCount++;

      return Math.max(...arr.map((sub) => checker(sub, internalCount)));
    };

    const mapObject = (obj: any, internalCount: number): number => {
      internalCount++;

      return Math.max(
        ...Object.keys(obj).map((key) => checker(obj[key], internalCount))
      );
    };

    return mapObject(data, 1);
  };

  const expandAll = () => {
    const maxLevel = maxLevelOpen();

    setLevelOpened(maxLevel);
  };

  const collapseAll = () => setLevelOpened(0);

  useEffect(() => {
    setLevelOpened(levelOpen);
  }, [levelOpen]);

  return (
    <div className="json-view-container">
      <div className="actions">
        <Tooltip content="Expandir todos os atributos">
          <Button variant="outline" onClick={() => expandAll()}>
            <FaPlus />
          </Button>
        </Tooltip>
        <Tooltip content="Retrair todos os atributos">
          <Button variant="outline" onClick={() => collapseAll()}>
            <FaMinus />
          </Button>
        </Tooltip>
      </div>
      <JsonViewerItem
        data={props.data}
        levelOpen={levelOpened}
        level={0}
        onEdit={onEdit}
      />
    </div>
  );
};
