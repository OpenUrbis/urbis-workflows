export const isValidJsonStr = (value: any) => {
  try {
    JSON.parse(value);

    return true;
  } catch (_err) {
    //console.error(_err);
    return false;
  }
};

export const isValidJsonAny = (value: any) => {
  if (typeof value !== "object") return false;
  let result = false;

  try {
    JSON.stringify(value);
    result = true;
  } catch (_err) {
    console.error("Error on stringfy", _err);
  }

  if (result) return result;

  try {
    JSON.parse(value);

    return true;
  } catch (_err) {
    console.error(_err);
    return false;
  }
};

export const removeDuplicates = (arr: any[]) => {
  return [...new Set(arr)];
};
