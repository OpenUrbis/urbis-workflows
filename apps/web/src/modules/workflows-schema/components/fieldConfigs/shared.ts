import {
  FieldTypeEnum,
  IFieldOptionsType,
  InputOptions,
  PrivacyLevelEnum,
} from "@open-urbis/types";

export const tooltipExpressions = `
  <p style="margin-bottom: 12px;">A expressão deve ser simples</p>
  <code style="border: 1px solid;border-radius: 8px;padding: 8px;margin-left: 16px;">$user.age > 18</code>
  <p style="margin-top: 12px;">ou uma função auto-invocada com retorno</p>
  <pre style="border: 1px solid;border-radius: 8px;padding: 8px;margin-left: 16px;margin-top:8px;margin-bottom:8px;">(() => {
const age = $user.age;
const minAge = 18;

return age > minAge;
})()</pre>

  <p><strong>Atenção</strong> para as variáveis globais do sistema para uso nas expressões:</p>
  <ul style="list-style-type: circle;margin-left: 36px;">
    <li>context</li>
    <li>valid</li>
    <li>$data</li>
    <li>$modules</li>
    <li>$variables</li>
    <li>$user</li>
  </ul>
`;

export const defaultOptionsSection = {
  key: "default-options",
  type: FieldTypeEnum.Block,
  options: {
    label: "Opções Padrão",
    card: true,
    hideCardBorder: true,
  },
  expressions: {},
  block: [],
};

export const specificOptionsSection = {
  key: "specific-options",
  type: FieldTypeEnum.Block,
  options: {
    label: "Opções Específicas",
    card: true,
    hideCardBorder: true,
  },
  expressions: {},
  block: [],
};

export const expressionsSection = {
  key: "expressions",
  type: FieldTypeEnum.Block,
  options: {
    label: "Expressões",
    card: true,
    hideCardBorder: true,
  },
  expressions: {},
  block: [],
};

export const controlSection = {
  key: "control",
  type: FieldTypeEnum.Block,
  options: {
    label: "Controle de Acesso",
    card: true,
    hideCardBorder: true,
  },
  expressions: {},
  block: [],
};

export const sharedExpressionFields = [
  {
    key: "$.expressions.modelDescription",
    type: FieldTypeEnum.Textarea,
    options: {
      label: "Documentação do modelo",
    } as InputOptions,
    expressions: {},
  },
  {
    key: "$.expressions.model",
    type: FieldTypeEnum.Textarea,
    options: {
      label: "Modelo",
      tooltip: tooltipExpressions,
      code: true,
    } as IFieldOptionsType,
    expressions: {},
  },
  {
    key: "$.expressions.visible",
    type: FieldTypeEnum.Textarea,
    options: {
      label: "Visibilidade",
      tooltip: tooltipExpressions,
      code: true,
    } as IFieldOptionsType,
    expressions: {},
  },
  {
    key: "$.expressions.valid",
    type: FieldTypeEnum.Textarea,
    options: {
      label: "Validação",
      tooltip: tooltipExpressions,
      code: true,
    } as IFieldOptionsType,
    expressions: {},
  },
  {
    key: "$.expressions.options",
    type: FieldTypeEnum.Textarea,
    options: {
      label: "Opções",
      tooltip: tooltipExpressions,
      code: true,
    } as IFieldOptionsType,
    expressions: {},
  },
];

// Common field configurations
export const keyField = {
  key: "$.key",
  type: FieldTypeEnum.Input,
  options: {
    label: "Chave",
    required: true,
    tooltip:
      "A alteração da chave só será aplicada quando fechar o menu de configurações",
  } as InputOptions,
  expressions: {},
};

export const requiredField = {
  key: "$.options.required",
  type: FieldTypeEnum.Radio,
  options: {
    label: "Campo obrigatório",
    items: [
      { label: "Sim", value: true },
      { label: "Não", value: false },
    ],
  } as IFieldOptionsType,
  expressions: {},
};

export const readOnlyField = {
  key: "$.options.readOnly",
  type: FieldTypeEnum.Radio,
  options: {
    label: "Apenas leitura",
    items: [
      { label: "Sim", value: true },
      { label: "Não", value: false },
    ],
  } as IFieldOptionsType,
  expressions: {},
};

