const supertest = require('supertest');
const AWS = require('aws-sdk');
const { GenericContainer } = require("testcontainers");

const app = require('../src/app');
const createTableIfNotExist = require("../src/db/createTable")

let dynamoContainer;
let request;

jest.setTimeout(60000)

beforeAll(async () => {
  dynamoContainer = await new GenericContainer("amazon/dynamodb-local","1.13.6")
    .withExposedPorts(8000)
    .start().catch((err)=>{console.log(err)})

  AWS.config.update({
    region: 'local',
    endpoint: `http://localhost:${dynamoContainer.getMappedPort(8000)}`,
    accessKeyId: "xxxxxx",
    secretAccessKey: "xxxxxx"
  });

  await createTableIfNotExist("films");
  request = supertest(app);
});

afterAll(async () => {
  await dynamoContainer.stop();
});

test('Retrieve all films', async () => {
  const film1 = {"title": "film1", "synopsis": "synopsis1", "rate": 3}
  const film2 = {"title": "film2", "synopsis": "synopsis2", "rate": 3}

  await request.post('/api/films/').send(film1);
  await request.post('/api/films/').send(film2);

  const response = await request.get('/api/films/')
    .expect(200)

  expect(response.body[0]['title']).toBe("film1")
  expect(response.body[1]['title']).toBe("film2")
})


test('Create a new film', async () => {
  const film = {"title": "film1", "synopsis": "synopsis1", "rate": 3}
  const response = await request.post('/api/films/')
    .send(film)
    .expect(201)
  expect(response.body['title']).toBe("film1")
  expect(response.body['synopsis']).toBe("synopsis1")
})

