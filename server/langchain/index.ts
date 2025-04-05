import { workflow } from "./graph.js";
import {
  PlanExecuteStateType,
  WorkflowResult,
} from "./types.js";

/**
 * Execute the agentic workflow with the given input
 * @param input The user's input/question
 * @returns The final result from the workflow
 */
export async function runWorkflow(input: string): Promise<WorkflowResult> {
  try {
    // Initialize the state
    const state = {
      input,
      plan: [],
      pastSteps: [],
      response: undefined,
      needsReplan: false,
    };

    // Run the workflow until it ends
    const result = await workflow.invoke(state);

    // Return the final state
    return result;
  } catch (error: Error | unknown) {
    console.error("Workflow execution failed:", error);

    // Return a graceful error state that won't break the UI
    return {
      input,
      plan: [],
      pastSteps: [
        [
          "Error",
          `The AI agent encountered an error: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        ] as [string, string],
      ],
      response:
        "I'm unable to process your request at the moment. The AI services might be unavailable or misconfigured. Please contact the administrator for assistance.",
      needsReplan: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get a human-readable trace of the workflow execution
 * @param state The final state from the workflow
 * @returns A formatted string showing the plan and execution steps
 */
export function getExecutionTrace(state: PlanExecuteStateType): string {
  try {
    let trace = `Input: ${state.input}\n\n`;

    if (state.plan && Array.isArray(state.plan) && state.plan.length > 0) {
      trace += "Plan:\n";
      trace += state.plan.map((step, i) => `${i + 1}. ${step}`).join("\n");
      trace += "\n\n";
    } else {
      trace += "No plan was generated.\n\n";
    }

    if (
      state.pastSteps &&
      Array.isArray(state.pastSteps) &&
      state.pastSteps.length > 0
    ) {
      trace += "Execution Steps:\n";
      state.pastSteps.forEach(([step, result], i) => {
        trace += `Step ${i + 1}: ${step}\n`;
        trace += `Result: ${result}\n\n`;
      });
    } else {
      trace += "No execution steps were performed.\n\n";
    }

    if (state.response) {
      trace += `Final Response: ${state.response}\n`;
    }

    return trace;
  } catch (error: Error | unknown) {
    console.error("Error generating execution trace:", error);
    return "Error: Could not generate execution trace due to an unexpected error.";
  }
}

// Export types for client-side use
export { PlanExecuteState } from "./types.js";
export type { PlanExecuteStateType, WorkflowResult } from "./types.js";
