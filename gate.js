export function renderGate(container, onUnlock) {
    container.innerHTML = `
    <div class="gate-container">
      <div class="gate-card">
        <div class="lock-icon">🔒</div>
        <h1>Unlock Access</h1>
        <p class="gate-subtitle">Get instant access to the complete KPS Business -N- The Box blueprint suite.</p>
        
        <div class="price-tag">
          <span class="currency">$</span>97<span class="period">/lifetime</span>
        </div>
        
        <ul class="features-list">
          <li>✅ AI Model Creation Guide</li>
          <li>✅ Faceless Theme Page Course</li>
          <li>✅ OnlyFans & Fanvue Blueprints</li>
          <li>✅ Viral Marketing Strategies</li>
        </ul>
        
        <button id="unlock-btn" class="btn btn-primary btn-large">Unlock Now</button>
        <p class="guarantee">🔒 Secure 256-bit SSL Encrypted Payment</p>
      </div>
    </div>
  `;

    document.getElementById('unlock-btn').addEventListener('click', () => {
        // Simulate payment processing
        const btn = document.getElementById('unlock-btn');
        btn.textContent = 'Processing...';
        btn.disabled = true;

        setTimeout(() => {
            onUnlock();
        }, 1500);
    });
}
