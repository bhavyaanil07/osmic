import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import App from './App';
import { StoreProvider } from './lib/store';
import { ToastProvider } from './components/Toasts';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* HashRouter (links like /#/admin) works on GitHub Pages without extra server setup */}
    <HashRouter>
      {/* reducedMotion="user" turns animations down for people who ask their OS for less motion */}
      <MotionConfig reducedMotion="user">
        <StoreProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </StoreProvider>
      </MotionConfig>
    </HashRouter>
  </StrictMode>,
);
