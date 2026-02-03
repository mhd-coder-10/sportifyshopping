import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const sendEmail = async (to: string[], subject: string, html: string) => {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "Sportify <noreply@sportifyshopping.lovable.app>",
      to,
      subject,
      html,
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Resend API error: ${error}`);
  }
  
  return response.json();
};



const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface OrderEmailRequest {
  orderId: string;
  type: 'confirmation' | 'status_update' | 'payment_update';
  newStatus?: string;
  newPaymentStatus?: string;
}

const getStatusMessage = (status: string): string => {
  const messages: Record<string, string> = {
    pending: 'Your order is pending confirmation.',
    confirmed: 'Your order has been confirmed and is being prepared.',
    processing: 'Your order is being processed.',
    shipped: 'Great news! Your order has been shipped.',
    out_for_delivery: 'Your order is out for delivery today!',
    delivered: 'Your order has been delivered. Enjoy!',
    cancelled: 'Your order has been cancelled.',
  };
  return messages[status] || `Your order status has been updated to: ${status}`;
};

const getPaymentStatusMessage = (status: string): string => {
  const messages: Record<string, string> = {
    pending: 'Payment is pending.',
    paid: 'Payment has been received.',
    failed: 'Payment failed. Please contact support.',
    refunded: 'Payment has been refunded.',
  };
  return messages[status] || `Payment status updated to: ${status}`;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { orderId, type, newStatus, newPaymentStatus }: OrderEmailRequest = await req.json();

    if (!orderId || !type) {
      throw new Error("Missing required fields: orderId and type");
    }

    // Fetch order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error(`Order not found: ${orderError?.message}`);
    }

    // Fetch user email from auth.users
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(order.user_id);

    if (userError || !userData.user?.email) {
      throw new Error(`User email not found: ${userError?.message}`);
    }

    const userEmail = userData.user.email;
    const orderIdShort = orderId.slice(0, 8).toUpperCase();

    // Fetch order items
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('*, products(name)')
      .eq('order_id', orderId);

    const itemsList = orderItems?.map(item => 
      `<li>${item.products?.name || 'Product'} × ${item.quantity} - ₹${(item.price_at_purchase * item.quantity).toLocaleString()}</li>`
    ).join('') || '';

    let subject = '';
    let content = '';

    if (type === 'confirmation') {
      subject = `Order Confirmed - #${orderIdShort}`;
      content = `
        <h1 style="color: #333; margin-bottom: 20px;">Thank you for your order!</h1>
        <p>Your order <strong>#${orderIdShort}</strong> has been placed successfully.</p>
        
        <h3 style="margin-top: 30px;">Order Details</h3>
        <ul style="list-style: none; padding: 0;">${itemsList}</ul>
        
        <p style="font-size: 18px; font-weight: bold; margin-top: 20px;">
          Total: ₹${Number(order.total_amount).toLocaleString()}
        </p>
        
        <h3 style="margin-top: 30px;">Shipping Address</h3>
        <p>${order.shipping_address}<br/>
        ${order.shipping_city}, ${order.shipping_state} ${order.shipping_postal_code}<br/>
        ${order.shipping_country}</p>
        
        <p style="margin-top: 20px;">
          <strong>Payment Method:</strong> ${order.payment_method === 'online' ? 'Online Payment' : 'Cash on Delivery'}<br/>
          <strong>Estimated Delivery:</strong> ${order.estimated_delivery ? new Date(order.estimated_delivery).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Within 5-7 business days'}
        </p>
        
        <p style="margin-top: 30px; color: #666;">
          We'll notify you when your order ships. Thank you for shopping with Sportify!
        </p>
      `;
    } else if (type === 'status_update' && newStatus) {
      subject = `Order Update - #${orderIdShort}`;
      content = `
        <h1 style="color: #333; margin-bottom: 20px;">Order Status Update</h1>
        <p>Your order <strong>#${orderIdShort}</strong> has been updated.</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="font-size: 18px; margin: 0;">
            <strong>New Status:</strong> ${newStatus.replace(/_/g, ' ').toUpperCase()}
          </p>
          <p style="margin-top: 10px; color: #666;">${getStatusMessage(newStatus)}</p>
        </div>
        
        ${order.tracking_number ? `<p><strong>Tracking Number:</strong> ${order.tracking_number}</p>` : ''}
        
        <p style="margin-top: 30px; color: #666;">
          Thank you for shopping with Sportify!
        </p>
      `;
    } else if (type === 'payment_update' && newPaymentStatus) {
      subject = `Payment Update - Order #${orderIdShort}`;
      content = `
        <h1 style="color: #333; margin-bottom: 20px;">Payment Status Update</h1>
        <p>The payment status for your order <strong>#${orderIdShort}</strong> has been updated.</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="font-size: 18px; margin: 0;">
            <strong>Payment Status:</strong> ${newPaymentStatus.toUpperCase()}
          </p>
          <p style="margin-top: 10px; color: #666;">${getPaymentStatusMessage(newPaymentStatus)}</p>
        </div>
        
        <p><strong>Order Total:</strong> ₹${Number(order.total_amount).toLocaleString()}</p>
        
        <p style="margin-top: 30px; color: #666;">
          Thank you for shopping with Sportify!
        </p>
      `;
    }

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        ${content}
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #999; text-align: center;">
          Sportify - Your Sports Destination<br/>
          F-99, Samarth Complex, Tavadiya Circle, Sidhpur, Patan, Gujarat – 384151, India
        </p>
      </div>
    `;

    const emailResponse = await sendEmail([userEmail], subject, emailHtml);

    console.log("Order email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending order email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
