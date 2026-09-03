import React from "react";
import { HelpTooltipClickable } from "../../../../components";
import { IField, IFormContext } from "@open-urbis/types";
import { FaCalculator } from "react-icons/fa";
import {
  ActivityTemplate,
  ActivityTypeEnum,
} from "../../../../api/types/schema";

export const RenderFieldModelCalculation = ({
  parent,
  field,
  general,
}: {
  parent: IField;
  field: IField;
  general: IFormContext;
}) => {
  if (!field.expressions?.model) {
    return null;
  }

  // Extract references to fields using the new $data pattern
  const extractReferences = (expression: string) => {
    // Match any $data.ACTIVITY_KEY.ACTIVITY_DATA_KEY pattern
    const regex =
      /\$data\.([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)(?:\.([a-zA-Z0-9_.]+))?/g;
    const matches = [];
    let match;

    while ((match = regex.exec(expression)) !== null) {
      matches.push({
        full: match[0],
        activityKey: match[1],
        dataKey: match[2],
        fieldPath: match[3] || null,
      });
    }

    return matches;
  };

  // Extract context references (same form/block) - these still use the old pattern
  const extractContextReferences = (expression: string) => {
    const regex = /context\.([a-zA-Z0-9_.]+)/g;
    const matches = [];
    let match;

    while ((match = regex.exec(expression)) !== null) {
      matches.push({
        full: match[0],
        fieldPath: match[1],
      });
    }

    return matches;
  };

  // Get all references
  const modelExpression = field.expressions.model;
  const dataReferences = extractReferences(modelExpression);
  const contextReferences = extractContextReferences(modelExpression);

  // Check if we have any references at all
  const hasReferences =
    dataReferences.length > 0 || contextReferences.length > 0;

  if (!hasReferences) {
    return null;
  }

  // Lookup activity information from the tree
  const getActivityInfo = (activityKey: string) => {
    const activities = (general.$tree?.activities as ActivityTemplate[]) || [];
    return activities.find((activity) => activity.namespace === activityKey);
  };

  // Build a full path of labels by traversing the form structure
  const buildFullLabelPath = (
    blocks: IField[] | undefined,
    path: string[]
  ): string[] => {
    if (!blocks || blocks.length === 0 || path.length === 0) {
      return [];
    }

    const currentKey = path[0];
    const currentField = blocks.find((f) => f.key === currentKey);

    if (!currentField) {
      return [currentKey]; // Use the key if field not found
    }

    // Get label for the current field
    const currentLabel =
      currentField.options && (currentField.options as any).label
        ? (currentField.options as any).label
        : currentKey;

    // If this is the last part of the path, return just this label
    if (path.length === 1) {
      return [currentLabel];
    }

    // Otherwise, continue building the path based on field type
    const remainingPath = path.slice(1);
    let nestedLabels: string[] = [];

    if (currentField.type === "block" && currentField.block) {
      nestedLabels = buildFullLabelPath(currentField.block, remainingPath);
    } else if (currentField.type === "preset" && currentField.preset) {
      nestedLabels = buildFullLabelPath(currentField.preset, remainingPath);
    } else if (currentField.type === "array" && currentField.block) {
      nestedLabels = buildFullLabelPath(currentField.block, remainingPath);
    }

    // Return the current label followed by any nested labels
    return [currentLabel, ...nestedLabels];
  };

  // Format field label path from activityInfo
  const getFieldLabelPath = (
    activityInfo: ActivityTemplate | undefined,
    dataKey: string,
    fieldPath: string | null
  ) => {
    if (!activityInfo || !fieldPath) {
      return { path: fieldPath || dataKey, labels: [fieldPath || dataKey] };
    }

    if (activityInfo.type === ActivityTypeEnum.FORM && dataKey === "form") {
      // Try to find the field in the form structure recursively
      const formTemplate = activityInfo.template as any;
      if (formTemplate?.form) {
        const pathParts = fieldPath.split(".");

        // Start with the form's block fields
        const rootBlock = formTemplate.form.block || [];
        const labelPath = buildFullLabelPath(rootBlock, pathParts);

        return {
          path: fieldPath,
          labels: labelPath.length > 0 ? labelPath : pathParts,
        };
      }
    }

    // Default case
    return {
      path: fieldPath || dataKey,
      labels: [fieldPath || dataKey],
    };
  };

  // Find field label path in the current form/block structure
  const getContextFieldLabelPath = (fieldPath: string) => {
    const pathParts = fieldPath.split(".");

    // Start with the parent's block
    const blocks = parent.block || parent.preset;
    if (!blocks) {
      return [pathParts[pathParts.length - 1]]; // Fallback to key
    }

    const labelPath = buildFullLabelPath(blocks, pathParts);

    // If we found any labels, return them, otherwise return the last part of the path
    return labelPath.length > 0 ? labelPath : [pathParts[pathParts.length - 1]];
  };

  // Generate tooltip content
  const generateTooltipContent = () => {
    let content = `<div class="space-y-3 text-foreground">`;

    // Title
    content += `<div class="font-semibold">Campo Calculado</div>`;

    // Description - Use custom description if available, otherwise use default
    const customDescription = (field.expressions as any).modelDescription;
    content += `
      <div>
        <p class="text-sm text-muted-foreground">${customDescription || "Este campo tem seu valor calculado automaticamente com base em outros dados:"}</p>
      </div>
    `;

    // Activity references
    if (dataReferences.length > 0) {
      content += `
        <div class="mt-2">
          <span class="font-medium">Dados de outras atividades:</span>
          <ul class="mt-1 space-y-1 text-sm text-foreground">
      `;

      dataReferences.forEach((ref) => {
        const activityInfo = getActivityInfo(ref.activityKey);
        const activityLabel = activityInfo?.label || ref.activityKey;
        const fieldInfo = getFieldLabelPath(
          activityInfo,
          ref.dataKey,
          ref.fieldPath
        );

        content += `<li class="flex items-center">
          <span class="inline-block w-2 h-2 mr-2 bg-primary rounded-full"></span>
          <span class="font-medium">${activityLabel}</span>
          ${ref.fieldPath ? ` <span class="text-muted-foreground">›</span> <span>${fieldInfo.labels.join(" › ")}</span>` : ""}
        </li>`;
      });

      content += `</ul></div>`;
    }

    // Context references (same form)
    if (contextReferences.length > 0) {
      content += `
        <div class="mt-2">
          <span class="font-medium">Campos deste formulário:</span>
          <ul class="mt-1 space-y-1 text-sm text-foreground">
      `;

      contextReferences.forEach((ref) => {
        // Get field label using the recursive function
        const labelPath = getContextFieldLabelPath(ref.fieldPath);

        content += `<li class="flex items-center">
          <span class="inline-block w-2 h-2 mr-2 bg-emerald-500 rounded-full"></span>
          ${labelPath.join(" › ")}
        </li>`;
      });

      content += `</ul></div>`;
    }

    content += `</div>`;
    return content;
  };

  // Always use the same icon for consistency
  return (
    <div className="text-blue-500">
      <HelpTooltipClickable
        tooltip={generateTooltipContent()}
        icon={FaCalculator}
        size="16px"
      />
    </div>
  );
};