export const enableApostilleField = {
  key: "$.options.enableEdition",
  type: FieldTypeEnum.Radio,
  options: {
    label: "Edição no Apostilamento",
    items: [
      { label: "Sim", value: true },
      { label: "Não", value: false },
    ],
  } as IFieldOptionsType,
  expressions: {},
};

export const accessLevelField = {
  key: "$.options.accessLevel",
  type: FieldTypeEnum.Select,
  options: {
    label: "Nível de acesso",
    items: [
      { label: "Público", value: PrivacyLevelEnum.PUBLIC },
      { label: "Registrado", value: PrivacyLevelEnum.REGISTERED },
      { label: "Restrito", value: PrivacyLevelEnum.RESTRICTED },
      { label: "Confidencial", value: PrivacyLevelEnum.CONFIDENTIAL },
      { label: "Anônimo", value: PrivacyLevelEnum.ANONYMIZED },
    ],
  } as IFieldOptionsType,
  expressions: {},
};

export const sensibilityLevelField = {
  key: "$.options.sensibilityLevel",
  type: FieldTypeEnum.Select,
  options: {
    label: "Nível de sensibilidade (LGPD)",
    items: [
      { label: "Não se aplica", value: 0 },
      { label: "Dados Pessoais", value: 1 },
      {
        label: "Dados Sensíveis",
        value: 2,
      },
      { label: "Dados Anonimizados", value: 3 },
    ],
    tooltip:
      "Classifique o nível de sensibilidade dos dados de acordo com a LGPD e GDPR",
  } as IFieldOptionsType,
  expressions: {},
};

export const tooltipField = {
  key: "$.options.tooltip",
  type: FieldTypeEnum.Textarea,
  options: {
    label: "Tooltip",
    placeholder: "Digite o texto de ajuda",
    tooltip:
      "<div style='width: 300px;'>As dicas podem tem o formato de HTML utilizando classes do Tailwind ou texto simples</div>",
  } as IFieldOptionsType,
  expressions: {},
};

export const documentationField = {
  key: "$.options.documentation",
  type: FieldTypeEnum.Textarea,
  options: {
    label: "Documentação",
  } as IFieldOptionsType,
  expressions: {},
};

export const placeholderField = {
  key: "$.options.placeholder",
  type: FieldTypeEnum.Input,
  options: {
    label: "Placeholder",
    required: false,
  } as InputOptions,
  expressions: {},
};

// Add after other shared fields, before commonDefaultFields
export const itemsField = {
  key: "$.options.items",
  type: FieldTypeEnum.Textarea,
  options: {
    label: "Items",
    placeholder: `label1;value1
label2
label3;value3`,
    tooltip: `Lista de items no formato CSV:
<pre style="border: 1px solid;border-radius: 8px;padding: 8px;margin: 8px 0;">
label1;value1
label2
label3;value3
label4;true
label5;42</pre>
<p style="margin-top: 8px;">
  <strong>Formato:</strong><br>
  - Uma opção por linha<br>
  - Cada linha pode ter um ou dois valores separados por ponto e vírgula (;)<br>
  - O primeiro valor é sempre a etiqueta (label) que será exibida<br>
  - O segundo valor é opcional e pode ser de qualquer tipo (string, number, boolean)<br>
  - Se apenas a etiqueta for fornecida, o valor será igual à etiqueta
</p>
<p style="margin-top: 8px;">
  <strong>Exemplos:</strong><br>
  - <code>Opção A;1</code> → label: "Opção A", value: 1 (número)<br>
  - <code>Opção B;true</code> → label: "Opção B", value: true (booleano)<br>
  - <code>Opção C</code> → label: "Opção C", value: "Opção C" (mesmo valor)<br>
  - <code>Opção D;"123"</code> → label: "Opção D", value: "123" (string)
</p>`,
  } as IFieldOptionsType,
  expressions: {},
};

// Common groups of fields for selection types
export const selectionDefaultFields = [
  keyField,
  requiredField,
  readOnlyField,
  enableApostilleField,
  tooltipField,
  documentationField,
  accessLevelField,
  itemsField,
];

// Common groups of fields
export const commonDefaultFields = [
  keyField,
  requiredField,
  readOnlyField,
  tooltipField,
  documentationField,
  enableApostilleField,
];

export const controlDefaultFields = [accessLevelField, sensibilityLevelField];
