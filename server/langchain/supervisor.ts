import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { PlanExecuteStateType, WORKER_AGENTS } from "./types.js";
import { END } from "@langchain/langgraph";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { z } from "zod";

// Define the structure of a tool call
interface ToolCall {
  id?: string;
  name?: string;
  type?: string;
  function?: {
    name?: string;
    arguments?: string;
  };
}

// LLM model
const model = new ChatOpenAI({
  model: "gpt-4o",
  temperature: 0,
});

// Define the supervisor's system prompt
const systemPrompt =
  "You are a supervisor agent that coordinates work between the" +
  " following workers: {worker_agents}. Given the current plan and state," +
  " respond with the worker to act next. Each worker will perform a" +
  " task and respond with their results. When finished with all tasks," +
  " respond with FINISH.\n\n" +
  "IMPORTANT CONSTRAINTS:\n" +
  "- The researcher agent can be called a maximum of 2 times\n" +
  "- The executor agent can be called a maximum of 1 time\n" +
  "- Once these limits are reached, you must either use the remaining agent (if available) or finish the task\n" +
  "- Current researcher calls: {researcher_calls}/2\n" +
  "- Current executor calls: {executor_calls}/1\n\n" +
  "Current question: {question}\n" +
  "Current plan: \n{plan}\n\n" +
  "{previous_steps}";

// Define routing options
const routingOptions = [...WORKER_AGENTS, END];

// Create the routing tool schema using zod
const routingSchema = z.object({
  next: z.enum([END, ...WORKER_AGENTS] as [string, ...string[]]),
  reasoning: z
    .string()
    .describe("Explanation for why this agent should handle the task next"),
});

// Create the routing tool
const routingTool = {
  name: "route",
  description: "Select the next agent to work on the task",
  schema: routingSchema,
};

// Create the supervisor prompt template
const supervisorPrompt = ChatPromptTemplate.fromMessages([
  ["system", systemPrompt],
  new MessagesPlaceholder("messages"),
  [
    "human",
    "Given the conversation and plan above, which worker should act next?" +
      " Or should we FINISH? Select one of: {options}",
  ],
]);

// Format the prompt with options
const formattedPrompt = async () => {
  return supervisorPrompt.partial({
    options: routingOptions.join(", "),
    worker_agents: WORKER_AGENTS.join(", "),
  });
};

// Create the supervisor chain with proper tool parsing
const getSupervisorChain = async () => {
  const prompt = await formattedPrompt();
  return prompt
    .pipe(
      model.bindTools([routingTool], {
        tool_choice: { type: "function", function: { name: "route" } },
      })
    )
    .pipe((message: AIMessage) => {
      // Access tool_calls with proper type checking
      const toolCalls = message.tool_calls as ToolCall[] | undefined;

      if (!toolCalls || toolCalls.length === 0) {
        console.warn(
          "No tool calls returned from model, defaulting to researcher"
        );
        return { next: "researcher", reasoning: "Defaulting to researcher" };
      }

      try {
        const toolCall = toolCalls[0];
        // Check if we have the expected structure
        if (toolCall && toolCall.function && toolCall.function.arguments) {
          // Parse the arguments from a JSON string
          const args = JSON.parse(toolCall.function.arguments);
          return {
            next: args.next,
            reasoning: args.reasoning || "No reasoning provided",
          };
        }

        console.warn("Tool output doesn't have expected format", toolCalls);
        return { next: "researcher", reasoning: "Invalid tool output format" };
      } catch (e) {
        console.error("Error processing supervisor output:", e);
        return { next: "researcher", reasoning: "Error processing output" };
      }
    });
};

/**
 * Supervise the execution of the plan
 * @param state The current state of the plan execution
 * @returns The updated state with routing decision
 */
