import Papa from "papaparse";

export type WorkflowsExportRow = Record<string, string | number | null | undefined>;

export function exportRowsToCsv(rows: WorkflowsExportRow[]): string {
  return Papa.unparse(rows);
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function printHtmlViaIframe(html: string, delayMs = 400): Promise<void> {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.style.opacity = "0";
  iframe.setAttribute("aria-hidden", "true");
  document.body.appendChild(iframe);

  try {
    const win = iframe.contentWindow;
    const doc = win?.document;
    if (!win || !doc) throw new Error("Unable to access iframe document");

    doc.open();
    doc.write(html);
    doc.close();

    await new Promise((resolve) => setTimeout(resolve, delayMs));

    win.focus();
    win.print();

    await new Promise((resolve) => setTimeout(resolve, 1000));
  } finally {
    iframe.remove();
  }
}
