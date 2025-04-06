import { StateGraph, END, START } from "@langchain/langgraph";
import { planner, replanner } from "./planner.js";
import { supervisorNode } from "./supervisor.js";
import { researcherNode } from "./researcher.js";
import { executorNode } from "./executor.js";
import { PlanExecuteState } from "./types.js";

// Node to create an initial plan
async function planStep(state) {
  const plan = await planner.invoke({ objective: state.input });
  return { plan: plan.steps, next: "supervisor" };
}

// Node to update the plan when needed
async function replanStep(state) {
  const output = await replanner.invoke({
    input: state.input,
    plan: state.plan.join("\n"),
    pastSteps: state.pastSteps
      .map(([step, result]) => `${step}: ${result}`)
      .join("\n"),
  });

  const toolCall = output[0];

  if (toolCall.type === "response") {
    return { response: toolCall.args?.response, next: END };
  }

  return {
    plan: toolCall.args?.steps,
    needsReplan: false,
    next: "supervisor",
  };
}

// Function to route after supervisor makes a decision
function routeAfterSupervisor(state) {
  return state.next;
}

// Create the workflow graph
const builder = new StateGraph(PlanExecuteState)
  // Add nodes for all agents
  .addNode("planner", planStep)
  .addNode("supervisor", supervisorNode)
  .addNode("researcher", researcherNode)
  .addNode("executor", executorNode)
  .addNode("replan", replanStep)

  // Define edges
  .addEdge("planner", "supervisor")
  .addEdge("researcher", "supervisor")
  .addEdge("executor", "supervisor")
  .addEdge("replan", "supervisor")

  // Add conditional edges based on supervisor's decision
  .addConditionalEdges("supervisor", routeAfterSupervisor, {
    researcher: "researcher",
    executor: "executor",
    replan: "replan",
    [END]: END,
  })

  // Start with planner
  .addEdge(START, "planner");

// Compile the graph for execution
export const workflow = builder.compile();
