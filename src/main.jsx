import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "@shared/ui.css";
import "./styles/app.css";
import App from "./App.jsx";
import { LangProvider } from "./i18n.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { MetaProvider } from "./context/MetaContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "")} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <LangProvider>
        <ToastProvider>
          <AuthProvider>
            <MetaProvider>
              <CartProvider>
                <App />
              </CartProvider>
            </MetaProvider>
          </AuthProvider>
        </ToastProvider>
      </LangProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
