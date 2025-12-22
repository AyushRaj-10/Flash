import User from "./User.model.js";

export default class Staff extends User {
  constructor(id, name) {
    super(id, name);
  }

  getRole() {
    return "STAFF";
  }
}
