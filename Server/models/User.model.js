export default class User {
    constructor(id, name) {
      if (new.target === User) {
        throw new Error("Cannot instantiate abstract class User");
      }
      this.id = id;
      this.name = name;
    }
  
    getRole() {
      throw new Error("Method must be implemented");
    }
  }
  