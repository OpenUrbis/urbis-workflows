import React, { useState } from "react";
import {
  FaFile,
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFilePowerpoint,
  FaFileAudio,
  FaFileVideo,
  FaFileArchive,
} from "react-icons/fa";

interface ImageGalleryProps {
  uploadedFiles: string[];
}

const Skeleton = ({
  isLoaded,
  className,
  children,
}: {
  isLoaded: boolean;
  className?: string;
  children: React.ReactNode;
}) => {
  return (
    <div className={className}>
      {!isLoaded ? (
        <div className="h-full w-full animate-pulse rounded-lg bg-muted" />
      ) : (
        children
      )}
    </div>
  );
};

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  uploadedFiles,
}) => {
  const [retry, setRetry] = useState<Record<string, number>>({});
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});

  const handleImageError = (filename: string) => {
    const count = retry[filename] ? retry[filename] + 1 : 1;
    setRetry((prevRetry) => ({ ...prevRetry, [filename]: count }));
    setTimeout(() => {
      setRetry((prevRetry) => ({ ...prevRetry, [filename]: count }));
    }, 3000);
  };

  const parseExtension = (filename: string) => {
    return (filename.split(".") as any).pop().toLowerCase();
  };

  const getFileIcon = (filename: string) => {
    const ext = parseExtension(filename);
    switch (ext) {
      case "pdf":
        return <FaFilePdf size="4em" />;
      case "doc":
      case "docx":
        return <FaFileWord size="4em" />;
      case "xls":
      case "xlsx":
      case "csv":
        return <FaFileExcel size="4em" />;
      case "ppt":
      case "pptx":
        return <FaFilePowerpoint size="4em" />;
      case "mp3":
      case "wav":
      case "aiff":
        return <FaFileAudio size="4em" />;
      case "mp4":
      case "avi":
      case "mov":
        return <FaFileVideo size="4em" />;
      case "zip":
      case "rar":
      case "7z":
        return <FaFileArchive size="4em" />;
      default:
        return <FaFile size="4em" />;
    }
  };

  const isImage = (filename: string) => {
    return /\.(jpg|jpeg|png|gif)$/i.test(filename);
  };

  return (
    <div className="flex flex-wrap">
      {uploadedFiles.map((filename) => (
        <Skeleton
          isLoaded={!isImage(filename) || loaded[filename]}
          className="w-32 h-32 rounded-lg mr-4 mt-4"
        >
          {isImage(filename) ? (
            <img
              key={`${filename}-${retry[filename] || 0}`}
              src={`https://licenciamento-uploads.s3.sa-east-1.amazonaws.com/thumbnails/${filename}?retry=${
                retry[filename] || 0
              }`}
              alt={filename}
              title={filename}
              className="w-32 h-32 rounded-lg"
              onLoad={() =>
                setLoaded((prevLoaded) => ({ ...prevLoaded, [filename]: true }))
              }
              onError={() => handleImageError(filename)}
            />
          ) : (
            <div
              className="flex w-32 h-32 rounded-lg border justify-center"
              title={filename}
            >
              <div className="flex flex-col space-y-2 mt-4">
                {getFileIcon(filename)}
                <span className="font-bold text-xl text-center">
                  {parseExtension(filename)}
                </span>
              </div>
            </div>
          )}
        </Skeleton>
      ))}
    </div>
  );
};

export default ImageGallery;
