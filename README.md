# Bitlook

Bitcoin analytics and monitoring platform with AI-powered insights.

## 💡 Inspiration

**Bitlook** was born out of a shared frustration: Bitcoin data is scattered, overwhelming, and often too technical for everyday users. From tracking blockchain stats to accessing Lightning Network insights, we found ourselves jumping across multiple platforms, piecing together what should have been readily available in one place.

We wanted to build a tool that **centralizes Bitcoin intelligence**—from real-time blockchain and Lightning Network analytics to curated news and education—so users can make informed decisions faster. As Bitcoin adoption grows, especially with the expansion of the Lightning Network, there's a clear need for a **focused, Bitcoin-first dashboard** that's intuitive, powerful, and user-friendly.

## 🚀 What it does

Bitlook centralizes Bitcoin insights by offering:

- Real-time blockchain and Lightning Network analytics
- Lightning wallet integration for instant transactions
- Curated news and updates relevant to Bitcoin
- AI-powered chatbot for on-demand Bitcoin education

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

## 🛠️ How we built it

We used a modern full-stack approach:

- **Vite** with **React** for a dynamic frontend
- **TypeScript** and **Tailwind CSS** for styling and type safety
- **Direct API calls** for real-time blockchain data updates
- Lightning Network APIs for statistics integration
- Standard API calls for news aggregation
- Chatbot UI component

## 🚧 Challenges we ran into

- Managing real-time data without performance issues
- Poor or incomplete documentation on Lightning APIs
- UI/UX balance: presenting dense data simply
- Training and fine-tuning the chatbot to reduce hallucinations _(challenge for future implementation)_

## 🏆 Accomplishments that we're proud of

- Built a functional dashboard with Bitcoin and Lightning Network statistics
- Created a polished and intuitive UI that simplifies Bitcoin analytics
- Implemented Bitcoin news integration
- Designed a chatbot UI component

## 🎓 What we learned

- How to integrate Bitcoin and Lightning Network data from public APIs
- UX strategies for simplifying technical content
- Best practices for organizing complex dashboard information
- How to collaborate across a multidisciplinary tech team

## 🔮 What's next for BitLook

- Implement AI capabilities for predictive Bitcoin analytics
- Add more educational content and interactive learning tools
- Integrate actual Lightning wallet functionality
- Launch mobile support and browser extensions
- Explore monetization through subscriptions and partnerships

## Development Notes

### Environment Variables

Create a `.env` file in both the root directory and server directory with:

```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Project Technical Info

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Clerk authentication
- Supabase database
