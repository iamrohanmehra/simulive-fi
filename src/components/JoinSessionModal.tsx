import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Volume2 } from "lucide-react";

interface JoinSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  sessionTitle: string;
  onJoin: () => void;
}

const JoinSessionModal = ({
  isOpen,
  onClose,
  userName,
  sessionTitle,
  onJoin,
}: JoinSessionModalProps) => {
  const handleJoin = () => {
    onJoin();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md text-center bg-card border-border" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader className="flex flex-col items-center">
          <DialogTitle className="text-2xl font-bold mb-2">Welcome, {userName}</DialogTitle>
          <DialogDescription className="text-lg text-foreground font-medium text-center">
            Ready to join <span className="text-primary">{sessionTitle}</span>?
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 flex flex-col items-center justify-center space-y-4">
          <div className="bg-primary/10 p-4 rounded-full ring-1 ring-primary/20">
            <Volume2 className="w-8 h-8 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto text-center">
            Clicking join will enable audio for the session. Please make sure your device volume is up.
          </p>
        </div>

        <DialogFooter className="sm:justify-center w-full">
          <Button size="lg" className="w-full sm:w-2/3 font-semibold text-md" onClick={handleJoin}>
            Join Session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default JoinSessionModal;
