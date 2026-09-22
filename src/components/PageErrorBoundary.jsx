/**
 * PageErrorBoundary — per-page React error boundary (Sprint 14)
 *
 * A render-time exception in one lazy-loaded page previously unmounted the
 * entire SPA (black screen). The root boundary in main.jsx still catches
 * truly fatal errors, but this boundary isolates failures to the active page:
 * the sidebar, header, and audio player stay alive so the user can navigate
 * away or retry without reloading the app.
 *
 * On catch, the error is also shipped to the backend via
 * `src/utils/errorReporter.js` (POST /api/errors/report → logs/server.log).
 *
 * Usage:
 *   <PageErrorBoundary pageKey="muse">
 *     <MusePage ... />
 *   </PageErrorBoundary>
 *
 * @module src/components/PageErrorBoundary
 * @version 7.7.0
 */

import React from 'react';
import { t } from '../i18n/index.js';
import { reportError } from '../utils/errorReporter.js';

class PageErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, retryCount: 0 };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('[PageErrorBoundary] Page render error:', error, info);
    reportError({
      level: 'fatal',
      source: 'PageErrorBoundary',
      message: error?.message || String(error),
      stack: error?.stack || '',
      context: `page=${this.props.pageKey || 'unknown'} retry=${this.state.retryCount} componentStack=${(info?.componentStack || '').slice(0, 600)}`,
    });
  }

  handleRetry = () => {
    this.setState((s) => ({ hasError: false, error: null, retryCount: s.retryCount + 1 }));
  };

  handleBack = () => {
    try {
      if (typeof this.props.onNavigate === 'function') {
        this.props.onNavigate('dashboard');
      } else {
        window.location.hash = '';
        window.location.reload();
      }
    } catch (_) {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      const errMsg = this.state.error ? (this.state.error.message || String(this.state.error)) : 'Unknown error';
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-2xl shadow-lg shadow-violet-500/30">
            ⚠
          </div>
          <div className="text-base font-bold text-gray-100">
            {t('error.page_crashed_title') || 'This page ran into a problem'}
          </div>
          <div className="text-xs text-gray-500 max-w-md">
            {t('error.page_crashed_desc') || 'The rest of the app is still working. You can retry this page or go back to the dashboard.'}
          </div>
          <div className="text-[11px] text-gray-500 bg-white/5 border border-white/10 rounded-lg px-4 py-3 max-w-lg text-left whitespace-pre-wrap break-words font-mono">
            {errMsg}
          </div>
          <div className="flex gap-3 flex-wrap justify-center">
            <button
              onClick={this.handleRetry}
              className="bg-gradient-to-r from-violet-500 to-pink-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              {t('app.retry_render') || 'Retry'}
            </button>
            <button
              onClick={this.handleBack}
              className="bg-white/10 text-white border border-white/15 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-white/15 transition-colors"
            >
              {t('error.back_to_dashboard') || 'Back to Dashboard'}
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default PageErrorBoundary;
