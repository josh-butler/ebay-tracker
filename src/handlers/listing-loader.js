const AWS = require('aws-sdk');

const S3 = new AWS.S3();
const ddb = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10' });

const TableName = process.env.TABLE_NAME;

const putItem = async params => {
  let err;
  try {
    await ddb.put(params).promise();
  } catch (e) { err = e; }
  return err;
};

const getObj = async params => {
  let err;
  let data;
  try {
    data = await S3.getObject(params).promise();
  } catch (e) { err = e; }
  return { data, err };
};

const parse = body => {
  let err;
  let data;
  if (body) {
    try {
      data = JSON.parse(body);
    } catch (e) { err = e; }
  }
  return [data, err];
};

const valid = ({ name }) => name;

/**
 * Transform data & build DDB put item obj
 */
const listingItem = data => {
  const {
    gender, height, mass, films: reviews, vehicles = [],
  } = data;
  const delta = height - mass;
  const cnt = vehicles.length;
  const pk = `LISTING#${gender}`;
  return {
    pk, sk: pk, gender, mass, height, cnt, delta, reviews,
  };
};

const transfrom = body => {
  let err;
  let item;
  const [data, parseErr] = parse(body);
  if (!parseErr) {
    err = valid(data) ? null : new Error('Invalid source data');
    if (!err) {
      item = listingItem(data);
    }
  } else {
    err = parseErr;
  }
  return { item, err };
};

const insertItem = async ({ Body }) => {
  const { item, err } = transfrom(Body);
  const params = { TableName, Item: item };
  return err || putItem(params);
};

/**
 * Download target S3 object & parse data
 * Transfrom data & insert into DDB
 */
const persist = async params => {
  const { data, err } = await getObj(params);
  if (!err) {
    const ddbErr = await insertItem(data);
    if (ddbErr) {
      console.error(ddbErr);
      return Promise.reject(new Error('DDB PUT Failed'));
    }
    return Promise.resolve();
  }
  return Promise.reject(err);
};

/**
 * Extract S3 bucket name & key from record
 */
const s3Params = ({ s3 }) => {
  const { bucket: { name: Bucket }, object: { key: Key } } = s3;
  return { Bucket, Key };
};

/**
 * Lambda function that fetches the S3 object associated with
 * the incoming event. S3 data is then validated & persisted in DDB
 */
exports.handler = async event => {
  const getObjectRequests = event.Records.map(rec => persist(s3Params(rec)));
  return Promise.all(getObjectRequests).then(() => {
    console.debug('ETL job complete!');
  });
};
