import React, { useEffect, useState } from "react";
import { IFormContext } from "@open-urbis/types";
import { Field } from "../workflows-schema/form-engine/Field";
import { parseFunctions } from "../workflows-schema/form-engine/utils/parsers";
import { removeApostilleKey } from "./Apostille";
import { Protocol } from "../../types/global";

export function ProtocolValidate(): JSX.Element {
  const [protocol, setProtocol] = useState<Protocol | undefined>(undefined);
  const [context, setContext] = useState<any>({});
  const [valid, setValid] = useState<any>({});
  const [isValid, setIsValid] = useState<boolean | undefined>();
  const [stableValid, setStableValid] = useState<any>(valid);
  const [timeoutId, setTimeoutId] = useState<number | undefined>();

  useEffect(() => {
    const targetNode = document.getElementById("data-injection");

    if (!targetNode) {
      return;
    }

    const observer = new MutationObserver((mutationsList) => {
      for (const mutation of mutationsList) {
        if (mutation.type === "childList") {
          try {
            const data = JSON.parse(mutation.target.textContent || "{}");

            data.field.options.layout = "block";

            setProtocol(data);
            setContext(removeApostilleKey(data.protocol));
          } catch (error) {
            console.error("Failed to parse injected data", error);
          }
        }
      }
    });

    observer.observe(targetNode, { childList: true });

    return () => {
      observer.disconnect();
    };
  }, []);

  function hasFalseLeaf(obj: any) {
    if (obj === false) return true;

    if (typeof obj === "object" && obj !== null) {
      if (Array.isArray(obj)) {
        for (let i = 0; i < obj.length; i++) {
          if (hasFalseLeaf(obj[i])) {
            return true;
          }
        }
      } else {
        for (const key in obj) {
          if (obj[key] !== undefined) {
            if (hasFalseLeaf(obj[key])) {
              return true;
            }
          }
        }
      }
    }

    return false;
  }

  useEffect(() => {
    if (protocol !== undefined) {
      // Clear previous timeout if valid changes again before the delay is over
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Set a delay to consider valid as stable
      const id = window.setTimeout(() => {
        setStableValid(valid);
      }, 500); // Delay of 500ms to allow valid to stabilize

      setTimeoutId(id);

      return () => clearTimeout(id);
    }
    // eslint-disable-next-line
  }, [valid, protocol]);

  useEffect(() => {
    if (hasFalseLeaf(stableValid)) {
      setIsValid(false);
    } else {
      setIsValid(true);
    }
    // eslint-disable-next-line
  }, [stableValid]);

  const general: IFormContext = protocol
    ? {
        $user: protocol.$user,
        $variables: protocol.environment,
        $data: protocol.protocol,
        $modules: parseFunctions(protocol?.function ?? {}),
        $state: (protocol as any)?.state,
      }
    : {};

  return (
    <div>
      <div id="data-injection" className="hidden"></div>
      {isValid !== undefined && (
        <div id="response">
          {JSON.stringify({ isValid, protocol: context })}
        </div>
      )}
      {protocol?.field && (
        <div className="hidden">
          <Field
            context={context}
            validContext={valid}
            general={general}
            field={protocol.field}
            value={context}
            valid={valid}
            onChange={(value) => {
              setContext(value);
            }}
            onValidChange={(valid: any) => {
              setValid(valid);
            }}
          ></Field>
          {JSON.stringify(valid)}
        </div>
      )}
    </div>
  );
}
