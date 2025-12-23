import Customer from "../models/Customer.schema.js";
import NotificationService from "../services/Notification.service.js";
import mongoose from "mongoose";

class QueueController {
  joinQueue = async (req, res) => {
    try {
      const { id, name, partySize, email } = req.body;
      if (!email || !name || !partySize || !id) {
        return res.status(400).json({ error: "All fields are required" });
      }

      const customer = await Customer.create({
        customerId: id,
        name,
        partySize,
        email
      });

      const io = req.app.get("io");
      const notifier = new NotificationService(io);

      // Get current position
      const queue = await Customer.find({ status: "WAITING" }).sort({ createdAt: 1 });
      const position = queue.findIndex(c => c.customerId === id) + 1;

      // Send email + WebSocket
      await notifier.sendJoinQueue(customer, position);

      io.emit("queueUpdated", queue);
      res.status(201).json({ customer, position });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  seatNext = async (req, res) => {
    try {
      const customer = await Customer.findOneAndUpdate(
        { status: "WAITING" },
        { status: "SEATED" },
        { sort: { createdAt: 1 }, new: true }
      );

      if (!customer) return res.json({ message: "Queue is empty" });

      const io = req.app.get("io");
      const notifier = new NotificationService(io);

      // Send table-ready email + WebSocket
      await notifier.sendTableReady(customer);

      // Emit updated queue
      const queue = await Customer.find({ status: "WAITING" }).sort({ createdAt: 1 });
      io.emit("queueUpdated", queue);
      
      // Emit updated seated list
      const seated = await Customer.find({ status: "SEATED" }).sort({ updatedAt: 1 });
      io.emit("seatedUpdated", seated);

      res.json(customer);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  getQueue = async (req, res) => {
    try {
      const queue = await Customer.find({ status: "WAITING" }).sort({ createdAt: 1 });
      res.json(queue);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  cancelQueue = async (req, res) => {
    try {
      const { id } = req.params;
      
      // Find customer by customerId or _id
      const customer = await Customer.findOneAndDelete({
        $or: [
          { customerId: id },
          { _id: id }
        ],
        status: "WAITING"
      });

      if (!customer) {
        return res.status(404).json({ error: "Customer not found in queue" });
      }

      const io = req.app.get("io");
      
      // Emit updated queue
      const queue = await Customer.find({ status: "WAITING" }).sort({ createdAt: 1 });
      io.emit("queueUpdated", queue);

      res.json({ message: "Customer removed from queue", customer });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  getSeated = async (req, res) => {
    try {
      const seated = await Customer.find({ status: "SEATED" }).sort({ updatedAt: 1 });
      res.json(seated);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  markFinished = async (req, res) => {
    try {
      const { id } = req.params;
      
      console.log("Attempting to delete customer with ID:", id);
      
      // Try to find customer first to see what we're working with
      // Handle both string IDs and MongoDB ObjectIds
      const queryConditions = [
        { customerId: id },
        { _id: id }
      ];
      
      // If id looks like a MongoDB ObjectId, add it to query
      if (mongoose.Types.ObjectId.isValid(id)) {
        queryConditions.push({ _id: new mongoose.Types.ObjectId(id) });
      }
      
      let customer = await Customer.findOne({
        $or: queryConditions,
        status: "SEATED"
      });

      if (!customer) {
        // Try without status filter to see if customer exists at all
        const anyCustomer = await Customer.findOne({
          $or: [
            { customerId: id },
            { _id: id }
          ]
        });
        
        if (anyCustomer) {
          return res.status(400).json({ 
            error: `Customer found but status is "${anyCustomer.status}", not SEATED. Cannot delete.` 
          });
        }
        
        return res.status(404).json({ error: "Customer not found" });
      }

      console.log("Found customer to delete:", customer.name, "with ID:", customer._id, "customerId:", customer.customerId);

      // Delete the customer
      const deletedCustomer = await Customer.findByIdAndDelete(customer._id);

      if (!deletedCustomer) {
        return res.status(500).json({ error: "Failed to delete customer from database" });
      }

      console.log("Successfully deleted customer:", deletedCustomer.name);

      const io = req.app.get("io");
      
      // Emit updated seated list (now without the deleted customer)
      const seated = await Customer.find({ status: "SEATED" }).sort({ updatedAt: 1 });
      io.emit("seatedUpdated", seated);

      // Also emit queue update in case frontend needs it
      const queue = await Customer.find({ status: "WAITING" }).sort({ createdAt: 1 });
      io.emit("queueUpdated", queue);

      // Return success - customer has been permanently deleted from database
      res.json({ 
        message: "Customer marked as finished and permanently removed from database", 
        customer: deletedCustomer,
        success: true,
        deleted: true
      });
    } catch (error) {
      console.error("Error in markFinished:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  };

  deleteByEmail = async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      // Find and delete customer with matching email (waiting or seated)
      const customer = await Customer.findOneAndDelete({ email });

      if (!customer) {
        return res.status(404).json({ error: "Customer with this email not found" });
      }

      const io = req.app.get("io");

      // Emit updated queue and seated lists
      const queue = await Customer.find({ status: "WAITING" }).sort({ createdAt: 1 });
      const seated = await Customer.find({ status: "SEATED" }).sort({ updatedAt: 1 });

      io.emit("queueUpdated", queue);
      io.emit("seatedUpdated", seated);

      res.json({ message: "Customer deleted successfully", customer });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };


}

export default new QueueController();
