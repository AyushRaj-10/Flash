import User from "./User.model.js";

export default class Customer extends User {
  constructor(id, name, partySize) {
    super(id, name);
    this.partySize = partySize;
    this.status = "WAITING";
  }

  getRole() {
    return "CUSTOMER";
  }
}
