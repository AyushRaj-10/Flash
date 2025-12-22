import Customer from "../models/Customer.schema.js";

class AnalyticsController {
  getStats = async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      // Build query
      const query = { status: "SEATED" };
      if (startDate && endDate) {
        query.seatedAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate + "T23:59:59.999Z")
        };
      }

      const history = await Customer.find(query).sort({ seatedAt: 1 });

      // Calculate statistics
      const totalServed = history.length;
      const totalParties = history.reduce((sum, item) => sum + item.partySize, 0);
      const averagePartySize = totalServed > 0 ? totalParties / totalServed : 0;

      // Group by hour
      const hourlyData = {};
      history.forEach(item => {
        if (item.seatedAt) {
          const hour = new Date(item.seatedAt).getHours();
          hourlyData[hour] = (hourlyData[hour] || 0) + 1;
        }
      });

      // Get current queue for average wait time
      const currentQueue = await Customer.find({ status: "WAITING" }).sort({
        createdAt: 1
      });
      const averageWaitTime =
        currentQueue.length > 0
          ? currentQueue.reduce(
              (sum, item) => sum + (item.estimatedWaitTime || 0),
              0
            ) / currentQueue.length
          : 0;

      res.json({
        totalServed,
        totalParties,
        averagePartySize: Math.round(averagePartySize * 10) / 10,
        hourlyData,
        averageWaitTime: Math.round(averageWaitTime * 10) / 10,
        currentQueueLength: currentQueue.length,
        history: history
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
}

export default new AnalyticsController();
