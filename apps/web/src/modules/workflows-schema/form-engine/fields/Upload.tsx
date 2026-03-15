import { getAccessToken } from "../../../../auth/token";
import axios from "axios";
import React, { useCallback, useState, useContext } from "react";
import { useSnackbar } from "../../../../hooks/snackbar";
import { downloadFile } from "../utils/utils";
import { IField, IFormContext, UploadOptions } from "@open-urbis/types";
import {
  FiUploadCloud,
  FiDownload,
  FiTrash2,
  FiFile,
  FiImage,
  FiFileText,
  FiFilm,
  FiMusic,
  FiPackage,
} from "react-icons/fi";
import { HiOutlineDocumentText } from "react-icons/hi";
import { StyleContext } from "../../../../reducers";

export type FieldUploadProps = {
  field?: IField;
  fieldKey: string;
  onChange: (value: string[] | string) => void;
  options: UploadOptions;
  value: string[] | string;
  general?: IFormContext;
};

// Helper to get appropriate icon based on filename
const getFileIcon = (filename: string) => {
  const extension = filename.split(".").pop()?.toLowerCase();

  if (!extension) return <FiFile size={24} />;

  switch (extension) {
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
    case "webp":
      return <FiImage size={24} />;
    case "pdf":
      return <HiOutlineDocumentText size={24} />;
    case "doc":
    case "docx":
    case "txt":
      return <FiFileText size={24} />;
    case "mp4":
    case "mov":
    case "avi":
      return <FiFilm size={24} />;
    case "mp3":
    case "wav":
      return <FiMusic size={24} />;
    case "zip":
    case "rar":
      return <FiPackage size={24} />;
    default:
      return <FiFile size={24} />;
  }
};

const FILES_API_BASE =
  import.meta.env.VITE_BACK_END_FILES ?? "https://api.mapa.urbis.sampa.br";

// Helper to get friendly file name from S3 key or original name
const getFriendlyFileName = (key: string, originalName?: string) => {
  if (originalName) return originalName;
  const parts = key.split("/");
  return parts[parts.length - 1] ?? key;
};

// Helper to format file size
const formatFileSize = (size: number): string => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

