import axios from "axios";

export async function downloadFile(dir: string | undefined, filename: string) {
  try {
    const { data } = await axios.post(
      `${process.env.REACT_APP_BACK_END_API}/datasets/generate-download-url`,
      {
        dirName: dir,
        fileName: filename,
      },
      {
        headers: {
          authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    const downloadLink = document.createElement("a");
    downloadLink.href = data.url;
    downloadLink.target = "_blank";
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  } catch (error) {
    console.warn(error);
  }
}
