const AWS = require('aws-sdk-mock');

const event = {
  Records: [{
    s3: {
      bucket: { name: 'test-bucket' },
      object: { key: 'test-key' },
    },
  }],
};

describe('test-listing-loader', () => {
  it('should handle S3 failures', async () => {
    const objectBody = '{"Test": "PASS"}';
    const getObjectResp = { Body: objectBody };

    AWS.mock('S3', 'getObject', (params, callback) => {
      callback(new Error('S3 Failure'), getObjectResp);
    });

    const handler = require('../../../src/handlers/listing-loader.js');

    let res;
    let err;
    try {
      res = await handler.handler(event, null);
    } catch (e) { err = e; }

    expect(res).toBeUndefined();
    expect(err).toEqual(new Error('S3 Failure'));

    AWS.restore('S3');
  });
});
