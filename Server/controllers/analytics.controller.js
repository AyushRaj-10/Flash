import Customer from "../models/Customer.schema.js";

class AnalyticsController {
  getStats = async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      const dateFilter = {};
      if (startDate || endDate) {
        dateFilter.createdAt = {};
        if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          dateFilter.createdAt.$lte = end;
        }
      }

      const allCustomers = await Customer.find(dateFilter);
      const seatedCustomers = await Customer.find({ status: "SEATED", ...dateFilter });
      const waitingCustomers = await Customer.find({ status: "WAITING", ...dateFilter });

      const totalServed = allCustomers.filter(c => c.status === "SEATED").length;
      const totalParties = allCustomers.length;
      const totalPartySize = allCustomers.reduce((sum, c) => sum + (c.partySize || 0), 0);
      const averagePartySize = totalParties > 0 ? (totalPartySize / totalParties).toFixed(1) : 0;
      const averageWaitTime = waitingCustomers.length > 0
        ? Math.round(waitingCustomers.length * 15 / waitingCustomers.length)
        : 15;
      const currentQueueLength = waitingCustomers.length;

      const hourlyData = {};
      allCustomers.forEach(customer => {
        const hour = new Date(customer.createdAt).getHours();
        const hourKey = hour.toString();
        hourlyData[hourKey] = (hourlyData[hourKey] || 0) + 1;
      });
      for (let i = 0; i < 24; i++) {
        const hourKey = i.toString();
        if (!hourlyData[hourKey]) hourlyData[hourKey] = 0;
      }

      res.json({
        totalServed,
        totalParties: parseInt(totalParties),
        averagePartySize: parseFloat(averagePartySize),
        averageWaitTime,
        currentQueueLength,
        hourlyData
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  getSeatedForAnalytics = async (req, res) => {
    try {
      const seated = await Customer.find({ status: "SEATED" }).sort({ updatedAt: 1 });
      res.json(seated);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  // -----------------------------
  // DELETE customer by email
  // -----------------------------
  deleteByEmail = async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: "Email is required" });

      const customer = await Customer.findOneAndDelete({ email });

      if (!customer) {
        return res.status(404).json({ error: "Customer with this email not found" });
      }

      res.json({ message: "Customer deleted successfully", customer });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
}

export default new AnalyticsController();
