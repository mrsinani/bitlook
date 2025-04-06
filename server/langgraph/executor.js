import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { StringOutputParser } from "@langchain/core/output_parsers";

/**
 * Executor node function to perform tasks and generate responses
 */
export async function executorNode(state) {
  // Get the input, plan, and progress
  const input = state.input;
  const plan = state.plan;
  const nextStepIndex = state.pastSteps ? state.pastSteps.length : 0;

  // Safety check: make sure we have a plan
  if (!plan || plan.length === 0 || nextStepIndex >= plan.length) {
    return {
      pastSteps: [["Error", "No valid plan or all steps completed."]],
      next: "supervisor",
    };
  }

  // Get the current step from the plan
  const currentStep = plan[nextStepIndex];

  try {
    // Create an executor prompt
    const executorPrompt =
      ChatPromptTemplate.fromTemplate(`You are an executor agent in an AI system.
Your job is to execute tasks, perform calculations, analyze data, or generate the final response to the user's query.

USER QUERY: {input}

CURRENT PLAN STEP: {currentStep}

CONTEXT AND PREVIOUS STEPS:
{previousSteps}

Execute the current plan step based on the information available from previous steps.
If this is the final step in the plan, make sure to provide a complete and comprehensive answer to the user's query.
Be detailed and precise in your execution.`);

    // Create the model and parser
    const model = new ChatOpenAI({ model: "gpt-4o", temperature: 0 });
    const parser = new StringOutputParser();

    // Create the executor chain
    const executorChain = executorPrompt.pipe(model).pipe(parser);

    // Format previous steps
    const previousSteps =
      state.pastSteps && state.pastSteps.length > 0
        ? state.pastSteps
            .map(
              ([step, result], i) => `Step ${i + 1}: ${step}\nResult: ${result}`
            )
            .join("\n\n")
        : "No previous steps executed yet.";

    // Invoke the executor chain
    const executorResult = await executorChain.invoke({
      input,
      currentStep,
      previousSteps,
    });

    // Check if this is the final step
    const isFinalStep = nextStepIndex === plan.length - 1;

    // If this is the final step, the result should be returned as the response
    if (isFinalStep) {
      return {
        pastSteps: [[currentStep, `Executor Result: ${executorResult}`]],
        response: executorResult,
        next: "supervisor",
      };
    }

    // Otherwise, just return the result
    return {
      pastSteps: [[currentStep, `Executor Result: ${executorResult}`]],
      next: "supervisor",
    };
  } catch (error) {
    console.error("Executor agent error:", error);
    return {
      pastSteps: [
        [currentStep, `Executor Error: ${error.message || "Unknown error"}`],
      ],
      next: "supervisor",
    };
  }
}
