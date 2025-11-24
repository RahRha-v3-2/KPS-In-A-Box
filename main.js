import './style.css'
import { renderDashboard } from './dashboard.js'
import { renderGate } from './gate.js'

const app = document.querySelector('#app');

function init() {
  const isUnlocked = localStorage.getItem('kps_unlocked') === 'true';

  if (isUnlocked) {
    renderDashboard(app);
  } else {
    renderGate(app, () => {
      localStorage.setItem('kps_unlocked', 'true');
      renderDashboard(app);
    });
  }
}

init();
