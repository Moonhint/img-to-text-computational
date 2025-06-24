
const { parentPort } = require('worker_threads');
const ImageToText = require('../index.js');

let analyzer = null;

parentPort.on('message', async (message) => {
  try {
    if (message.type === 'process_image') {
      if (!analyzer) {
        analyzer = new ImageToText(message.options);
      }
      
      const result = await analyzer.analyze(message.imageInput, message.options);
      parentPort.postMessage(result);
    }
  } catch (error) {
    parentPort.postMessage({ error: error.message });
  }
});
    