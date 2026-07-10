import React from 'react';
import ReactDOM from 'react-dom/client';
import './i18n/index.js';
import App from './App.jsx';
import './index.css';
import { GenerationProvider } from './stores/generationStore.jsx';
import { initMobile } from './mobile.js';

initMobile();

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <GenerationProvider>
            <App />
        </GenerationProvider>
    </React.StrictMode>
);