import { ChatPromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { ChatOpenAI } from "@langchain/openai";
import { supabase } from "./supabase.js";
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { PlanExecuteStateType } from "./types.js";
import { AIMessage, HumanMessage } from "@langchain/core/messages";

// Schema introspection utility
async function getSchemaInfo() {
  try {
    // Query information_schema to get table and column metadata
    const { data: tables, error: tablesError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public");

    if (tablesError) {
      console.error(`Error fetching tables: ${tablesError.message}`);
      return "Unable to access database schema. Using external data sources instead.";
    }

    if (!tables || tables.length === 0) {
      return "No tables found in the public schema. Using external data sources instead.";
    }

    let schemaInfo = "";

    // For each table, get its columns
    for (const table of tables) {
      const { data: columns, error: columnsError } = await supabase
        .from("information_schema.columns")
        .select("column_name, data_type, column_default, is_nullable")
        .eq("table_schema", "public")
        .eq("table_name", table.table_name);

      if (columnsError) {
        console.error(
          `Error fetching columns for ${table.table_name}: ${columnsError.message}`
        );
        continue; // Skip this table but continue with others
      }

      schemaInfo += `TABLE: ${table.table_name}\n`;
      schemaInfo += "COLUMNS:\n";

      for (const column of columns || []) {
        schemaInfo += `  - ${column.column_name} (${column.data_type}, ${
          column.is_nullable === "YES" ? "nullable" : "not null"
        }${
          column.column_default ? `, default: ${column.column_default}` : ""
        })\n`;
      }
      schemaInfo += "\n";
    }

    return (
      schemaInfo ||
      "Database schema exists but no detailed information available."
    );
  } catch (error) {
    console.error("Error in getSchemaInfo:", error);
    return "Error accessing database schema. Using external data sources instead.";
  }
}

// Check if schema info indicates the database is accessible
function isDatabaseAccessible(schemaInfo: string): boolean {
  return !(
    schemaInfo.includes("Unable to access database schema") ||
    schemaInfo.includes("Error accessing database schema") ||
    schemaInfo.includes("No tables found") ||
    schemaInfo.includes("no detailed information available")
  );
}

// Define the tool schemas for the researcher agent
const querySqlSchema = zodToJsonSchema(
  z.object({
    query: z.string().describe("SQL query to execute on the database"),
    reasoning: z
      .string()
      .describe(
        "Reasoning for why this query will retrieve the needed information"
      ),
  })
);

const queryVectorSchema = zodToJsonSchema(
  z.object({
    query: z
      .string()
      .describe(
        "Natural language query to execute against the vector database"
      ),
    reasoning: z
      .string()
      .describe(
        "Reasoning for why this vector search will retrieve the needed information"
      ),
  })
);

const searchWebSchema = zodToJsonSchema(
  z.object({
    query: z.string().describe("Web search query to find information"),
    reasoning: z
      .string()
      .describe(
        "Reasoning for why web search is needed for comprehensive information gathering"
      ),
  })
);

const finalAnswerSchema = zodToJsonSchema(
  z.object({
    answer: z.string().describe("Final answer to the research question"),
    sources: z.string().describe("Sources used to compile the answer"),
  })
);

// Create the tools
const querySqlTool = {
  type: "function",
  function: {
    name: "query_sql",
    description: "Query structured data from the Supabase database using SQL",
    parameters: querySqlSchema,
  },
};

const queryVectorTool = {
  type: "function",
  function: {
    name: "query_vector",
    description:
      "Search for information in the vector database using semantic search",
    parameters: queryVectorSchema,
  },
};

const searchWebTool = {
  type: "function",
  function: {
    name: "search_web",
    description: "Search the web for information not available in the database",
    parameters: searchWebSchema,
  },
};

const finalAnswerTool = {
  type: "function",
  function: {
    name: "final_answer",
    description: "Provide the final answer to the research question",
    parameters: finalAnswerSchema,
  },
};

// Create the Tavily search tool
const tavilySearch = new TavilySearchResults({
  maxResults: 5,
});

// Create the researcher prompt template
const researcherPrompt =
  ChatPromptTemplate.fromTemplate(`You are a researcher agent with access to multiple data sources:
1. A Supabase structured database with tables containing numerical and financial data
2. A vector database containing embedded knowledge and insights
3. Web search

Your task is to find information to answer a specific question or complete a research step.
Your goal is to gather as much relevant information as possible from ALL available sources.

CURRENT DATABASE SCHEMA:
{schema_info}

RESEARCH QUESTION:
{question}

APPROACH:
1. If database schema is available and shows accessible tables, use SQL queries to retrieve relevant structured data.
2. ALWAYS search the vector database for relevant knowledge and insights, even if you used SQL or will use web search.
3. ALWAYS search the web to get the most up-to-date information available.
4. Combine information from all sources to provide the most comprehensive answer possible.

IMPORTANT RULES:
- Do NOT use SQL queries if the database schema shows the database is not accessible.
- ALWAYS use the vector database search regardless of other sources.
- ALWAYS use web search to supplement information from other sources.
- Use all available sources to gather as much information as possible.

Think step by step about how to gather comprehensive information from all available sources.
`);

// Define a simplified interface for tool calls that we will use throughout our code
interface ToolCall {
  type: string;
  args: Record<string, unknown>;
}

// Create the researcher chain
export const researcher = async (question: string): Promise<ToolCall[]> => {
  // Get current schema information
  let schemaInfo;
  try {
    schemaInfo = await getSchemaInfo();
  } catch (error) {
    console.error("Error getting schema info:", error);
    schemaInfo =
      "Unable to access database schema. Using external data sources instead.";
  }

  // Determine which tools to include based on database accessibility
  const dbAccessible = isDatabaseAccessible(schemaInfo);
  const tools = dbAccessible
    ? [querySqlTool, queryVectorTool, searchWebTool, finalAnswerTool]
    : [queryVectorTool, searchWebTool, finalAnswerTool];

  // Create the model with appropriate tools
  const model = new ChatOpenAI({
    model: "gpt-4o",
    temperature: 0,
  }).bindTools(tools, {
    tool_choice: "auto", // Let the model decide which tool to use
  });

  try {
    // Invoke the model directly with the researcher prompt
    const messages = await researcherPrompt.formatMessages({
      schema_info: schemaInfo,
      question,
    });

    // Get raw response from the model
    const response = await model.invoke(messages);

    // Process tool calls from the response
    const toolCalls: ToolCall[] = [];

    // Safely access tool_calls with the correct typing
    const aiMessage = response as AIMessage;

    if (aiMessage.tool_calls && Array.isArray(aiMessage.tool_calls)) {
      for (const tc of aiMessage.tool_calls) {
        try {
          // Check if it has the expected structure
          if (tc && typeof tc === "object" && "function" in tc) {
            const func = tc.function as { name?: string; arguments?: string };

            if (func && func.name && func.arguments) {
              const functionName = func.name;
              // Parse arguments as JSON
              const args = JSON.parse(func.arguments);

              toolCalls.push({
                type: functionName,
                args: args,
              });
            }
          }
        } catch (error) {
          console.error("Error processing tool call:", error);
        }
      }
    }

    if (toolCalls.length > 0) {
      return toolCalls;
    }

    // Fallback if no tool calls are detected
    return [
      {
        type: "search_web",
        args: {
          query: question,
          reasoning: "No tool calls detected, falling back to web search",
        },
      },
    ];
  } catch (error) {
    console.error("Error in researcher chain:", error);
    // Return a fallback response
    return [
      {
        type: "search_web",
        args: {
          query: question,
          reasoning: "Error in researcher chain, falling back to web search",
        },
      },
    ];
  }
};

// Function to execute SQL queries
async function executeQuery(query: string) {
  try {
    const { data, error } = await supabase.rpc("execute_query", {
      query_text: query,
    });

    if (error) {
      console.error(`Error executing query: ${error.message}`);
      return { success: false, data: [], error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error("Error in executeQuery:", error);
    return { success: false, data: [], error: "Database query failed" };
  }
}

// Function to search vector database
async function searchVectorDb(query: string) {
  try {
    const { data, error } = await supabase.rpc("match_documents", {
      query_embedding: query,
      match_threshold: 0.7,
      match_count: 5,
    });

    if (error) {
      console.error(`Error searching vector database: ${error.message}`);
      return { success: false, data: [], error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error("Error in searchVectorDb:", error);
    return { success: false, data: [], error: "Vector search failed" };
  }
}

// Define interface for source data structure
interface SourceData {
  success: boolean;
  data?: unknown;
  error?: string;
  reasoning?: string;
}

interface ResearchSources {
  db?: SourceData;
  vector?: SourceData;
  web?: SourceData;
}

// Comprehensive research function that gathers information from all sources
async function comprehensiveResearch(
  step: string
): Promise<{ result: string; sources: ResearchSources }> {
  const toolCalls = await researcher(step);

  // Initialize sources object to store results from each source
  const sources: ResearchSources = {};

  // Process each tool call
  for (const toolCall of toolCalls) {
    const toolType = toolCall.type;
    const args = toolCall.args;

    if (toolType === "query_sql") {
      const result = await executeQuery(args.query as string);
      sources.db = {
        success: result.success,
        data: result.data,
        error: result.error,
        reasoning: args.reasoning as string,
      };
    }

    if (toolType === "query_vector") {
      const result = await searchVectorDb(args.query as string);
      sources.vector = {
        success: result.success,
        data: result.data,
        error: result.error,
        reasoning: args.reasoning as string,
      };
    }

    if (toolType === "search_web") {
      try {
        const searchQuery = args.query as string;
        const result = await tavilySearch.invoke(searchQuery);
        sources.web = {
          success: true,
          data: result,
          reasoning: args.reasoning as string,
        };
      } catch (error) {
        console.error("Error in web search:", error);
        sources.web = {
          success: false,
          error: "Web search failed",
          reasoning: args.reasoning as string,
        };
      }
    }

    // If we got a final answer, we can just return it
    if (toolType === "final_answer") {
      return {
        result: `Final Answer: ${args.answer}\nSources: ${args.sources}`,
        sources,
      };
    }
  }

  // If we have sources but no final answer was provided, create a summary
  if (Object.keys(sources).length > 0) {
    let resultText = `Research Results for: ${step}\n\n`;

    if (sources.db) {
      resultText += `DATABASE: ${
        sources.db.success
          ? JSON.stringify(sources.db.data)
          : "Query failed: " + sources.db.error
      }\n\n`;
    }

    if (sources.vector) {
      resultText += `VECTOR DB: ${
        sources.vector.success
          ? JSON.stringify(sources.vector.data)
          : "Search failed: " + sources.vector.error
      }\n\n`;
    }

    if (sources.web) {
      resultText += `WEB SEARCH: ${
        sources.web.success
          ? JSON.stringify(sources.web.data)
          : "Search failed: " + sources.web.error
      }\n\n`;
    }

    return {
      result: resultText,
      sources,
    };
  }

  // Fallback if processing the research output didn't work
  return {
    result:
      "Research completed but no structured data was returned. Please try a different query or approach.",
    sources,
  };
}

// Main research step function
export async function researchStep(step: string): Promise<{ result: string }> {
  try {
    // Use the comprehensive research function
    const { result } = await comprehensiveResearch(step);
    return { result };
  } catch (error: unknown) {
    console.error("Error in researchStep:", error);
    return {
      result: `Research error: ${
        error instanceof Error
          ? error.message
          : "Unknown error occurred during research"
      }`,
    };
  }
}

// Find the researchStep function and update it to work as a node in the graph workflow
export async function researcherNode(
  state: PlanExecuteStateType
): Promise<Partial<PlanExecuteStateType>> {
  // Extract the current plan step to research
  let stepToResearch = "";
  if (state.plan && state.plan.length > 0) {
    stepToResearch = state.plan[0];
  } else {
    stepToResearch = "Provide general information about the query.";
  }

  // Call the existing researchStep function with the step
  const result = await researchStep(stepToResearch);

  // Update the state with the research result and increment the call counter
  return {
    pastSteps: [[stepToResearch, result.result]],
    plan: state.plan.slice(1), // Remove the first step that was just handled
    messages: [
      new HumanMessage({
        content: `Research completed: ${stepToResearch}\nResult: ${result.result}`,
        name: "Researcher",
      }),
    ],
    researcherCallCount: (state.researcherCallCount || 0) + 1, // Increment call counter
    next: "supervisor", // Return control to the supervisor
  };
}
