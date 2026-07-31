import { createRoot } from 'react-dom/client';
import { App } from './App';
import './index.css';

const container = document.getElementById('root');
if (!container) throw new Error('Renderer root element is missing.');

// Deliberately not wrapped in StrictMode: the workspace owns a single
// long-lived WebContentsView and one ScenarioRunner, and StrictMode's
// double-invoked effects would attach and start both twice in development.
createRoot(container).render(<App />);
