import { useContext } from "react";
import { FaDotCircle } from "react-icons/fa";
import { IField, IFormContext, RadioOptions } from "@open-urbis/types";
import { StyleContext } from "../../../../reducers/style.reducer";

export type FieldRadioProps = {
  field: IField;
  fieldKey: string;
  options: RadioOptions;
  value?: any;
  general: IFormContext;
  onChange: (value: any) => void;
};

export const Radio: React.FC<FieldRadioProps> = ({
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

  // Convert current value to string for RadioGroup
  const currentValue = value?.toString() ?? "";

  // Ensure items is an array and has content
  const items = Array.isArray(options?.items) ? options.items : [];

  if (!items.length) {
    return (
      <div className="flex items-start space-x-4 py-4 text-gray-500">
        <FaDotCircle size={24} className="mt-1 opacity-50" />
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
    <div role="radiogroup">
      {items.map((item) => (
        <div key={`${fieldKey}-${item.label}`} className="mb-1">
          <label
            className={`inline-flex items-center gap-2 ${
              isReadonly ? "cursor-not-allowed opacity-70" : "cursor-pointer"
            }`}
          >
            <input
              type="radio"
              name={fieldKey}
              className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
              value={item.value.toString()}
              checked={currentValue === item.value.toString()}
              disabled={isReadonly}
              onChange={(e) => {
                if (!isReadonly) {
                  const selectedValue = e.target.value;
                  const originalTypeValue = items.find(
                    (currentItem) =>
                      currentItem.value.toString() === selectedValue
                  )?.value;

                  if (
                    originalTypeValue !== undefined &&
                    originalTypeValue !== null
                  ) {
                    onChange(originalTypeValue);
                  } else {
                    onChange(selectedValue);
                  }
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
