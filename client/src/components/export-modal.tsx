import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
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
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Info, FileArchive, Image as ImageIcon } from "lucide-react";

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  album: any;
}

export default function ExportModal({ open, onOpenChange, album }: ExportModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [exportFormat, setExportFormat] = useState("jpg");
  const [exportQuality, setExportQuality] = useState("72");
  const [exportProgress, setExportProgress] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  const exportMutation = useMutation({
    mutationFn: async (exportData: any) => {
      const response = await fetch(`/api/albums/${album.id}/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(exportData),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to export album");
      return response.blob();
    },
    onSuccess: (blob) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${album.name}.${exportFormat === "zip" ? "zip" : "jpg"}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setIsExporting(false);
      setExportProgress(0);
      toast({
        title: "Export Complete",
        description: "Your album has been exported successfully.",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      setIsExporting(false);
      setExportProgress(0);
      
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
        title: "Export Failed",
        description: "Failed to export album. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleExport = () => {
    if (!album) return;
    
    // Check plan limitations
    if (exportFormat === "zip" && user?.plan === "FREE") {
      toast({
        title: "Premium Feature",
        description: "ZIP export is only available for PRO and PREMIUM plans.",
        variant: "destructive",
      });
      return;
    }
    
    if (parseInt(exportQuality) > 72 && user?.plan === "FREE") {
      toast({
        title: "Premium Feature",
        description: "High quality export is only available for PRO and PREMIUM plans.",
        variant: "destructive",
      });
      return;
    }
    
    setIsExporting(true);
    setExportProgress(0);
    
    // Simulate export progress
    const progressInterval = setInterval(() => {
      setExportProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + Math.random() * 10;
      });
    }, 300);
    
    exportMutation.mutate({
      format: exportFormat,
      quality: parseInt(exportQuality),
      includeWatermark: user?.plan === "FREE",
    });
  };

  const getQualityLabel = (quality: string) => {
    switch (quality) {
      case "72":
        return "72 DPI (Web)";
      case "150":
        return "150 DPI (Print)";
      case "300":
        return "300 DPI (High Quality)";
      default:
        return quality;
    }
  };

  const isQualityDisabled = (quality: string) => {
    if (user?.plan === "FREE") return quality !== "72";
    if (user?.plan === "PRO") return quality === "300";
    return false;
  };

  const isPremiumFeature = (feature: string) => {
    if (user?.plan === "FREE") {
      return feature === "zip" || feature === "150" || feature === "300";
    }
    if (user?.plan === "PRO") {
      return feature === "300";
    }
    return false;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export Album</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Export Format */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Export Format</Label>
            <RadioGroup value={exportFormat} onValueChange={setExportFormat}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="jpg" id="jpg" />
                <Label htmlFor="jpg" className="flex items-center space-x-2 cursor-pointer">
                  <ImageIcon className="h-4 w-4" />
                  <span>JPG Individual Pages</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem 
                  value="zip" 
                  id="zip" 
                  disabled={user?.plan === "FREE"}
                />
                <Label htmlFor="zip" className="flex items-center space-x-2 cursor-pointer">
                  <FileArchive className="h-4 w-4" />
                  <span>ZIP Archive</span>
                  {isPremiumFeature("zip") && (
                    <Badge variant="secondary" className="text-xs">
                      PRO+
                    </Badge>
                  )}
                </Label>
              </div>
            </RadioGroup>
          </div>
          
          {/* Export Quality */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Quality</Label>
            <Select value={exportQuality} onValueChange={setExportQuality}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="72">
                  <div className="flex items-center justify-between w-full">
                    <span>{getQualityLabel("72")}</span>
                  </div>
                </SelectItem>
                <SelectItem 
                  value="150" 
                  disabled={isQualityDisabled("150")}
                >
                  <div className="flex items-center justify-between w-full">
                    <span>{getQualityLabel("150")}</span>
                    {isPremiumFeature("150") && (
                      <Badge variant="secondary" className="text-xs ml-2">
                        PRO+
                      </Badge>
                    )}
                  </div>
                </SelectItem>
                <SelectItem 
                  value="300" 
                  disabled={isQualityDisabled("300")}
                >
                  <div className="flex items-center justify-between w-full">
                    <span>{getQualityLabel("300")}</span>
                    {isPremiumFeature("300") && (
                      <Badge variant="secondary" className="text-xs ml-2">
                        PREMIUM
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Plan Notice */}
          {user?.plan === "FREE" && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Info className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>FREE plan exports include watermark</span>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Export Progress */}
          {isExporting && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Exporting album...</span>
                <span className="text-sm text-muted-foreground">
                  {Math.round(exportProgress)}%
                </span>
              </div>
              <Progress value={exportProgress} className="w-full" />
            </div>
          )}
          
          {/* Album Info */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Album:</span>
                  <span className="font-medium">{album?.name}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Photos:</span>
                  <span>{album?.photoCount || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Pages:</span>
                  <span>{album?.slideCount || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="flex items-center justify-end space-x-3 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleExport} 
            disabled={isExporting || !album}
            className="bg-primary hover:bg-primary/90"
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Start Export
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
