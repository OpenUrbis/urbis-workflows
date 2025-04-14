import { IField, IFieldOptionsType, IFormContext } from "@open-urbis/types";
import axios from "axios";
import { ValidState } from "../Field";

export const babelFieldEspression = (expr: string) =>
  (window as any).Babel.transform(`(() => {return ${expr}; })()`, {
    presets: ["env"],
  })
    .code.replace('"use strict";', "")
    .trim();

export function evalFieldExpression(
  expr: string,
  context: any,
  general: IFormContext,
  valid: any
): any {
  try {
    const transpileExpr = babelFieldEspression(expr);

    // eslint-disable-next-line no-new-func
    const func = new Function(
      "context",
      "valid",
      "$data",
      "$modules",
      "$user",
      "$variables",
      "$state",
      `return ${transpileExpr};`
    );
    return func(
      context ?? {},
      valid,
      general.$data,
      general.$modules,
      general.$user,
      general.$variables,
      general.$state
    );
  } catch (e) {
    console.warn("expr debug:", expr, e);
    return undefined;
  }
}

export function optionCallback(
  field: IField,
  context: any,
  general: IFormContext,
  validContext: any,
  setOptions: (options: IFieldOptionsType) => void
): IFieldOptionsType {
  if (field.expressions?.options) {
    const config =
      evalFieldExpression(
        replaceContextSpecialPattern(field.expressions.options, field.key),
        context,
        general,
        validContext
      ) ?? {};

    if (config) {
      const options = {
        ...field.options,
        ...config,
      };

      setOptions(options);

      return options;
    }
  }

  return field.options;
}

export function integrationCallback(
  field: IField,
  context: any,
  general: IFormContext,
  validContext: any,
  value: any,
  setLoading: ((loading: boolean) => void) | undefined,
  onChange: (value: any) => void
) {
  if (field.expressions?.integration) {
    const newValue = evalFieldExpression(
      replaceContextSpecialPattern(field.expressions.integration, field.key),
      context,
      general,
      validContext
    );

    if (
      (newValue !== undefined &&
        JSON.stringify(newValue) !== JSON.stringify(value?.$cache)) ||
      (general.$state === "edition" &&
        field.options.enableEdition &&
        value?.$apostille !== true)
    ) {
      if (
        (newValue.method === "GET" || newValue.method === "POST") &&
        newValue.url !== undefined
      ) {
        (async () => {
          try {
            setLoading && setLoading(true);
            const result = await axios.post(
              `${process.env.REACT_APP_BACK_END_API}/integrations/call`,
              {
                method: newValue.method,
                url: newValue.url,
                data: newValue.body,
              },
              {
                headers: {
                  authorization: `Bearer ${localStorage.getItem("token")}`,
                },
              }
            );
            setLoading && setLoading(false);
            onChange({
              ...result.data,
              $cache: newValue,
              $timestamp: new Date(),
              ...(field.options.enableEdition && general.$state === "edition"
                ? { $apostille: true }
                : {}),
            });
          } catch (e) {
            setLoading && setLoading(false);
            onChange({
              error: e,
              $cache: newValue,
              $timestamp: new Date(),
              ...(field.options.enableEdition && general.$state === "edition"
                ? { $apostille: true }
                : {}),
            });
          }
        })();
      } else if (JSON.stringify(newValue) !== JSON.stringify(value)) {
        onChange(newValue);
      }
    }
  }
}

export function validCallback(
  field: IField,
  context: any,
  general: IFormContext,
  validContext: any,
  setValidState: (valid: boolean | ValidState) => void,
  onValidChange: (valid: boolean) => void
) {
  if (field.expressions?.valid) {
    const calcValid = evalFieldExpression(
      replaceContextSpecialPattern(field.expressions.valid, field.key),
      context,
      general,
      validContext
    );

    if (
      calcValid !== undefined &&
      JSON.stringify(calcValid) !== JSON.stringify(validContext)
    ) {
      setValidState(calcValid);

      const isValid = !(calcValid.type === "invalid" || calcValid === false);

      if (["block", "preset"].includes(field.type)) {
        const key = (field.options as any).key ?? field.key;

        if (validContext === undefined || validContext === null) {
          validContext = {};
        }

        if (validContext[key] === undefined || validContext[key] === null) {
          validContext[key] = {};
        }

        validContext[key].$ = isValid;
        onValidChange(validContext[key]);
      } else {
        onValidChange(isValid);
      }
    } else if (calcValid === undefined) {
      checkRequiredFieldIfisValid(field, context, onValidChange);
    }
  } else if (
    !["block", "integration", "preset", "subtitle", "table", "title"].includes(
      field.type
    )
  ) {
    checkRequiredFieldIfisValid(field, context, onValidChange);
  }
}

export function visibleCallback(
  field: IField,
  context: any,
  general: IFormContext,
  validContext: any,
  setVisible: (visible: boolean) => void
) {
  if (field.expressions?.visible) {
    const visible = evalFieldExpression(
      replaceContextSpecialPattern(field.expressions.visible, field.key),
      context,
      general,
      validContext
    );

    setVisible(visible);
  }
}

export function modelCallback(
  field: IField,
  value: any,
  context: any,
  general: IFormContext,
  validContext: any,
  onChange: (value: any) => void
) {
  if (field?.expressions?.model) {
    const newValue = evalFieldExpression(
      replaceContextSpecialPattern(field.expressions.model, field.key),
      field.type === "block" ? value : context,
      general,
      validContext
    );

    if (Number.isNaN(newValue)) {
      // avoid unexpected exceptions
      return;
    }

    if (field.type === "block") {
      if (JSON.stringify(newValue) !== JSON.stringify(value?.$ ?? {})) {
        onChange({
          ...(value ?? {}),
          $: newValue,
        });
      }
    } else if (JSON.stringify(newValue) !== JSON.stringify(value)) {
      onChange(newValue);
    }
  }
}

function checkRequiredFieldIfisValid(
  field: IField,
  context: any,
  onValidChange: (valid: boolean) => void
) {
  const isRequired = field?.options?.required === true;

  if (isRequired) {
    const value = context?.[field.key];
    const valueIsNegative =
      value === undefined ||
      value === null ||
      value === "" ||
      (typeof value === "object" && Object.keys(value).length === 0);

    if (field.type === "array") {
      if (valueIsNegative) {
        // exceção quando é um array
        onValidChange([{ $: false }] as any);
      }
    } else {
      onValidChange(!valueIsNegative);
    }
  }
}

// context.$ means the field own value and context.$global the whole form value
function replaceContextSpecialPattern(expr: string, fieldKey: string): string {
  return expr
    .replace(/context\.\$(?!metadata|data)/g, `context["${fieldKey}"]`)
    .replace(/valid\.\$(?!metadata|data)/g, `valid["${fieldKey}"]`);
}

export const evalLabel = function (label: string, input: any) {
  try {
    // eslint-disable-next-line no-new-func
    const func = new Function("context", `return \`${label}\`;`);
    return func(input);
  } catch (e) {
    return label;
  }
};
