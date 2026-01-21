import React from "react";
import { RenderFieldModelCalculation } from "./RenderFieldModelCalculation";
import { Label } from "../fields";
import { HelpTooltipClickable } from "../../../../components";
import {
  IField,
  IFieldOptionsType,
  IFormContext,
  InputOptions,
} from "@open-urbis/types";
import { RenderFieldPrivacyInfo } from "./RenderFieldPrivacyInfo";

export const RenderLabelTooltip = ({
  parent,
  options,
  field,
  context,
  general,
}: {
  parent: IField;
  options: IFieldOptionsType;
  field: IField;
  context: IFormContext;
  general: IFormContext;
}) => {
  return (
    <div className="flex items-start space-x-4">
      {(options as InputOptions).label && (
        <Label fieldKey={field.key} context={context} options={options} />
      )}
      <RenderFieldPrivacyInfo
        sensibilityLevel={options.sensibilityLevel}
        accessLevel={options.accessLevel}
        permissions={options.permissions}
      />
      <RenderFieldModelCalculation
        parent={parent}
        field={field}
        general={general}
      />
      {(options as InputOptions).tooltip && (
        <HelpTooltipClickable
          tooltip={(options as InputOptions).tooltip as string}
        />
      )}
    </div>
  );
};
