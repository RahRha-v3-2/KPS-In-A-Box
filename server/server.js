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
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] CREATE ORDER REQUEST - Amount: ${process.env.PAYMENT_AMOUNT}, Currency: ${process.env.CURRENCY || 'USD'}`);

  try {
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: process.env.CURRENCY || 'USD',
          value: process.env.PAYMENT_AMOUNT || '449.95'
        }
      }]
    });

    const order = await client().execute(request);
    console.log(`[${timestamp}] ORDER CREATED - Order ID: ${order.result.id}, Status: ${order.result.status}`);
    res.json({ id: order.result.id });
  } catch (error) {
    console.error(`[${timestamp}] ERROR CREATING ORDER:`, {
      message: error.message,
      statusCode: error.statusCode,
      headers: error.headers,
      details: error.message
    });

    // Send detailed error to client for debugging
    res.status(500).json({
      error: 'Failed to create order',
      details: error.message,
      statusCode: error.statusCode,
      debugInfo: process.env.NODE_ENV === 'development' ? {
        paypalMode: process.env.PAYPAL_MODE,
        hasClientId: !!process.env.PAYPAL_CLIENT_ID,
        hasClientSecret: !!process.env.PAYPAL_CLIENT_SECRET
      } : undefined
    });
  }
});

app.post('/api/capture-order', async (req, res) => {
  const { orderID } = req.body;
  const timestamp = new Date().toISOString();

  console.log(`[${timestamp}] CAPTURE ORDER REQUEST - Order ID: ${orderID}`);

  if (!orderID) {
    console.error(`[${timestamp}] ERROR: Missing orderID in capture request`);
    return res.status(400).json({ error: 'Order ID is required' });
  }

  try {
    const request = new paypal.orders.OrdersCaptureRequest(orderID);
    const capture = await client().execute(request);

    console.log(`[${timestamp}] ORDER CAPTURED - Order ID: ${orderID}, Status: ${capture.result.status}`);
    console.log(`[${timestamp}] CAPTURE DETAILS:`, JSON.stringify({
      id: capture.result.id,
      status: capture.result.status,
      payer: capture.result.payer?.email_address,
      amount: capture.result.purchase_units?.[0]?.payments?.captures?.[0]?.amount
    }, null, 2));

    if (capture.result.status === 'COMPLETED') {
      // Mark user as paid in session
      req.session.paid = true;
      req.session.orderID = orderID;
      req.session.paidAt = timestamp;
      req.session.save((err) => {
        if (err) {
          console.error(`[${timestamp}] ERROR SAVING SESSION:`, err);
        } else {
          console.log(`[${timestamp}] SESSION SAVED - User granted access`);
        }
      });
    } else {
      console.warn(`[${timestamp}] WARNING: Order status is ${capture.result.status}, not COMPLETED`);
    }

    res.json(capture.result);
  } catch (error) {
    console.error(`[${timestamp}] ERROR CAPTURING ORDER - Order ID: ${orderID}:`, {
      message: error.message,
      statusCode: error.statusCode,
      name: error.name,
      details: error.message
    });

    res.status(500).json({
      error: 'Failed to capture order',
      details: error.message,
      statusCode: error.statusCode
    });
  }
});

app.get('/api/check-access', (req, res) => {
  res.json({ hasAccess: req.session.paid === true });
});

app.get('/api/config', (req, res) => {
  res.json({
    paypalClientId: process.env.PAYPAL_CLIENT_ID,
    currency: process.env.CURRENCY || 'USD',
    amount: process.env.PAYMENT_AMOUNT || '449.95'
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

// Startup validation
function validateConfig() {
  const errors = [];

  if (!process.env.PAYPAL_CLIENT_ID) {
    errors.push('❌ PAYPAL_CLIENT_ID is not set');
  }
  if (!process.env.PAYPAL_CLIENT_SECRET) {
    errors.push('❌ PAYPAL_CLIENT_SECRET is not set');
  }
  if (!process.env.PAYPAL_MODE) {
    errors.push('⚠️  PAYPAL_MODE is not set (defaulting to sandbox)');
  }

  console.log('\n=== PayPal Configuration Status ===');
  console.log(`PayPal Mode: ${process.env.PAYPAL_MODE || 'sandbox'}`);
  console.log(`Client ID: ${process.env.PAYPAL_CLIENT_ID ? '✓ Configured' : '✗ Missing'}`);
  console.log(`Client Secret: ${process.env.PAYPAL_CLIENT_SECRET ? '✓ Configured' : '✗ Missing'}`);
  console.log(`Payment Amount: $${process.env.PAYMENT_AMOUNT || '449.95'} ${process.env.CURRENCY || 'USD'}`);
  console.log('===================================\n');

  if (errors.length > 0) {
    console.error('\n🚨 CRITICAL CONFIGURATION ERRORS:');
    errors.forEach(err => console.error(err));
    console.error('\nPayPal integration will NOT work until these are fixed!');
    console.error('Please update your .env file with valid PayPal credentials.\n');
  }

  return errors.length === 0;
}

app.listen(PORT, () => {
  console.log(`KPS Backend server running on port ${PORT}`);
  validateConfig();
});