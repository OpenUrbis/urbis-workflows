import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function MapCallback(): JSX.Element {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);

  useEffect(() => {
    const subjectId = params.get("subject");
    const sql = params.get("sql");
    const currentUrl = new URL(window.location.href);
    const httpsUrl = `https://${currentUrl.host}${currentUrl.pathname}${currentUrl.search}`;

    if (currentUrl.protocol !== "https:") {
      window.location.href = httpsUrl;
    } else {
      navigate(`/workflows/${subjectId}/create?sql=${sql}`);
    }
    
  }, []);

  return <></>;
}

export default MapCallback;
