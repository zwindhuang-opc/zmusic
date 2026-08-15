import React from 'react';
import ReactDOM from 'react-dom/client';
import './i18n/index.js';
import App from './App.jsx';
import './index.css';
import { initMobile } from './mobile.js';

initMobile();

/**
 * Top-level Error Boundary.
 *
 * Without this, any render-time exception (bad import, missing hook dependency,
 * undefined value accessed in a component) causes React to unmount the entire tree,
 * leaving the user with a pure black screen on Android/Capacitor builds.
 *
 * This boundary catches the error, logs it, and renders a recoverable fallback UI.
 */
class RootErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, info: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        // eslint-disable-next-line no-console
        console.error('[RootErrorBoundary] Caught fatal render error:', error, info);
        this.setState({ info });
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, info: null });
    };

    handleReload = () => {
        try { window.location.reload(); } catch (_) { }
    };

    render() {
        if (this.state.hasError) {
            const errMsg = this.state.error ? (this.state.error.message || String(this.state.error)) : 'Unknown error';
            return (
                <div style={{
                    minHeight: '100vh',
                    background: 'linear-gradient(135deg,#0a0a0f 0%,#0f0a1a 50%,#0a0a0f 100%)',
                    color: '#fff',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '32px 24px',
                    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
                    gap: '16px',
                    textAlign: 'center',
                }}>
                    <div style={{
                        width: '64px', height: '64px', borderRadius: '16px',
                        background: 'linear-gradient(135deg,#8b5cf6,#ec4899)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '32px', boxShadow: '0 8px 32px rgba(139,92,246,0.35)',
                    }}>⚠</div>
                    <div style={{
                        fontSize: '20px', fontWeight: 700,
                        background: 'linear-gradient(90deg,#a78bfa,#f472b6)',
                        WebkitBackgroundClip: 'text', backgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>ZMusic</div>
                    <div style={{ fontSize: '15px', fontWeight: 600, opacity: 0.95 }}>Something went wrong</div>
                    <div style={{
                        fontSize: '12px', opacity: 0.65, lineHeight: 1.55,
                        maxWidth: '480px', wordBreak: 'break-word',
                        background: 'rgba(255,255,255,0.04)', padding: '12px 14px',
                        borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)',
                        whiteSpace: 'pre-wrap', textAlign: 'left',
                    }}>{errMsg}</div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <button onClick={this.handleReload} style={{
                            background: 'linear-gradient(135deg,#8b5cf6,#ec4899)', color: '#fff',
                            border: 'none', padding: '10px 20px', borderRadius: '10px',
                            fontWeight: 600, fontSize: '13px', cursor: 'pointer',
                        }}>Restart App</button>
                        <button onClick={this.handleReset} style={{
                            background: 'rgba(255,255,255,0.08)', color: '#fff',
                            border: '1px solid rgba(255,255,255,0.12)',
                            padding: '10px 20px', borderRadius: '10px',
                            fontWeight: 600, fontSize: '13px', cursor: 'pointer',
                        }}>Retry Render</button>
                    </div>
                    <div style={{ fontSize: '10px', opacity: 0.4, marginTop: '8px' }}>
                        Please restart the app if the problem persists.
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

/**
 * Invoked after React mounts + commits the first real paint.
 * - Dismisses the HTML bootstrap loader (index.html).
 * - Dispatches `zmusic:ui-ready` → mobile.js hides the native Capacitor splash.
 *
 * We intentionally defer by 2 x requestAnimationFrame + a small timeout so:
 *   a) the browser has actually painted the first committed frame,
 *   b) layout-heavy children (sidebars, nav) have settled into their geometry.
 */
function signalUiReady() {
    const fire = () => {
        try {
            if (typeof window.__zmusic_dismiss_bootstrap === 'function') {
                window.__zmusic_dismiss_bootstrap();
            } else {
                window.dispatchEvent(new CustomEvent('zmusic:ui-ready'));
            }
        } catch (_) { /* no-op */ }
    };
    // 2 x rAF = the paint after the commit has definitely reached the screen.
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            // Extra 50ms so lazy-loaded heavy chunks settle visually.
            setTimeout(fire, 50);
        });
    });
}

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
    <React.StrictMode>
        <RootErrorBoundary>
            <App />
        </RootErrorBoundary>
    </React.StrictMode>,
);

// Kick off the "React is on screen" handshake after first commit.
signalUiReady();

// Register Service Worker for PWA offline support (production only)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js', { scope: '/' })
            .then((reg) => {
                console.log('[SW] Registered with scope:', reg.scope);
            })
            .catch((err) => {
                console.warn('[SW] Registration failed:', err);
            });
    });
}