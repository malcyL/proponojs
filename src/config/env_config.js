const accessKey = process.env.PROPONOJS_AWS_ACCESS_KEY_ID;
const secretKey = process.env.PROPONOJS_AWS_SECRET_KEY;
const queueRegion = process.env.PROPONOJS_QUEUE_REGION;
const applicationName = process.env.PROPONOJS_APPLICATION_NAME;
const queueSuffix = process.env.PROPONOJS_QUEUE_SUFFIX;

// The following are the complete set of Propono configuration
// parameters. These are not yet supported by ProponoJS
//
// const maxRetries = process.env.PROPONOJS_MAX_RETRIES;
// const numMessages_per_poll = process.env.PROPONOJS_NUM_MESSAGES_PER_POLL;
// const useIamProfile = process.env.PROPONOJS.USE_IAM_PROFILE;
// const applicationName = process.env.PROPONOJS_APPLICATION_NAME;
// const queueSuffix = process.env.PROPONOJS_QUEUE_SUFFIX;

const config = {
  accessKeyId: accessKey,
  secretAccessKey: secretKey,
  region: queueRegion,
  applicationName,
  queueSuffix,
};

module.exports = config;
