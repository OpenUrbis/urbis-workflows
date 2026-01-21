import { removeDuplicates } from "../../modules/workflows-schema/form-engine/utils/is-valid-json-str";

import { parse } from "@babel/parser";

export const buildLinesTxt = (validationConfig: any[]) => {
  const lines = removeDuplicates(
    validationConfig.map((value) => value.startLineNumber)
  );
  if (!lines.length) return `no editor`;
  let text = `${lines.length > 1 ? "nas linhas" : "na linha"}: `;
  if (lines.length === 1) text += lines[0];
  else if (lines.length === 2) text += lines.join(" e ");
  else {
    const lastLine = lines.pop();

    text += `${lines.join(", ")} e ${lastLine}`;
  }

  return `${text}.`;
};

// Função para verificar se a expressão é válida
export function isValidExpression(expression: string) {
  try {
    const parsed = parse(expression, { sourceType: "module" });

    // Verifica se há apenas um statement no nível superior
    if (parsed.program.body.length !== 1) {
      return {
        valid: false,
        message:
          "A expressão deve conter apenas um statement no nível superior.",
      };
    }

    const node = parsed.program.body[0];

    // Verifica se é uma ExpressionStatement
    if (node.type === "ExpressionStatement") {
      const expressionType = node.expression.type;

      // Verifica se é uma IIFE (função auto-invocada)
      if (
        expressionType === "CallExpression" &&
        node.expression.callee.type === "ArrowFunctionExpression"
      ) {
        const functionBody = node.expression.callee.body;

        // Verifica se a IIFE contém uma declaração de return
        if (functionBody.type === "BlockStatement") {
          const returnStatement = functionBody.body.find(
            (statement) => statement.type === "ReturnStatement"
          );
          if (returnStatement === undefined) {
            return {
              valid: false,
              message: "A IIFE deve conter uma declaração de return.",
            };
          }
        }

        return { valid: true }; // IIFE válida com return
      }

      // Permite expressões simples (como `context > 10`, `user > 18`) e objetos literais
      if (
        expressionType === "BinaryExpression" ||
        expressionType === "LogicalExpression" ||
        node.expression.type === "ObjectExpression"
      ) {
        return { valid: true }; // Expressão simples ou objeto literal válida
      }

      // Se não for uma IIFE ou expressão simples, é inválido
      return {
        valid: true, // false,
        message:
          "A expressão deve ser uma IIFE, uma expressão simples ou um objeto literal.",
      };
    }

    return { valid: false, message: "A expressão deve ser um Statement." }; // Caso não seja uma ExpressionStatement, é inválido
  } catch (error) {
    return { valid: false, message: "Erro de sintaxe na expressão." }; // Se houver erro no parse, é inválido
  }
}

/* const expressions = [
  {
    expression: `(() => { return 'saci'; })()`,
    expected: true,
  },
  {
    expression: `(() => { return $user > 18; })()`,
    expected: true,
  },
  {
    expression: `user > 18`,
    expected: true,
  },
  {
    expression: `(() => { console.log('teste'); })()`,
    expected: false,
  },
  {
    expression: `let user = 'teste'; user`,
    expected: false,
  },
  {
    expression: `context > 10`,
    expected: true,
  },
  {
    expression: `(() => { return { method: "GET", url: "ex.: https://api.com/api/v1/resource", headers: {} }; })()`,
    expected: true,
  },
  {
    expression: `return { method: "GET", url: "ex.: https://api.com/api/v1/resource", headers: {} }`,
    expected: true,
  },
  {
    expression: `(() => {
      return {
        "readOnly": context.campo === 'Sim'
      };
    })()`,
    expected: true,
  },
  {
    expression: `return { "readOnly": context.campo === 'Sim' }`,
    expected: true,
  },
];

expressions.forEach(({ expression, expected }, index) => {
  const result = isValidV2(expression);
  console.log(
    result.valid === expected ? "✓" : "✗",
    `Teste ${index + 1}:`,
    result.valid ? true : result.message
  );
});
 */