export async function supervisorNode(
  state: PlanExecuteStateType
): Promise<Partial<PlanExecuteStateType>> {
  // Format the previous steps for the prompt
  const previousSteps =
    state.pastSteps.length > 0
      ? "Past steps:\n" +
        state.pastSteps
          .map(([step, result]) => `${step}: ${result}`)
          .join("\n\n")
      : "";

  // Add a message from the supervisor asking for the next step
  const messages = [
    new HumanMessage({
      content: "Which agent should handle the next step in our plan?",
    }),
  ];

  // Get the supervisor chain
  const supervisorChain = await getSupervisorChain();

  // Get current call counts
  const researcherCallCount = state.researcherCallCount || 0;
  const executorCallCount = state.executorCallCount || 0;

  // Log the current call counts
  console.log(
    `Current call counts - Researcher: ${researcherCallCount}/2, Executor: ${executorCallCount}/1`
  );

  // Run the supervisor model
  const output = await supervisorChain.invoke({
    question: state.input,
    plan: state.plan.join("\n"),
    previous_steps: previousSteps,
    researcher_calls: researcherCallCount,
    executor_calls: executorCallCount,
    messages: [...state.messages, ...messages],
  });

  console.log("Supervisor Decision:", output.next);
  console.log("Reasoning:", output.reasoning);

  // Check call limits and override decision if necessary
  let finalDecision = output.next;
  let overrideReason = "";

  if (finalDecision === "researcher" && researcherCallCount >= 2) {
    // If researcher has been called 2 times already, try executor if it hasn't been used
    if (executorCallCount < 1 && state.plan && state.plan.length > 0) {
      finalDecision = "executor";
      overrideReason =
        "Researcher limit reached (2 calls). Trying executor instead.";
    } else {
      // If both agents have reached their limits or no more plan steps, end the workflow
      finalDecision = END;
      overrideReason = "Both agent limits reached. Finishing workflow.";
    }
  } else if (finalDecision === "executor" && executorCallCount >= 1) {
    // If executor has been called already, try researcher if it hasn't reached its limit
    if (researcherCallCount < 2 && state.plan && state.plan.length > 0) {
      finalDecision = "researcher";
      overrideReason =
        "Executor limit reached (1 call). Trying researcher instead.";
    } else {
      // If both agents have reached their limits or no more plan steps, end the workflow
      finalDecision = END;
      overrideReason = "Both agent limits reached. Finishing workflow.";
    }
  }

  // Log if decision was overridden
  if (finalDecision !== output.next) {
    console.log(`Decision overridden: ${output.next} -> ${finalDecision}`);
    console.log(`Reason: ${overrideReason}`);
  }

  // If we're done, generate a final response
  if (finalDecision === END) {
    const finalResponse = await generateResponse(
      state.input,
      state.pastSteps,
      state.plan
    );

    return {
      response: finalResponse,
      messages: [
        new AIMessage({
          content: finalResponse,
          name: "Assistant",
        }),
      ],
      next: END,
    };
  }

  // Otherwise, update the state with the next agent to run
  return {
    next: finalDecision,
  };
}

/**
 * Generate the final response
 * @param question The original question
 * @param pastSteps The steps taken and their results
 * @param plan The original plan
 * @returns The final response
 */
async function generateResponse(
  question: string,
  pastSteps: [string, string][],
  plan: string[]
): Promise<string> {
  // Extract relevant research
  const relevantInfo = pastSteps
    .map(([step, result]) => `${step}: ${result}`)
    .join("\n\n");

  // Create the response chain
  const responseTemplate =
    ChatPromptTemplate.fromTemplate(`You are a helpful assistant that answers questions about Bitcoin and cryptocurrency.

You need to answer this question: "{question}"

Here is the information you've gathered:
{research}

The original plan was:
{plan}

FORMAT YOUR RESPONSE FOR MAXIMUM READABILITY:
- Use bullet points for listing information
- Break content into short paragraphs (3-4 lines maximum)
- Use clear headings for different sections
- Include line breaks between sections
- Highlight key information with concise statements
- Avoid long, dense paragraphs of text

Now, provide a clear, concise, and easy-to-read answer based on this information.`);

  // Use a simpler model binding without tools for the final response
  const responseModel = new ChatOpenAI({
    model: "gpt-4o",
    temperature: 0,
  });

  const responseChain = responseTemplate.pipe(responseModel);

  const responseResult = await responseChain.invoke({
    question,
    research: relevantInfo,
    plan: plan.join("\n"),
  });

  return responseResult.content as string;
}
