import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CloudUpload, X, Image, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  selectedFiles: File[];
  maxFiles?: number;
  maxFileSize?: number;
  className?: string;
}

export default function UploadDropzone({
  onFilesSelected,
  selectedFiles,
  maxFiles = 20,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  className,
}: UploadDropzoneProps) {
  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (rejectedFiles.length > 0) {
      console.warn("Some files were rejected:", rejectedFiles);
    }
    
    const newFiles = [...selectedFiles, ...acceptedFiles].slice(0, maxFiles);
    onFilesSelected(newFiles);
  }, [selectedFiles, onFilesSelected, maxFiles]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxFiles,
    maxSize: maxFileSize,
    multiple: true,
  });

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    onFilesSelected(newFiles);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={cn("space-y-4", className)}>
      <Card
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed cursor-pointer transition-colors",
          isDragActive && !isDragReject ? "border-primary bg-primary/5" : "border-border",
          isDragReject ? "border-destructive bg-destructive/5" : "",
          "hover:border-primary/50 hover:bg-muted/50"
        )}
      >
        <CardContent className="p-8 text-center">
          <input {...getInputProps()} />
          
          <div className="space-y-4">
            <div className="flex justify-center">
              {isDragReject ? (
                <AlertCircle className="h-12 w-12 text-destructive" />
              ) : (
                <CloudUpload className="h-12 w-12 text-muted-foreground" />
              )}
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium">
                {isDragActive
                  ? isDragReject
                    ? "Some files are not supported"
                    : "Drop files here"
                  : "Drag and drop photos here, or click to browse"}
              </h3>
              <p className="text-sm text-muted-foreground">
                Supports JPG, PNG, WEBP up to {formatFileSize(maxFileSize)} each
              </p>
              <p className="text-xs text-muted-foreground">
                Maximum {maxFiles} files
              </p>
            </div>
            
            {!isDragActive && (
              <Button type="button" variant="outline">
                Browse Files
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Selected Files</h4>
              <Badge variant="secondary">
                {selectedFiles.length} / {maxFiles}
              </Badge>
            </div>
            
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-2 min-w-0">
                    <Image className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
