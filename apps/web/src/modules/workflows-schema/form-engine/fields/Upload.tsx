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

// Helper to get friendly file name
const getFriendlyFileName = (filename: string) => {
  // Extract just the actual file name without path and timestamp
  const parts = filename.split("/");
  const actualFileName = parts[parts.length - 1];

  // Remove timestamp prefix if it exists
  return actualFileName.replace(/^\d+_/, "");
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
    Array.isArray(value) ? value : value?.length > 0 ? [value] : []
  );
  const [fileDetails, setFileDetails] = useState<{
    [filename: string]: { size: number; type: string; lastModified: number };
  }>({});
  const [inputKey, setInputKey] = useState(Date.now());
  const [isDragging, setIsDragging] = useState(false);

  const uploadFileToServer = useCallback(
    async (fileName: string, file: File) => {
      try {
        // Store file details for future reference
        setFileDetails((prev) => ({
          ...prev,
          [fileName]: {
            size: file.size,
            type: file.type,
            lastModified: file.lastModified,
          },
        }));

        const { data } = await axios.post(
          `${import.meta.env.VITE_BACK_END_API}/datasets/generate-presigned-url`,
          {
            dirName: options.dir,
            fileName: fileName,
            fileType: file.type,
          },
          {
            headers: {
              authorization: `Bearer ${getAccessToken()}`,
            },
          }
        );

        setUploadedFiles((prevFiles: string[]) => [...prevFiles, fileName]);

        await axios.put(data.url, file, {
          headers: {
            "Content-Type": file.type,
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / (progressEvent?.total ?? -1)
            );
            setUploadProgress((prevProgress) => ({
              ...prevProgress,
              [fileName]: percentCompleted,
            }));
          },
        });

        snackbar.success(
          `Arquivo ${getFriendlyFileName(fileName)} carregado com sucesso`
        );
      } catch (error) {
        console.log(error);
        snackbar.error(`Falha ao carregar ${getFriendlyFileName(fileName)}`);

        // Remove failed upload from list
        setUploadedFiles((prev) => prev.filter((f) => f !== fileName));
      }
    },
    [snackbar, options.dir]
  );

  const handleFileUpload = useCallback(
    (files: FileList | null) => {
      if (files) {
        const validFiles = Array.from(files).filter((file) => {
          const isSizeValid = !options.maxSize || file.size <= options.maxSize;
          const isExtensionValid =
            !options.supportedExtensions ||
            options.supportedExtensions.some((ext) =>
              file.name.toLowerCase().endsWith(ext.toLowerCase())
            );

          if (!isSizeValid) {
            snackbar.error(
              `O arquivo ${file.name} ultrapassa o limite permitido de ${formatFileSize(options.maxSize || 0)}.`
            );
          }

          if (!isExtensionValid) {
            snackbar.error(
              `O arquivo ${file.name} não é de um tipo suportado. Tipos aceitos: ${options.supportedExtensions?.join(", ")}`
            );
          }

          return isSizeValid && isExtensionValid;
        });

        if (validFiles.length > 0) {
          const code = (Math.random() + 1).toString(36).substring(7);

          const filenamesWithTimestamp = validFiles.map((file) => {
            const fileName = `${code}/${new Date().getTime()}_${file.name}`;
            uploadFileToServer(fileName, file);
            return fileName;
          });

          onChange(
            options.multiple === false
              ? filenamesWithTimestamp[0]
              : filenamesWithTimestamp
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
    ]
  );

  const removeUploadedFile = (filename: string) => {
    setUploadedFiles((prevFiles) => {
      const newFiles = prevFiles.filter((file) => file !== filename);
      onChange(options.multiple === false ? "" : newFiles);
      return newFiles;
    });

    // Remove from progress and details
    setUploadProgress((prev) => {
      const newProgress = { ...prev };
      delete newProgress[filename];
      return newProgress;
    });

    setFileDetails((prev) => {
      const newDetails = { ...prev };
      delete newDetails[filename];
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
    [isReadonly]
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
    [handleFileUpload, isReadonly]
  );

  return (
    <div className="w-full">
      {/* File list */}
      {uploadedFiles.length > 0 && (
        <div className="mb-4 space-y-3">
          {uploadedFiles.map((filename) => {
            const progress = uploadProgress[filename] || 0;
            const isUploading = progress > 0 && progress < 100;
            const friendlyName = getFriendlyFileName(filename);

            return (
              <div
                key={filename}
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
                    {getFileIcon(filename)}
                  </div>
                  <div className="flex-grow min-w-0">
                    <div
                      className={`text-sm font-medium truncate`}
                      style={{ color: styleContext.state.textColor }}
                      title={friendlyName}
                    >
                      {friendlyName}
                    </div>

                    {fileDetails[filename] && (
                      <div
                        className={`text-xs ${isLightMode ? "text-gray-500" : "text-gray-400"}`}
                      >
                        {formatFileSize(fileDetails[filename].size)}
                      </div>
                    )}

                    {isUploading && (
                      <div
                        className={`mt-1 w-full h-1.5 ${isLightMode ? "bg-gray-200" : "bg-gray-700"} rounded-full overflow-hidden`}
                      >
                        <div
                          className={`h-full ${isLightMode ? "bg-yellow-500" : "bg-yellow-500"} rounded-full transition-all duration-200`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0 ml-2 space-x-2 flex items-center">
                    {!isUploading && (
                      <>
                        <button
                          onClick={() => downloadFile(options.dir, filename)}
                          className={`p-1.5 rounded-full transition-colors ${
                            isLightMode
                              ? "text-gray-500 hover:text-yellow-600 hover:bg-yellow-50"
                              : "text-gray-300 hover:text-yellow-400 hover:bg-yellow-900/20"
                          }`}
                          title="Baixar arquivo"
                        >
                          <FiDownload size={18} />
                        </button>
                        <button
                          onClick={() => removeUploadedFile(filename)}
                          className={`p-1.5 rounded-full transition-colors ${
                            isLightMode
                              ? "text-gray-500 hover:text-yellow-600 hover:bg-yellow-50"
                              : "text-gray-300 hover:text-yellow-400 hover:bg-yellow-900/20"
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
              ? "border-yellow-400 bg-yellow-50"
              : "border-yellow-600 bg-yellow-900/10"
            : isReadonly
              ? isLightMode
                ? "border-gray-300 bg-gray-100 opacity-70"
                : "border-gray-600 bg-gray-800/20 opacity-70"
              : isLightMode
                ? "border-gray-300 hover:border-yellow-400 bg-gray-50"
                : "border-gray-600 hover:border-yellow-500 bg-gray-800/10"
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
                  ? "bg-yellow-100 text-yellow-600"
                  : "bg-yellow-900/20 text-yellow-400"
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
            className={`bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors duration-150 ${
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
