const express = require('express');
const session = require('express-session');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const paypal = require('@paypal/checkout-server-sdk');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// PayPal client setup
function environment() {
  let clientId = process.env.PAYPAL_CLIENT_ID;
  let clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (process.env.PAYPAL_MODE === 'sandbox') {
    return new paypal.core.SandboxEnvironment(clientId, clientSecret);
  } else {
    return new paypal.core.LiveEnvironment(clientId, clientSecret);
  }
}

function client() {
  return new paypal.core.PayPalHttpClient(environment());
}

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(bodyParser.json());

// Serve static files from frontend build
app.use(express.static('/app/dist'));
app.use(session({
  secret: process.env.SESSION_SECRET || 'change_this_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Routes
app.post('/api/create-order', async (req, res) => {
  try {
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
         amount: {
           currency_code: process.env.CURRENCY || 'USD',
           value: process.env.PAYMENT_AMOUNT || '998.95'
         }
      }]
    });

    const order = await client().execute(request);
    res.json({ id: order.result.id });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

app.post('/api/capture-order', async (req, res) => {
  const { orderID } = req.body;

  try {
    const request = new paypal.orders.OrdersCaptureRequest(orderID);
    const capture = await client().execute(request);

    if (capture.result.status === 'COMPLETED') {
      // Mark user as paid in session
      req.session.paid = true;
      req.session.save();
    }

    res.json(capture.result);
  } catch (error) {
    console.error('Error capturing order:', error);
    res.status(500).json({ error: 'Failed to capture order' });
  }
});

app.get('/api/check-access', (req, res) => {
  res.json({ hasAccess: req.session.paid === true });
});

app.get('/api/config', (req, res) => {
  res.json({
    paypalClientId: process.env.PAYPAL_CLIENT_ID,
    currency: process.env.CURRENCY || 'USD',
    amount: process.env.PAYMENT_AMOUNT || '998.95'
  });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// Serve React app for all non-API routes
app.get('*', (req, res) => {
  res.sendFile('/app/dist/index.html');
});

app.listen(PORT, () => {
  console.log(`KPS Backend server running on port ${PORT}`);
});