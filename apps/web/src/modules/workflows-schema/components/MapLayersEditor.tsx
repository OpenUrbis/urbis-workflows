import React, { FC, useContext, useState } from "react";
import { IconButton, Switch } from "@chakra-ui/react";
import { StyleContext } from "../../../reducers";
import { FaPlus, FaTrash, FaMap, FaLayerGroup } from "react-icons/fa";
import { Input, Select } from "../../../components";
import { BlockPicker } from "react-color";
import { LayerDescriptor } from "../../../api/types/schema";

interface LayersEditorProps {
  layers: LayerDescriptor[];
  onSave: (value: LayerDescriptor[]) => void;
}

const getLayerIcon = () => ({
  icon: FaLayerGroup,
  color: "teal",
  label: "Camada",
  bgColor: "bg-teal-100",
  textColor: "text-teal-800",
});

const MapLayersEditor: FC<LayersEditorProps> = ({ layers, onSave }) => {
  const styleContext = useContext(StyleContext);
  const [localLayers, setLocalLayers] = useState(layers);

  const handleAddLayer = () => {
    const newLayers = [
      ...localLayers,
      {
        key: "",
        title: "",
        color: "#fffaaa",
        properties: [],
      },
    ];
    setLocalLayers(newLayers);
    onSave(newLayers);
  };

  const handleRemoveLayer = (layerIndex: number) => {
    const newLayers = localLayers.filter((_, index) => index !== layerIndex);
    setLocalLayers(newLayers);
    onSave(newLayers);
  };

  const handleSetLayerAttr = (
    layerIndex: number,
    attr: "color" | "key" | "properties" | "title",
    value: string | any
  ) => {
    const newLayers = [...localLayers];
    if (newLayers[layerIndex]) {
      newLayers[layerIndex] = {
        ...newLayers[layerIndex],
        [attr]: value,
      };
      setLocalLayers(newLayers);
      onSave(newLayers);
    }
  };

  const handleSetLayerParseProperties = (
    layerIndex: number,
    propertyIndex: number,
    attr: "label" | "key" | "includeOnPopUp",
    value: string | boolean
  ) => {
    const newLayers = [...localLayers];
    if (newLayers[layerIndex]?.properties?.[propertyIndex]) {
      newLayers[layerIndex].properties[propertyIndex] = {
        ...newLayers[layerIndex].properties[propertyIndex],
        [attr]: value,
      };
      setLocalLayers(newLayers);
      onSave(newLayers);
    }
  };

  const handleRemoveLayerParseProperties = (
    layerIndex: number,
    propertyIndex: number
  ) => {
    const newLayers = [...localLayers];
    newLayers[layerIndex].properties = newLayers[layerIndex].properties.filter(
      (_, index) => index !== propertyIndex
    );
    setLocalLayers(newLayers);
    onSave(newLayers);
  };

  const handleAddLayerParseProperties = (layerIndex: number) => {
    const newLayers = [...localLayers];
    newLayers[layerIndex].properties.push({
      label: "",
      key: "",
      includeOnPopUp: false,
    });
    setLocalLayers(newLayers);
    onSave(newLayers);
  };

  if (localLayers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 w-full">
        <FaMap size={32} className="mb-4 opacity-50" />
        <p
          className="text-xl font-medium mb-2"
          style={{ color: styleContext.state.textColor }}
        >
          Nenhuma camada cadastrada
        </p>
        <p
          className="text-sm mb-6"
          style={{ color: styleContext.state.textColor }}
        >
          Adicione uma camada usando o botão abaixo
        </p>
        <IconButton
          aria-label="Add Layer"
          icon={<FaPlus />}
          onClick={handleAddLayer}
          bg={
            styleContext.state.buttonHoverColorWeight === "200"
              ? "teal.100"
              : "teal.800"
          }
          color={
            styleContext.state.buttonHoverColorWeight === "200"
              ? "teal.800"
              : "teal.100"
          }
          _hover={{
            bg:
              styleContext.state.buttonHoverColorWeight === "200"
                ? "teal.200"
                : "teal.700",
          }}
        />
      </div>
    );
  }

  return (
    <div className="px-4">
      <div>
        {localLayers.map((layer, layerIndex) => (
          <div className="py-4 group" key={layerIndex}>
            <div className="flex items-center mb-4">
              <div className="flex items-center space-x-2 flex-1">
                <div
                  className={`px-2 py-0.5 rounded-full ${getLayerIcon().bgColor} ${getLayerIcon().textColor}`}
                >
                  <span className="text-xs font-medium">
                    Camada #{layerIndex + 1}
                  </span>
                </div>
              </div>
              <IconButton
                aria-label="Remove layer"
                icon={<FaTrash />}
                onClick={() => handleRemoveLayer(layerIndex)}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                bg={
                  styleContext.state.buttonHoverColorWeight === "200"
                    ? "gray.100"
                    : "gray.800"
                }
                color={
                  styleContext.state.buttonHoverColorWeight === "200"
                    ? "gray.600"
                    : "gray.200"
                }
                _hover={{
                  bg:
                    styleContext.state.buttonHoverColorWeight === "200"
                      ? "gray.200"
                      : "gray.700",
                }}
              />
            </div>
            <div className="flex flex-col w-full">
              <div className="flex space-x-8 w-full">
                <div className="flex flex-col space-y-4 w-full">
                  <div className="space-y-4">
                    <label>Chave da camada *</label>
                    <Select
                      placeholder="Selecione o nome da chave da camada"
                      size="lg"
                      className="flex-grow"
                      value={layer?.key}
                      onChange={(e) =>
                        handleSetLayerAttr(layerIndex, "key", e.target.value)
                      }
                    >
                      {layersKey.map((key) => (
                        <option key={key} value={key}>
                          {key}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-4">
                    <label>Título da camada *</label>
                    <Input
                      type="text"
                      placeholder="Insira o título da camada"
                      size="lg"
                      className="flex-grow"
                      value={layer?.title}
                      onChange={(e) =>
                        handleSetLayerAttr(layerIndex, "title", e.target.value)
                      }
                    />
                  </div>
                </div>
                <div className="flex">
                  <div className="space-y-4">
                    <label>Cor da camada *</label>
                    <BlockPicker
                      color={localLayers[layerIndex]?.color ?? "#fffaaa"}
                      onChangeComplete={(value) =>
                        handleSetLayerAttr(layerIndex, "color", value.hex)
                      }
                      triangle="hide"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col space-y-4 w-full mt-6">
              <h2 className="md:text-lg font-bold mb-2 w-full">
                Dados da camada
              </h2>
              {layer?.properties.map((property, propertyIndex) => (
                <div
                  className="flex space-x-4 w-full group"
                  key={propertyIndex}
                >
                  <div className="flex flex-col space-y-4 w-full">
                    <label>Etiqueta *</label>
                    <Input
                      type="text"
                      placeholder="Nome da etiqueta"
                      size="lg"
                      className="flex-grow"
                      value={property?.label}
                      onChange={(e) =>
                        handleSetLayerParseProperties(
                          layerIndex,
                          propertyIndex,
                          "label",
                          e.target.value
                        )
                      }
                    />
                  </div>
                  <div className="flex flex-col space-y-4 w-full">
                    <label>Chave *</label>
                    <Input
                      type="text"
                      placeholder="Nome da chave"
                      size="lg"
                      className="flex-grow"
                      value={property?.key}
                      onChange={(e) =>
                        handleSetLayerParseProperties(
                          layerIndex,
                          propertyIndex,
                          "key",
                          e.target.value
                        )
                      }
                    />
                  </div>
                  <div className="flex flex-col space-y-4 w-2/3">
                    <label>Incluir no Pop-up?</label>
                    <Switch
                      isChecked={!!property?.includeOnPopUp}
                      onChange={() =>
                        handleSetLayerParseProperties(
                          layerIndex,
                          propertyIndex,
                          "includeOnPopUp",
                          !property?.includeOnPopUp
                        )
                      }
                      size={"lg"}
                      colorScheme="teal"
                      className="pt-3"
                    />
                  </div>
                  <IconButton
                    aria-label="Remove data"
                    icon={<FaTrash />}
                    className="mt-11 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() =>
                      handleRemoveLayerParseProperties(
                        layerIndex,
                        propertyIndex
                      )
                    }
                    bg={
                      styleContext.state.buttonHoverColorWeight === "200"
                        ? "gray.100"
                        : "gray.800"
                    }
                    color={
                      styleContext.state.buttonHoverColorWeight === "200"
                        ? "gray.600"
                        : "gray.200"
                    }
                    _hover={{
                      bg:
                        styleContext.state.buttonHoverColorWeight === "200"
                          ? "gray.200"
                          : "gray.700",
                    }}
                  />
                </div>
              ))}

              <div className="flex justify-center pt-4">
                <IconButton
                  aria-label="Add layer property"
                  icon={<FaPlus />}
                  onClick={() => handleAddLayerParseProperties(layerIndex)}
                  bg={
                    styleContext.state.buttonHoverColorWeight === "200"
                      ? "teal.100"
                      : "teal.800"
                  }
                  color={
                    styleContext.state.buttonHoverColorWeight === "200"
                      ? "teal.800"
                      : "teal.100"
                  }
                  _hover={{
                    bg:
                      styleContext.state.buttonHoverColorWeight === "200"
                        ? "teal.200"
                        : "teal.700",
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-center mt-6">
        <IconButton
          aria-label="Add Layer"
          icon={<FaPlus />}
          onClick={handleAddLayer}
          bg={
            styleContext.state.buttonHoverColorWeight === "200"
              ? "teal.100"
              : "teal.800"
          }
          color={
            styleContext.state.buttonHoverColorWeight === "200"
              ? "teal.800"
              : "teal.100"
          }
          _hover={{
            bg:
              styleContext.state.buttonHoverColorWeight === "200"
                ? "teal.200"
                : "teal.700",
          }}
        />
      </div>
    </div>
  );
};

export default MapLayersEditor;

const layersKey = [
  "geom_apa",
  "geom_area_contaminada",
  "geom_area_envoltoria_condephaat",
  "geom_area_envoltoria_conpresp",
  "geom_area_envoltoria_iphan",
  "geom_area_manancial_billings",
  "geom_area_manancial_guarapiranga",
  "geom_area_manancial_juquery",
  "geom_bairro_ambiental",
  "geom_calcadas",
  "geom_classificacao_viaria",
  "geom_dis_dup",
  "geom_distrito",
  "geom_faixa_nao_edificavel",
  "geom_gasoduto",
  "geom_linha_alta_tensao",
  "geom_lote",
  "geom_melhoramento_viario",
  "geom_operacao_urbana",
  "geom_parque_estadual",
  "geom_parque_municipal",
  "geom_rampa_heliponto",
  "geom_remanescente_mata_atlantica",
  "geom_requalifica_centro_especial",
  "geom_requalifica_centro_geral",
  "geom_restricao_geotecnica",
  "geom_restricao_mirante_santana",
  "geom_risco_geologico",
  "geom_rppn",
  "geom_sitio_arqueologico",
  "geom_subprefeitura",
  "geom_tca",
  "geom_terra_indigena",
  "geom_tombado",
  "geom_uc",
  "geom_zoneamento_2016",
];