export const Upload: React.FC<FieldUploadProps> = ({
  field,
  fieldKey,
  onChange,
  options,
  value,
  general,
}) => {
  const styleContext = useContext(StyleContext);
  const isLightMode = styleContext.state.buttonHoverColorWeight === "200";

  const snackbar = useSnackbar();
  const [uploadProgress, setUploadProgress] = useState<{
    [filename: string]: number;
  }>({});
  const [uploadedFiles, setUploadedFiles] = useState<string[]>(
    Array.isArray(value) ? value : value?.length > 0 ? [value] : [],
  );
  const [fileDetails, setFileDetails] = useState<{
    [key: string]: {
      size: number;
      type: string;
      lastModified: number;
      originalName?: string;
    };
  }>({});
  const [inputKey, setInputKey] = useState(Date.now());
  const [isDragging, setIsDragging] = useState(false);

  const uploadFileToServer = useCallback(
    async (file: File) => {
      let key: string | null = null;
      try {
        const { data } = await axios.post<{
          uploadURL: string;
          key: string;
        }>(
          `${FILES_API_BASE}/files/upload-url`,
          {
            contentType: file.type,
            folderPath: options.dir,
          },
          {
            headers: {
              authorization: `Bearer ${getAccessToken() ?? ""}`,
            },
          },
        );

        key = data.key;
        setFileDetails((prev) => ({
          ...prev,
          [data.key]: {
            size: file.size,
            type: file.type,
            lastModified: file.lastModified,
            originalName: file.name,
          },
        }));
        setUploadedFiles((prevFiles: string[]) => [...prevFiles, data.key]);

        await axios.put(data.uploadURL, file, {
          headers: {
            "Content-Type": file.type,
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / (progressEvent?.total ?? -1),
            );
            setUploadProgress((prevProgress) => ({
              ...prevProgress,
              [data.key]: percentCompleted,
            }));
          },
        });

        snackbar.success(
          `Arquivo ${getFriendlyFileName(data.key, file.name)} carregado com sucesso`,
        );
        return data.key;
      } catch (error) {
        console.log(error);
        snackbar.error(`Falha ao carregar ${file.name}`);
        if (key) {
          setUploadedFiles((prev) => prev.filter((k) => k !== key));
          setFileDetails((prev) => {
            const next = { ...prev };
            delete next[key!];
            return next;
          });
          setUploadProgress((prev) => {
            const next = { ...prev };
            delete next[key!];
            return next;
          });
        }
        throw error;
      }
    },
    [snackbar, options.dir],
  );

  const handleFileUpload = useCallback(
    async (files: FileList | null) => {
      if (!files) return;
      const validFiles = Array.from(files).filter((file) => {
        const isSizeValid = !options.maxSize || file.size <= options.maxSize;
        const isExtensionValid =
          !options.supportedExtensions ||
          options.supportedExtensions.some((ext) =>
            file.name.toLowerCase().endsWith(ext.toLowerCase()),
          );

        if (!isSizeValid) {
          snackbar.error(
            `O arquivo ${file.name} ultrapassa o limite permitido de ${formatFileSize(options.maxSize || 0)}.`,
          );
        }

        if (!isExtensionValid) {
          snackbar.error(
            `O arquivo ${file.name} não é de um tipo suportado. Tipos aceitos: ${options.supportedExtensions?.join(", ")}`,
          );
        }

        return isSizeValid && isExtensionValid;
      });

      if (validFiles.length > 0) {
        const keys: string[] = [];
        for (const file of validFiles) {
          try {
            const key = await uploadFileToServer(file);
            keys.push(key);
          } catch {
            // Error already handled in uploadFileToServer
          }
        }
        if (keys.length > 0) {
          const existing = Array.isArray(value) ? value : value ? [value] : [];
          onChange(
            options.multiple === false ? keys[0] : [...existing, ...keys],
          );
        }
      }
    },
    [
      onChange,
      uploadFileToServer,
      options.maxSize,
      options.supportedExtensions,
      options.multiple,
      snackbar,
    ],
  );

  const removeUploadedFile = (key: string) => {
    setUploadedFiles((prevFiles) => {
      const newFiles = prevFiles.filter((k) => k !== key);
      onChange(options.multiple === false ? "" : newFiles);
      return newFiles;
    });

    setUploadProgress((prev) => {
      const newProgress = { ...prev };
      delete newProgress[key];
      return newProgress;
    });

    setFileDetails((prev) => {
      const newDetails = { ...prev };
      delete newDetails[key];
      return newDetails;
    });

    setInputKey(Date.now());
  };

  const isReadonly =
    options.readOnly === true ||
    (general?.$state === "edition" && options.enableEdition !== true) ||
    (options.multiple === false && uploadedFiles.length > 0);

  // Handle drag events
  const handleDrag = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (isReadonly) return;

      if (e.type === "dragenter" || e.type === "dragover") {
        setIsDragging(true);
      } else if (e.type === "dragleave") {
        setIsDragging(false);
      }
    },
    [isReadonly],
  );

  // Handle drop event
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (isReadonly) return;

      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFileUpload(e.dataTransfer.files);
      }
    },
    [handleFileUpload, isReadonly],
  );

  return (
    <div className="w-full">
      {/* File list */}
      {uploadedFiles.length > 0 && (
        <div className="mb-4 space-y-3">
          {uploadedFiles.map((key) => {
            const progress = uploadProgress[key] || 0;
            const isUploading = progress > 0 && progress < 100;
            const details = fileDetails[key];
            const friendlyName = getFriendlyFileName(
              key,
              details?.originalName,
            );

            return (
              <div
                key={key}
                className={`border rounded-lg overflow-hidden transition-all duration-200 ${
                  isLightMode
                    ? "border-gray-200 bg-white"
                    : "border-gray-700 bg-gray-800/50"
                }`}
              >
                <div className="flex items-center p-3">
                  <div
                    className={`flex-shrink-0 mr-3 ${isLightMode ? "text-gray-500" : "text-gray-300"}`}
                  >
                    {getFileIcon(friendlyName)}
                  </div>
                  <div className="flex-grow min-w-0">
                    <div
                      className={`text-sm font-medium truncate`}
                      style={{ color: styleContext.state.textColor }}
                      title={friendlyName}
                    >
                      {friendlyName}
                    </div>

                    {details && (
                      <div
                        className={`text-xs ${isLightMode ? "text-gray-500" : "text-gray-400"}`}
                      >
                        {formatFileSize(details.size)}
                      </div>
                    )}

                    {isUploading && (
                      <div
                        className={`mt-1 w-full h-1.5 ${isLightMode ? "bg-gray-200" : "bg-gray-700"} rounded-full overflow-hidden`}
                      >
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-200"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0 ml-2 space-x-2 flex items-center">
                    {!isUploading && (
                      <>
                        <button
                          onClick={() => downloadFile(key)}
                          className={`p-1.5 rounded-full transition-colors ${
                            isLightMode
                              ? "text-gray-500 hover:text-primary hover:bg-primary/10"
                              : "text-gray-300 hover:text-primary hover:bg-primary/10"
                          }`}
                          title="Baixar arquivo"
                        >
                          <FiDownload size={18} />
                        </button>
                        <button
                          onClick={() => removeUploadedFile(key)}
                          className={`p-1.5 rounded-full transition-colors ${
                            isLightMode
                              ? "text-gray-500 hover:text-primary hover:bg-primary/10"
                              : "text-gray-300 hover:text-primary hover:bg-primary/10"
                          }`}
                          title="Remover arquivo"
                          disabled={isReadonly}
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </>
                    )}
                    {isUploading && (
                      <span
                        className={`text-xs font-medium ${isLightMode ? "text-gray-600" : "text-gray-400"}`}
                      >
                        {progress}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload area */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-6 transition-all duration-200 ${
          isDragging
            ? isLightMode
              ? "border-primary bg-primary/5"
              : "border-primary bg-primary/10"
            : isReadonly
              ? isLightMode
                ? "border-gray-300 bg-gray-100 opacity-70"
                : "border-gray-600 bg-gray-800/20 opacity-70"
              : isLightMode
                ? "border-gray-300 hover:border-primary bg-gray-50"
                : "border-gray-600 hover:border-primary bg-gray-800/10"
        }`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center space-y-3 text-center">
          <div
            className={`p-3 rounded-full ${
              isDragging
                ? isLightMode
                  ? "bg-primary/10 text-primary"
                  : "bg-primary/10 text-primary"
                : isLightMode
                  ? "bg-gray-100 text-gray-500"
                  : "bg-gray-800 text-gray-300"
            }`}
          >
            <FiUploadCloud size={28} />
          </div>
          <div>
            <p
              className="text-sm font-medium"
              style={{ color: styleContext.state.textColor }}
            >
              {options.multiple === false
                ? "Anexe um arquivo"
                : "Anexe arquivos"}
            </p>
            <p
              className={`text-xs mt-1 ${isLightMode ? "text-gray-500" : "text-gray-400"}`}
            >
              {isReadonly
                ? "Limite de arquivos atingido"
                : options.supportedExtensions?.length
                  ? `Formatos aceitos: ${options.supportedExtensions.join(", ")}`
                  : "Arraste e solte ou clique para selecionar"}
            </p>
            {options.maxSize && (
              <p
                className={`text-xs ${isLightMode ? "text-gray-500" : "text-gray-400"}`}
              >
                Tamanho máximo: {formatFileSize(options.maxSize)}
              </p>
            )}
          </div>

          <label
            htmlFor={inputKey.toString()}
            className={`bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium py-2 px-4 rounded-lg transition-colors duration-150 ${
              isReadonly ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
            }`}
          >
            {options.multiple === false
              ? "Selecionar arquivo"
              : "Selecionar arquivos"}
          </label>
        </div>

        <input
          id={inputKey.toString()}
          multiple={options.multiple ?? true}
          type="file"
          accept={options.supportedExtensions
            ?.map((ext) => `.${ext}`)
            .join(",")}
          onChange={(e) => handleFileUpload(e.target.files)}
          className="hidden"
          disabled={isReadonly}
        />
      </div>
    </div>
  );
};
