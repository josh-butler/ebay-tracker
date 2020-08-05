const AWS = require('aws-sdk');

const S3 = new AWS.S3();

const getObj = async params => {
  let err;
  let data;
  try {
    data = await S3.getObject(params).promise();
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

const s3Params = ({ s3 }) => {
  const { bucket: { name: Bucket }, object: { key: Key } } = s3;
  return { Bucket, Key };
};

/**
 * Lambda function that fetches the S3 object associated with
 * the incoming event. S3 data is then validated & persisted in DDB
 */
exports.handler = async event => {
  const getObjectRequests = event.Records.map(rec => process(s3Params(rec)));
  return Promise.all(getObjectRequests).then(() => {
    console.debug('Complete!');
  });
};
