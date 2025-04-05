import { Annotation } from "@langchain/langgraph";
import { AIMessage, HumanMessage } from "@langchain/core/messages";

// Define the state using Annotation.Root
export const PlanExecuteState = Annotation.Root({
  input: Annotation<string>(),
  plan: Annotation<string[]>({
    value: (x = [], y) => y || x,
    default: () => [],
  }),
  pastSteps: Annotation<[string, string][]>({
    value: (x = [], y) => [...x, ...(y || [])],
    default: () => [],
  }),
  response: Annotation<string | undefined>(),
  needsReplan: Annotation<boolean>({
    value: (x = false, y) => y ?? x,
    default: () => false,
  }),
  // Add next field for agent routing
  next: Annotation<string>({
    reducer: (x, y) => y ?? x ?? "supervisor",
    default: () => "supervisor",
  }),
  messages: Annotation<(AIMessage | HumanMessage)[]>({
    reducer: (x = [], y) => [...x, ...(y || [])],
    default: () => [],
  }),
  // Add call counters to track how many times each agent has been called
  researcherCallCount: Annotation<number>({
    reducer: (x = 0, y) => (y !== undefined ? y : x),
    default: () => 0,
  }),
  executorCallCount: Annotation<number>({
    reducer: (x = 0, y) => (y !== undefined ? y : x),
    default: () => 0,
  }),
});

// Type for state
export type PlanExecuteStateType = typeof PlanExecuteState.State;

// Type for workflow result
export type WorkflowResult = {
  input: string;
  plan: string[];
  pastSteps: [string, string][];
  response?: string;
  needsReplan: boolean;
  error?: string;
};

// Define the worker agent options
export const WORKER_AGENTS = ["researcher", "executor"] as const;
export type WorkerAgent = (typeof WORKER_AGENTS)[number];
