import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { OpenAIEmbeddings } from "@langchain/openai";
import { supabase } from "./supabase.js";

/**
 * Researcher node function to gather information
 */
export async function researcherNode(state) {
  /**
   * Tools
   */
  const tavilyTool = new TavilySearchResults();

  // Initialize Supabase vector store
  const vectorStoreRetriever = new SupabaseVectorStore(new OpenAIEmbeddings(), {
    client: supabase,
    tableName: "documents",
    queryName: "match_documents",
  }).asRetriever();

  const vectorStoreTool = createRetrieverTool(vectorStoreRetriever, {
    name: "retrieve_blog_posts",
    description:
      "Search and return information about Lilian Weng blog posts on LLM agents, prompt engineering, and adversarial attacks on LLMs.",
  });

  const { data: publicSchemaData, error: publicSchemaError } =
    await supabase.rpc("get_public_schema");
    

  const tools = [tavilyTool, vectorStoreTool];

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
    // Create a researcher prompt
    const researcherPrompt =
      ChatPromptTemplate.fromTemplate(`You are a researcher agent in an AI system.
Your job is to find information, provide data, and generate facts to help answer a user query.

USER QUERY: {input}

CURRENT PLAN STEP: {currentStep}

CONTEXT AND PREVIOUS STEPS:
{previousSteps}

Please research and provide detailed information about the current plan step. 


Your response should be comprehensive but focused only on this research task.`);

    // Create the model and parser
    const model = new ChatOpenAI({ model: "gpt-4o", temperature: 0 }).bindTools(
      tools
    );
    const parser = new StringOutputParser();

    // Create the researcher chain
    const researcherChain = researcherPrompt.pipe(model).pipe(parser);

    // Format previous steps
    const previousSteps =
      state.pastSteps && state.pastSteps.length > 0
        ? state.pastSteps
            .map(
              ([step, result], i) => `Step ${i + 1}: ${step}\nResult: ${result}`
            )
            .join("\n\n")
        : "No previous steps executed yet.";

    // Invoke the researcher chain
    const researchResult = await researcherChain.invoke({
      input,
      currentStep,
      previousSteps,
    });

    // Return the result
    return {
      pastSteps: [[currentStep, `Researcher Result: ${researchResult}`]],
      next: "supervisor",
    };
  } catch (error) {
    console.error("Researcher agent error:", error);
    return {
      pastSteps: [
        [currentStep, `Researcher Error: ${error.message || "Unknown error"}`],
      ],
      next: "supervisor",
    };
  }
}
