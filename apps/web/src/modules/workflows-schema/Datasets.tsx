import { getAccessToken } from "../../auth/token";
import React, { FormEvent, useContext, useEffect, useState } from "react";
import { FaPlus, FaRetweet, FaTrash, FaSave, FaDatabase } from "react-icons/fa";
import { SL } from "../../components";
import {
  Spinner,
  Table,
  TableContainer,
  Tag,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react";
import EditableHeader from "../../components/EditableHeader";
import { HotkeyContext } from "../../reducers/hotkeys.reducer";
import { AddDataset } from "./components/AddDataset";
import { Upload } from "./form-engine/fields";
import { useSnackbar } from "../../hooks/snackbar";
import { ApiClient } from "../../api";
import { StyleContext } from "../../reducers/style.reducer";
import { TreeList } from "./components/TreeList";
import {
  DatasetsEntity,
  CreateDatasetHttpDto,
} from "../../api/types/datasets.dto";

const api = new ApiClient({
  baseURL: import.meta.env.VITE_BACK_END_API || "",
  headers: {
    Authorization: `Bearer ${getAccessToken()}`,
  },
});

export type DatasetConfig = DatasetsEntity & {
  inserted?: number;
  total?: number;
  sample?: any[];
};

// Mapper function to transform datasets into TreeItems
const mapDatasetsToTreeItems = (datasets: DatasetConfig[]) => {
  return datasets.map(({ id, title, description, ...rest }) => ({
    id,
    label: title,
    namespace: "",
    title,
    description,
    ...rest,
  }));
};

export const Datasets: React.FC = () => {
  const hotkeyContext = useContext(HotkeyContext);
  const snackbar = useSnackbar();
  const styleContext = useContext(StyleContext);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [datasets, setDatasets] = useState<DatasetConfig[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<DatasetConfig | null>(
    null
  );
  const [addingDataset, setAddingDataset] = useState(false);

  const fetchDatasets = async () => {
    try {
      const response = await api.datasets.findAll();
      setDatasets(response);
    } catch (error) {
      console.error(error);
      snackbar.error("Erro ao carregar datasets");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDatasets();
    
  }, []);

  useEffect(() => {
    hotkeyContext.dispatch({
      type: "SET_HOTKEY",
      payload: {
        N: (e) => !loading && handleAddDatasetForm(e),
      },
    });

    return () => {
      hotkeyContext.dispatch({
        type: "UNSET_HOTKEY",
        delete: ["N"],
      });
    };
    
  }, [loading, hotkeyContext]);

  const searchCallback = (search: string) => {
    setSearch(search);
  };

  const selectDatasetCallback = async (datasetConfig: DatasetConfig) => {
    if (datasetConfig?.id) {
      setLoading(true);
      try {
        const dataset = await api.datasets.findOne(datasetConfig.id);
        setSelectedDataset(dataset);
        setAddingDataset(false);
      } catch (error) {
        console.error(error);
        snackbar.error("Erro ao carregar dataset");
      }
      setLoading(false);
    }
  };

  const handleSetDataset = (key: string, value: any) => {
    if (selectedDataset) {
      setSelectedDataset((prev) => ({
        ...prev!,
        [key]: value,
      }));
    }
  };

  const handleAddDatasetForm = (e: FormEvent | undefined) => {
    e?.preventDefault();
    setSelectedDataset(null);
    setAddingDataset(true);
  };

  const handleSaveDataset = async () => {
    if (selectedDataset?.id) {
      setLoading(true);
      try {
        const dataset: CreateDatasetHttpDto = {
          title: selectedDataset.title,
          description: selectedDataset.description,
          link: selectedDataset.link,
        };

        await api.datasets.update(selectedDataset.id, dataset);
        await fetchDatasets();
        snackbar.success("Dataset atualizado com sucesso");
      } catch (error) {
        console.error(error);
        snackbar.error("Erro ao atualizar dataset");
      }
      setLoading(false);
    }
  };

  const handleAddDataset = async (newDataset: CreateDatasetHttpDto) => {
    setLoading(true);
    try {
      const dataset: CreateDatasetHttpDto = {
        title: newDataset.title,
        description: newDataset.description,
        link: newDataset.link,
      };

      await api.datasets.create(dataset);
      await fetchDatasets();
      setAddingDataset(false);
      snackbar.success("Dataset criado com sucesso");
    } catch (error) {
      console.error(error);
      snackbar.error("Erro ao criar dataset");
    }
    setLoading(false);
  };

  const handleRemoveDataset = async () => {
    if (selectedDataset?.id) {
      const response = await confirmation(
        "Tem certeza que deseja remover este dataset?"
      );

      if (!response) {
        return;
      }

      try {
        setLoading(true);
        await api.datasets.remove(selectedDataset.id);
        await fetchDatasets();
        setSelectedDataset(null);
        snackbar.success("Dataset removido com sucesso");
      } catch (error) {
        console.error(error);
        snackbar.error("Erro ao remover dataset");
      }
      setLoading(false);
    }
  };

  const handleRetry = async () => {
    if (selectedDataset?.id) {
      setLoading(true);
      try {
        await api.datasets.createTable({ id: selectedDataset.id });
        snackbar.success("Dataset criado com sucesso");
      } catch (error) {
        console.error(error);
        snackbar.error("Erro ao criar dataset");
      }
      setLoading(false);
    }
  };

  const headers = Object.keys(selectedDataset?.sample?.[0] ?? {});

  return (
    <div className="flex flex-col space-y-6 mb-24 px-20 min-h-[80vh]">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-medium text-left">
          Base de dados
        </h1>
        <button
          className="flex items-center space-x-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors duration-200 font-medium"
          onClick={handleAddDatasetForm}
          disabled={loading}
        >
          <FaPlus size={16} />
          <span>Base de dados</span>
          <span className="text-sm opacity-75 ml-2">
            <SL bg="yellow.600">N</SL>
          </span>
        </button>
      </div>

      <div className="flex flex-grow border rounded-lg shadow-sm overflow-hidden">
        <div
          className="w-3/12 border-r"
          style={{
            borderColor:
              styleContext.state.buttonHoverColorWeight === "200"
                ? "#E5E7EB"
                : "#374151",
          }}
        >
          <TreeList
            items={mapDatasetsToTreeItems(datasets)}
            search={search}
            onClick={(item) => selectDatasetCallback(item as DatasetConfig)}
            onSearchChange={searchCallback}
            icon={FaDatabase}
            iconColor="blue"
          />
        </div>
        <div className="flex flex-col p-6 w-9/12">
          {loading && (
            <div className="flex-grow flex items-center justify-center">
              <Spinner size="xl" />
            </div>
          )}
          {!loading && selectedDataset === null && addingDataset && (
            <AddDataset onAddDataset={handleAddDataset} />
          )}
          {!loading && selectedDataset === null && !addingDataset && (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <FaDatabase size={48} className="mb-4 opacity-50" />
              <p className="text-xl font-medium mb-2">
                Nenhuma base de dados selecionada
              </p>
              <p className="text-sm mb-6">
                Selecione uma base de dados da lista ao lado ou crie uma nova
              </p>
              <button
                className="flex items-center space-x-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors duration-200 font-medium"
                onClick={handleAddDatasetForm}
              >
                <FaPlus size={16} />
                <span>Base de dados</span>
                <span className="text-sm opacity-75 ml-2">
                  <SL bg="yellow.600">N</SL>
                </span>
              </button>
            </div>
          )}
          {!loading && selectedDataset !== null && (
            <>
              <div className="flex flex-col mx-auto w-full mb-8">
                <div className="flex items-start justify-between">
                  <div className="flex-grow flex flex-col items-center">
                    <EditableHeader
                      value={selectedDataset.title}
                      onTextChange={(text) => handleSetDataset("title", text)}
                      className="text-xl md:text-3xl font-black text-center mb-3"
                    />
                    <EditableHeader
                      value={selectedDataset.description}
                      onTextChange={(text) =>
                        handleSetDataset("description", text)
                      }
                      className="text-gray-600 dark:text-gray-400 text-center"
                    />
                  </div>
                </div>
              </div>

              <div className="w-4/5 mx-auto">
                <div className="flex flex-col space-y-4">
                  <Tag size={"lg"} className="w-fit">
                    Inserido {selectedDataset.inserted} de{" "}
                    {selectedDataset.total}
                  </Tag>
                  <TableContainer className="border dark:border-gray-700 rounded-lg">
                    <Table>
                      <Thead>
                        <Tr>
                          {headers.map((header) => (
                            <Th key={header}>{header}</Th>
                          ))}
                        </Tr>
                      </Thead>
                      <Tbody>
                        {selectedDataset?.sample?.map((item, index) => (
                          <Tr key={index}>
                            {headers.map((header) => (
                              <Td key={header}>{item[header]}</Td>
                            ))}
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </TableContainer>

                  <Upload
                    fieldKey="dataset-uploader"
                    options={{
                      multiple: false,
                      dir: "datasets",
                      supportedExtensions: ["csv"],
                      maxSize: 2 * 1024 * 1024 * 1024, // 2 GB
                    }}
                    value={selectedDataset.link}
                    onChange={(value) => handleSetDataset("link", value)}
                  />
                </div>
              </div>

              <div className="flex-grow" />

              <div
                className="flex justify-end items-center px-8 py-4 border-t mt-8"
                style={{
                  borderColor:
                    styleContext.state.buttonHoverColorWeight === "200"
                      ? "#E5E7EB"
                      : "#374151",
                }}
              >
                <div className="flex gap-4">
                  <button
                    onClick={handleRetry}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-200"
                    style={{
                      backgroundColor:
                        styleContext.state.buttonHoverColorWeight === "200"
                          ? "#f3f4f6"
                          : "#374151",
                      color: styleContext.state.textColor,
                    }}
                  >
                    <FaRetweet className="text-sm" />
                    <span>Recriar</span>
                  </button>
                  <button
                    onClick={handleRemoveDataset}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-200"
                    style={{
                      backgroundColor:
                        styleContext.state.buttonHoverColorWeight === "200"
                          ? "#fee2e2"
                          : "#7f1d1d",
                      color:
                        styleContext.state.buttonHoverColorWeight === "200"
                          ? "#dc2626"
                          : "#fca5a5",
                    }}
                  >
                    <FaTrash className="text-sm" />
                    <span>Remover</span>
                  </button>
                </div>
              </div>

              <div className="fixed bottom-16 right-4 flex space-x-4">
                <button
                  className="px-6 py-2.5 rounded-lg shadow-lg flex items-center space-x-2 transition-colors duration-200"
                  onClick={handleSaveDataset}
                  disabled={loading}
                  style={{
                    backgroundColor:
                      styleContext.state.buttonHoverColorWeight === "200"
                        ? "#ca8a04"
                        : "#854d0e",
                    color: "#ffffff",
                  }}
                >
                  <FaSave size={14} />
                  <span>Salvar</span> <SL bg="yellow.600">S</SL>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
