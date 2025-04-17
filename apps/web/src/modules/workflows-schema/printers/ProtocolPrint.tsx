import axios from "axios";
import { useLocation, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { parseFunctions } from "../form-engine/utils/parsers";
import { FieldView } from "../form-engine/FieldView";
import { Protocol } from "../../../types/global";

export const ProtocolPrint = (): JSX.Element => {
  const { id } = useParams();
  const location = useLocation();
  const [protocol, setProtocol] = useState<Protocol>();

  const fetchSubject = async () => {
    try {
      const queryParams = new URLSearchParams(location.search);
      const redact = queryParams.get("redact") === "true";
      const apiUrl = redact
        ? `${import.meta.env.VITE_BACK_END_API}/protocols/api/${id}/redact`
        : `${import.meta.env.VITE_BACK_END_API}/protocols/api/${id}`;

      const response = await axios.get(apiUrl, {
        headers: {
          apiKey: localStorage.getItem("apiKey"),
        },
      });

      delete response.data.id;

      setProtocol(response.data);
    } catch (e) {
      console.warn(e);
    }
  };

  useEffect(() => {
    fetchSubject();
  }, []);

  const pdfPageStyle: React.CSSProperties = {
    minWidth: "794px",
    minHeight: "1123px",
    overflow: "auto",
    boxSizing: "border-box",
    backgroundColor: "white",
  };

  const isAllLoaded = !!protocol;

  if (protocol) {
    return (
      <div id={isAllLoaded ? "waitNoMore" : undefined} style={pdfPageStyle}>
        <div className="flex-col space-y-10 p-10">
          <FieldView
            context={protocol.protocol}
            general={{
              $user: protocol.$user,
              $variables: protocol.environment,
              $data: protocol.protocol,
              $modules: parseFunctions(protocol?.function ?? {}),
              $state: "view",
            }}
            field={protocol.field}
            value={protocol.protocol}
          ></FieldView>
        </div>
      </div>
    );
  } else {
    return <></>;
  }
};
