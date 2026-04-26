import React from "react";
import ReactDOM from "react-dom/client";

import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";

import { App } from "@capacitor/app";

import "./styles.css";

const router = getRouter();

/* ----------------------------
   ANDROID BACK BUTTON FIX (SAFE)
-----------------------------*/
let lastBackPress = 0;

const backHandler = App.addListener("backButton", () => {
  const now = Date.now();

  // Try router navigation first
  if (window.history.length > 1) {
    window.history.back();
    return;
  }

  // Double press to exit app
  if (now - lastBackPress < 2000) {
    App.exitApp();
  } else {
    lastBackPress = now;
    console.log("Press back again to exit");
  }
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