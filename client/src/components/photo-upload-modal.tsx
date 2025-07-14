import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import UploadDropzone from "@/components/upload-dropzone";
import { Loader2 } from "lucide-react";

interface PhotoUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PhotoUploadModal({ open, onOpenChange }: PhotoUploadModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>("");

  // Fetch user albums
  const { data: albums, isLoading: albumsLoading } = useQuery({
    queryKey: ["/api/albums"],
    enabled: open,
  });

  const uploadPhotosMutation = useMutation({
    mutationFn: async ({ albumId, files }: { albumId: string; files: File[] }) => {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("photos", file);
      });

      const response = await fetch(`/api/albums/${albumId}/photos`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to upload photos");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/albums"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Photos uploaded",
        description: `${selectedFiles.length} photos have been uploaded successfully.`,
      });
      handleClose();
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: "Failed to upload photos. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleUpload = () => {
    if (!selectedAlbumId) {
      toast({
        title: "No album selected",
        description: "Please select an album to upload photos to.",
        variant: "destructive",
      });
      return;
    }

    if (selectedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one photo to upload.",
        variant: "destructive",
      });
      return;
    }

    uploadPhotosMutation.mutate({
      albumId: selectedAlbumId,
      files: selectedFiles,
    });
  };

  const handleClose = () => {
    setSelectedFiles([]);
    setSelectedAlbumId("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Photos</DialogTitle>
          <DialogDescription>
            Select an album and upload your photos. Supported formats: JPG, PNG, WEBP (max 10MB each).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Album Selection */}
          <div className="space-y-2">
            <Label htmlFor="album-select">Select Album</Label>
            {albumsLoading ? (
              <div className="flex items-center space-x-2 p-3 border rounded-md">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading albums...</span>
              </div>
            ) : (
              <Select value={selectedAlbumId} onValueChange={setSelectedAlbumId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an album" />
                </SelectTrigger>
                <SelectContent>
                  {albums && albums.length > 0 ? (
                    albums.map((album: any) => (
                      <SelectItem key={album.id} value={album.id}>
                        {album.name} ({album.photoCount || 0} photos)
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="" disabled>
                      No albums available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label>Photos</Label>
            <UploadDropzone
              onFilesSelected={setSelectedFiles}
              selectedFiles={selectedFiles}
              maxFiles={20}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={uploadPhotosMutation.isPending || !selectedAlbumId || selectedFiles.length === 0}
          >
            {uploadPhotosMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              `Upload ${selectedFiles.length} Photo${selectedFiles.length !== 1 ? 's' : ''}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}