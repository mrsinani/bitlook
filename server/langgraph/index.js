import { workflow } from "./graph.js";

/**
 * Execute the agentic workflow with the given input
 * @param {string} input The user's input/question
 * @returns {Promise<object>} The final result from the workflow
 */
export async function runWorkflow(input) {
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
  } catch (error) {
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
        ],
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
 * @param {object} state The final state from the workflow
 * @returns {string} A formatted string showing the plan and execution steps
 */
export function getExecutionTrace(state) {
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
  } catch (error) {
    console.error("Error generating execution trace:", error);
    return "Error: Could not generate execution trace due to an unexpected error.";
  }
}
