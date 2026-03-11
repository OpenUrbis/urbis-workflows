import { IField } from "@open-urbis/types";
import {
  ActivityTemplate,
  ActivityTypeEnum,
  FormTemplate,
} from "../../../api/types/schema";
import { SchemaDefinition } from "../../../api/types/schema";

/**
 * Represents a single field match within a workflow's dynamic content.
 */
export interface FieldMatch {
  /** Activity/step label (e.g. "Formulário de Cadastro") */
  activityLabel: string;
  /** Activity namespace */
  activityNamespace: string;
  /** Dot-separated path of field keys from root */
  fieldPath: string;
  /** Human-readable label of the matched field */
  fieldLabel: string;
  /** The raw string value that matched */
  rawValue: string;
  /** The value with matched terms wrapped in <mark> tags */
  highlightedValue: string;
}

/**
 * Walks the IField tree recursively and collects all leaf values
 * that contain the search query (case-insensitive).
 */
function walkFields(
  fields: IField[],
  value: any,
  query: string,
  parentPath: string,
  matches: Omit<FieldMatch, "activityLabel" | "activityNamespace">[],
): void {
  if (!fields || !value || typeof value !== "object") return;

  for (const field of fields) {
    const key = (field.options as any)?.key ?? field.key;
    if (!key) continue;

    const fieldValue = value[key];
    const currentPath = parentPath ? `${parentPath}.${key}` : key;
    const label =
      (field.options as any)?.label || field.key || currentPath;

    // Recurse into blocks
    if (field.type === "block" && field.block) {
      walkFields(
        field.block,
        field.key === "root" ? value : fieldValue,
        query,
        field.key === "root" ? parentPath : currentPath,
        matches,
      );
      continue;
    }

    // Recurse into presets
    if (field.type === "preset" && field.preset) {
      walkFields(field.preset, fieldValue, query, currentPath, matches);
      continue;
    }

    // Recurse into arrays
    if (field.type === "array" && field.block && Array.isArray(fieldValue)) {
      fieldValue.forEach((item: any, index: number) => {
        walkFields(
          field.block!,
          item,
          query,
          `${currentPath}[${index}]`,
          matches,
        );
      });
      continue;
    }

    // Leaf field — check for match
    const stringValue = leafToString(fieldValue);
    if (!stringValue) continue;

    if (stringValue.toLowerCase().includes(query.toLowerCase())) {
      matches.push({
        fieldPath: currentPath,
        fieldLabel: label,
        rawValue: stringValue,
        highlightedValue: highlightText(stringValue, query),
      });
    }
  }
}

/**
 * Converts a leaf field value to a searchable string.
 */
function leafToString(value: any): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value.trim() || null;
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  if (Array.isArray(value)) {
    // Array of primitives (e.g. multi-select, uploaded file names)
    const parts = value
      .filter((v) => typeof v === "string" || typeof v === "number")
      .map(String);
    return parts.length > 0 ? parts.join(", ") : null;
  }
  // Objects that have been redacted
  if (value?.__redacted) return null;
  return null;
}

/**
 * Wraps all occurrences of `query` in `text` with <mark> tags (case-insensitive).
 */
function highlightText(text: string, query: string): string {
  if (!query) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  return text.replace(regex, "<mark>$1</mark>");
}

/**
 * Recursively searches a value object for any string/number leaf
 * that contains the query. Used as fallback for data not covered
 * by a form definition (e.g. prerequisite $metadata or nested data).
 */
