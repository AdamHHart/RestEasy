import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { operation, data, userId } = await req.json();

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Generate a unique encryption key for each document
    const generateKey = () => {
      const key = new Uint8Array(32);
      crypto.getRandomValues(key);
      return key;
    };

    // Encrypt data using AES-GCM
    const encrypt = async (text: string, key: Uint8Array) => {
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encodedText = new TextEncoder().encode(text);
      
      const encryptedData = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        await crypto.subtle.importKey(
          "raw",
          key,
          { name: "AES-GCM" },
          false,
          ["encrypt"]
        ),
        encodedText
      );

      return {
        encrypted: Array.from(new Uint8Array(encryptedData)),
        iv: Array.from(iv),
      };
    };

    // Decrypt data using AES-GCM
    const decrypt = async (
      encryptedData: Uint8Array,
      key: Uint8Array,
      iv: Uint8Array
    ) => {
      const decryptedData = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        await crypto.subtle.importKey(
          "raw",
          key,
          { name: "AES-GCM" },
          false,
          ["decrypt"]
        ),
        encryptedData
      );

      return new TextDecoder().decode(decryptedData);
    };

    let result;
    if (operation === "encrypt") {
      const key = generateKey();
      const { encrypted, iv } = await encrypt(data, key);
      
      // Store the encrypted data
      const { error } = await supabase.from('encrypted_documents').insert({
        user_id: userId,
        encrypted_data: encrypted,
        iv: iv,
        key: Array.from(key), // In production, use a proper key management system
      });

      if (error) throw error;
      result = { success: true, message: "Document encrypted successfully" };
    } else if (operation === "decrypt") {
      // Retrieve the encrypted document
      const { data: doc, error } = await supabase
        .from('encrypted_documents')
        .select('*')
        .eq('id', data.documentId)
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      const decrypted = await decrypt(
        new Uint8Array(doc.encrypted_data),
        new Uint8Array(doc.key),
        new Uint8Array(doc.iv)
      );

      result = { success: true, data: decrypted };
    } else {
      throw new Error("Invalid operation");
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});