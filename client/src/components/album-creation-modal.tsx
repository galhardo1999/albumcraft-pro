import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import UploadDropzone from "@/components/upload-dropzone";
import { useRouter } from "wouter";

interface AlbumCreationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AlbumCreationModal({ open, onOpenChange }: AlbumCreationModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [, navigate] = useRouter();
  const [step, setStep] = useState(1);
  const [albumData, setAlbumData] = useState({
    name: "",
    size: "A4",
    orientation: "Landscape",
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  const createAlbumMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/albums", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to create album");
      return response.json();
    },
    onSuccess: (album) => {
      queryClient.invalidateQueries({ queryKey: ["/api/albums"] });
      if (selectedFiles.length > 0) {
        uploadPhotos(album.id);
      } else {
        toast({
          title: "Album Created",
          description: "Your album has been created successfully.",
        });
        onOpenChange(false);
        navigate(`/albums/${album.id}/edit`);
      }
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create album. Please try again.",
        variant: "destructive",
      });
    },
  });

  const uploadPhotos = async (albumId: string) => {
    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append("photos", file);
    });

    try {
      const response = await fetch(`/api/albums/${albumId}/photos`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to upload photos");

      toast({
        title: "Album Created",
        description: "Your album and photos have been uploaded successfully.",
      });
      onOpenChange(false);
      navigate(`/albums/${albumId}/edit`);
    } catch (error) {
      toast({
        title: "Upload Error",
        description: "Album created but failed to upload photos. You can upload them later.",
        variant: "destructive",
      });
      onOpenChange(false);
      navigate(`/albums/${albumId}/edit`);
    }
  };

  const handleSubmit = () => {
    if (!albumData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter an album name.",
        variant: "destructive",
      });
      return;
    }

    createAlbumMutation.mutate(albumData);
  };

  const handleClose = () => {
    setStep(1);
    setAlbumData({ name: "", size: "A4", orientation: "Landscape" });
    setSelectedFiles([]);
    setUploadProgress(0);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Album</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Step 1: Album Details */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="albumName">Album Name</Label>
                <Input
                  id="albumName"
                  placeholder="Enter album name..."
                  value={albumData.name}
                  onChange={(e) => setAlbumData({ ...albumData, name: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="size">Size</Label>
                  <Select value={albumData.size} onValueChange={(value) => setAlbumData({ ...albumData, size: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A4">A4 (210 x 297mm)</SelectItem>
                      <SelectItem value="A3">A3 (297 x 420mm)</SelectItem>
                      <SelectItem value="Letter">Letter (8.5 x 11in)</SelectItem>
                      <SelectItem value="Square">Square (200 x 200mm)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="orientation">Orientation</Label>
                  <Select value={albumData.orientation} onValueChange={(value) => setAlbumData({ ...albumData, orientation: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Landscape">Landscape</SelectItem>
                      <SelectItem value="Portrait">Portrait</SelectItem>
                      <SelectItem value="Square">Square</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Photo Upload */}
          {step === 2 && (
            <div className="space-y-4">
              <Label>Upload Photos (Optional)</Label>
              <UploadDropzone
                onFilesSelected={setSelectedFiles}
                selectedFiles={selectedFiles}
                maxFiles={user?.plan === "FREE" ? 20 : 100}
              />
              
              {selectedFiles.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  {selectedFiles.length} file(s) selected
                </div>
              )}
            </div>
          )}

          {/* Upload Progress */}
          {createAlbumMutation.isPending && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Creating album...</span>
                <span className="text-sm text-muted-foreground">
                  {selectedFiles.length > 0 ? "Uploading photos..." : "Please wait..."}
                </span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-end space-x-3 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          {step === 1 ? (
            <Button onClick={() => setStep(2)}>
              Next
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              disabled={createAlbumMutation.isPending}
            >
              {createAlbumMutation.isPending ? "Creating..." : "Create Album"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
