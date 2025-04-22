import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Spinner } from "@chakra-ui/react";
import { SL } from "../../components";
import axios from "axios";
import { HotkeyContext } from "../../reducers/hotkeys.reducer";
import { FieldEditable } from "../workflows-schema/form-engine/FieldEditable";
import { StyleContext } from "../../reducers";
import { parseFunctions } from "../workflows-schema/form-engine/utils/parsers";
import { Field } from "../workflows-schema";
import { IField, IFormContext } from "@open-urbis/types";
import { Protocol } from "../../types/global";
import { DocumentEditor } from "../workflows-schema/activities/documents/DocumentEditor";

export function ApostilleOfficial(): JSX.Element {
  const navigate = useNavigate();
  const { id } = useParams();
  const [protocol, setProtocol] = useState<Protocol>();
  const [context, setContext] = useState<any>({});
  const [valid, setValid] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const styleContext = useContext(StyleContext);
  const hotkeyContext = useContext(HotkeyContext);

  const fetchProtocol = async () => {
    const response = await axios.get(
      `${import.meta.env.VITE_BACK_END_API}/protocols/${id}`,
      {
        headers: {
          authorization: `${localStorage.getItem("token")}`,
        },
      }
    );

    setProtocol(response.data);
    setContext(response.data.protocol);

    setLoading(false);
  };

  const handleApostilleExtra = async () => {
    if (protocol === undefined) {
      return;
    }

    try {
      const commitMessage = await prompt(
        "Insira o motivo do extra apostilamento:"
      );

      if (!commitMessage?.trim()) {
        return;
      }

      setLoading(true);

      await axios.put(
        `${import.meta.env.VITE_BACK_END_API}/protocols/apostille/${id}/official`,
        {
          field: protocol.field,
          document: protocol.document ?? {},
          plate: protocol.plate ?? {},
          protocol: context,
          commitMessage,
        },
        {
          headers: {
            authorization: `${localStorage.getItem("token")}`,
          },
        }
      );

      navigate(`/protocol/${id}/document`);
    } catch (error) {
      console.log(error);
    }

    setLoading(false);
  };

  const handleSetSubjectAttr = (key: string, value: any) => {
    setProtocol((prev: any) => {
      const newValue = {
        ...prev,
        [key]: value,
      };
      return newValue;
    });
  };

  useEffect(() => {
    fetchProtocol();
    
  }, []);

  useEffect(() => {
    hotkeyContext.dispatch({
      type: "SET_HOTKEY",
      payload: {
        S: () => !loading && handleApostilleExtra(),
        1: () => !loading && setSubPage("subject"),
        2: () => !loading && setSubPage("homolog"),
        3: () => !loading && setSubPage("document"),
        4: () => !loading && setSubPage("plate"),
      },
    });

    return () => {
      hotkeyContext.dispatch({
        type: "UNSET_HOTKEY",
        delete: ["S", "1", "2", "3", "4"],
      });
    };
    
  }, [loading, protocol]);

  const [subPage, setSubPage] = useState("subject");
  const editionSubPage = [
    {
      label: "Formulário",
      shortcut: 1,
      onClick: () => {
        setSubPage("subject");
      },
    },
    {
      label: "Visão do munícipe",
      shortcut: 2,
      onClick: () => {
        setSubPage("homolog");
      },
    },
    {
      label: "Documento",
      shortcut: 3,
      onClick: () => {
        setSubPage("document");
      },
    },
    {
      label: "Placa",
      shortcut: 4,
      onClick: () => {
        setSubPage("plate");
      },
    },
  ];

  const general: IFormContext = {
    $user: protocol?.$user,
    $variables: protocol?.environment,
    $data: context,
    $modules: parseFunctions(protocol?.function ?? {}),
    $history: protocol?.diff,
    $commits: protocol?.versions,
    $state: "edition",
  };

  return (
    <>
      <div className="flex space-y-6 justify-center sm:px-0 md:px-6 mb-6">
        <div className="flex flex-col mx-6 md:mx-0 justify-center space-y-4 w-full">
          {loading && (
            <div className="pt-10 text-center">
              <Spinner size="xl" />
            </div>
          )}
          {!loading && (
            <div className="flex">
              <div className="flex-grow"></div>
              <div className="flex-col w-2/5">
                <h1 className="text-xl md:text-3xl font-black mb-6 text-center">
                  Apostilamento
                </h1>
                <h1 className="text-lg md:text-2xl font-black mb-2 text-center">
                  {protocol?.field.options.title}
                </h1>
                <h2 className="mb-2 text-center">
                  {protocol?.field.options.description}
                </h2>
              </div>
              <div className="flex-grow"></div>
            </div>
          )}
        </div>
      </div>

      <div className="flex w-full mb-40">
        <div
          className="flex flex-col space-y-6 border-2 "
          style={{ minWidth: "250px", width: "250px" }}
        >
          <div className="mx-0 px-0 mt-4">
            {editionSubPage.map((item) => (
              <div
                className={`px-6 py-2.5 ${
                  styleContext.state.backgroundColor === "#000000"
                    ? "hover:bg-gray-600"
                    : "hover:bg-gray-200"
                }`}
              >
                <button
                  onClick={item.onClick}
                  className="flex justify-between w-full items-center"
                >
                  {item.label} <SL>{item.shortcut}</SL>
                </button>
              </div>
            ))}
            <div className="flex-grow border-b-2 border-t-2 py-4"></div>
            <div
              className={`px-6 py-2.5 ${
                styleContext.state.backgroundColor === "#000000"
                  ? "hover:bg-gray-600"
                  : "hover:bg-gray-200"
              }`}
            >
              <button
                className="flex justify-between w-full items-center"
                disabled={loading}
                onClick={handleApostilleExtra}
              >
                Apostilar <SL>S</SL>
              </button>
            </div>
          </div>
        </div>
        {!loading && protocol && (
          <div className="flex w-full justify-center mb-48">
            {subPage === "subject" && (
              <div
                className=""
                style={{
                  width: "1100px",
                }}
              >
                <FieldEditable
                  context={context}
                  validContext={valid}
                  general={general}
                  field={protocol.field}
                  value={context}
                  valid={valid}
                  onChange={(value) => setContext(value)}
                  onValidChange={(valid) => setValid(valid)}
                  onConfigChange={(field: IField) => {
                    handleSetSubjectAttr("field", field);
                  }}
                  onRemove={() => {}}
                />
              </div>
            )}
            {subPage === "homolog" && (
              <div
                className=""
                style={{
                  width: "1100px",
                }}
              >
                <Field
                  context={context}
                  validContext={valid}
                  general={general}
                  field={protocol.field}
                  value={context}
                  valid={valid}
                  onChange={(value) => setContext(value)}
                  onValidChange={(valid) => setValid(valid)}
                />
              </div>
            )}
            {subPage === "document" && (
              <DocumentEditor
                config={protocol.document}
                context={context}
                onChange={(value) => {
                  const newSubject = {
                    ...protocol,
                    document: value,
                  };
                  setProtocol(newSubject);
                }}
                general={general}
              />
            )}
            {/* {subPage === "plate" && (
              <PlateEditor
                value={protocol.plate}
                context={context}
                onChange={(value) => {
                  const newSubject = {
                    ...protocol,
                    plate: value,
                  };
                  setProtocol(newSubject);
                }}
                general={general}
              />
            )} */}
          </div>
        )}
      </div>
    </>
  );
}
