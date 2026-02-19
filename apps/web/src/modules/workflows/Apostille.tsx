import { getAccessToken } from "../../auth/token";
import React, { useEffect, useState } from "react";
import { Spinner } from "@chakra-ui/react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { Field } from "../workflows-schema/form-engine/Field";
import { parseExpressionsVariables } from "../workflows-schema/form-engine/utils/parsers";
import { parseFunctions } from "../workflows-schema/form-engine/utils/parsers";
import { IFormContext } from "@open-urbis/types";
import { Protocol } from "../../types/global";
import { removeApostilleKey } from "./utils";

export function Apostille(): JSX.Element {
  const navigate = useNavigate();
  const { id } = useParams();
  const [protocol, setProtocol] = useState<Protocol | undefined>(undefined);
  const [context, setContext] = useState<any>({});
  const [valid, setValid] = useState<any>({});
  const [loading, setLoading] = useState(true);

  const fetchProtocol = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACK_END_API}/protocols/${id}`,
        {
          headers: {
            authorization: `${getAccessToken()}`,
          },
        }
      );

      setProtocol(response.data);
      setContext(removeApostilleKey(response.data.protocol));
    } catch (e) {
      console.log(e);
    }

    setLoading(false);
  };

  const handleApostille = async (protocol: any) => {
    const commitMessage = await prompt("Insira o motivo do apostilamento:");

    if (!commitMessage?.trim()) {
      return;
    }

    setLoading(true);

    try {
      if (protocol) {
        await axios.put(
          `${import.meta.env.VITE_BACK_END_API}/protocols/apostille/${id}`,
          {
            protocol,
            commitMessage,
          },
          {
            headers: {
              authorization: `${getAccessToken()}`,
            },
          }
        );

        navigate(`/protocol/${id}/document`);
        setLoading(false);
      }
    } catch (e) {
      setLoading(false);
    }
  };

  useEffect(() => {
    const lastStepkey = protocol?.field?.block?.[
      protocol.field.block.length - 1
    ].key as string;

    if (lastStepkey && valid?.[lastStepkey]?.$complete === true) {
      handleApostille(context);
    }
  }, [valid]);

  useEffect(() => {
    fetchProtocol();
  }, []);

  const field = protocol ? JSON.parse(JSON.stringify(protocol.field)) : {};
  const general: IFormContext = protocol
    ? {
        $user: protocol?.$user,
        $variables: protocol?.environment,
        $data: context,
        $modules: parseFunctions(protocol?.function ?? {}),
        $tree: parseExpressionsVariables(field),
        $state: "edition",
      }
    : {};

  return (
    <div className="flex flex-col space-y-6 sm:px-0 md:px-6 mt-6 mb-24">
      <div className="flex justify-center">
        <div
          className="flex flex-col justify-center mx-6 md:mx-0 justify-center space-y-4"
          style={{ width: window.innerWidth <= 500 ? "auto" : "882px" }}
        >
          {loading && (
            <div className="mt-10 text-center">
              <Spinner size="xl" />
            </div>
          )}
          {!loading && (
            <>
              <h1 className="text-2xl md:text-3xl font-black mb-6 text-center">
                {protocol?.field.options.title}
              </h1>
              <h2 className="text-lg md:text-xl font-bold text-center pb-6">
                Apostilamento de {id}
              </h2>
            </>
          )}
        </div>
      </div>

      {protocol?.field && (
        <div className={`flex justify-center ${loading ? "hidden" : ""}`}>
          <div
            className="flex flex-col mx-6 md:mx-0 justify-center space-y-4"
            style={{ width: window.innerWidth <= 500 ? "auto" : "882px" }}
          >
            <Field
              context={context}
              validContext={valid}
              general={general}
              field={field}
              value={context}
              valid={valid}
              onChange={(value) => {
                setContext(value);
              }}
              onValidChange={(valid: any) => {
                setValid(valid);
              }}
            ></Field>
          </div>
        </div>
      )}
    </div>
  );
}
