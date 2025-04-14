export interface IIntellisense {
  obj: any;
  docs?: any;
}

const MAX_DEPTH = 5; // Prevent infinite recursion

const validAndTransformKey = (
  key: string | undefined,
  useDotInStart = false
) => {
  if (!key) return key;
  const isValid = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key);
  return isValid ? `${useDotInStart ? "." : ""}${key}` : `["${key}"]`;
};

const declareProperty = (declareObj: string, obj: any, key: string) => {
  return (declareObj += `${validAndTransformKey(key)}: ${typeof obj}`);
};

const declareArray = (
  declareObj: string,
  obj: any[],
  key: string,
  depth: number
) => {
  const keyToUse = validAndTransformKey(key);
  if (!obj.length) return `${keyToUse}: any[]`;
  if (typeof obj[0] !== "object" || depth >= MAX_DEPTH) {
    return `${keyToUse}: ${typeof obj[0]}[]`;
  }
  return `${keyToUse}: Array<${subDeclare(
    declareObj,
    obj[0],
    key,
    false,
    depth + 1
  )}>`;
};

const declareObject = (
  declareObj: string,
  obj: any,
  key: string,
  useKey: boolean = true,
  depth: number = 0
) => {
  if (!obj || typeof obj !== "object") {
    const result = typeof obj === "undefined" ? "any" : typeof obj;
    return useKey ? `${validAndTransformKey(key)}: ${result}` : result;
  }

  let objType = ``;
  const processedKeys = new Set<string>();

  Object.keys(obj || {}).forEach((subKey) => {
    if (
      !processedKeys.has(subKey) &&
      obj[subKey] !== null &&
      obj[subKey] !== undefined
    ) {
      objType += `${subDeclare(
        declareObj,
        obj[subKey],
        subKey,
        true,
        depth + 1
      )};`;
      processedKeys.add(subKey);
    }
  });

  const result = objType ? `{ ${objType} }` : "any";
  if (useKey) return `${validAndTransformKey(key)}: ${result}`;
  return result;
};

const subDeclare = (
  declareObj: string,
  obj: any,
  key: string,
  useKey: boolean = true,
  depth: number = 0
): string => {
  if (!obj || depth >= MAX_DEPTH) {
    return declareProperty(declareObj, obj, key);
  }

  if (typeof obj === "object") {
    if (Array.isArray(obj)) {
      return declareArray(declareObj, obj, key, depth);
    }
    return declareObject(declareObj, obj, key, useKey, depth);
  }

  return declareProperty(declareObj, obj, key);
};

export const buildDeclarations = (data: IIntellisense) => {
  if (!data || !data.obj) {
    return "";
  }

  const { obj, docs } = data;
  let declarations = ``;

  // Add context and valid declarations first
  declarations += `/** Current form context */\n`;
  declarations += `declare const context: any;\n\n`;
  declarations += `/** Current form validation state */\n`;
  declarations += `declare const valid: any;\n\n`;

  Object.keys(obj).forEach((key) => {
    if (key !== "context" && key !== "valid") {
      if (docs?.[key] && typeof docs[key] === "string") {
        declarations += `${docs[key]}\n`;
      }
      declarations += `declare const ${subDeclare(
        "",
        obj[key],
        key,
        true,
        0
      )};\n`;
    }
  });

  return declarations;
};
