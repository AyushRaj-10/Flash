import Customer from "../models/Customer.schema.js";
import NotificationService from "../services/Notification.service.js";
import AnalyticsService from "../services/Analytics.service.js";

class QueueController {
  constructor() {
    this.notifier = new NotificationService();
    this.analytics = new AnalyticsService();
  }

  // JOIN QUEUE
  joinQueue = async (req, res) => {
    try {
      const { id, name, partySize, email, eventDate } = req.body;

      if (!email || !eventDate) {
        return res.status(400).json({ error: "Email and event date are required" });
      }

      const expiryDate = new Date(eventDate);
      expiryDate.setHours(23, 59, 59, 999); // Delete at end of event day

      const customer = await Customer.create({
        customerId: id,
        name,
        partySize,
        email,
        eventDate,
        expiresAt: expiryDate
      });

      this.notifier.send(customer, "You joined the queue");
      this.analytics.log("CUSTOMER_JOINED");

      res.status(201).json(customer);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  // GET QUEUE
  getQueue = async (req, res) => {
    try {
      const queue = await Customer.find({ status: "WAITING" }).sort({ createdAt: 1 });
      res.json(queue);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  // SEAT NEXT CUSTOMER
  seatNext = async (req, res) => {
    try {
      const customer = await Customer.findOneAndUpdate(
        { status: "WAITING" },
        { status: "SEATED" },
        { sort: { createdAt: 1 }, new: true }
      );

      if (!customer) return res.json({ message: "Queue is empty" });

      this.notifier.send(customer, "Your table is ready");
      this.analytics.log("CUSTOMER_SEATED");

      res.json(customer);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
}

export default new QueueController();
