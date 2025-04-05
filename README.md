# Bitlook

Bitcoin analytics and monitoring platform with AI-powered insights.

## Architecture

This application is built with a client-server architecture:

1. **Frontend**: React application with Vite, TypeScript, and Shadcn UI
2. **Backend**: Express.js server that handles API requests and runs AI workflows

The LangGraph agent has been moved to run server-side because it uses Node.js-specific features that aren't compatible with browser environments.

## Running the Application

### 1. Start the Server

```bash
cd server
npm install  # Only needed first time
node server.js
```

The server will start on port 3001 by default.

### 2. Start the Frontend

```bash
npm install  # Only needed first time
npm run dev
```

The frontend will be available at http://localhost:8081 (or another port if 8081 is in use).

## API Endpoints

The server exposes the following endpoints:

- `GET /api/health` - Check server health
- `GET /api/bitcoin-price` - Get current Bitcoin price
- `GET /api/bitcoin-history` - Get historical Bitcoin price
- `POST /api/ai/workflow` - Run the AI agent workflow
- `POST /api/ai/trace` - Get a detailed execution trace

## Development Notes

### Environment Variables

Create a `.env` file in both the root directory and server directory with:

```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Adding New Features

When extending the AI agent:

1. Update the server-side implementation in `server/server.js`
2. If necessary, update the types in `src/lib/langhain/types.ts`
3. The client components in `src/components/dashboard/` make API calls to the server

# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/5085cc6f-b238-463e-a960-8a8f14c146e8

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/5085cc6f-b238-463e-a960-8a8f14c146e8) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/5085cc6f-b238-463e-a960-8a8f14c146e8) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes it is!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
