import React, { ErrorInfo, Component } from "react";
import AgentWorkflowUI from "@/components/dashboard/AgentWorkflowUI";
import NewsFeed from "@/components/dashboard/NewsFeed";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

// Error boundary to catch rendering errors
class ErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error in component:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 border rounded-lg bg-card">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>AI Component Error</AlertTitle>
            <AlertDescription>
              The AI component has encountered an error and could not be
              rendered.
              <br />
              <code className="mt-2 block text-xs">
                {this.state.error?.message || "Unknown error"}
              </code>
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}

// Fallback component if AgentWorkflowUI fails to load
const FallbackAIComponent: React.FC<{ className?: string }> = ({
  className,
}) => (
  <div className={`data-card flex flex-col ${className}`}>
    <h3 className="card-heading mb-4">Bitlook AI Agent</h3>
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>AI Service Unavailable</AlertTitle>
      <AlertDescription>
        The AI service is currently unavailable or misconfigured. Please try
        again later or contact support.
      </AlertDescription>
    </Alert>
    <div className="flex-1 flex items-center justify-center">
      <p className="text-muted-foreground">
        AI functionality is temporarily unavailable.
      </p>
    </div>
  </div>
);

const AIAndNewsSection = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ErrorBoundary>
        <React.Suspense
          fallback={
            <FallbackAIComponent className="lg:col-span-1 min-h-[600px]" />
          }
        >
          <AgentWorkflowUI className="lg:col-span-1 min-h-[600px]" />
        </React.Suspense>
      </ErrorBoundary>
      <NewsFeed className="lg:col-span-1 min-h-[600px]" />
    </div>
  );
};

export default AIAndNewsSection;
