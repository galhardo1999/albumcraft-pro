import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, Download, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface AlbumCardProps {
  album: any;
  viewMode?: "grid" | "list";
}

export default function AlbumCard({ album, viewMode = "grid" }: AlbumCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "exported":
        return "bg-blue-500";
      case "draft":
      default:
        return "bg-yellow-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "exported":
        return "Exported";
      case "draft":
      default:
        return "Draft";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  if (viewMode === "list") {
    return (
      <Card className="album-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                <div className="text-2xl">📸</div>
              </div>
              <div>
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {album.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {album.photoCount || 0} photos • Created {formatDate(album.createdAt)}
                </p>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-1">
                  <span>{album.orientation}</span>
                  <span>•</span>
                  <span>{album.size}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge className={cn("text-white", getStatusColor(album.status))}>
                {getStatusText(album.status)}
              </Badge>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/albums/${album.id}/edit`}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="album-card">
      <CardContent className="p-0">
        <Link href={`/albums/${album.id}/edit`}>
          <div className="relative overflow-hidden rounded-t-lg bg-muted aspect-[4/3] flex items-center justify-center">
            {/* Placeholder for album cover */}
            <div className="text-6xl opacity-20">📸</div>
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity"></div>
            <Badge 
              className={cn("absolute top-3 right-3 text-white", getStatusColor(album.status))}
            >
              {getStatusText(album.status)}
            </Badge>
          </div>
        </Link>
        
        <div className="p-4 space-y-2">
          <Link href={`/albums/${album.id}/edit`}>
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
              {album.name}
            </h3>
          </Link>
          <p className="text-sm text-muted-foreground">
            {album.photoCount || 0} photos • Created {formatDate(album.createdAt)}
          </p>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span>{album.orientation}</span>
            <span>•</span>
            <span>{album.size}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
