import { Annotation } from "@langchain/langgraph";
import { AIMessage, HumanMessage } from "@langchain/core/messages";

// Define the state using Annotation.Root
export const PlanExecuteState = Annotation.Root({
  input: Annotation(),
  plan: Annotation({
    value: (x = [], y) => y || x,
    default: () => [],
  }),
  pastSteps: Annotation({
    value: (x = [], y) => [...x, ...(y || [])],
    default: () => [],
  }),
  response: Annotation(),
  needsReplan: Annotation({
    value: (x = false, y) => y ?? x,
    default: () => false,
  }),
  // Add next field for agent routing
  next: Annotation({
    reducer: (x, y) => y ?? x ?? "supervisor",
    default: () => "supervisor",
  }),
  messages: Annotation({
    reducer: (x = [], y) => [...x, ...(y || [])],
    default: () => [],
  }),
  // Add call counters to track how many times each agent has been called
  researcherCallCount: Annotation({
    reducer: (x = 0, y) => (y !== undefined ? y : x),
    default: () => 0,
  }),
  executorCallCount: Annotation({
    reducer: (x = 0, y) => (y !== undefined ? y : x),
    default: () => 0,
  }),
});

// Define the worker agent options
export const WORKER_AGENTS = ["researcher", "executor"];
