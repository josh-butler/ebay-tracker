const AWS = require('aws-sdk-mock');

describe('test-listing-loader', () => {
  it('should read and log S3 objects', async () => {
    const objectBody = '{"Test": "PASS"}';
    const getObjectResp = {
      Body: objectBody,
    };

    AWS.mock('S3', 'getObject', (params, callback) => {
      callback(null, getObjectResp);
    });

    const event = {
      Records: [
        {
          s3: {
            bucket: {
              name: 'test-bucket',
            },
            object: {
              key: 'test-key',
            },
          },
        },
      ],
    };

    console.info = jest.fn();
    const handler = require('../../../src/handlers/listing-loader.js');

    await handler.handler(event, null);

    expect(console.info).toHaveBeenCalledWith(objectBody);
    AWS.restore('S3');
  });
});
