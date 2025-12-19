// Edge Function Supabase pour envoyer les rappels de paiement
// Déployez cette fonction avec: supabase functions deploy send-payment-reminders

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Créer le client Supabase avec les credentials de service
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // 1. Créer les notifications pour les paiements à venir
    const { error: checkError } = await supabaseAdmin.rpc(
      "check_and_create_payment_notifications"
    );

    if (checkError) {
      console.error("Erreur lors de la création des notifications:", checkError);
    }

    // 2. Récupérer les notifications en attente
    const { data: notifications, error: fetchError } = await supabaseAdmin
      .from("pending_notifications")
      .select("*")
      .limit(100);

    if (fetchError) {
      throw fetchError;
    }

    if (!notifications || notifications.length === 0) {
      return new Response(
        JSON.stringify({ message: "Aucune notification à envoyer" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // 3. Envoyer les emails
    const results = [];
    for (const notification of notifications) {
      try {
        // Préparer le contenu de l'email
        const emailSubject = `Rappel de paiement - Échéance dans 10 jours`;
        const emailBody = `
Bonjour ${notification.tenant_name},

Ceci est un rappel amical que votre loyer de ${notification.monthly_rent} FCFA 
est dû dans 10 jours (${new Date(notification.due_date).toLocaleDateString("fr-FR")}).

Propriété: ${notification.property_name}
Adresse: ${notification.property_address}

Merci de procéder au paiement avant la date d'échéance.

Cordialement,
Votre gestionnaire immobilier
        `.trim();

        // Envoyer l'email via Supabase (nécessite la configuration SMTP)
        const { data: emailData, error: emailError } = await supabaseAdmin
          .functions.invoke("send-email", {
            body: {
              to: notification.tenant_email,
              subject: emailSubject,
              html: emailBody.replace(/\n/g, "<br>"),
              text: emailBody,
            },
          });

        if (emailError) {
          // Si l'envoi d'email échoue, marquer avec l'erreur
          await supabaseAdmin.rpc("mark_notification_sent", {
            notification_id: notification.id,
            email_sent: false,
            error_message: emailError.message,
          });
          results.push({
            notification_id: notification.id,
            success: false,
            error: emailError.message,
          });
        } else {
          // Marquer comme envoyé
          await supabaseAdmin.rpc("mark_notification_sent", {
            notification_id: notification.id,
            email_sent: true,
          });
          results.push({
            notification_id: notification.id,
            success: true,
          });
        }
      } catch (error: any) {
        console.error(
          `Erreur pour la notification ${notification.id}:`,
          error
        );
        await supabaseAdmin.rpc("mark_notification_sent", {
          notification_id: notification.id,
          email_sent: false,
          error_message: error.message,
        });
        results.push({
          notification_id: notification.id,
          success: false,
          error: error.message,
        });
      }
    }

    return new Response(
      JSON.stringify({
        message: `${results.filter((r) => r.success).length} emails envoyés sur ${results.length}`,
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});

