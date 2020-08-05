const AWS = require('aws-sdk');
const axios = require('axios');
const { v4: uuid } = require('uuid');

const s3 = new AWS.S3();

const Bucket = process.env.BUCKET_NAME;
const prefix = 'etl';
const apiURL = process.env.API_URL;

const getData = async url => {
  let res;
  let err;
  try {
    res = await axios.get(url);
  } catch (e) {
    err = e;
  }
  return { res, err };
};

const putObj = async params => {
  let err;
  try {
    await s3.putObject(params).promise();
  } catch (e) { err = e; }
  return err;
};

const s3Put = async data => {
  const params = {
    Bucket,
    Key: `${prefix}/${uuid()}.json`,
    Body: JSON.stringify(data),
    ContentType: 'application/json',
    ServerSideEncryption: 'AES256',
  };
  return putObj(params);
};

const returnErr = (err, msg) => {
  console.error(err);
  throw new Error(msg);
};

/**
 * Lambda function that fetches data from an external API &
 * uploads it to S3
 */
exports.handler = async () => {
  const url = `${apiURL}/people/1`;

  const { res, err } = await getData(url);
  if (!err) {
    const { data = {} } = res;
    const s3Err = await s3Put(data);
    if (s3Err) {
      returnErr(s3Err, 'S3 put failed');
    }
  } else {
    returnErr(err.toJSON(), 'API request failed');
  }
};
