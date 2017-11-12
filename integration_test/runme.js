const config = require('../src/config/env_config.js');
const proponojs = require('../src/proponojs.js')(config);

// proponojs.publish('ml-test-topic', 'Hello, ProponoJS', (err, data) => {
//   console.log('Publish completed...');
//   console.log('Error: ' + err);
//   console.log('Data: ' + data);
// });

proponojs.listen('ml-test-topic',(err, data) => {
  console.log('Listen completed...');
  console.log('Err: ' + err);
  console.log('Data: ' + data);
});
