export default class Queue {
    #items; // private field
  
    constructor() {
      this.#items = [];
    }
  
    enqueue(customer) {
      this.#items.push(customer);
    }
  
    dequeue() {
      return this.#items.shift();
    }
  
    getPosition(customerId) {
      return this.#items.findIndex(c => c.id === customerId) + 1;
    }
  
    getAll() {
      return [...this.#items];
    }
  
    size() {
      return this.#items.length;
    }
  }
  