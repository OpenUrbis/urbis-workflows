import { useContext } from "react";
import { FaCheckSquare } from "react-icons/fa";
import { IField, IFormContext, CheckboxOptions } from "@open-urbis/types";
import { StyleContext } from "../../../../reducers/style.reducer";

export type FieldCheckboxProps = {
  field: IField;
  fieldKey: string;
  options: CheckboxOptions;
  value: { [value: string]: boolean } | undefined;
  general: IFormContext;
  onChange: (value: { [value: string]: boolean } | undefined) => void;
};

export const Checkbox: React.FC<FieldCheckboxProps> = ({
  field,
  fieldKey,
  onChange,
  options,
  value = {},
  general,
}) => {
  const styleContext = useContext(StyleContext);
  const isReadonly =
    options.readOnly === true ||
    (general?.$state === "edition" && options.enableEdition !== true);

  if (!options?.items?.length) {
    return (
      <div className="flex items-start space-x-4 py-4 text-gray-500">
        <FaCheckSquare size={24} className="mt-1 opacity-50" />
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
    <div>
      {options?.items?.map((item: { label: string; value: any }) => (
        <div key={item.label} className="mb-1">
          <label
            key={fieldKey + "#" + item.label}
            className={`inline-flex items-center gap-2 ${
              isReadonly ? "cursor-not-allowed opacity-70" : "cursor-pointer"
            }`}
          >
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
              checked={value[item.value] === true}
              disabled={isReadonly}
            onChange={(e) => {
              const nextValue = { ...(value ?? {}) };

              if (e.target.checked) {
                nextValue[item.value] = true;
              } else {
                delete nextValue[item.value];
              }

              if (Object.keys(nextValue).length === 0) {
                onChange(undefined);
              } else {
                onChange(nextValue);
              }
            }}
            />
            <span>{item.label}</span>
          </label>
        </div>
      ))}
    </div>
  );
};
