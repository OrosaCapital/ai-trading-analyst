import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, systemContext } = await req.json();

    console.log("Admin support chat request:", { message, systemContext });

    // Call n8n webhook
    const webhookUrl = "https://ocapx.app.n8n.cloud/webhook/071d31b1-7ec7-4e76-b5da-99154637eed9/chat";
    
    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chatInput: message,
        systemContext,
        timestamp: new Date().toISOString(),
        source: "admin-panel"
      }),
    });

    console.log("Webhook response status:", webhookResponse.status);
    
    // Try to get the response text regardless of status
    const responseText = await webhookResponse.text();
    console.log("Webhook response body:", responseText);

    if (!webhookResponse.ok) {
      throw new Error(`Webhook returned ${webhookResponse.status}: ${responseText}`);
    }

    // Parse JSON response
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse webhook response as JSON:", e);
      responseData = { message: responseText };
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        response: responseData 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Admin support chat error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
