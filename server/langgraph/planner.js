import { ChatPromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { ChatOpenAI } from "@langchain/openai";
import { JsonOutputToolsParser } from "@langchain/core/output_parsers/openai_tools";

// Define the schema for the planning tool
const plan = zodToJsonSchema(
  z.object({
    steps: z
      .array(z.string()).length(3)
      .describe("different steps to follow, should be in sorted order"),
  })
);

// Configure the planning function
const planFunction = {
  name: "plan",
  description: "This tool is used to plan the steps to follow",
  parameters: plan,
};

// Create the planning tool
const planTool = {
  type: "function",
  function: planFunction,
};

// Create the planner prompt
const plannerPrompt = ChatPromptTemplate.fromTemplate(
  `For the given objective, come up with a simple 3 step plan. \
This plan should involve individual tasks, that if executed correctly will yield the correct answer. Do not add any superfluous steps. \
The result of the final step should be the final answer. Make sure that each step has all the information needed - do not skip steps.

{objective}`
);

// Create the OpenAI model
const model = new ChatOpenAI({
  model: "gpt-4-0125-preview",
}).withStructuredOutput(planFunction);

// Create the planner chain
export const planner = plannerPrompt.pipe(model);

// Define the schema for the response tool
const response = zodToJsonSchema(
  z.object({
    response: z.string().describe("Response to user."),
  })
);

// Create the response tool
const responseTool = {
  type: "function",
  function: {
    name: "response",
    description: "Response to user.",
    parameters: response,
  },
};

// Create the replanner prompt
const replannerPrompt = ChatPromptTemplate.fromTemplate(
  `For the given objective, come up with a simple step by step plan. 
This plan should involve individual tasks, that if executed correctly will yield the correct answer. Do not add any superfluous steps.
The result of the final step should be the final answer. Make sure that each step has all the information needed - do not skip steps.

Your objective was this:
{input}

Your original plan was this:
{plan}

You have currently done the follow steps:
{pastSteps}

Update your plan accordingly. If no more steps are needed and you can return to the user, then respond with that and use the 'response' function.
Otherwise, fill out the plan.  
Only add steps to the plan that still NEED to be done. Do not return previously done steps as part of the plan.`
);

// Create the parser for structured output
const parser = new JsonOutputToolsParser();

// Create the replanner model with tools
const replannerModel = new ChatOpenAI({ model: "gpt-4o" }).bindTools([
  planTool,
  responseTool,
]);

// Create the replanner chain
export const replanner = replannerPrompt.pipe(replannerModel).pipe(parser);
