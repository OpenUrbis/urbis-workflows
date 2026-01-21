import { FormControl, FormLabel } from "@chakra-ui/react";
import { useContext, useEffect, useState } from "react";
import { Input, SL, Textarea } from "../../../components";
import { HotkeyContext } from "../../../reducers";
import { Upload } from "../form-engine/fields";
import { CreateDatasetHttpDto } from "../../../api/types/datasets.dto";
import { FaPlus } from "react-icons/fa";

export type AddDatasetProps = {
  onAddDataset: (dataset: CreateDatasetHttpDto) => void;
};

export const AddDataset: React.FC<AddDatasetProps> = ({
  onAddDataset,
}): JSX.Element => {
  const hotkeyContext = useContext(HotkeyContext);
  const [newDatasetForm, setNewDatasetForm] = useState<CreateDatasetHttpDto>({
    title: "",
    description: "",
    link: [],
  });

  useEffect(() => {
    hotkeyContext.dispatch({
      type: "SET_HOTKEY",
      payload: {
        S: () => {
          if (
            newDatasetForm.title.length > 0 &&
            newDatasetForm.description.length > 0 &&
            newDatasetForm.link.length > 0
          ) {
            onAddDataset(newDatasetForm);
          }
        },
      },
    });

    return () => {
      hotkeyContext.dispatch({
        type: "UNSET_HOTKEY",
        delete: ["S"],
      });
    };
  }, [newDatasetForm, onAddDataset, hotkeyContext]);

  return (
    <div className="w-4/5 mx-auto">
      <div className="flex flex-col mx-auto w-full mb-8">
        <div className="flex items-start justify-between">
          <div className="flex-grow flex flex-col items-center">
            <h1 className="text-xl md:text-3xl font-black text-center mb-3">
              Adicionar Base de dados
            </h1>
          </div>
        </div>
      </div>

      <div className="flex flex-col space-y-4">
        <FormControl id="title">
          <FormLabel>Título</FormLabel>
          <Input
            placeholder="Título da base de dados"
            size="lg"
            value={newDatasetForm.title}
            onChange={(e) =>
              setNewDatasetForm({
                ...newDatasetForm,
                title: e.target.value,
              })
            }
          />
        </FormControl>

        <FormControl id="description">
          <FormLabel>Descrição</FormLabel>
          <Textarea
            placeholder="Descrição da base de dados"
            size="lg"
            value={newDatasetForm.description}
            onChange={(e) =>
              setNewDatasetForm({
                ...newDatasetForm,
                description: e.target.value,
              })
            }
          />
        </FormControl>

        <FormControl id="file">
          <FormLabel>Arquivo</FormLabel>
          <Upload
            fieldKey="dataset-uploader"
            options={{
              multiple: false,
              dir: "datasets",
              supportedExtensions: ["csv"],
              maxSize: 2 * 1024 * 1024 * 1024, // 2 GB
            }}
            value={newDatasetForm.link}
            onChange={(value) =>
              setNewDatasetForm({
                ...newDatasetForm,
                link: value as string[],
              })
            }
          />
        </FormControl>
      </div>

      <div className="flex-grow" />

      <div className="fixed bottom-16 right-4 flex space-x-4">
        <button
          className="px-6 py-2.5 rounded-lg shadow-lg flex items-center space-x-2 transition-colors duration-200 bg-yellow-600 hover:bg-yellow-700 text-white disabled:opacity-80"
          disabled={
            !newDatasetForm.title ||
            !newDatasetForm.description ||
            newDatasetForm.link.length === 0
          }
          onClick={() => onAddDataset(newDatasetForm)}
        >
          <FaPlus size={14} />
          <span>Adicionar</span> <SL bg="yellow.600">S</SL>
        </button>
      </div>
    </div>
  );
};
