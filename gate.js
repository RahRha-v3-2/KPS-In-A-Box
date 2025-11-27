export function renderGate(container, onUnlock) {
    container.innerHTML = `
    <div class="gate-container">
      <div class="gate-card">
        <div class="lock-icon">🔒</div>
        <h1>Unlock Access</h1>
        <p class="gate-subtitle">Get instant access to the complete KPS Business -N- The Box blueprint suite.</p>

        <div class="price-tag">
          <span class="currency">$</span>5<span class="period">/lifetime</span>
        </div>

        <ul class="features-list">
          <li>✅ AI Model Creation Guide</li>
          <li>✅ Faceless Theme Page Course</li>
          <li>✅ OnlyFans & Fanvue Blueprints</li>
          <li>✅ Viral Marketing Strategies</li>
        </ul>

        <div id="paypal-button-container"></div>
        <p class="guarantee">🔒 Secure 256-bit SSL Encrypted Payment</p>
      </div>
    </div>
  `;

    // Fetch config and load PayPal SDK
    fetch('/api/config')
      .then(response => response.json())
      .then(config => {
        if (!window.paypal) {
            const script = document.createElement('script');
            script.src = `https://www.paypal.com/sdk/js?client-id=${config.paypalClientId}&currency=${config.currency}`;
            script.onload = () => initPayPalButton(config);
            document.head.appendChild(script);
        } else {
            initPayPalButton(config);
        }
      })
      .catch(error => console.error('Error loading config:', error));

    function initPayPalButton(config) {
        paypal.Buttons({
            createOrder: async () => {
                const response = await fetch('/api/create-order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include'
                });
                const order = await response.json();
                return order.id;
            },
            onApprove: async (data) => {
                const response = await fetch('/api/capture-order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ orderID: data.orderID }),
                    credentials: 'include'
                });
                const result = await response.json();

                if (result.status === 'COMPLETED') {
                    onUnlock();
                } else {
                    alert('Payment failed. Please try again.');
                }
            }
        }).render('#paypal-button-container');
    }
}
