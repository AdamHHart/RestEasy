import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { to, subject, html, text }: EmailRequest = await req.json();

    // Get email service configuration from environment
    const emailService = Deno.env.get("EMAIL_SERVICE") || "resend";
    
    let response;
    
    if (emailService === "resend") {
      response = await sendWithResend(to, subject, html, text);
    } else if (emailService === "sendgrid") {
      response = await sendWithSendGrid(to, subject, html, text);
    } else {
      throw new Error("Unsupported email service");
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email sent successfully",
        messageId: response.messageId
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Email sending error:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function sendWithResend(to: string, subject: string, html: string, text?: string) {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const fromEmail = Deno.env.get("FROM_EMAIL") || "noreply@resteasy.com";
  
  if (!resendApiKey) {
    throw new Error("RESEND_API_KEY environment variable is required");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [to],
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Resend API error: ${error}`);
  }

  return await response.json();
}

async function sendWithSendGrid(to: string, subject: string, html: string, text?: string) {
  const sendGridApiKey = Deno.env.get("SENDGRID_API_KEY");
  const fromEmail = Deno.env.get("FROM_EMAIL") || "noreply@resteasy.com";
  
  if (!sendGridApiKey) {
    throw new Error("SENDGRID_API_KEY environment variable is required");
  }

  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${sendGridApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [
        {
          to: [{ email: to }],
          subject,
        },
      ],
      from: { email: fromEmail, name: "Rest Easy" },
      content: [
        {
          type: "text/html",
          value: html,
        },
        {
          type: "text/plain",
          value: text || html.replace(/<[^>]*>/g, ''),
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SendGrid API error: ${error}`);
  }

  return { messageId: response.headers.get("x-message-id") };
}