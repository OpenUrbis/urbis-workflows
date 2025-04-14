import esprima from "esprima-next";
import { IField } from "@open-urbis/types";
import { FunctionDefinitions, ParsedFunctions } from "./types";
import { Node, Identifier, MemberExpression, SimpleLiteral } from "estree";

export function parseFunctions(
  $function: FunctionDefinitions
): ParsedFunctions {
  const result: ParsedFunctions = {};

  try {
    for (const group in $function) {
      const functions = $function[group];

      for (const key in functions) {
        const funcStr = functions[key];

        result[key] = loadFunctions(funcStr);
      }
    }
  } catch (e) {}

  return result;
}

export function loadFunctions(functionsString: string) {
  try {
    const ast = esprima.parseScript(functionsString, { range: true });

    const extractFunctions = (
      node: any,
      code: string
    ): { functionName: string; functionContent: string }[] => {
      try {
        const functions = [];

        if (node.type === "FunctionDeclaration") {
          const functionName = node.id.name;
          const functionContent = code.slice(node.range[0], node.range[1]);
          functions.push({ functionName, functionContent });
        }

        for (const key in node) {
          if (node[key] && typeof node[key] === "object") {
            functions.push(...extractFunctions(node[key], code));
          }
        }

        return functions;
      } catch (e) {
        return [];
      }
    };

    const extractedFunctions = extractFunctions(ast, functionsString);

    const namespace = {};

    extractedFunctions.forEach((func) => {
      // eslint-disable-next-line no-eval
      eval(`namespace.${func.functionName} = ${func.functionContent}`);
    });

    return namespace;
  } catch (e) {
    return {};
  }
}

export function extractContext(text: string) {
  const pattern = /\bcontext(?:\.[\w$]*|\.\$)*(?!\w)/g;
  const matches = text.match(pattern);
  return matches || [];
}

/* 
  parseExpressionsVariables receives a field and returns a tree with all references to other fields
  in the model and integration expression. It also adds a $refs and $ownRefs property to the field.

  @param {Field} field - The field to parse the references.
  @returns {any} - Returns a tree with all references to other fields.
*/
export function parseExpressionsVariables(field: IField): any {
  const tree: any = {};

  parseExpressionsVariablesUtil(field, tree, field, field);

  return tree;
}

function parseExpressionsVariablesUtil(
  field: IField,
  tree: any = {},
  parent: IField,
  fieldGlobal: IField
) {
  if (field.expressions?.model) {
    const paths = extractContextVariables(field.expressions.model);

    if (paths.length > 0) {
      tree["$"] = extractFieldFromPath(paths, field, parent, fieldGlobal);
      field.options.$ownRefs = tree["$"];
    }
  }

  parseExpressionsVariablesBlockUtil(
    field.block ?? [],
    tree,
    field,
    fieldGlobal
  );

  parseExpressionsVariablesBlockUtil(
    field.preset ?? [],
    tree,
    field,
    fieldGlobal
  );
}

function parseExpressionsVariablesBlockUtil(
  block: IField[],
  tree: any = {},
  parent: IField,
  fieldGlobal: IField
) {
  for (let f of block) {
    if (f.expressions?.model || f.expressions?.integration) {
      const paths = extractContextVariables(
        f.expressions.model ?? f.expressions.integration ?? ""
      );

      tree[f.key] = extractFieldFromPath(paths, f, parent, fieldGlobal);
      f.options.$ownRefs = tree[f.key];
    }

    if (f.block?.length || f.preset?.length) {
      tree[f.key] = {};
      parseExpressionsVariablesUtil(f, tree[f.key], parent, fieldGlobal);
    }
  }
}

function extractFieldFromPath(
  paths: string[],
  field: IField,
  parent: IField,
  fieldGlobal: IField
) {
  const fieldsRef: IField[] = [];

  for (let path of paths) {
    const pathParts = path.split(".");

    if (pathParts[1] === "$global") {
      let fieldRef: IField = fieldGlobal;
      for (let subpath of pathParts.slice(2)) {
        if (fieldRef.block) {
          const subField = fieldRef.block.find((f) => f.key === subpath);

          if (subField) {
            fieldRef = subField;

            if (subField.options.$refs === undefined) {
              subField.options.$refs = [];
            }

            if (!subField.options.$refs.find((sub) => sub.key === field.key)) {
              subField.options.$refs.push(field);
            }
          }
        }
      }

      fieldsRef.push(fieldRef);
    } else if (pathParts[1] !== "$") {
      const subField = parent.block?.find((f) => f.key === pathParts[1]);

      if (subField) {
        fieldsRef.push(subField);

        if (subField.options.$refs === undefined) {
          subField.options.$refs = [];
        }

        if (!subField.options.$refs.find((sub) => sub.key === field.key)) {
          subField.options.$refs.push(field);
        }
      }
    }
  }
  return fieldsRef;
}

/**
 * extractContextVariables extracts all context variables from a given code.
 *
 * @returns {string[]} - Returns empty array if no context variables are found.
 */
function extractContextVariables(code: string): string[] {
  try {
    const ast = esprima.parseScript(code);
    const contextVariables: string[] = [];

    function traverse(node: Node, path: string): void {
      switch (node.type) {
        case "Program":
          node.body.forEach((statement) => {
            if ("expression" in statement) {
              traverse(statement.expression, "");
            }
          });
          break;
        case "CallExpression":
          traverse(node.callee, path);
          break;
        case "Identifier":
          if (node.name === "context") {
            contextVariables.push(`context.${path}`);
            path = "";
          }
          break;
        case "MemberExpression":
          const memberExpr = node as MemberExpression;
          if (memberExpr.computed) {
            traverse(
              memberExpr.object,
              `${(node.property as SimpleLiteral).value}${
                path.length > 0 ? "." : ""
              }${path}`
            );
            traverse(memberExpr.property, "");
          } else {
            const name = (memberExpr.property as Identifier).name;
            const newPath = `${name}${path.length > 0 ? "." : ""}${path}`;
            traverse(memberExpr.object, newPath);
          }
          break;
        default:
          if ("left" in node && node.left) traverse(node.left, path);
          if ("right" in node && node.right) traverse(node.right, path);
          if ("expression" in node && node.expression)
            traverse(node.expression as Node, path);
      }
    }

    traverse(ast as Node, "");

    return contextVariables.map((con: string) => {
      return con.replace(".undefined", "");
    });
  } catch (e) {
    return [];
  }
}
