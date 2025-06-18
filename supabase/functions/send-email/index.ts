// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface EmailRequest {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

console.info('send-email function started');

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { to, subject, html, text }: EmailRequest = await req.json();

    // Validate required fields
    if (!to || !subject) {
      throw new Error("Missing required fields: to, subject");
    }

    // If no HTML provided but text is provided, convert text to HTML
    const emailHtml = html || (text ? text.replace(/\n/g, '<br>') : '');
    const emailText = text || (html ? html.replace(/<[^>]*>/g, '') : '');

    if (!emailHtml && !emailText) {
      throw new Error("Either html or text content is required");
    }

    // Get email service configuration from environment
    const emailService = Deno.env.get("EMAIL_SERVICE") || "resend";
    
    let response;
    
    if (emailService === "resend") {
      response = await sendWithResend(to, subject, emailHtml, emailText);
    } else if (emailService === "sendgrid") {
      response = await sendWithSendGrid(to, subject, emailHtml, emailText);
    } else {
      throw new Error("Unsupported email service");
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email sent successfully",
        messageId: response.messageId || response.id
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
  const fromEmail = Deno.env.get("FROM_EMAIL") || "onboarding@resend.dev";
  
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
    const errorData = await response.text();
    throw new Error(`Resend API error (${response.status}): ${errorData}`);
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
      from: { email: fromEmail, name: "Ever Ease" },
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
    const errorData = await response.text();
    throw new Error(`SendGrid API error (${response.status}): ${errorData}`);
  }

  return { messageId: response.headers.get("x-message-id") };
}