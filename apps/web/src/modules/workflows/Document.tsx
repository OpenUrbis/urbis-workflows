import {
  IconButton,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Step,
  StepIcon,
  StepIndicator,
  StepNumber,
  Stepper,
  StepSeparator,
  StepStatus,
  StepTitle,
  Tag,
  useDisclosure,
  useSteps,
} from "@chakra-ui/react";
import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { FaDownload, FaExpand } from "react-icons/fa";
import { RiBarcodeFill } from "react-icons/ri";
import { useNavigate, useParams } from "react-router-dom";
import { IField } from "@open-urbis/types";
import logoCityHallImg from "../../assets/logo_white.png";
import { useSnackbar } from "../../hooks/snackbar";
import { StyleContext } from "../../reducers";
import { Field } from "../workflows-schema";
import { VersionsMenu } from "../workflows-schema/components/VersionsMenu";
import { FieldView } from "../workflows-schema/form-engine/FieldView";
import { parseFunctions } from "../workflows-schema/form-engine/utils/parsers";
import { Protocol } from "../../types/global";

export function Document(): JSX.Element {
  const snackbar = useSnackbar();
  const styleContext = useContext(StyleContext);
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [protocol, setProtocol] = useState<Protocol | undefined>(undefined);
  const [maxStepEnable, setMaxStepEnable] = useState(0);
  const [acceptance, setAcceptance] = useState<any>(null);
  const [acceptanceForm, setAcceptanceForm] = useState<any>({});
  const [acceptanceValid, setAcceptanceValid] = useState<any>({});
  const [openedAcceptance, setOpenedAcceptance] = useState<any>({});
  const [selectedVersion, setSelectedVersion] = useState<{
    version: number;
    diff?: any;
    field?: IField;
    protocol?: any;
  }>();
  const { activeStep, setActiveStep } = useSteps({
    index: 1,
    count: 4,
  });
  const { isOpen, onOpen, onClose } = useDisclosure();

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

    if (response.data.status === "WAITING_ACCEPTANCE") {
      setMaxStepEnable(1);
    } else if (response.data.status === "WAITING_TAX_PAYMENT") {
      setActiveStep(2);
      setMaxStepEnable(2);
    } else if (response.data.status === "CONCLUDED") {
      setActiveStep(3);
      setMaxStepEnable(3);
    }

    setAcceptance(null);

    response.data.acceptances.forEach((acceptance: any) => {
      if (
        acceptance.status === "PENDING" &&
        acceptance.document === response.data.$user.document
      ) {
        setAcceptance(acceptance);
      }
    });

    setLoading(false);
  };

  const handleFetchProtocolVersion = async (version: number) => {
    setLoading(true);

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACK_END_API}/protocols/${id}/versions/${version}`,
        {
          headers: {
            authorization: `${localStorage.getItem("token")}`,
          },
        }
      );

      setSelectedVersion({
        version,
        diff: response.data.diff,
        protocol: response.data.protocol,
        field: response.data.field,
      });
    } catch (e) {
      snackbar.error("Não foi buscar a versão");
      setLoading(false);
    }

    setLoading(false);
  };

  const handleExtraApostille = async () => {
    navigate(`/apostille-extra/${id}`);
  };

  const handleApostille = async () => {
    navigate(`/apostille/${id}`);
  };

  const handleAccept = async () => {
    setLoading(true);

    try {
      await axios.put(
        `${import.meta.env.VITE_BACK_END_API}/protocols/acceptance/${acceptance.id}/accept`,
        {
          ...acceptanceForm,
        },
        {
          headers: {
            authorization: `${localStorage.getItem("token")}`,
          },
        }
      );

      fetchProtocol();
    } catch (e) {
      snackbar.error("Não foi possível realizar o aceite");
      setLoading(false);
    }
  };

  const mockCallPayment = async () => {
    setLoading(true);

    const response = await axios.get(
      `${import.meta.env.VITE_BACK_END_API}/protocols/tax/${id}/browser`,
      {
        headers: {
          authorization: `${localStorage.getItem("token")}`,
        },
      }
    );

    const link = document.createElement("a");
    link.href = response.data.tax;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();

    await axios.put(
      `${import.meta.env.VITE_BACK_END_API}/protocols/mock/pay-tax/${id}`,
      {},
      {
        headers: {
          authorization: `${localStorage.getItem("token")}`,
        },
      }
    );

    fetchProtocol();
  };

  const downloadDocument = async (version?: number) => {
    setLoading(true);
    const response = await axios.get(
      `${import.meta.env.VITE_BACK_END_API}/protocols/document/${id}/browser`,
      {
        params: {
          version,
        },
        headers: {
          authorization: `${localStorage.getItem("token")}`,
        },
      }
    );
    setLoading(false);

    const link = document.createElement("a");
    link.href = response.data.document;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
  };

  const downloadPlate = async (version?: number) => {
    setLoading(true);
    const response = await axios.get(
      `${import.meta.env.VITE_BACK_END_API}/protocols/plate/${id}/browser`,
      {
        params: {
          version,
        },
        headers: {
          authorization: `${localStorage.getItem("token")}`,
        },
      }
    );
    setLoading(false);

    const link = document.createElement("a");
    link.href = response.data.plate;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
  };

  useEffect(() => {
    fetchProtocol();
  }, []);

  const COLOR_MAPPER: { [key: string]: string } = {
    PENDING: "gray",
    ACCEPTED: "green",
    REJECTED: "red",
  };

  const LABEL_MAPPER: { [key: string]: string } = {
    PENDING: "Pendente",
    ACCEPTED: "Aceito",
    REJECTED: "Rejeitado",
  };

  const formVersions = protocol
    ? protocol.versions.filter(
        (version) => version.type === "apostille" || version.type === "create"
      )
    : [{ version: 1 }];

  if (!loading) {
    return (
      <div className="flex space-y-6 justify-center px-6 mb-24">
        <div
          className="flex flex-col mx-6 md:mx-0 justify-center space-y-4"
          style={{ width: window.innerWidth <= 500 ? "auto" : "882px" }}
        >
          <h1 className="text-2xl md:text-3xl font-black text-center pt-6">
            {protocol?.field.options.title}
          </h1>
          <h2 className="text-lg md:text-xl font-bold text-center pb-6">
            Pedido: {id}
          </h2>

          <div className="flex justify-end space-x-4 pb-6">
            {protocol?.status === "CONCLUDED" && (
              <>
                <div className="text-end x">
                  <button
                    className={`bg-yellow-600 hover:bg-yellow-700 text-white text-lg px-6 py-2 rounded-md disabled:opacity-80`}
                    onClick={handleExtraApostille}
                  >
                    Ex Officio
                  </button>
                </div>
                <div className="text-end">
                  <button
                    className={`bg-yellow-600 hover:bg-yellow-700 text-white text-lg px-6 py-2 rounded-md disabled:opacity-80`}
                    onClick={handleApostille}
                  >
                    Apostilar
                  </button>
                </div>
              </>
            )}
          </div>

          <Stepper
            size="lg"
            colorScheme="red"
            orientation={window.innerWidth <= 500 ? "vertical" : "horizontal"}
            index={activeStep}
          >
            <Step>
              <StepIndicator
                className="cursor-pointer"
                onClick={() => setActiveStep(0)}
              >
                <StepStatus
                  complete={<StepIcon />}
                  incomplete={<StepNumber />}
                  active={<StepNumber />}
                />
              </StepIndicator>
              <StepTitle>Pedido</StepTitle>
              <StepSeparator></StepSeparator>
            </Step>
            <Step>
              <StepIndicator
                className="cursor-pointer"
                onClick={() => setActiveStep(1)}
              >
                <StepStatus
                  complete={<StepIcon />}
                  incomplete={<StepNumber />}
                  active={<StepNumber />}
                />
              </StepIndicator>
              <StepTitle>Aceites</StepTitle>
              <StepSeparator></StepSeparator>
            </Step>
            <Step>
              <StepIndicator
                className="cursor-pointer"
                onClick={() => setActiveStep(2)}
              >
                <StepStatus
                  complete={<StepIcon />}
                  incomplete={<StepNumber />}
                  active={<StepNumber />}
                />
              </StepIndicator>
              <StepTitle>Taxa</StepTitle>
              <StepSeparator></StepSeparator>
            </Step>
            <Step>
              <StepIndicator
                className="cursor-pointer"
                onClick={() => setActiveStep(3)}
              >
                <StepStatus
                  complete={<StepIcon />}
                  incomplete={<StepNumber />}
                  active={<StepNumber />}
                />
              </StepIndicator>
              <StepTitle>Documento</StepTitle>
              <StepSeparator></StepSeparator>
            </Step>
          </Stepper>

          {/* Protocol */}
          {activeStep === 0 && protocol && (
            <>
              <div className="flex ">
                <div className="flex-grow"></div>
                <VersionsMenu
                  defaultVersion={
                    selectedVersion ?? formVersions[formVersions.length - 1]
                  }
                  versions={formVersions}
                  callback={(version) => handleFetchProtocolVersion(version)}
                ></VersionsMenu>
              </div>
              <FieldView
                context={protocol.protocol}
                general={{
                  $user: protocol.$user,
                  $variables: protocol.environment,
                  $data: protocol.protocol,
                  $modules: parseFunctions(protocol?.function ?? {}),
                  $history: selectedVersion?.diff ?? protocol.diff,
                  $state: "view",
                }}
                field={selectedVersion?.field ?? protocol.field}
                value={selectedVersion?.protocol ?? protocol.protocol}
              ></FieldView>
            </>
          )}

          {/* Acceptance  */}
          {activeStep === 1 && protocol && acceptance?.status === "PENDING" && (
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-center py-6">
                Realize o aceite como {acceptance.type}
              </h1>
              <Field
                context={acceptanceForm}
                validContext={acceptanceValid}
                general={{
                  $user: protocol.$user as any,
                  $variables: protocol.environment,
                  $data: acceptanceForm,
                  $modules: parseFunctions(protocol?.function ?? {}),
                  $state: "create",
                }}
                field={
                  protocol.acceptance[
                    Object.keys(protocol.acceptance).find((key) =>
                      key.includes(acceptance.type)
                    ) as string
                  ]
                }
                value={acceptanceForm}
                valid={acceptanceValid}
                onChange={(value) => {
                  setAcceptanceForm(value);
                }}
                onValidChange={(valid) => {
                  setAcceptanceValid(valid);
                }}
              ></Field>
              <div className="text-center">
                <button
                  className={`bg-yellow-600 hover:bg-yellow-700 text-white text-lg px-6 py-2 rounded-md disabled:opacity-80`}
                  onClick={handleAccept}
                >
                  Aceitar
                </button>
              </div>
            </div>
          )}

          {activeStep === 1 && (
            <h1 className="text-xl md:text-2xl font-bold text-center py-6">
              Lista dos Aceites
            </h1>
          )}

          {activeStep === 1 &&
            protocol?.acceptances &&
            protocol.acceptances.map((acceptance) => {
              return (
                <div className="flex flex-col border rounded-md p-6">
                  <div className="flex space-x-6">
                    <div className="flex flex-col space-y-2">
                      <div>
                        CPF:{" "}
                        <span className="font-black ">
                          {acceptance.document}
                        </span>
                      </div>
                      {acceptance.document !== acceptance.represented && (
                        <div>
                          Representado:{" "}
                          <span className="font-black ">
                            {acceptance.represented}
                          </span>
                        </div>
                      )}
                      <div>
                        Relação:{" "}
                        <span className="font-bold">{acceptance.type}</span>
                      </div>
                      <div>
                        Emitido em:{" "}
                        <span className="font-black">
                          {new Date(acceptance.timestamp).toLocaleString(
                            "pt-br"
                          )}
                        </span>
                      </div>
                      <div>
                        Atualizado em:{" "}
                        <span className="font-black">
                          {new Date(acceptance.updatedAt).toLocaleString(
                            "pt-br"
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="flex-grow"></div>
                    <div className="flex flex-col space-y-6">
                      <div className="flex justify-end">
                        <Tag
                          size={"lg"}
                          color={COLOR_MAPPER[acceptance.status as any]}
                        >
                          {LABEL_MAPPER[acceptance.status as any]}
                        </Tag>
                      </div>
                      {acceptance.status === "ACCEPTED" && (
                        <div
                          onClick={() => {
                            onOpen();
                            setOpenedAcceptance(acceptance);
                          }}
                          className="flex items-center space-x-2 cursor-pointer"
                        >
                          <FaExpand
                            title="Mostrar formulário de aceite"
                            size={20}
                            className="cursor-pointer"
                          ></FaExpand>
                          <span className="">Ver dados do aceite</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

          {protocol && (
            <Modal isOpen={isOpen} onClose={onClose}>
              <ModalOverlay />
              <ModalContent
                className="px-4 py-6"
                style={{ minWidth: 685, maxHeight: "80vh" }}
                bg={styleContext.state.backgroundColor}
              >
                <ModalHeader>Dados do Aceite</ModalHeader>
                <ModalCloseButton />
                <ModalBody overflowY="auto" wordBreak="break-word">
                  <FieldView
                    context={openedAcceptance.value}
                    field={protocol.acceptance[openedAcceptance.type]}
                    general={{
                      $user: protocol.$user,
                      $variables: protocol.environment,
                      $data: openedAcceptance.value,
                      $modules: parseFunctions(protocol?.function ?? {}),
                      $state: "view",
                    }}
                    value={openedAcceptance.value}
                  ></FieldView>
                </ModalBody>
              </ModalContent>
            </Modal>
          )}

          {/* Tax */}
          {activeStep === 2 && maxStepEnable < 2 && (
            <div className="flex flex-col space-y-4 justify-center text-center pt-6">
              <p className="text-lg">
                É necessário realizar todos os aceites para liberar o pagamento
                da taxa.
              </p>
            </div>
          )}

          {activeStep === 2 && maxStepEnable >= 2 && (
            <div className="flex flex-col space-y-4 justify-center text-center pt-6">
              <p className="text-lg">
                Pague a taxa abaixo para liberar seu documento. Caso já pagou
                aguarde até dois dias úteis para seu pagamento ser processado.
              </p>
              <p className="text-lg">
                Assim que identificarmos seu pagamento, enviaremos um e-mail com
                o seu documento e também poderá consultar aqui acessando o seu
                protocolo por "Pedidos".
              </p>
              <div
                className="bg-yellow-600 hover:bg-yellow-700 text-white text-xl py-4 px-6 rounded-xl disabled:opacity-80 cursor-pointer"
                onClick={mockCallPayment}
              >
                <RiBarcodeFill className="inline" size={42} /> Baixar boleto
              </div>
            </div>
          )}

          {/* Document */}
          {activeStep === 3 && maxStepEnable < 3 && (
            <div className="flex flex-col space-y-4 justify-center text-center pt-6">
              <p className="text-lg">
                Os seguinte documentos são prévias. Realize os aceites e
                pagamento da taxa para liberar o seu documento válido.
              </p>
            </div>
          )}

          {activeStep === 3 && (
            <div className="flex flex-col space-y-4 justify-center text-center pt-6 cursor-pointer">
              <div
                onClick={() => downloadDocument()}
                className="bg-yellow-600 hover:bg-yellow-700 text-white text-xl py-4 px-6 rounded-xl disabled:opacity-80"
              >
                <img
                  className="inline mr-2"
                  src={logoCityHallImg}
                  alt=""
                  width="30px"
                />{" "}
                Baixar documento
              </div>
            </div>
          )}
          {activeStep === 3 && protocol?.plate && (
            <div className="flex flex-col space-y-4 justify-center text-center cursor-pointer">
              <div
                onClick={() => downloadPlate()}
                className="bg-yellow-600 hover:bg-yellow-700 text-white text-xl py-4 px-6 rounded-xl disabled:opacity-80"
              >
                <img
                  className="inline mr-2"
                  src={logoCityHallImg}
                  alt=""
                  width="30px"
                />{" "}
                Baixar placa
              </div>
            </div>
          )}
          {activeStep === 3 && protocol && (
            <>
              {protocol?.integrations?.register?.sei?.LinkAcesso && (
                <div className="flex space-x-2">
                  <span>Processo SEI:</span>
                  <a
                    className="text-blue-500"
                    href={protocol?.integrations?.register?.sei?.LinkAcesso}
                    target="__blank"
                  >
                    Acesse Aqui
                  </a>
                </div>
              )}
              <div className="grid grid-cols-4 gap-4 bg-gray-100 p-4 pt-10">
                <div className="font-bold">Tipo</div>
                <div className="font-bold">Mudança</div>
                <div className="font-bold">Autor</div>
                <div className="font-bold">Data</div>
                {protocol.versions
                  .sort(
                    (a, b) =>
                      new Date(a.timestamp).getTime() -
                      new Date(b.timestamp).getTime()
                  )
                  .map((version, index) => (
                    <React.Fragment key={index}>
                      <div className="py-2 border-b border-gray-300">
                        {version.type}
                        {version.type === "document" && (
                          <IconButton
                            size={"sm"}
                            aria-label="Retry Preset"
                            icon={<FaDownload />}
                            onClick={() => downloadDocument(version.version)}
                            className="ml-2"
                            disabled={loading}
                          />
                        )}
                        {version.type === "plate" && (
                          <IconButton
                            size={"sm"}
                            aria-label="Retry Preset"
                            icon={<FaDownload />}
                            onClick={() => downloadPlate(version.version)}
                            className="ml-2"
                            disabled={loading}
                          />
                        )}
                      </div>
                      <div className="py-2 border-b border-gray-300">
                        {version.commitMessage}
                      </div>
                      <div className="py-2 border-b border-gray-300">
                        {version.createdBy}
                      </div>
                      <div className="py-2 border-b border-gray-300">
                        {new Date(version.timestamp).toLocaleString("pt-br")}
                      </div>
                    </React.Fragment>
                  ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  } else {
    return (
      <div className="pt-10 text-center">
        <Spinner size="xl" />
      </div>
    );
  }
}
