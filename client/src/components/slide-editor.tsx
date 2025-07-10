import { useState, useEffect } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Grid, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Photo {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  thumbnailUrl?: string;
  width: number;
  height: number;
  order: number;
}

interface Slide {
  id: string;
  albumId: string;
  order: number;
  layout: string;
  photoPositions: any[];
}

interface SlideEditorProps {
  slide: Slide;
  photos: Photo[];
  onUpdate: (slide: Slide) => void;
  previewMode?: boolean;
}

const LAYOUT_TEMPLATES = {
  single: {
    name: "Single Photo",
    positions: [{ x: 0, y: 0, width: 100, height: 100 }],
  },
  double: {
    name: "Two Photos",
    positions: [
      { x: 0, y: 0, width: 50, height: 100 },
      { x: 50, y: 0, width: 50, height: 100 },
    ],
  },
  triple: {
    name: "Three Photos",
    positions: [
      { x: 0, y: 0, width: 50, height: 100 },
      { x: 50, y: 0, width: 50, height: 50 },
      { x: 50, y: 50, width: 50, height: 50 },
    ],
  },
  quad: {
    name: "Four Photos",
    positions: [
      { x: 0, y: 0, width: 50, height: 50 },
      { x: 50, y: 0, width: 50, height: 50 },
      { x: 0, y: 50, width: 50, height: 50 },
      { x: 50, y: 50, width: 50, height: 50 },
    ],
  },
  grid: {
    name: "Grid Layout",
    positions: [
      { x: 0, y: 0, width: 33.33, height: 50 },
      { x: 33.33, y: 0, width: 33.33, height: 50 },
      { x: 66.66, y: 0, width: 33.33, height: 50 },
      { x: 0, y: 50, width: 33.33, height: 50 },
      { x: 33.33, y: 50, width: 33.33, height: 50 },
      { x: 66.66, y: 50, width: 33.33, height: 50 },
    ],
  },
};

function DropZone({ 
  position, 
  photo, 
  onDrop, 
  onRemove, 
  previewMode = false 
}: { 
  position: any;
  photo?: Photo;
  onDrop?: (photoId: string) => void;
  onRemove?: () => void;
  previewMode?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `dropzone-${position.x}-${position.y}`,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "absolute rounded-lg transition-all duration-200",
        !previewMode && "border-2 border-dashed",
        isOver && "border-primary bg-primary/5",
        !photo && !previewMode && "border-muted-foreground/30 hover:border-primary",
        photo && !previewMode && "border-transparent"
      )}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        width: `${position.width}%`,
        height: `${position.height}%`,
      }}
    >
      {photo ? (
        <div className="relative w-full h-full group">
          <img
            src={photo.thumbnailUrl || photo.url}
            alt={photo.originalName}
            className="w-full h-full object-cover rounded-lg"
          />
          {!previewMode && (
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded-lg" />
          )}
          {!previewMode && (
            <Button
              variant="destructive"
              size="sm"
              onClick={onRemove}
              className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      ) : (
        !previewMode && (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <ImageIcon className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">Drop photo here</p>
            </div>
          </div>
        )
      )}
    </div>
  );
}

export default function SlideEditor({ slide, photos, onUpdate, previewMode = false }: SlideEditorProps) {
  const [currentLayout, setCurrentLayout] = useState(slide.layout);
  const [photoPositions, setPhotoPositions] = useState(slide.photoPositions || []);

  useEffect(() => {
    setCurrentLayout(slide.layout);
    setPhotoPositions(slide.photoPositions || []);
  }, [slide]);

  const handleLayoutChange = (newLayout: string) => {
    setCurrentLayout(newLayout);
    const template = LAYOUT_TEMPLATES[newLayout as keyof typeof LAYOUT_TEMPLATES];
    if (template) {
      // Keep existing photos if they fit in the new layout
      const newPositions = template.positions.map((pos, index) => ({
        ...pos,
        photoId: photoPositions[index]?.photoId || null,
      }));
      setPhotoPositions(newPositions);
      onUpdate({
        ...slide,
        layout: newLayout,
        photoPositions: newPositions,
      });
    }
  };

  const handlePhotoDrop = (positionIndex: number, photoId: string) => {
    const newPositions = [...photoPositions];
    newPositions[positionIndex] = {
      ...newPositions[positionIndex],
      photoId,
    };
    setPhotoPositions(newPositions);
    onUpdate({
      ...slide,
      photoPositions: newPositions,
    });
  };

  const handlePhotoRemove = (positionIndex: number) => {
    const newPositions = [...photoPositions];
    newPositions[positionIndex] = {
      ...newPositions[positionIndex],
      photoId: null,
    };
    setPhotoPositions(newPositions);
    onUpdate({
      ...slide,
      photoPositions: newPositions,
    });
  };

  const getPhotoById = (photoId: string) => {
    return photos.find(p => p.id === photoId);
  };

  const template = LAYOUT_TEMPLATES[currentLayout as keyof typeof LAYOUT_TEMPLATES];
  const positions = template ? template.positions : [];

  return (
    <Card className="slide-canvas aspect-[4/3] relative">
      <CardContent className="p-8 h-full">
        {/* Layout Controls */}
        {!previewMode && (
          <div className="absolute top-4 right-4 z-10">
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">
                {template?.name || "Unknown Layout"}
              </Badge>
              <Select value={currentLayout} onValueChange={handleLayoutChange}>
                <SelectTrigger className="w-32">
                  <Grid className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LAYOUT_TEMPLATES).map(([key, layout]) => (
                    <SelectItem key={key} value={key}>
                      {layout.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Photo Positions */}
        <div className="relative w-full h-full">
          {positions.map((position, index) => {
            const photoId = photoPositions[index]?.photoId;
            const photo = photoId ? getPhotoById(photoId) : undefined;
            
            return (
              <DropZone
                key={index}
                position={position}
                photo={photo}
                onDrop={(photoId) => handlePhotoDrop(index, photoId)}
                onRemove={() => handlePhotoRemove(index)}
                previewMode={previewMode}
              />
            );
          })}
        </div>

        {/* Empty State */}
        {positions.length === 0 && (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Grid className="h-16 w-16 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Layout Selected</h3>
              <p>Choose a layout to start arranging your photos</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
