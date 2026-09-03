import { IFormContext, FieldInputOptions } from "@open-urbis/types";
import { evalLabel } from "../utils/expressions";

export type FieldLabelProps = {
  fieldKey: string;
  context: IFormContext;
  options: FieldInputOptions;
};

export const Label: React.FC<FieldLabelProps> = ({
  fieldKey,
  context,
  options,
}) => {
  const isRequired = options.required === true;
  const label = evalLabel(options.label ?? "", context);

  return (
    <div className="flex space-x-2 mb-2 text-sm" key={fieldKey}>
      <div dangerouslySetInnerHTML={{ __html: label ?? "" }}></div>
      {isRequired && <div className="text-red-500">*</div>}
    </div>
  );
};
