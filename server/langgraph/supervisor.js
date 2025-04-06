import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { JsonOutputToolsParser } from "@langchain/core/output_parsers/openai_tools";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { END } from "@langchain/langgraph";
import { WORKER_AGENTS } from "./types.js";

// Define the schema for the supervisor to decide the next agent to use
const supervisorFunction = {
  name: "supervisor_decide",
  description: "Decide the next step to take in the workflow",
  parameters: zodToJsonSchema(
    z.object({
      thought: z.string().describe("Reasoning about what to do next"),
      next: z
        .enum([...WORKER_AGENTS, "replan", "END"])
        .describe("The next agent to use, or END if done"),
    })
  ),
  required: ["next", "thought"],
};

// Create the supervisor prompt
const supervisorPrompt =
  ChatPromptTemplate.fromTemplate(`You are a workflow supervisor in an AI system.
Your job is to decide the next step to take in the workflow, based on the current state.

CURRENT STATE:
User input: {input}

Current plan:
{planString}

Progress so far:
{progress}

Based on the current state, decide what to do next:

1. If we need specific information that is not generated yet (facts, data, etc.), use the 'researcher' agent to collect that information.
2. If we need to perform specific tasks like calculations, code analysis, or generate final responses using existing information, use the 'executor' agent.
3. If the plan is not working or off track and needs to be revised, use 'replan'.
4. If all steps in the plan have been completed and we have a satisfactory response, use 'END'.

Think step by step, considering the plan and what's been done so far. Don't use an agent if we already have the information it would provide.
`);

// Create the OpenAI model with tools
const model = new ChatOpenAI({
  model: "gpt-4o",
  temperature: 0,
}).bindTools([
  {
    type: "function",
    function: supervisorFunction,
  },
]);

// Create the output parser
const parser = new JsonOutputToolsParser();

// Create the supervisor chain
export const supervisorChain = supervisorPrompt.pipe(model).pipe(parser);

/**
 * Supervisor node function to decide the next step in the workflow
 */
export async function supervisorNode(state) {
  // Format the plan as a string
  const planString =
    state.plan && state.plan.length > 0
      ? state.plan.map((step, i) => `${i + 1}. ${step}`).join("\n")
      : "No plan created yet.";

  // Format progress as a string
  const progress =
    state.pastSteps && state.pastSteps.length > 0
      ? state.pastSteps
          .map(
            ([step, result], i) => `Step ${i + 1}: ${step}\nResult: ${result}`
          )
          .join("\n\n")
      : "No steps executed yet.";

  // Call the supervisor chain
  const result = await supervisorChain.invoke({
    input: state.input,
    planString,
    progress,
  });

  const supervisorDecision = result[0].args;

  // Check if we're done
  if (supervisorDecision.next === "END") {
    // Return an object with the final result and next=END
    const lastStepResult =
      state.pastSteps.length > 0
        ? state.pastSteps[state.pastSteps.length - 1][1]
        : "No steps were executed.";

    return {
      response: lastStepResult,
      next: END,
    };
  }

  // For worker agents, increment their call counts
  if (WORKER_AGENTS.includes(supervisorDecision.next)) {
    if (supervisorDecision.next === "researcher") {
      return {
        researcherCallCount: (state.researcherCallCount || 0) + 1,
        next: supervisorDecision.next,
      };
    } else if (supervisorDecision.next === "executor") {
      return {
        executorCallCount: (state.executorCallCount || 0) + 1,
        next: supervisorDecision.next,
      };
    }
  }

  // Otherwise, just return the next step
  return { next: supervisorDecision.next };
}
