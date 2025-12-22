import { v4 as uuidv4 } from "uuid";
import Customer from "../models/Customer.schema.js";
import NotificationService from "../services/Notification.service.js";
import AnalyticsService from "../services/Analytics.service.js";
import { broadcastUpdate } from "../server.js";

const AVERAGE_SERVICE_TIME_MINUTES = 15;

class QueueController {
  constructor() {
    this.notifier = new NotificationService();
    this.analytics = new AnalyticsService();
  }

  // Calculate estimated wait time based on position
  calculateWaitTime = (position) => {
    return position * AVERAGE_SERVICE_TIME_MINUTES;
  };

  // Update positions for all customers in queue
  updatePositions = async () => {
    const queue = await Customer.find({ status: "WAITING" }).sort({
      createdAt: 1
    });

    const updates = queue.map((customer, index) => {
      customer.position = index + 1;
      customer.estimatedWaitTime = this.calculateWaitTime(index + 1);
      return customer.save();
    });
    await Promise.all(updates);
  };

  joinQueue = async (req, res) => {
    try {
      const { name, partySize, phoneNumber } = req.body;

      if (!name || !partySize) {
        return res.status(400).json({ error: "Name and party size are required" });
      }

      // Get current queue to determine position
      const currentQueue = await Customer.find({ status: "WAITING" }).sort({
        createdAt: 1
      });

      const position = currentQueue.length + 1;
      const estimatedWaitTime = this.calculateWaitTime(position);

      // Set expiry to end of today
      const eventDate = new Date();
      const expiryDate = new Date(eventDate);
      expiryDate.setHours(23, 59, 59, 999);

      const customer = await Customer.create({
        customerId: uuidv4(),
        name: name.trim(),
        partySize: parseInt(partySize),
        phoneNumber: phoneNumber || null,
        eventDate: eventDate,
        expiresAt: expiryDate,
        position: position,
        estimatedWaitTime: estimatedWaitTime,
        joinedAt: new Date()
      });

      this.notifier.send(customer, "You joined the queue");
      this.analytics.log("CUSTOMER_JOINED");

      // Broadcast update
      const updatedQueue = await Customer.find({ status: "WAITING" }).sort({
        createdAt: 1
      });

      broadcastUpdate("QUEUE_UPDATED", {
        queue: updatedQueue,
        queueLength: updatedQueue.length
      });

      res.status(201).json({
        success: true,
        party: customer,
        message: `You are #${position} in the queue`
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  getQueue = async (req, res) => {
    try {
      const queue = await Customer.find({ status: "WAITING" }).sort({
        createdAt: 1
      });

      // Ensure positions are updated
      await this.updatePositions();

      const updatedQueue = await Customer.find({ status: "WAITING" }).sort({
        createdAt: 1
      });

      const averageWaitTime =
        updatedQueue.length > 0
          ? updatedQueue.reduce(
              (sum, item) => sum + (item.estimatedWaitTime || 0),
              0
            ) / updatedQueue.length
          : 0;

      res.json({
        queue: updatedQueue,
        queueLength: updatedQueue.length,
        averageWaitTime: Math.round(averageWaitTime * 10) / 10
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  cancelQueue = async (req, res) => {
    try {
      const { id } = req.params;

      const customer = await Customer.findByIdAndDelete(id);

      if (!customer) {
        return res.status(404).json({ error: "Party not found in queue" });
      }

      // Update positions
      await this.updatePositions();

      // Get updated queue
      const updatedQueue = await Customer.find({ status: "WAITING" }).sort({
        createdAt: 1
      });

      broadcastUpdate("QUEUE_UPDATED", {
        queue: updatedQueue,
        queueLength: updatedQueue.length
      });

      res.json({ success: true, message: "Removed from queue" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  seatNext = async (req, res) => {
    try {
      const customer = await Customer.findOneAndUpdate(
        { status: "WAITING" },
        { status: "SEATED", seatedAt: new Date() },
        { sort: { createdAt: 1 }, new: true }
      );

      if (!customer) {
        return res.json({ message: "Queue is empty" });
      }

      // Update positions
      await this.updatePositions();

      // Get updated queue
      const updatedQueue = await Customer.find({ status: "WAITING" }).sort({
        createdAt: 1
      });

      this.notifier.send(customer, "Your table is ready");
      this.analytics.log("CUSTOMER_SEATED");

      broadcastUpdate("PARTY_ADMITTED", {
        party: customer,
        queue: updatedQueue,
        queueLength: updatedQueue.length
      });

      res.json(customer);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
}

export default new QueueController();
