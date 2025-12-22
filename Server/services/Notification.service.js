import nodemailer from "nodemailer";

class NotificationService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: "ayushrajranjan10@gmail.com",
        pass: "bmciwukbzzzwofjp"
      }
    });
  }

  async send(customer, message) {
    const mailOptions = {
      from: `"Gourmet Bistro" <${process.env.EMAIL_USER}>`,
      to: customer.email,
      subject: "Your Table at Gourmet Bistro",
      html: `
        <div style="font-family: 'Helvetica', Arial, sans-serif; color: #333;">
          <h2 style="color: #d35400;">Hello ${customer.name},</h2>
          <p>${message}</p>
          <p>
            <strong>Party Size:</strong> ${customer.partySize}<br>
            <strong>Reservation Date:</strong> ${new Date(customer.eventDate).toLocaleDateString()}
          </p>
          <p>We’re excited to host you at <strong>Gourmet Bistro</strong>! 🍽️</p>
          <p>To ensure a smooth experience, please arrive a few minutes early.</p>
          <hr style="border: 0; border-top: 1px solid #eee;">
          <p style="font-size: 0.85em; color: #777;">
            This is an automated message. If you have questions, please contact us at (123) 456-7890.
          </p>
        </div>
      `
    };
    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email sent to ${customer.email}`);
    } catch (err) {
      console.error("❌ Failed to send email:", err.message);
    }
  }
}

export default NotificationService;
