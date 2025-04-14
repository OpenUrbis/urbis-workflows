import { IField, IFormContext, SelectOptions } from "@open-urbis/types";
import { useContext } from "react";
import { FaCaretSquareDown } from "react-icons/fa";
import { Select as SelectBase } from "../../../../components";
import { StyleContext } from "../../../../reducers/style.reducer";

export type FieldSelectProps = {
  field: IField;
  fieldKey: string;
  onChange: (value: string) => void;
  options: SelectOptions;
  value?: string | number;
  general: IFormContext;
};

export const Select: React.FC<FieldSelectProps> = ({
  field,
  fieldKey,
  onChange,
  options,
  value,
  general,
}) => {
  const styleContext = useContext(StyleContext);
  const isReadonly =
    options.readOnly === true ||
    (general?.$state === "edition" && options.enableEdition !== true);

  if (!options?.items?.length) {
    return (
      <div className="flex items-start space-x-4 py-4 text-gray-500">
        <FaCaretSquareDown size={24} className="mt-1 opacity-50" />
        <div>
          <p
            className="text-sm mb-1"
            style={{ color: styleContext.state.textColor }}
          >
            Nenhuma opção configurada
          </p>
          <p
            className="text-xs"
            style={{ color: styleContext.state.textColor }}
          >
            Configure as opções nas propriedades do campo
          </p>
        </div>
      </div>
    );
  }

  return (
    <SelectBase
      placeholder={options?.placeholder}
      size="lg"
      onChange={(e) => {
        // Convert back to original type before calling onChange
        const originalTypeValue = options.items?.find(
          (item) => item.value.toString() === e.target.value
        )?.value;

        if (originalTypeValue !== undefined && originalTypeValue !== null) {
          onChange(originalTypeValue);
        } else {
          onChange(e.target.value);
        }
      }}
      className={`flex-grow ${isReadonly ? "cursor-not-allowed" : ""}`}
      value={value}
      disabled={isReadonly}
    >
      {options?.items?.map((item) => (
        <option key={fieldKey + "#" + item.label} value={item.value}>
          {item.label}
        </option>
      ))}
    </SelectBase>
  );
};
