import { getAccessToken } from "../../../../auth/token";
import { IField, IFieldOptionsType, IFormContext } from "@open-urbis/types";
import axios from "axios";
import { ValidState } from "../Field";

const _transpileCache = new Map<string, string>();
export const babelFieldEspression = (expr: string): string => {
  const cached = _transpileCache.get(expr);
  if (cached !== undefined) return cached;
  const result = (window as any).Babel.transform(`(() => {return ${expr}; })()`, {
    presets: ["env"],
  })
    .code.replace('"use strict";', "")
    .trim();
  _transpileCache.set(expr, result);
  return result;
};

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
const _funcCache = new Map<string, Function>();
// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
function getCachedFunction(transpiled: string): Function {
  const cached = _funcCache.get(transpiled);
  if (cached !== undefined) return cached;
  // eslint-disable-next-line no-new-func
  const func = new Function(
    "context",
    "valid",
    "$data",
    "$modules",
    "$user",
    "$variables",
    "$state",
    `return ${transpiled};`
  );
  _funcCache.set(transpiled, func);
  return func;
}

export function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return a === b;
  if (typeof a !== typeof b) return false;
  if (typeof a !== "object") return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }
  return true;
}

export function evalFieldExpression(
  expr: string,
  context: any,
  general: IFormContext,
  valid: any
): any {
  try {
    const transpileExpr = babelFieldEspression(expr);
    const func = getCachedFunction(transpileExpr);
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
        !deepEqual(newValue, value?.$cache)) ||
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
            if (setLoading) {
              setLoading(true);
            }

            const result = await axios.post(
              `${import.meta.env.VITE_BACK_END_API}/integrations/call`,
              {
                method: newValue.method,
                url: newValue.url,
                data: newValue.body,
              },
              {
                headers: {
                  authorization: `Bearer ${getAccessToken()}`,
                },
              }
            );

            if (setLoading) {
              setLoading(false);
            }

            onChange({
              ...result.data,
              $cache: newValue,
              $timestamp: new Date(),
              ...(field.options.enableEdition && general.$state === "edition"
                ? { $apostille: true }
                : {}),
            });
          } catch (e) {
            if (setLoading) {
              setLoading(false);
            }

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
      } else if (!deepEqual(newValue, value)) {
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
      !deepEqual(calcValid, validContext)
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
      if (!deepEqual(newValue, value?.$ ?? {})) {
        onChange({
          ...(value ?? {}),
          $: newValue,
        });
      }
    } else if (!deepEqual(newValue, value)) {
      onChange(newValue);
    }
  }
}

/** Same rules as MapPickerField.hasLoadedDwgData — required mapPicker must have DWG payload, not just `{}`. */
function mapPickerHasPayload(value: unknown): boolean {
  if (value == null || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  const keys = Object.keys(o);
  if (keys.length === 0) return false;
  if (o.s3_metadata) return true;
  return keys.some((k) =>
    ["dados", "geometrias", "features", "blocos", "value"].includes(k),
  );
}

/** Perimeter is satisfied when a feature with coordinates exists (editFeature or perimetroProtocolo). */
function mapPerimeterHasPayload(value: unknown): boolean {
  if (value == null || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  const feat = o.editFeature ?? o.perimetroProtocolo;
  if (!feat || typeof feat !== "object") return false;
  const g = (feat as { geometry?: { coordinates?: unknown } }).geometry;
  return !!(g && g.coordinates);
}

function checkRequiredFieldIfisValid(
  field: IField,
  context: any,
  onValidChange: (valid: boolean) => void
) {
  const isRequired = field?.options?.required === true;

  if (!isRequired) return;

  const value = context?.[field.key];
  let valueIsNegative =
    value === undefined ||
    value === null ||
    value === "" ||
    (typeof value === "object" && Object.keys(value).length === 0);

  const fieldType = field.type as unknown as string;
  if (fieldType === "mapPicker") {
    valueIsNegative = !mapPickerHasPayload(value);
  } else if (fieldType === "mapPerimeter") {
    valueIsNegative = !mapPerimeterHasPayload(value);
  }

  if (field.type === "array") {
    if (valueIsNegative) {
      onValidChange([{ $: false }] as any);
    }
  } else {
    const ok = !valueIsNegative;
    onValidChange(ok);
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
