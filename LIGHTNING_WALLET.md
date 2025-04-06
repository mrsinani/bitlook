# Lightning Wallet Integration

This document outlines the Lightning Network integration for Bitlook, explaining how the wallet connects to a Voltage Lightning Node and how to set up and debug the connection.

## Architecture Overview

The Lightning wallet integration uses the following components:

1. **Voltage Lightning Node** - A Lightning Network node hosted on [Voltage](https://voltage.cloud)
2. **Lightning Proxy Server** - A Node.js Express server that handles communication with the Voltage REST API
3. **React Frontend** - The wallet UI that connects to the proxy server

This architecture solves several problems:

- Prevents CORS issues by proxying requests
- Keeps sensitive macaroon credentials secure
- Provides a unified API for the frontend
- Handles error states and connection issues

## Setup Instructions

### 1. Configure Environment Variables

Copy the example environment file and update it with your Voltage node details:

```bash
cp .env.example .env
```

Edit the `.env` file and update the following values:

```
# Voltage Node REST API (for Lightning Proxy)
api_endpoint=http://your-node.u.voltageapp.io
rest_port=8080
admin_macaroon=your_admin_macaroon_here
```

You can get these values from your Voltage dashboard.

### 2. Test the Connection

Before starting the application, you can test the connection to your Voltage node:

```bash
npm run debug:lightning
```

This will verify if your node is accessible and correctly configured.

### 3. Starting the Application

You can start the entire application (Lightning proxy + app servers) using one of these commands:

**Option 1: Easy start with debug info**

```bash
npm run start:easy
```

This runs a comprehensive startup script that checks connection, starts servers in sequence, and provides detailed logs.

**Option 2: Using concurrently**

```bash
npm run start:all
```

This starts all servers simultaneously using concurrently.

## API Endpoints

The Lightning Proxy Server provides these endpoints:

| Endpoint                            | Description                              |
| ----------------------------------- | ---------------------------------------- |
| `GET /`                             | Health check endpoint                    |
| `GET /api/lightning/balance`        | Get on-chain wallet balance              |
| `GET /api/lightning/info`           | Get Lightning node info                  |
| `GET /api/lightning/invoices`       | Get list of invoices (incoming payments) |
| `POST /api/lightning/invoice`       | Create a new invoice                     |
| `GET /api/lightning/payments`       | Get list of payments (outgoing)          |
| `POST /api/lightning/pay`           | Pay a Lightning invoice                  |
| `GET /api/lightning/decode/:payreq` | Decode a BOLT11 invoice                  |

## Troubleshooting

### Connection Issues

If you're having trouble connecting to your Voltage node:

1. Run the diagnostic script:

   ```bash
   npm run debug:lightning
   ```

2. Check common issues:
   - Make sure your node is online in the Voltage dashboard
   - Verify the admin macaroon is correct and has the necessary permissions
   - Ensure the API endpoint URL is correct (including http:// prefix)
   - Check if your network allows outbound connections to the node

### Proxy Server Issues

If the Lightning proxy server isn't working:

1. Check if it's running:

   ```bash
   curl http://localhost:3001/
   ```

2. Look for errors in the console output

3. Verify ports are not blocked or in use by other applications

## Developing

When developing the Lightning Wallet functionality:

1. The main service code is in `src/services/lightning.ts`
2. Proxy server code is in `server/proxy.js`
3. Debugging utility is in `server/debug.js`

To add new endpoints:

1. Add a new endpoint handler in `server/proxy.js`
2. Add corresponding function in `src/services/lightning.ts`
3. Update types as needed

## Security Considerations

- The admin macaroon has full access to your node - keep it secure
- In production, use HTTPS for all connections
- Consider using more restricted macaroons for specific operations
- The proxy server should be behind proper authentication in production

## Resources

- [Voltage Documentation](https://docs.voltage.cloud)
- [Lightning Network Daemon (LND) API Reference](https://api.lightning.community)
- [BOLT11 Invoice Specification](https://github.com/lightning/bolts/blob/master/11-payment-encoding.md)
