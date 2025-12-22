export default class NotificationService {
    send(user, message) {
      console.log(`🔔 ${user.name}: ${message}`);
    }
  }
  