import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const source: string = (body.source || "").toLowerCase();
    const search: string = (body.search || "").trim();

    if (!search) {
      return new Response(
        JSON.stringify({ error: "Missing 'search' parameter" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (source === "openfda") {
      return await queryOpenFDA(search);
    } else if (source === "rxnorm") {
      return await queryRxNorm(search);
    } else {
      return new Response(
        JSON.stringify({ error: "Unknown or missing 'source' parameter" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

/**
 * Query the openFDA NDC API.
 * https://api.fda.gov/drug/ndc.json
 */
async function queryOpenFDA(search: string): Promise<Response> {
  const baseUrl = "https://api.fda.gov/drug/ndc.json";
  const encoded = encodeURIComponent(search);

  // Try brand_name first, then generic_name
  const queries = [
    `search=openfda.brand_name:${encoded}&limit=5`,
    `search=openfda.generic_name:${encoded}&limit=5`,
    `search=brand_name:${encoded}&limit=5`,
  ];

  let lastError: string | null = null;

  for (const q of queries) {
    const url = `${baseUrl}?${q}`;
    try {
      const resp = await fetch(url, {
        headers: { Accept: "application/json" },
      });

      if (resp.ok) {
        const data = await resp.json();
        if (data.results && data.results.length > 0) {
          return new Response(
            JSON.stringify({ results: data.results }),
            {
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
              },
            },
          );
        }
      } else if (resp.status === 404) {
        // No results for this query — try next
        continue;
      } else {
        lastError = `openFDA returned ${resp.status}`;
      }
    } catch (err) {
      lastError = err.message;
    }
  }

  return new Response(
    JSON.stringify({ results: [], error: lastError || "No results found" }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
}

/**
 * Query the RxNorm approximate matching API.
 * https://rxnav.nlm.nih.gov/REST/approximateTerm.json
 */
async function queryRxNorm(search: string): Promise<Response> {
  const baseUrl = "https://rxnav.nlm.nih.gov/REST/approximateTerm.json";
  const params = new URLSearchParams({
    term: search,
    maxEntries: "10",
    option: "0",
  });

  try {
    const resp = await fetch(`${baseUrl}?${params.toString()}`, {
      headers: { Accept: "application/json" },
    });

    if (resp.ok) {
      const data = await resp.json();
      const candidates =
        data?.approximateGroup?.candidate?.map(
          (c: Record<string, string>) => ({
            rxcui: c.rxcui || "",
            name: c.name || "",
            synonym: c.synonym || "",
            score: c.score || "0",
          }),
        ) || [];

      return new Response(
        JSON.stringify({ candidates }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    } else {
      return new Response(
        JSON.stringify({
          candidates: [],
          error: `RxNorm returned ${resp.status}`,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
  } catch (err) {
    return new Response(
      JSON.stringify({ candidates: [], error: err.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
}
