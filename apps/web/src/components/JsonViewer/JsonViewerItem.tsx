import { IconButton } from "../LegacyUi";
import React, { useEffect, useState } from "react";
import { FaCopy, FaEdit } from "react-icons/fa";
import { isValidJsonAny } from "../../modules/workflows-schema/form-engine/utils/is-valid-json-str";
import { DataTypeEnum, IJsonViewerItem, IJsonViewerProps } from "./index.dto";
import { JsonViewerNewKey } from "./JsonViewerNewKey";
import "./style.css";
import {
  isArray,
  isBoolean,
  isNumber,
  isObject,
  isString,
  isUndefined,
} from "./utils";

export const JsonViewerItem = (props: IJsonViewerProps): React.JSX.Element => {
  const { levelOpen = 0, level = 0, keyName, onEdit, path = [] } = props;

  const [item, setItem] = useState<IJsonViewerItem>({
    dataType: DataTypeEnum.NULL,
  });
  const [isOpen, setIsOpen] = useState<boolean>(!keyName);
  const [isInit, setIsInit] = useState<boolean>(false);

  const isArrayOrObject = () =>
    (item.dataType === DataTypeEnum.OBJECT ||
      item.dataType === DataTypeEnum.ARRAY) &&
    item.hasChildren;

  const toogle = () => {
    setIsOpen(!isOpen);
  };

  const renderKey = () => (
    <span className="key">
      {keyName && <span>{keyName}</span>}
      {renderDataType()}
      <span>: </span>
    </span>
  );

  const renderClickable = () => {
    const tooglerClassName = `toggler ${
      isOpen ? "viewer-opened" : "viewer-closed"
    }`;

    return isArrayOrObject() ? (
      // eslint-disable-next-line jsx-a11y/anchor-is-valid
      <a href="#" onClick={() => toogle()}>
        {item.hasChildren && <span className={tooglerClassName}></span>}
        {renderKey()}
      </a>
    ) : (
      renderKey()
    );
  };

  const renderDataType = () => (
    <span className="data-type">
      {item.dataType}
      <span className="length">
        {item.dataType === DataTypeEnum.ARRAY && <>[{item.value?.length}]</>}
      </span>
    </span>
  );

  const copyToClipboard = () =>
    navigator.clipboard.writeText(
      isValidJsonAny(props.data) ? JSON.stringify(props.data) : props.data
    );

  const editValue = (newKey?: string) => {
    if (onEdit) {
      onEdit(newKey ? "" : props.data, newKey ? [...path, newKey] : path);
    }
  };

  const renderIcons = (type: "object" | "value") => {
    if (type === "object" && !isArrayOrObject()) return null;
    if (type === "value" && !!isArrayOrObject()) return null;

    return (
      <div className="action-icons">
        <IconButton
          aria-label="Edit item"
          onClick={() => editValue()}
          className="h-6 w-6"
          icon={<FaEdit />}
        >
        </IconButton>
        <IconButton
          aria-label="Copy item"
          onClick={() => copyToClipboard()}
          className="h-6 w-6"
          icon={<FaCopy />}
        >
        </IconButton>
        {type === "object" && !Array.isArray(props.data) && (
          <JsonViewerNewKey newKey={(key: string) => editValue(key)} />
        )}
      </div>
    );
  };

  const isValid = (value: any) => {
    if (isValidJsonAny(value)) return JSON.stringify(value) !== "{}";

    return true;
  };

  const renderValue = () => {
    if (item.dataType === DataTypeEnum.NULL)
      return (
        <div className="value-label">
          <span className={item.dataType}>{item.value}</span>
        </div>
      );
    if (isArrayOrObject()) {
      return (
        isOpen &&
        Object.keys(item.value).map((key) => {
          return (
            isValid(item?.value?.[key]) && (
              <div className="children" key={window.self.crypto.randomUUID()}>
                <JsonViewerItem
                  data={item.value[key]}
                  levelOpen={levelOpen}
                  level={level + 1}
                  keyName={`${key}`}
                  onEdit={onEdit}
                  path={[...path, key]}
                />
              </div>
            )
          );
        })
      );
    } else {
      return (
        <div className="value-label">
          <span className={item.dataType}>{item.value}</span>
        </div>
      );
    }
  };

  const renderItem = () => {
    return (
      <div className="json-view">
        {renderClickable()}
        {renderIcons("object")}
        <span className="value">
          {renderValue()}
          {renderIcons("value")}
        </span>
      </div>
    );
  };

  useEffect(() => {
    if (isInit) setIsOpen(!isUndefined(levelOpen) && level <= levelOpen);
  }, [isInit, level, levelOpen]);

  useEffect(() => {
    const data = props.data;
    const item: IJsonViewerItem = {
      dataType: DataTypeEnum.NULL,
      hasChildren: false,
      value: data,
    };

    if (isObject(data)) {
      item.dataType = isArray(data) ? DataTypeEnum.ARRAY : DataTypeEnum.OBJECT;

      item.childrenKeys = Object.keys(data);
      item.hasChildren = item.childrenKeys && item?.childrenKeys?.length;
    } else {
      if (isString(data)) {
        item.dataType = DataTypeEnum.STRING;
      } else if (isNumber(data)) {
        item.dataType = DataTypeEnum.NUMBER;
      } else if (isBoolean(data)) {
        item.dataType = DataTypeEnum.BOOLEAN;
      } else if (null === data) {
        item.dataType = DataTypeEnum.NULL;
        item.value = "null";
      }
    }

    setItem(item);
    setIsInit(true);
  }, [props]);

  return renderItem();
};
