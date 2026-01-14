import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { X, Image as ImageIcon } from 'lucide-react';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { updateDoc } from 'firebase/firestore';

import { storage } from '@/lib/firebase';
import { sessionDoc } from '@/lib/firestore-collections';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface SessionThumbnailUploadProps {
  sessionId: string;
  currentThumbnail: string | null;
}

const SessionThumbnailUpload = ({ sessionId, currentThumbnail }: SessionThumbnailUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(currentThumbnail);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Validation
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload JPG, PNG, or WebP.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      toast.error('File size too large. Max 5MB allowed.');
      return;
    }

    // 2. Upload
    try {
      setUploading(true);
      setProgress(0);
      
      const storageRef = ref(storage, `sessions/${sessionId}/thumbnail`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(progress);
        },
        (error) => {
          console.error('Upload failed:', error);
          toast.error('Upload failed. Please try again.');
          setUploading(false);
        },
        async () => {
          // Success
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          // Update Firestore
          await updateDoc(sessionDoc(sessionId), {
            thumbnailUrl: downloadURL
          });

          setPreview(downloadURL);
          setUploading(false);
          toast.success('Thumbnail updated successfully');
        }
      );
    } catch (error) {
      console.error('Error starting upload:', error);
      toast.error('Failed to start upload');
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!preview) return;

    try {
      // If it's a firebase storage URL, try to delete it
      // Note: We might want to be careful if multiple sessions share images, but here it's 1:1 usually.
      // For now, simpler to just update the doc to null, and optionally delete the file if we made it.
      // Let's verify if it matches our storage path structure or just update doc.
      // Requirement says "Remove button to delete thumbnail".
      // We'll update doc first for responsiveness.
      
      const previousThumbnail = preview;
      setPreview(null); // Optimistic update

      await updateDoc(sessionDoc(sessionId), {
        thumbnailUrl: null
      });

      // Optional: Delete from storage if it matches our pattern
      if (previousThumbnail.includes('firebasestorage')) {
          const storageRef = ref(storage, `sessions/${sessionId}/thumbnail`);
          try {
             await deleteObject(storageRef);
          } catch (e) {
             console.warn('Could not delete file from storage (might act unrelated or already gone)', e);
          }
      }

      toast.success('Thumbnail removed');
    } catch (error) {
      console.error('Failed to remove thumbnail:', error);
      toast.error('Failed to remove thumbnail');
      setPreview(preview); // Revert
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Session Thumbnail</h3>
        {uploading && <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>}
      </div>

      <div className={cn(
        "relative group border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center gap-4 transition-colors",
        preview ? "border-muted bg-muted/10" : "border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/50",
        uploading && "opacity-50 pointer-events-none"
      )}>
        
        {preview ? (
          <div className="relative aspect-video w-full max-w-[300px] overflow-hidden rounded-md shadow-sm">
            <img 
              src={preview} 
              alt="Session thumbnail" 
              className="w-full h-full object-cover"
            />
            <button
              onClick={handleRemove}
              className="absolute top-2 right-2 p-1.5 bg-background/80 backdrop-blur-sm rounded-full text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors shadow-sm"
              type="button"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Remove thumbnail</span>
            </button>
          </div>
        ) : (
          <div className="text-center space-y-2 py-8">
            <div className="flex justify-center">
              <div className="p-3 bg-muted rounded-full">
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Click to upload thumbnail</p>
              <p className="text-xs text-muted-foreground">
                JPG, PNG, or WebP up to 5MB
              </p>
            </div>
          </div>
        )}

        <input 
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className={cn(
            "absolute inset-0 w-full h-full opacity-0 cursor-pointer",
            preview && "hidden" // Hide input if preview exists (must remove first)
          )}
          onChange={handleFileSelect}
          disabled={uploading}
        />
      </div>

      {uploading && (
        <Progress value={progress} className="h-2" />
      )}
    </div>
  );
};

export default SessionThumbnailUpload;
