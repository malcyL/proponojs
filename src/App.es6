"use strict";

class proponojs {
  constructor(config) {
    this.config = config;
  }

  publish (topic, message) {
    return topic;
  }
}

// we export the class instance via a function call
module.exports = (config) => {
  return new proponojs (config);
};
