import { ChatPromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { ChatOpenAI } from "@langchain/openai";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { PlanExecuteStateType } from "./types.js";
import { HumanMessage } from "@langchain/core/messages";

// Define the tool schemas for the executor agent
const executeActionSchema = zodToJsonSchema(
  z.object({
    action: z.string().describe("The action that should be executed"),
    parameters: z
      .record(z.any())
      .describe("Parameters required for the action"),
    reasoning: z
      .string()
      .describe("Reasoning for why this action should be taken"),
  })
);

const resultSchema = zodToJsonSchema(
  z.object({
    result: z.string().describe("The result of executing the step"),
    success: z.boolean().describe("Whether the execution was successful"),
    details: z.string().describe("Additional details about the execution"),
  })
);

// Create the tools
const executeActionTool = {
  type: "function",
  function: {
    name: "execute_action",
    description: "Execute a specific action with the given parameters",
    parameters: executeActionSchema,
  },
};

const resultTool = {
  type: "function",
  function: {
    name: "provide_result",
    description: "Provide the result of the execution",
    parameters: resultSchema,
  },
};

// Create the executor prompt template
const executorPrompt =
  ChatPromptTemplate.fromTemplate(`You are an executor agent responsible for carrying out actions based on provided information and instructions.
Your goal is to execute the given step effectively and report the results.

TASK TO EXECUTE:
{step}

AVAILABLE INFORMATION:
{available_info}

APPROACH:
1. Determine what specific action needs to be taken based on the step description
2. Define the necessary parameters for the action
3. Execute the action and provide the result
4. If you cannot execute the action, explain why and provide a meaningful error message

Think step by step about how to best execute this task.
`);

// Create the parser for structured output
const parser = new JsonOutputParser();

// Create the executor chain
export const executor = async (step: string, availableInfo: string = "") => {
  try {
    // Create the model with tools using proper binding
    const model = new ChatOpenAI({ model: "gpt-4o" }).bind({
      tools: [executeActionTool, resultTool],
    });

    // Create the chain
    const chain = executorPrompt.pipe(model).pipe(parser);

    return chain.invoke({
      step,
      available_info: availableInfo || "No additional information provided.",
    });
  } catch (error) {
    console.error("Error in executor chain:", error);
    // Return a fallback response
    return [
      {
        type: "provide_result",
        args: {
          result: "Unable to execute the requested action",
          success: false,
          details:
            error instanceof Error ? error.message : "API or parsing error",
        },
      },
    ];
  }
};

// Main execution step function
export async function executeStep(
  step: string,
  additionalInfo: string = ""
): Promise<{ result: string }> {
  try {
    const executorOutput = await executor(step, additionalInfo);

    // Handle output from JsonOutputParser
    if (Array.isArray(executorOutput) && executorOutput.length > 0) {
      const tool = executorOutput[0];

      if (tool.type === "execute_action") {
        // In a real implementation, this would trigger actual execution of the action
        // For now, simulate execution with the provided parameters
        const action = tool.args?.action || "unknown action";
        const parameters = tool.args?.parameters || {};
        const reasoning = tool.args?.reasoning || "";

        // This is a placeholder for where real execution would happen
        const executionResult = {
          success: true,
          details: `Executed ${action} with parameters: ${JSON.stringify(
            parameters
          )}`,
        };

        return {
          result: `Action Executed: ${action}\nResult: ${
            executionResult.success ? "SUCCESS" : "FAILURE"
          }\nDetails: ${executionResult.details}\nReasoning: ${reasoning}`,
        };
      }

      if (tool.type === "provide_result") {
        return {
          result: `Execution ${tool.args?.success ? "Successful" : "Failed"}: ${
            tool.args?.result
          }\nDetails: ${tool.args?.details}`,
        };
      }
    }

    // If we got an OpenAI response with tool_calls
    if (
      typeof executorOutput === "object" &&
      executorOutput !== null &&
      !Array.isArray(executorOutput) &&
      "tool_calls" in executorOutput &&
      Array.isArray(executorOutput.tool_calls) &&
      executorOutput.tool_calls.length > 0
    ) {
      const toolCall = executorOutput.tool_calls[0];
      if (toolCall.function && toolCall.function.arguments) {
        try {
          const args = JSON.parse(toolCall.function.arguments);
          const toolName = toolCall.function.name || "";

          if (toolName === "execute_action" && args.action) {
            return {
              result: `Action Executed: ${
                args.action
              }\nResult: SUCCESS\nDetails: Simulated execution\nReasoning: ${
                args.reasoning || "No reasoning provided"
              }`,
            };
          }

          if (toolName === "provide_result") {
            return {
              result: `Execution ${args.success ? "Successful" : "Failed"}: ${
                args.result || "No result"
              }\nDetails: ${args.details || "No details"}`,
            };
          }

          return {
            result: `Tool call '${toolName}' with args: ${JSON.stringify(
              args
            )}`,
          };
        } catch (e) {
          console.error("Error parsing tool call arguments:", e);
        }
      }
    }

    // If we got a different format or no valid tool call
    if (typeof executorOutput === "object" && executorOutput !== null) {
      // Try to extract meaningful information from any response format
      const responseStr = JSON.stringify(executorOutput);
      return {
        result: `Execution completed with non-standard response: ${responseStr.substring(
          0,
          500
        )}${responseStr.length > 500 ? "..." : ""}`,
      };
    }

    return {
      result: "Unable to execute task. Received an unexpected response format.",
    };
  } catch (error: unknown) {
    console.error("Error in executeStep:", error);
    return {
      result: `Execution error: ${
        error instanceof Error
          ? error.message
          : "Unknown error occurred during execution"
      }`,
    };
  }
}

// Add the executor node function for the graph workflow
export async function executorNode(
  state: PlanExecuteStateType
): Promise<Partial<PlanExecuteStateType>> {
  // Extract the current plan step to execute
  let stepToExecute = "";
  if (state.plan && state.plan.length > 0) {
    stepToExecute = state.plan[0];
  } else {
    stepToExecute = "No specific execution step provided.";
  }

  // Call the existing executeStep function with the step
  const result = await executeStep(stepToExecute);

  // For now, executor has minimal functionality
  // In the future, this will be expanded with real execution capabilities

  // Update the state with the execution result and increment the call counter
  return {
    pastSteps: [[stepToExecute, result.result]],
    plan: state.plan.slice(1), // Remove the first step that was just handled
    messages: [
      new HumanMessage({
        content: `Execution completed: ${stepToExecute}\nResult: ${result.result}`,
        name: "Executor",
      }),
    ],
    executorCallCount: (state.executorCallCount || 0) + 1, // Increment call counter
    next: "supervisor", // Return control to the supervisor
  };
}
