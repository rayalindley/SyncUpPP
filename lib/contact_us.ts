import nodemailer from 'nodemailer'; // Import nodemailer

const transporter = nodemailer.createTransport({ // Create a transporter
  service: 'Gmail', // Use your email service
  auth: {
    user: process.env.EMAIL_USER, // Your email
    pass: process.env.EMAIL_PASS, // Your email password
  },
});

export async function sendEmail({ name, email, message }) {
  try {
    const response = await transporter.sendMail({ // Use nodemailer to send the email
      from: email,
      to: process.env.RECEIVER_EMAIL,
      subject: `Contact Form Submission from ${name}`,
      html: `<p>${message}</p><p>From: ${name} (${email})</p>`,
    });
    console.log("Email response:", response); // Log the response
    return response;
  } catch (error) {
    console.error("Error sending email:", error); // Log any errors
    throw error; // Rethrow the error for handling in the API route
  }
}
