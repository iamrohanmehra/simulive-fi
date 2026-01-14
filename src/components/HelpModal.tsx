import { Keyboard } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface ShortcutItem {
  label: string;
  combination: string;
}

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: ShortcutItem[];
}

const HelpModal = ({ isOpen, onClose, shortcuts }: HelpModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Use these shortcuts to navigate Simulive more efficiently.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {shortcuts.map((shortcut, index) => (
            <div 
              key={index} 
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border"
            >
              <span className="text-sm font-medium">{shortcut.label}</span>
              <kbd className="pointer-events-none inline-flex h-6 select-none items-center gap-1 rounded border bg-muted px-2 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                {shortcut.combination}
              </kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HelpModal;
