import AgentWorkflowUI from "@/components/dashboard/AgentWorkflowUI";
import NewsFeed from "@/components/dashboard/NewsFeed";
import ErrorBoundary from "@/components/ErrorBoundary";

const AIAndNewsSection = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ErrorBoundary
        fallback={
          <div className="data-card flex flex-col min-h-[600px]">
            <h3 className="card-heading mb-4">Bitlook AI Agent</h3>
            <div className="p-4 border rounded-lg bg-card">
              <div className="flex items-center gap-2 text-destructive mb-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-alert-triangle h-4 w-4"
                >
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                  <path d="M12 9v4"></path>
                  <path d="M12 17h.01"></path>
                </svg>
                <span className="font-medium">AI Service Unavailable</span>
              </div>
              <p className="text-muted-foreground">
                The AI service is currently unavailable or misconfigured. Please
                try again later or contact support.
              </p>
            </div>
          </div>
        }
      >
        <AgentWorkflowUI className="lg:col-span-1 min-h-[600px]" />
      </ErrorBoundary>
      <ErrorBoundary
        fallback={
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 h-full flex flex-col justify-center items-center min-h-[600px]">
            <h3 className="text-lg font-semibold mb-2">Bitcoin News</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Unable to load news feed
            </p>
          </div>
        }
      >
        <NewsFeed
          className="lg:col-span-1 min-h-[600px]"
          refreshInterval={900000}
        />
      </ErrorBoundary>
    </div>
  );
};

export default AIAndNewsSection;
