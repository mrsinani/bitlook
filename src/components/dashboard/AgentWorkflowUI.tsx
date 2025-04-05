import React, { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Send,
  Bot,
  User,
  RefreshCw,
  Verified,
  XCircle,
  Search,
  Cog,
  CheckCircle2,
  AlertTriangle,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { API_URL } from "@/lib/env";

interface AgentWorkflowUIProps {
  className?: string;
}

interface Step {
  description: string;
  status: "pending" | "in-progress" | "completed" | "error";
  agent?: "planner" | "supervisor" | "researcher" | "executor";
  result?: string;
}

// Define WorkflowResult interface for type safety
interface WorkflowResult {
  error?: string;
  pastSteps?: [string, string][]; // [stepDescription, stepResult]
  plan?: string[];
  response?: string;
}

const AgentWorkflowUI: React.FC<AgentWorkflowUIProps> = ({ className }) => {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [executionTrace, setExecutionTrace] = useState<string | null>(null);
  const [serviceStatus, setServiceStatus] = useState<
    "available" | "unavailable"
  >("available");

  const resetState = () => {
    setSteps([]);
    setResult(null);
    setExecutionTrace(null);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    resetState();
    setIsLoading(true);

    // Initial planning step
    setSteps([
      {
        description: "Planning approach",
        status: "in-progress",
        agent: "planner",
      },
    ]);

    try {
      // Call the server API instead of direct implementation
      const response = await fetch(`${API_URL}/api/ai/workflow`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ input }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const workflowResult = (await response.json()) as WorkflowResult;

      // Check if we got an error response
      if (
        workflowResult.error ||
        (workflowResult.pastSteps &&
          workflowResult.pastSteps[0] &&
          workflowResult.pastSteps[0][0] === "Error")
      ) {
        setServiceStatus("unavailable");
        throw new Error(workflowResult.error || "Service unavailable");
      }

      // Parse the plan and steps from the result
      if (workflowResult) {
        // Get the execution trace for debugging and display
        const traceResponse = await fetch(`${API_URL}/api/ai/trace`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ state: workflowResult }),
        });

        if (traceResponse.ok) {
          const { trace } = await traceResponse.json();
          setExecutionTrace(trace);
        }

        // Process and display steps
        const processedSteps: Step[] = [];

        // Add planner step
        processedSteps.push({
          description: "Planning approach",
          status: "completed",
          agent: "planner",
          result: `Created plan with ${workflowResult.plan?.length || 0} steps`,
        });

        // Process past steps
        if (workflowResult.pastSteps && workflowResult.pastSteps.length > 0) {
          workflowResult.pastSteps.forEach(
            ([stepDescription, stepResult]: [string, string]) => {
              // Determine agent type from the result string
              let agent: "supervisor" | "researcher" | "executor" =
                "supervisor";
              if (stepResult.includes("Researcher Result:")) {
                agent = "researcher";
              } else if (stepResult.includes("Executor Result:")) {
                agent = "executor";
              }

              processedSteps.push({
                description: stepDescription,
                status: "completed",
                agent,
                result: stepResult,
              });
            }
          );
        }

        setSteps(processedSteps);

        // Set the final response
        if (workflowResult.response) {
          setResult(workflowResult.response);
        } else {
          setResult(
            "The workflow completed but did not produce a final response."
          );
        }
      }
    } catch (error: unknown) {
      console.error("Error running workflow:", error);
      setSteps((prev) => [
        ...prev,
        {
          description: "Error occurred",
          status: "error",
          result: error instanceof Error ? error.message : String(error),
        },
      ]);
      setResult(
        "Sorry, I encountered an error while processing your request. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getAgentIcon = (agent?: string) => {
    switch (agent) {
      case "planner":
        return <Cog className="h-4 w-4" />;
      case "supervisor":
        return <Verified className="h-4 w-4" />;
      case "researcher":
        return <Search className="h-4 w-4" />;
      case "executor":
        return <RefreshCw className="h-4 w-4" />;
      default:
        return <Bot className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-positive" />;
      case "error":
        return <XCircle className="h-4 w-4 text-destructive" />;
      case "in-progress":
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      default:
        return null;
    }
  };

  return (
    <div className={cn("data-card flex flex-col h-full", className)}>
      <h3 className="card-heading mb-4">Bitlook AI Agent</h3>

      {serviceStatus === "unavailable" && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>AI Service Unavailable</AlertTitle>
          <AlertDescription>
            The AI services are currently unavailable or misconfigured. Please
            try again later or contact support.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2 mb-4">
        <Input
          value={input}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setInput(e.target.value)
          }
          placeholder="Ask about Bitcoin metrics or trends..."
          onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) =>
            e.key === "Enter" && handleSend()
          }
          className="flex-1"
          disabled={isLoading}
        />
        <Button
          onClick={handleSend}
          className="bg-primary hover:bg-primary/90"
          disabled={isLoading || !input.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {(steps.length > 0 || result) && (
        <Tabs defaultValue="steps" className="flex-1 flex flex-col">
          <TabsList className="mb-2">
            <TabsTrigger value="steps">Execution Steps</TabsTrigger>
            <TabsTrigger value="result">Result</TabsTrigger>
            {executionTrace && <TabsTrigger value="trace">Trace</TabsTrigger>}
          </TabsList>

          <TabsContent
            value="steps"
            className="flex-1 overflow-y-auto space-y-2 mt-0"
          >
            {steps.map((step, index) => (
              <Card
                key={index}
                className="border-l-4 shadow-sm"
                style={{
                  borderLeftColor:
                    step.status === "completed"
                      ? "var(--positive)"
                      : step.status === "error"
                      ? "var(--destructive)"
                      : "var(--primary)",
                }}
              >
                <CardHeader className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "flex items-center justify-center h-6 w-6 rounded-full shrink-0",
                          step.agent === "planner"
                            ? "bg-violet-500"
                            : step.agent === "supervisor"
                            ? "bg-blue-500"
                            : step.agent === "researcher"
                            ? "bg-emerald-500"
                            : step.agent === "executor"
                            ? "bg-amber-500"
                            : "bg-gray-500"
                        )}
                      >
                        {getAgentIcon(step.agent)}
                      </div>
                      <CardTitle className="text-sm font-medium">
                        {step.description}
                      </CardTitle>
                    </div>

                    {step.agent && (
                      <Badge variant="outline" className="text-xs capitalize">
                        {step.agent}
                      </Badge>
                    )}

                    {getStatusIcon(step.status)}
                  </div>
                </CardHeader>

                {step.result && (
                  <CardContent className="py-2 px-4 text-xs text-muted-foreground">
                    {step.result}
                  </CardContent>
                )}
              </Card>
            ))}

            {isLoading && steps.length === 0 && (
              <div className="flex justify-center items-center h-20">
                <RefreshCw className="h-5 w-5 animate-spin" />
              </div>
            )}
          </TabsContent>

          <TabsContent value="result" className="flex-1 overflow-y-auto mt-0">
            {result ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-md">Analysis Result</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{result}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="flex justify-center items-center h-20">
                <p className="text-muted-foreground">Waiting for results...</p>
              </div>
            )}
          </TabsContent>

          {executionTrace && (
            <TabsContent value="trace" className="flex-1 overflow-y-auto mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-md">Execution Trace</CardTitle>
                  <CardDescription>
                    Detailed log of the agent's workflow
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="whitespace-pre-wrap text-xs font-mono bg-muted p-2 rounded">
                    {executionTrace}
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      )}

      {!steps.length && !result && !isLoading && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
          <Bot className="h-12 w-12 mb-4 text-muted-foreground" />
          <h4 className="text-lg font-medium mb-2">Ask Bitlook AI</h4>
          <p className="text-muted-foreground">
            Ask questions about Bitcoin price, on-chain metrics, market trends,
            and more.
          </p>
        </div>
      )}
    </div>
  );
};

export default AgentWorkflowUI;
