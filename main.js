import './style.css'
import { renderDashboard } from './dashboard.js'
import { renderGate } from './gate.js'

const app = document.querySelector('#app');

async function checkAccess() {
  try {
    const response = await fetch('/api/check-access', {
      credentials: 'include'
    });
    const data = await response.json();
    return data.hasAccess;
  } catch (error) {
    console.error('Error checking access:', error);
    return false;
  }
}

async function init() {
  const hasAccess = await checkAccess();

  if (hasAccess) {
    renderDashboard(app);
  } else {
    renderGate(app, () => {
      renderDashboard(app);
    });
  }
}

init();
