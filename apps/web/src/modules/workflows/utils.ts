export function removeApostilleKey(obj: any) {
  if (typeof obj === "object" && obj !== null) {
    for (const key in obj) {
      if (key === "$apostille") {
        delete obj[key];
      } else if (typeof obj[key] === "object") {
        removeApostilleKey(obj[key]);
      }
    }
  }
  return obj;
}
