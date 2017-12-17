'use strinct';

class MessageProcessor {
  constructor(sqs, queueUrl, outerMessage, processMessage) {
    this.sqs = sqs;
    this.queueUrl = queueUrl;
    this.outerMessage = outerMessage;
    this.processMessage = processMessage;

    this.acknowledgeMessage = this.acknowledgeMessage.bind(this);
    this.processComplete = this.processComplete.bind(this);
  }

  process(cb) {
    this.cb = cb;
    const body = JSON.parse(this.outerMessage.Body);
    const payload = JSON.parse(body.Message);
    this.processMessage(payload.message, this.acknowledgeMessage);
  }

  acknowledgeMessage() {
    const params = {
      QueueUrl: this.queueUrl,
      ReceiptHandle: this.outerMessage.ReceiptHandle,
    };
    // Another function to check for err?
    this.sqs.deleteMessage(params, this.processComplete);
  }

  processComplete(err) {
    this.cb(err);
  }
}

module.exports = MessageProcessor;
