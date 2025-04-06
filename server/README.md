# BitLook Lightning Proxy Server

This is a proxy server that handles API calls to the Voltage Lightning node. It solves CORS and connectivity issues by proxying requests from the front-end to the Lightning node.

## Why a Proxy Server?

Direct browser connections to Lightning nodes often fail due to:

1. CORS restrictions (browser security)
2. Tor hidden service connections (onion addresses)
3. Mixed content warnings (HTTP vs HTTPS)

This proxy server acts as a middleware, making API calls to Voltage on behalf of the frontend.

## Setup and Running

1. Install dependencies:

```bash
cd server
npm install
```

2. Start the proxy server:

```bash
npm start
```

The server will run on port 3001 by default.

## Available Endpoints

- `GET /api/lightning/balance` - Get wallet balance
- `GET /api/lightning/info` - Get node information
- `GET /api/lightning/invoices` - Get list of invoices
- `POST /api/lightning/invoice` - Create new invoice
- `GET /api/lightning/payments` - Get list of payments
- `POST /api/lightning/pay` - Pay a Lightning invoice
- `GET /api/lightning/decode/:payreq` - Decode a Lightning invoice

## Configuration

The proxy server uses the following environment variables:

- `PORT` - Port to run the server on (default: 3001)
- `VOLTAGE_API_URL` - Voltage API URL (hardcoded in the code)
- `VOLTAGE_ADMIN_MACAROON` - Voltage admin macaroon (hardcoded in the code)

For production use, you should move these values to environment variables.

## Security Notes

This is set up for development purposes. For production:

1. Add proper authentication to the proxy
2. Use HTTPS
3. Set up proper error handling
4. Move credentials to environment variables
