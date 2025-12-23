import nodemailer from "nodemailer";

class NotificationService {
  constructor(io) {
    this.io = io; // Socket.IO for real-time notifications
    this.transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: "ayushrajranjan10@gmail.com",
        pass: "bmciwukbzzzwofjp"
      }
    });
  }

  // Send email + optional WebSocket notification
  async sendJoinQueue(customer, position) {
    const mailOptions = {
      from: `"FlowDine" <${process.env.EMAIL_USER}>`,
      to: customer.email,
      subject: "Queue Confirmation – FlowDine",
      html: `
        <div style="font-family: 'Helvetica', Arial, sans-serif; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #d35400; margin-bottom: 10px;">Hello ${customer.name},</h2>
          <p>Thank you for joining the queue at <strong>FlowDine</strong>.</p>
    
          <h3 style="margin-bottom: 5px;">Your Queue Details:</h3>
          <ul style="list-style: none; padding-left: 0; line-height: 1.6;">
            <li><strong>Party Size:</strong> ${customer.partySize}</li>
            <li><strong>Current Position:</strong> ${position}</li>
          </ul>
    
          <p>We look forward to welcoming you! Please wait for your table. You will receive a notification as soon as your table is ready.</p>
    
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 0.85em; color: #777;">
            This is an automated message from <strong>Gourmet Bistro</strong>. For any inquiries, please contact us at (123) 456-7890.
          </p>
        </div>
      `
    };
    

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Join email sent to ${customer.email}`);
    } catch (err) {
      console.error("❌ Failed to send join email:", err.message);
    }

    if (this.io) {
      this.io.emit("queueNotification", {
        type: "JOIN_QUEUE",
        customerId: customer.customerId,
        position,
        message: "You joined the queue"
      });
    }
  }

  async sendTableReady(customer) {
    const mailOptions = {
      from: `"FlowDine" <${process.env.EMAIL_USER}>`,
      to: customer.email,
      subject: "Your Table is Ready – FlowDine",
      html: `
        <div style="font-family: 'Helvetica', Arial, sans-serif; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #27ae60; margin-bottom: 10px;">Hello ${customer.name},</h2>
          
          <p>Exciting news! Your table for <strong>${customer.partySize} people</strong> is now ready at <strong>Gourmet Bistro</strong>.</p>
          
          <p>Please proceed to the host stand, and we’ll be delighted to seat you shortly. 🍽️</p>
          
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          
          <p style="font-size: 0.85em; color: #777;">
            This is an automated notification from <strong>Gourmet Bistro</strong>. For any questions, contact us at (123) 456-7890.
          </p>
        </div>
      `
    };
    

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Table-ready email sent to ${customer.email}`);
    } catch (err) {
      console.error("❌ Failed to send table-ready email:", err.message);
    }

    if (this.io) {
      this.io.emit("queueNotification", {
        type: "TABLE_READY",
        customerId: customer.customerId,
        message: "Your table is ready!"
      });
    }
  }
}

export default NotificationService;
