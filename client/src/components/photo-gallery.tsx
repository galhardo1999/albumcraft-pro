import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GripVertical, Eye, Trash2 } from "lucide-react";
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

interface PhotoGalleryProps {
  photos: Photo[];
  onPhotoSelect?: (photo: Photo) => void;
  onPhotoDelete?: (photoId: string) => void;
  selectable?: boolean;
  deletable?: boolean;
}

function PhotoItem({ 
  photo, 
  onSelect, 
  onDelete, 
  selectable = true, 
  deletable = false 
}: { 
  photo: Photo;
  onSelect?: (photo: Photo) => void;
  onDelete?: (photoId: string) => void;
  selectable?: boolean;
  deletable?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: photo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group cursor-grab active:cursor-grabbing",
        isDragging && "opacity-50"
      )}
      {...attributes}
      {...listeners}
    >
      <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
        <img
          src={photo.thumbnailUrl || photo.url}
          alt={photo.originalName}
          className="w-full h-full object-cover photo-hover"
          loading="lazy"
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity" />
        
        {/* Controls */}
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity space-y-1">
          <div className="bg-white rounded-full p-1 shadow-md">
            <GripVertical className="h-3 w-3 text-muted-foreground" />
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="absolute bottom-1 left-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex justify-between items-center">
            {selectable && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onSelect?.(photo)}
                className="h-6 px-2 text-xs"
              >
                <Eye className="h-3 w-3 mr-1" />
                View
              </Button>
            )}
            
            {deletable && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onDelete?.(photo.id)}
                className="h-6 px-2 text-xs"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Dimensions Badge */}
        <Badge 
          variant="secondary" 
          className="absolute top-1 left-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {photo.width}×{photo.height}
        </Badge>
      </div>
    </div>
  );
}

export default function PhotoGallery({ 
  photos, 
  onPhotoSelect, 
  onPhotoDelete, 
  selectable = true, 
  deletable = false 
}: PhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  const handlePhotoSelect = (photo: Photo) => {
    setSelectedPhoto(photo);
    onPhotoSelect?.(photo);
  };

  if (photos.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-4xl mb-4">📸</div>
          <p className="text-muted-foreground">
            No photos uploaded yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="photo-grid photo-grid-3">
        {photos.map((photo) => (
          <PhotoItem
            key={photo.id}
            photo={photo}
            onSelect={handlePhotoSelect}
            onDelete={onPhotoDelete}
            selectable={selectable}
            deletable={deletable}
          />
        ))}
      </div>
      
      {photos.length > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          {photos.length} photo{photos.length !== 1 ? 's' : ''} in gallery
        </div>
      )}
    </div>
  );
}
