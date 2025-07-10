import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/navigation";
import PhotoGallery from "@/components/photo-gallery";
import SlideEditor from "@/components/slide-editor";
import ExportModal from "@/components/export-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, 
  Eye, 
  Download, 
  Save,
  ChevronLeft,
  ChevronRight,
  Grid,
  Plus
} from "lucide-react";
import { Link } from "wouter";

export default function AlbumEditor() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [showExportModal, setShowExportModal] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [previewMode, setPreviewMode] = useState(false);

  const { data: album, isLoading, error } = useQuery({
    queryKey: ["/api/albums", id],
    enabled: isAuthenticated && !!id,
  });

  const { data: photos, isLoading: photosLoading } = useQuery({
    queryKey: ["/api/albums", id, "photos"],
    enabled: isAuthenticated && !!id,
  });

  const { data: slides, isLoading: slidesLoading } = useQuery({
    queryKey: ["/api/albums", id, "slides"],
    enabled: isAuthenticated && !!id,
  });

  const updateSlideMutation = useMutation({
    mutationFn: async (slideData: any) => {
      const response = await fetch(`/api/slides/${slideData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(slideData),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to update slide");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/albums", id, "slides"] });
      toast({
        title: "Slide Updated",
        description: "Your changes have been saved automatically.",
      });
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
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
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
  }, [isAuthenticated, authLoading, toast]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-8 w-8" />
                <div>
                  <Skeleton className="h-6 w-48 mb-1" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
              </div>
            </div>
          </div>
        </div>
        <div className="flex h-screen">
          <div className="w-80 border-r border-border">
            <Skeleton className="h-full" />
          </div>
          <div className="flex-1">
            <Skeleton className="h-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error && isUnauthorizedError(error as Error)) {
    return null; // Will redirect via useEffect
  }

  if (!album) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2">Album Not Found</h2>
              <p className="text-muted-foreground mb-4">
                The album you're looking for doesn't exist or you don't have permission to view it.
              </p>
              <Link href="/albums">
                <Button>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Albums
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const handleSlideUpdate = (slideData: any) => {
    updateSlideMutation.mutate(slideData);
  };

  const totalSlides = slides?.length || 0;
  const currentSlideData = slides?.[currentSlide];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Editor Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/albums">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-lg font-semibold text-foreground">{album.name}</h1>
                <p className="text-sm text-muted-foreground">
                  {album.photoCount || 0} photos • Last saved 2 minutes ago
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => setPreviewMode(!previewMode)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {previewMode ? "Edit" : "Preview"}
              </Button>
              <Button onClick={() => setShowExportModal(true)}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Photo Gallery Sidebar */}
        {!previewMode && (
          <div className="w-80 bg-muted/30 border-r border-border overflow-y-auto">
            <div className="p-4">
              <h2 className="text-lg font-semibold text-foreground mb-4">Photo Gallery</h2>
              {photosLoading ? (
                <div className="grid grid-cols-3 gap-2">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="aspect-square" />
                  ))}
                </div>
              ) : photos && photos.length > 0 ? (
                <PhotoGallery photos={photos} />
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No photos uploaded yet</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Main Editor */}
        <div className="flex-1 flex flex-col">
          {/* Slide Navigation */}
          <div className="bg-card border-b border-border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
                  disabled={currentSlide === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium text-foreground">
                  Page {currentSlide + 1} of {totalSlides}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentSlide(Math.min(totalSlides - 1, currentSlide + 1))}
                  disabled={currentSlide === totalSlides - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Grid className="h-4 w-4 mr-1" />
                  Layout
                </Button>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Page
                </Button>
              </div>
            </div>
          </div>
          
          {/* Canvas Area */}
          <div className="flex-1 bg-muted/20 p-8 overflow-auto">
            <div className="max-w-4xl mx-auto">
              {slidesLoading ? (
                <Skeleton className="slide-canvas aspect-[4/3] p-8" />
              ) : currentSlideData ? (
                <SlideEditor
                  slide={currentSlideData}
                  photos={photos || []}
                  onUpdate={handleSlideUpdate}
                  previewMode={previewMode}
                />
              ) : (
                <Card className="slide-canvas aspect-[4/3] p-8">
                  <CardContent className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        No slides created yet
                      </h3>
                      <p className="text-muted-foreground">
                        Add your first slide to start building your album
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      <ExportModal
        open={showExportModal}
        onOpenChange={setShowExportModal}
        album={album}
      />
    </div>
  );
}
