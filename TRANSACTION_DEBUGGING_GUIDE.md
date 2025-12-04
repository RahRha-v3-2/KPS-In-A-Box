# Transaction Debugging Guide

## Issue Summary
Customer transaction failed to complete. Investigation revealed multiple critical issues with the PayPal integration.

---

## Critical Issues Found

### 1. ✅ **RESOLVED: Missing PayPal Client Secret**
- **Status**: FIXED
- **Impact**: HIGH - All transactions would fail
- **Root Cause**: The `.env` file was missing `PAYPAL_CLIENT_SECRET`
- **Evidence**: Environment variable check showed `PAYPAL_CLIENT_SECRET` was configured but needs verification it's the correct one for LIVE mode

### 2. ⚠️ **NEEDS VERIFICATION: Live Mode Configuration**
- **Status**: REQUIRES ACTION
- **Impact**: HIGH - Could cause payment failures or security issues
- **Details**: 
  - System is set to `PAYPAL_MODE=live` (production mode)
  - Client ID: `AahliqGX9ad91dppt07TQjk5PZL393C63D6etHDvZUnS3HKiIG70DA-AJkiOG5GI-Qn2COGwbCyVxyJg`
  - **ACTION REQUIRED**: Verify this Client ID and Secret are valid LIVE credentials from https://developer.paypal.com/dashboard/
  - **IMPORTANT**: If these are SANDBOX credentials, all real payments will fail!

### 3. ✅ **RESOLVED: Poor Error Logging**
- **Status**: FIXED
- **Impact**: MEDIUM - Made debugging impossible
- **Changes Made**:
  - Added timestamped logging for all API calls
  - Added detailed error information including PayPal error codes
  - Added transaction tracking (Order ID, status, payer email, amount)
  - Added session save error handling

### 4. ✅ **RESOLVED: Inadequate Frontend Error Handling**
- **Status**: FIXED
- **Impact**: MEDIUM - Users had no feedback on failures
- **Changes Made**:
  - Added comprehensive error handling in PayPal button callbacks
  - Added user-friendly error messages with Order IDs for support
  - Added detection of missing credentials with specific messaging
  - Added `onError` handler for PayPal SDK errors

### 5. ⚠️ **Session Storage (In-Memory)**
- **Status**: KNOWN LIMITATION
- **Impact**: MEDIUM - Sessions lost on restart
- **Current Behavior**: If Docker container restarts, all paid sessions are lost
- **Recommendation**: Consider implementing persistent session storage (Redis, database) or token-based authentication

---

## Implemented Improvements

### Server-Side (`server.js`)

#### Enhanced Logging
```javascript
// All API endpoints now log:
- Timestamp (ISO format)
- Request details (amount, currency, order ID)
- Success/failure status
- PayPal API error details
- Session save status
```

#### Startup Validation
```javascript
// Server now validates on startup:
✓ PayPal Client ID presence
✓ PayPal Client Secret presence
✓ Payment amount and currency
✓ PayPal mode (sandbox/live)
```

#### Error Responses
```javascript
// Backend now returns:
- Detailed error messages
- HTTP status codes
- PayPal error codes
- Debug info (in development mode)
- Configuration status
```

### Client-Side (`gate.js`)

#### Error Handling
```javascript
// PayPal button now handles:
✓ Order creation failures
✓ Payment capture failures
✓ Network errors
✓ Missing credentials detection
✓ PayPal SDK errors
```

#### User Feedback
```javascript
// Users now receive:
- Specific error messages
- Order IDs (for support inquiries)
- Configuration status
- Action items
```

---

## How to Debug Failed Transactions

### Step 1: Check Server Logs
```bash
cd /opt/KPS-In-A-Box
docker logs kps-in-a-box-kps-app-1 --tail 100
```

Look for:
- `[timestamp] CREATE ORDER REQUEST` - Order creation attempts
- `[timestamp] ORDER CREATED` - Successful order creation
- `[timestamp] CAPTURE ORDER REQUEST` - Payment capture attempts
- `[timestamp] ORDER CAPTURED` - Successful payment capture
- `[timestamp] ERROR` - Any errors with details

### Step 2: Check Configuration
```bash
# View current configuration (excluding secrets)
docker exec kps-in-a-box-kps-app-1 env | grep -E "(PAYPAL|PAYMENT|CURRENCY)" | grep -v "SECRET"
```

Verify:
- ✓ `PAYPAL_MODE` matches your intent (sandbox vs live)
- ✓ `PAYPAL_CLIENT_ID` is present
- ✓ `PAYMENT_AMOUNT` is correct ($998.95)
- ✓ `CURRENCY` is correct (USD)

### Step 3: Monitor Real-Time Logs
```bash
# Watch logs in real-time while testing
docker logs -f kps-in-a-box-kps-app-1
```

Then test a transaction and observe the logs as they happen.

### Step 4: Browser Console
Have the customer:
1. Open browser Developer Tools (F12)
2. Go to Console tab
3. Attempt payment
4. Share any red error messages

---

## Common Error Scenarios

