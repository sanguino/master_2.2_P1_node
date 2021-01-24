const supertest = require('supertest');
const AWS = require('aws-sdk');
const {GenericContainer} = require("testcontainers");

const app = require('../src/app');
const createTableIfNotExist = require("../src/db/createTable");

let dynamoContainer;
let request;

jest.setTimeout(60000);

beforeAll(async () => {
  dynamoContainer = await new GenericContainer("amazon/dynamodb-local", "1.13.6")
    .withExposedPorts(8000)
    .start().catch((err) => {
      console.log(err)
    });

  AWS.config.update({
    region: 'local',
    endpoint: `http://localhost:${dynamoContainer.getMappedPort(8000)}`,
    accessKeyId: "xxxxxx",
    secretAccessKey: "xxxxxx"
  });

  await createTableIfNotExist("films");
  request = supertest(app);
});

afterEach(async () => {
  await new AWS.DynamoDB().deleteTable({TableName: "films"}).promise();
  await createTableIfNotExist("films");
})

afterAll(async () => {
  await dynamoContainer.stop();
});

test('Retrieve all films', async () => {
  await request.post('/api/films/').send({"title": "film1", "synopsis": "synopsis1"});
  await request.post('/api/films/').send({"title": "film2", "synopsis": "synopsis2"});

  const response = await request.get('/api/films/').expect(200);

  expect(response.body.length).toBe(5);
  expect(response.body).toEqual(
    expect.arrayContaining([
      expect.objectContaining({"title": "film1"}),
      expect.objectContaining({"title": "film2"})
    ])
  );
});


test('Create a new film', async () => {
  const film = {"title": "film3", "synopsis": "synopsis3"};
  const response = await request.post('/api/films/')
    .send(film)
    .expect(201);

  expect(response.body['title']).toBe("film3");
  expect(response.body['synopsis']).toBe("synopsis3");
})

