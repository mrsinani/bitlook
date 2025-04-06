#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Store the base directory
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$BASE_DIR"

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}   Bitlook Application Startup Script   ${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Working from directory: ${YELLOW}$BASE_DIR${NC}"

# Check if .env file exists
if [ ! -f .env ]; then
  echo -e "${RED}Error: .env file not found!${NC}"
  echo -e "Please create a .env file with your Voltage node credentials."
  echo -e "You can copy .env.example and fill in your details:"
  echo -e "${YELLOW}cp .env.example .env${NC}"
  exit 1
fi

# Check if server directory exists
if [ ! -d "$BASE_DIR/server" ]; then
  echo -e "${RED}Error: server directory not found!${NC}"
  echo -e "Expected server directory at: ${YELLOW}$BASE_DIR/server${NC}"
  ls -la
  exit 1
fi

# Function to check if a port is available
check_port() {
  local port=$1
  if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${RED}Port $port is already in use. Cannot start server.${NC}"
    return 1
  fi
  return 0
}

# Check required ports
check_port 8080 || exit 1  # Main app (Vite uses 8080 by default)
check_port 3001 || exit 1  # Lightning proxy
check_port 3002 || exit 1  # API server
check_port 8545 || exit 1  # Hardhat node

# Step 1: Start Hardhat network and deploy contracts
echo -e "\n${YELLOW}Step 1: Starting Ethereum local network...${NC}"
cd "$BASE_DIR" && npx hardhat node > /dev/null &
HARDHAT_PID=$!
echo -e "${GREEN}Hardhat node starting with PID: $HARDHAT_PID${NC}"

# Wait for Hardhat node to be ready
echo -e "Waiting for Hardhat node to start..."
sleep 5
if ! curl -s -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' http://localhost:8545 > /dev/null; then
  echo -e "${RED}Hardhat node failed to start!${NC}"
  kill $HARDHAT_PID 2>/dev/null
  exit 1
fi
echo -e "${GREEN}Hardhat node is running!${NC}"

# Deploy the contracts
echo -e "\n${YELLOW}Deploying smart contracts...${NC}"
cd "$BASE_DIR" && npx hardhat run scripts/deploy.cjs --network localhost
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to deploy smart contracts!${NC}"
  kill $HARDHAT_PID 2>/dev/null
  exit 1
fi
echo -e "${GREEN}Smart contracts deployed successfully!${NC}"

# Step 2: Debug Lightning node connection
echo -e "\n${YELLOW}Step 2: Checking connection to Voltage Lightning node...${NC}"
cd "$BASE_DIR/server" && node debug.js
DEBUG_STATUS=$?
cd "$BASE_DIR"

if [ $DEBUG_STATUS -ne 0 ]; then
  echo -e "${RED}Failed to connect to Lightning node. Please check your .env configuration.${NC}"
  echo -e "See error details above for troubleshooting."
  kill $HARDHAT_PID 2>/dev/null
  exit 1
fi

# Step 3: Start Lightning proxy and API server together
echo -e "\n${YELLOW}Step 3: Starting Lightning proxy and API server...${NC}"
cd "$BASE_DIR/server" && npm run all &
SERVER_PID=$!
cd "$BASE_DIR"
echo -e "${GREEN}Lightning proxy and API server starting with PID: $SERVER_PID${NC}"

# Wait for Lightning proxy to be ready
echo -e "Waiting for Lightning proxy to start..."
sleep 5
if ! curl -s http://localhost:3001/ > /dev/null; then
  echo -e "${RED}Lightning proxy failed to start!${NC}"
  kill $HARDHAT_PID $SERVER_PID 2>/dev/null
  exit 1
fi
echo -e "${GREEN}Lightning proxy is running!${NC}"

# Wait for API server to be ready
echo -e "Waiting for API server to start..."
sleep 5
if ! curl -s http://localhost:3002/api/health > /dev/null; then
  echo -e "${RED}API server failed to start!${NC}"
  kill $HARDHAT_PID $SERVER_PID 2>/dev/null
  exit 1
fi
echo -e "${GREEN}API server is running!${NC}"

# Step 4: Start the main application
echo -e "\n${YELLOW}Step 4: Starting Bitlook application...${NC}"
cd "$BASE_DIR" && npm run dev &
APP_PID=$!
echo -e "${GREEN}Bitlook app starting with PID: $APP_PID${NC}"

echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN}All services are now running!${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Hardhat Node:    ${YELLOW}http://localhost:8545/${NC}"
echo -e "Lightning Proxy: ${YELLOW}http://localhost:3001/${NC}"
echo -e "API Server:      ${YELLOW}http://localhost:3002/${NC}"
echo -e "Bitlook App:     ${YELLOW}http://localhost:8080/${NC}"
echo -e "\nPress Ctrl+C to stop all services"

# Trap SIGINT and SIGTERM to gracefully shut down services
trap "echo -e '\n${YELLOW}Shutting down services...${NC}'; kill $HARDHAT_PID $SERVER_PID $APP_PID 2>/dev/null; exit 0" SIGINT SIGTERM

# Keep the script running
wait 