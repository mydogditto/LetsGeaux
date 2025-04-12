import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './client/components/App';
import { SnackbarProvider } from 'notistack';
import { BudgetNotificationProvider } from './client/components/BudgetBuddy/BudgetNotificationContext';
import { PartyProvider } from './client/components/Dashboard/PartyContext'

const root = createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <SnackbarProvider maxSnack={3}>
      <BudgetNotificationProvider>
        <PartyProvider>
          <App />
        </PartyProvider>
      </BudgetNotificationProvider>
    </SnackbarProvider>
  </BrowserRouter>
);