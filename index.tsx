
import './lib/api-patch';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Register Capacitor local notification listener
if (typeof window !== 'undefined') {
  import('@capacitor/local-notifications').then(({ LocalNotifications }) => {
    LocalNotifications.requestPermissions().catch(() => {});
    LocalNotifications.addListener('localNotificationReceived', (notification) => {
      console.log('🔔 Notif received:', notification);
    });
  }).catch(() => {});
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
