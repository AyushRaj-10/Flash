import Customer from "../models/Customer.schema.js";
import { broadcastUpdate } from "../server.js";

const STAFF_PASSWORD = process.env.STAFF_PASSWORD || "admin123";
const AVERAGE_SERVICE_TIME_MINUTES = 15;

class StaffController {
  login = async (req, res) => {
    try {
      const { password } = req.body;

      if (password === STAFF_PASSWORD) {
        res.json({ success: true, token: "staff-token-" + Date.now() });
      } else {
        res.status(401).json({ error: "Invalid password" });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  getNext = async (req, res) => {
    try {
      const nextParty = await Customer.findOne({ status: "WAITING" }).sort({
        createdAt: 1
      });

      res.json({ nextParty });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  admitNext = async (req, res) => {
    try {
      const customer = await Customer.findOneAndUpdate(
        { status: "WAITING" },
        { status: "SEATED", seatedAt: new Date() },
        { sort: { createdAt: 1 }, new: true }
      );

      if (!customer) {
        return res.status(400).json({ error: "Queue is empty" });
      }

      // Get updated queue
      const queue = await Customer.find({ status: "WAITING" }).sort({
        createdAt: 1
      });

      // Update positions
      await this.updatePositions(queue);

      broadcastUpdate("PARTY_ADMITTED", {
        party: customer,
        queue: queue,
        queueLength: queue.length
      });

      res.json({
        success: true,
        party: customer,
        message: `${customer.name} has been seated`
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  skip = async (req, res) => {
    try {
      const { id, reason } = req.body;

      if (!id) {
        return res.status(400).json({ error: "Customer ID is required" });
      }

      const customer = await Customer.findByIdAndDelete(id);

      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }

      // Get updated queue
      const queue = await Customer.find({ status: "WAITING" }).sort({
        createdAt: 1
      });

      // Update positions
      await this.updatePositions(queue);

      broadcastUpdate("QUEUE_UPDATED", {
        queue: queue,
        queueLength: queue.length,
        skipped: { id, reason }
      });

      res.json({ success: true, message: "Party skipped" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  updatePositions = async (queue) => {
    // Positions are determined by order in queue (FIFO)
    // MongoDB sort by createdAt ensures FIFO order
    const updates = queue.map((customer, index) => {
      customer.position = index + 1;
      customer.estimatedWaitTime = (index + 1) * AVERAGE_SERVICE_TIME_MINUTES;
      return customer.save();
    });
    await Promise.all(updates);
  };
}

export default new StaffController();
