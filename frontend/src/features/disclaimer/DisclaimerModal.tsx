import { AlertTriangle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DisclaimerModalProps {
  open: boolean;
  onAccept: () => void;
}

export function DisclaimerModal({ open, onAccept }: DisclaimerModalProps) {
  return (
    <Dialog open={open}>
      <DialogContent hideClose className="max-w-2xl">
        <DialogHeader>
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-700 dark:text-amber-300">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <DialogTitle>Advisory-only clinical estimate</DialogTitle>
          <DialogDescription className="text-base">
            OrthoPredict is a decision-support tool. It does not replace medical judgment,
            diagnosis, imaging review, or follow-up care planning.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-4 rounded-[1.5rem] bg-secondary/80 p-5">
          <div className="flex gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" />
            <p className="text-sm leading-6 text-muted-foreground">
              Use the output as a supportive estimate only. Final treatment decisions should
              remain with a qualified clinician who can consider the full patient context.
            </p>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <Button size="lg" onClick={onAccept}>
            I understand
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
