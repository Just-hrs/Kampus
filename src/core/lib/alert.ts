import { useStore } from "@/core/store";

type AlertOptions = {
  title: string;
  message: string;
};

export function nativeConfirm(
  options: AlertOptions,
): Promise<boolean> {
  const showAppAlert =
    useStore.getState().showAppAlert;

  return new Promise((resolve) => {
    showAppAlert({
      title: options.title,
      message: options.message,
      type: "confirm",
      _resolve: resolve,
    });
  });
}

export function nativeAlert(
  options: AlertOptions,
): Promise<void> {
  const showAppAlert =
    useStore.getState().showAppAlert;

  return new Promise((resolve) => {
    showAppAlert({
      title: options.title,
      message: options.message,
      type: "alert",
      _resolve: () => resolve(),
    });
  });
}