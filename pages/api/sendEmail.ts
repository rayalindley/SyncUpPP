import { sendEmail } from '../../lib/contact_us';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { name, email, message } = req.body;
      await sendEmail({ name, email, message }); // Call your email sending function
      res.status(200).json({ message: 'Email sent successfully' });
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({ error: 'Error sending email' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