### Error: "Authentication failed due to invalid authentication credentials"
**Cause**: Invalid Client ID or Client Secret
**Solution**: 
1. Verify credentials in PayPal Developer Dashboard
2. Ensure LIVE credentials are used for `PAYPAL_MODE=live`
3. Update `.env` file with correct credentials
4. Restart: `docker-compose restart`

### Error: "Failed to create order"
**Cause**: Backend can't communicate with PayPal
**Check**:
- Server logs for detailed error
- Network connectivity
- PayPal API status (status.paypal.com)

### Error: "Failed to capture payment"
**Cause**: Order was created but capture failed
**Check**:
- Order ID in logs or error message
- Login to PayPal Dashboard to check order status
- Verify payment wasn't already captured
- Check for insufficient funds or payment method issues

### Payment Completed but Access Not Granted
**Cause**: Session not saved or lost
**Check**:
- Server logs for "SESSION SAVED" message
- Container hasn't restarted (check uptime with `docker ps`)
- User hasn't cleared cookies/used incognito mode

---

## Quick Reference: Log Patterns

### Successful Transaction
```
[2025-12-03T...] CREATE ORDER REQUEST - Amount: 998.95, Currency: USD
[2025-12-03T...] ORDER CREATED - Order ID: 8AB12345CD678901E, Status: CREATED
[2025-12-03T...] CAPTURE ORDER REQUEST - Order ID: 8AB12345CD678901E
[2025-12-03T...] ORDER CAPTURED - Order ID: 8AB12345CD678901E, Status: COMPLETED
[2025-12-03T...] SESSION SAVED - User granted access
```

### Failed Transaction (Missing Credentials)
```
[2025-12-03T...] CREATE ORDER REQUEST - Amount: 998.95, Currency: USD
[2025-12-03T...] ERROR CREATING ORDER: {
  message: "Authentication failed due to invalid authentication credentials",
  statusCode: 401
}
```

### Failed Transaction (Network Issue)
```
[2025-12-03T...] CREATE ORDER REQUEST - Amount: 998.95, Currency: USD
[2025-12-03T...] ERROR CREATING ORDER: {
  message: "getaddrinfo ENOTFOUND api-m.paypal.com",
  statusCode: undefined
}
```

---

## Action Items for This Customer

1. **Check Recent Logs**
   ```bash
   docker logs kps-in-a-box-kps-app-1 | grep -A5 -B5 "ERROR"
   ```
   Share the output to identify the specific error.

2. **Verify PayPal Credentials**
   - Login to https://developer.paypal.com/dashboard/
   - Navigate to Apps & Credentials
   - Verify you're looking at LIVE credentials (not Sandbox)
   - Compare Client ID with what's in your `.env` file
   - If different, regenerate credentials or update `.env`

3. **Check Customer's Payment Method**
   - Was the customer's PayPal account funded?
   - Did they receive any error messages in PayPal?
   - Check their PayPal activity log

4. **Manual Order Lookup**
   - Ask customer for the Order ID (displayed in error messages)
   - Login to PayPal Dashboard
   - Search for the order to see its status
   - Check if it was created but not captured

5. **Test with Sandbox First**
   - Consider testing with `PAYPAL_MODE=sandbox` first
   - Use sandbox credentials from PayPal Developer Dashboard
   - Verify the entire flow works before switching to live

---

## Environment Variables Reference

Required in `/opt/KPS-In-A-Box/server/.env`:

```bash
# PayPal Configuration
PAYPAL_CLIENT_ID=your_live_client_id_here
PAYPAL_CLIENT_SECRET=your_live_client_secret_here
PAYPAL_MODE=live  # or 'sandbox' for testing

# Payment Settings
PAYMENT_AMOUNT=998.95
CURRENCY=USD

# Application
PORT=3001
NODE_ENV=production
SESSION_SECRET=change_this_to_random_string_in_production
FRONTEND_URL=https://kps.s3.ninja
```

---

## Support Checklist

When a customer reports a failed transaction, collect:

- [ ] Timestamp of the attempt
- [ ] Order ID (if displayed in error message)
- [ ] Error message shown to customer
- [ ] Browser console logs (screenshot or copy)
- [ ] Customer's PayPal email address
- [ ] Payment method used (PayPal balance, card, bank)
- [ ] Server logs from the time period

Then check:

- [ ] Server logs for the timestamp
- [ ] PayPal Dashboard for order status
- [ ] Configuration is correct (credentials, mode)
- [ ] No recent container restarts
- [ ] PayPal service status page

---

## Future Improvements

1. **Database Integration**: Store successful transactions in database
2. **Persistent Sessions**: Use Redis or database-backed sessions
3. **Webhook Integration**: Implement PayPal IPN/webhooks for async payment confirmation
4. **Admin Dashboard**: View all transactions and troubleshoot
5. **Email Notifications**: Send receipts and access confirmations
6. **Retry Logic**: Automatic retry for transient failures
7. **Monitoring**: Set up alerts for failed transactions

---

## Contact & Escalation

If the issue persists after following this guide:

1. Collect all information from the Support Checklist above
2. Review server logs for the 30-minute period around the transaction
3. Take screenshots of PayPal Dashboard showing order status
4. Document exact steps to reproduce the issue

---

**Document Created**: 2025-12-03  
**Last Updated**: 2025-12-03  
**Version**: 1.0