function walkValueGeneric(
  obj: any,
  query: string,
  parentPath: string,
  matches: Omit<FieldMatch, "activityLabel" | "activityNamespace">[],
  depth = 0,
): void {
  if (depth > 8 || !obj) return;

  if (Array.isArray(obj)) {
    obj.forEach((item, i) =>
      walkValueGeneric(item, query, `${parentPath}[${i}]`, matches, depth + 1),
    );
    return;
  }

  if (typeof obj === "object") {
    for (const [key, val] of Object.entries(obj)) {
      if (key.startsWith("$") && key !== "$metadata") continue; // skip internal keys except metadata
      walkValueGeneric(val, query, parentPath ? `${parentPath}.${key}` : key, matches, depth + 1);
    }
    return;
  }

  const str = typeof obj === "string" ? obj : typeof obj === "number" ? String(obj) : null;
  if (str && str.toLowerCase().includes(query.toLowerCase())) {
    // Derive a human-readable label from the path (last segment, cleaned up)
    const segments = parentPath.split(".");
    const lastSegment = segments[segments.length - 1]?.replace(/\[\d+\]$/, "") || parentPath;
    matches.push({
      fieldPath: parentPath,
      fieldLabel: lastSegment,
      rawValue: str,
      highlightedValue: highlightText(str, query),
    });
  }
}

/**
 * Given a full workflow (schema + value) and a search query,
 * returns all matching fields grouped by activity.
 * Searches both FORM activities and Incoming (prerequisite) data.
 */
export function findFieldMatches(
  schema: SchemaDefinition,
  value: any,
  query: string,
): FieldMatch[] {
  if (!query || !schema?.activities || !value) return [];

  const allMatches: FieldMatch[] = [];

  // 1. Search FORM activities
  for (const activity of schema.activities) {
    // Only FORM activities have searchable dynamic content
    if (activity.type !== ActivityTypeEnum.FORM) continue;

    const formTemplate = activity.template as FormTemplate;
    if (!formTemplate?.form) continue;

    const activityValue = value[activity.namespace];
    const formData = activityValue?.form;
    if (!formData) continue;

    const fieldMatches: Omit<
      FieldMatch,
      "activityLabel" | "activityNamespace"
    >[] = [];

    // The root field is typically type="block" with block=IField[]
    if (formTemplate.form.type === "block" && formTemplate.form.block) {
      walkFields(formTemplate.form.block, formData, query, "", fieldMatches);
    } else {
      // Single field at root
      walkFields([formTemplate.form], formData, query, "", fieldMatches);
    }

    for (const match of fieldMatches) {
      allMatches.push({
        ...match,
        activityLabel: activity.label,
        activityNamespace: activity.namespace,
      });
    }
  }

  // 2. Search Incoming (prerequisite) data
  if (schema.incoming && schema.incoming.length > 0) {
    for (const incoming of schema.incoming) {
      const incomingValue = value[incoming.namespace];
      if (!incomingValue) continue;

      const fieldMatches: Omit<
        FieldMatch,
        "activityLabel" | "activityNamespace"
      >[] = [];

      // Walk the incoming's form definition if it exists
      if (incoming.form) {
        if ((incoming.form as any).type === "block" && (incoming.form as any).block) {
          walkFields((incoming.form as any).block, incomingValue, query, "", fieldMatches);
        } else {
          walkFields([incoming.form], incomingValue, query, "", fieldMatches);
        }
      }

      // Also do a generic recursive search on the incoming value
      // to catch data not covered by the form definition (e.g. $metadata, nested prerequisite data)
      const genericMatches: Omit<
        FieldMatch,
        "activityLabel" | "activityNamespace"
      >[] = [];
      walkValueGeneric(incomingValue, query, "", genericMatches);

      // Merge: add generic matches that weren't already found via form walking
      const existingPaths = new Set(fieldMatches.map((m) => m.fieldPath));
      for (const gm of genericMatches) {
        if (!existingPaths.has(gm.fieldPath)) {
          fieldMatches.push(gm);
        }
      }

      const incomingLabel = `Pré-requisito: ${incoming.label}`;
      for (const match of fieldMatches) {
        allMatches.push({
          ...match,
          activityLabel: incomingLabel,
          activityNamespace: incoming.namespace,
        });
      }
    }
  }

  return allMatches;
}
