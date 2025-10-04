import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { UIProvider } from './context/UIContext';

// FIX: Add global declaration for the 'dotlottie-wc' web component to ensure it's recognized by TypeScript's JSX parser.
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'dotlottie-wc': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { src: string; autoplay?: boolean; loop?: boolean; style?: React.CSSProperties }, HTMLElement>;
    }
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <DataProvider>
        <UIProvider>
          <App />
        </UIProvider>
      </DataProvider>
    </AuthProvider>
  </React.StrictMode>
);