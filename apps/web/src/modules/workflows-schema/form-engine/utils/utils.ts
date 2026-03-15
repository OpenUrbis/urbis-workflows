import { getAccessToken } from "../../../../auth/token";
import axios from "axios";

const FILES_API_BASE =
  import.meta.env.VITE_BACK_END_FILES ?? "https://api.mapa.urbis.sampa.br";

/**
 * Fetches a signed download URL from the files API (GET /files/download-url?key=)
 * and opens it in a new tab. Uses the key returned by the upload API.
 */
export async function downloadFile(key: string) {
  try {
    const { data } = await axios.get<{ downloadURL: string }>(
      `${FILES_API_BASE}/files/download-url`,
      {
        params: { key },
        headers: {
          authorization: `Bearer ${getAccessToken() ?? ""}`,
        },
      }
    );

    const downloadLink = document.createElement("a");
    downloadLink.href = data.downloadURL;
    downloadLink.target = "_blank";
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  } catch (error) {
    console.warn(error);
  }
}
