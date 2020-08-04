const AWS = require('aws-sdk');

const s3 = new AWS.S3();

/**
 * Lambda function that fetches data from an external API &
 * uploads it to S3
 */
// eslint-disable-next-line no-unused-vars
exports.handler = async (event, context) => {
  const getObjectRequests = event.Records.map(record => {
    const params = {
      Bucket: record.s3.bucket.name,
      Key: record.s3.object.key,
    };
    return s3.getObject(params).promise().then(data => {
      console.info(data.Body.toString());
    }).catch(err => {
      console.error('Error calling S3 getObject:', err);
      return Promise.reject(err);
    });
  });
  return Promise.all(getObjectRequests).then(() => {
    console.debug('Complete!');
  });
};
