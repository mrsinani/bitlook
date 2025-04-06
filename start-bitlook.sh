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
check_port 3000 || exit 1  # Main app
check_port 3001 || exit 1  # Lightning proxy

# Step 1: Debug Lightning node connection
echo -e "\n${YELLOW}Step 1: Checking connection to Voltage Lightning node...${NC}"
cd "$BASE_DIR/server" && node debug.js
DEBUG_STATUS=$?
cd "$BASE_DIR"

if [ $DEBUG_STATUS -ne 0 ]; then
  echo -e "${RED}Failed to connect to Lightning node. Please check your .env configuration.${NC}"
  echo -e "See error details above for troubleshooting."
  exit 1
fi

# Step 2: Start Lightning proxy with dependencies
echo -e "\n${YELLOW}Step 2: Starting Lightning proxy server...${NC}"
cd "$BASE_DIR/server" && npm start &
LIGHTNING_PROXY_PID=$!
cd "$BASE_DIR"
echo -e "${GREEN}Lightning proxy starting with PID: $LIGHTNING_PROXY_PID${NC}"

# Wait for Lightning proxy to be ready
echo -e "Waiting for Lightning proxy to start..."
sleep 5
if ! curl -s http://localhost:3001/ > /dev/null; then
  echo -e "${RED}Lightning proxy failed to start!${NC}"
  kill $LIGHTNING_PROXY_PID 2>/dev/null
  exit 1
fi
echo -e "${GREEN}Lightning proxy is running!${NC}"

# Step 3: Start the main application
echo -e "\n${YELLOW}Step 3: Starting Bitlook application...${NC}"
cd "$BASE_DIR" && npm run dev &
APP_PID=$!
echo -e "${GREEN}Bitlook app starting with PID: $APP_PID${NC}"

echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN}All services are now running!${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Lightning Proxy: ${YELLOW}http://localhost:3001/${NC}"
echo -e "Bitlook App:     ${YELLOW}http://localhost:3000/${NC}"
echo -e "\nPress Ctrl+C to stop all services"

# Trap SIGINT and SIGTERM to gracefully shut down services
trap "echo -e '\n${YELLOW}Shutting down services...${NC}'; kill $LIGHTNING_PROXY_PID $APP_PID 2>/dev/null; exit 0" SIGINT SIGTERM

# Keep the script running
wait 