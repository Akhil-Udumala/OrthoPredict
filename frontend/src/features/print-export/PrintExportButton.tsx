import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintExportButton() {
  return (
    <Button
      type="button"
      variant="outline"
      className="no-print"
      onClick={() => window.print()}
    >
      <Printer className="h-4 w-4" />
      Print / Export
    </Button>
  );
}

