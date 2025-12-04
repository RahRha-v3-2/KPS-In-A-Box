export function renderGate(container, onUnlock) {
  container.innerHTML = `
    <div class="gate-container">
      <div class="gate-card">
        <div class="lock-icon">🔒</div>
        <h1>Unlock Access</h1>
        <p class="gate-subtitle">Get instant access to the complete KPS Business -N- The Box blueprint suite.</p>

        <div class="price-tag">
          <span class="currency">$</span><span id="price-amount">20.00</span><span class="period">/lifetime</span>
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
      // Update price display
      document.getElementById('price-amount').textContent = config.amount;

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
    try {
      paypal.Buttons({
        createOrder: async () => {
          try {
            const response = await fetch('/api/create-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include'
            });

            if (!response.ok) {
              const errorData = await response.json();
              console.error('Failed to create order:', errorData);

              // Show user-friendly error
              let errorMsg = 'Failed to initiate payment. ';
              if (errorData.debugInfo) {
                if (!errorData.debugInfo.hasClientSecret) {
                  errorMsg += 'PayPal is not properly configured (missing credentials).';
                } else {
                  errorMsg += errorData.details || 'Please try again or contact support.';
                }
              } else {
                errorMsg += 'Please try again or contact support.';
              }
              alert(errorMsg);
              throw new Error(errorData.details || 'Failed to create order');
            }

            const order = await response.json();
            console.log('Order created:', order.id);
            return order.id;
          } catch (error) {
            console.error('Error in createOrder:', error);
            throw error;
          }
        },
        onApprove: async (data) => {
          try {
            const response = await fetch('/api/capture-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderID: data.orderID }),
              credentials: 'include'
            });

            if (!response.ok) {
              const errorData = await response.json();
              console.error('Failed to capture payment:', errorData);
              alert(`Payment capture failed: ${errorData.details || 'Unknown error'}. Please contact support with Order ID: ${data.orderID}`);
              return;
            }

            const result = await response.json();
            console.log('Payment captured:', result);

            if (result.status === 'COMPLETED') {
              console.log('Payment completed successfully, unlocking access...');
              onUnlock();
            } else {
              console.warn('Payment status:', result.status);
              alert(`Payment status: ${result.status}. Please contact support if you were charged. Order ID: ${data.orderID}`);
            }
          } catch (error) {
            console.error('Error in onApprove:', error);
            alert(`An error occurred while processing your payment. Please contact support. Order ID: ${data.orderID}`);
          }
        },
        onError: (err) => {
          console.error('PayPal button error:', err);
          alert('An error occurred with PayPal. Please try again or contact support.');
        }
      }).render('#paypal-button-container');
    } catch (error) {
      console.error('PayPal button initialization failed:', error);
      document.getElementById('paypal-button-container').innerHTML = '<p style="color: red;">PayPal integration is not properly configured. Please contact support.</p>';
    }
  }
}
