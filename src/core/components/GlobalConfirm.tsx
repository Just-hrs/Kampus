import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { useStore } from "@/core/store";

export function GlobalConfirm() {
  const alertState = useStore(
    (s) => s.alertState,
  );

  const hideAppAlert = useStore(
    (s) => s.hideAppAlert,
  );

  const handleConfirm = () => {
    alertState._resolve(true);
    hideAppAlert();
  };

  const handleCancel = () => {
    alertState._resolve(false);
    hideAppAlert();
  };

  return (
    <AlertDialog
      open={alertState.isOpen}
      onOpenChange={(open) => {
        if (!open) handleCancel();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {alertState.title}
          </AlertDialogTitle>

          <AlertDialogDescription>
            {alertState.message}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          {alertState.type === "confirm" && (
            <AlertDialogCancel
              onClick={handleCancel}
            >
              Cancel
            </AlertDialogCancel>
          )}

          <AlertDialogAction
            onClick={handleConfirm}
          >
            {alertState.type === "confirm"
              ? "Confirm"
              : "OK"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}