import React from "react";
import ReactDOM from "react-dom/client";

import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";

import { App } from "@capacitor/app";

import "./styles.css";
import { useStore } from "@/core/store";

if (typeof window !== "undefined") {
  // debug only
  (window as any).useStore = useStore;
}

const router = getRouter();

/* ----------------------------
   ANDROID BACK BUTTON
-----------------------------*/

const ROOT_ROUTES = [
  "/",
  "/attendance",
  "/grades",
  "/games",
  "/expenses",
  "/settings",
  "/insights",
  "/timetable",
];

const backHandler = App.addListener("backButton", async () => {
  const path = router.state.location.pathname;

  // HOME -> EXIT APP
  if (path === "/") {
    App.exitApp();
    return;
  }

  // TOP LEVEL PAGE -> HOME
  if (ROOT_ROUTES.includes(path)) {
    router.navigate({
      to: "/",
      replace: true,
    });

    return;
  }

  // NESTED PAGE -> NORMAL BACK
  window.history.back();
});

/* ----------------------------
   BOOT APP
-----------------------------*/
const rootElement = document.getElementById("root");

if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);

  root.render(
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>
  );
}