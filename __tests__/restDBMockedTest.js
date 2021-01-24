const supertest = require('supertest');
const app = require('../src/app');
const request = supertest(app);
const AWS = require('aws-sdk');

jest.mock('aws-sdk');

const putMock = (params, cb) => {
  cb(undefined, params);
};

const scanMock = (params, cb) => {
  cb(undefined, {
    Items: [
      {"title": "film1", "synopsis": "synopsis1", "rate": 3},
      {"title": "film2", "synopsis": "synopsis2", "rate": 4}
    ]
  });
};

beforeAll(async () => {
  AWS.DynamoDB.DocumentClient.mockImplementation(() => {
    return {
      put: jest.fn().mockImplementation(putMock),
      scan: jest.fn().mockImplementation(scanMock),
    };
  })
})


test('Retrieve all films', async () => {
  const response = await request.get('/api/films/')
    .expect(200);

  expect(response.body[0]['title']).toBe("film1");
  expect(response.body[1]['title']).toBe("film2");
});


test('Create a new film', async () => {
  const film = {"title": "film1", "synopsis": "synopsis1", "rate": 3};
  const response = await request.post('/api/films/')
    .send(film)
    .expect(201);

  expect(response.body['title']).toBe("film1");
  expect(response.body['synopsis']).toBe("synopsis1");
});
