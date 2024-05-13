const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with environment variables
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY);

// Function to send an email using the Resend API
const sendEmail = async (notification) => {
  const emailData = {
    from: 'Acme <onboarding@resend.dev>',
    to: notification.userid, // Replace with actual email field if different
    subject: notification.title,
    text: notification.message,
  };

  // Send the email using the Resend API
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(emailData),
  });

  if (!response.ok) {
    throw new Error(`Email sending failed: ${response.statusText}`);
  }

  console.log('Email sent successfully!');
};

// Real-time subscription setup to listen for new notifications
const channels = supabase.channel('custom-insert-channel')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'notifications' },
    async (payload) => {
      console.log('Change received!', payload);
      await sendEmail(payload.new);
    }
  )
  .subscribe();

// Keep the Node process running
process.on('SIGINT', () => {
  console.log('Stopping the listener...');
  channels.unsubscribe();
  process.exit();
});
