const AWS = require('aws-sdk');

const s3 = new AWS.S3();

const getObj = async params => {
  let err;
  let data;
  try {
    data = await s3.getObject(params).promise();
  } catch (e) { err = e; }
  return { data, err };
};

const process = async params => {
  const { data, err } = await getObj(params);
  console.info(data.Body.toString());
  if (!err) {
    return Promise.resolve();
  }
  return Promise.reject(err);
};

/**
 * Lambda function that fetches the S3 object associated with
 * the incoming event. S3 data is then validated & persisted in DDB
 */
exports.handler = async event => {
  const getObjectRequests = event.Records.map(record => {
    const params = {
      Bucket: record.s3.bucket.name,
      Key: record.s3.object.key,
    };
    return process(params);
  });
  return Promise.all(getObjectRequests).then(() => {
    console.debug('Complete!');
  });
};
