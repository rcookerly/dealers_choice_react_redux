const express = require('express');
const path = require('path');
const faker = require('faker');
const { Player } = require('./db');
const { randomYear, syncAndSeed } = require('./seed');

const PORT = process.env.PORT || 1337;
const DIST_PATH = path.join(__dirname, '../dist');
const HTML_PATH = path.join(__dirname, '../src/index.html');
const PUBLIC_PATH = path.join(__dirname, '../public');

const app = express();

// Body parsing middleware (only needed for POST & PUT requests)
app.use(express.json());

// Static file-serving middleware
app.use(express.static(DIST_PATH));
app.use(express.static(PUBLIC_PATH));

app.get('/players', async(req, res, next) => {
  try {
    const players = await Player.findAll();
    res.send(players);
  }
  catch(ex) {
    console.log(ex);
    next(ex);
  }
});

/*
// Not currently using
app.get('/players/:id', async(req, res, next) => {
  try {
    const player = await Player.findByPk(req.params.id);
    res.send(player);
  }
  catch(ex) {
    console.log(ex);
    next(ex);
  }
});
*/

app.post('/add', async(req, res, next) => {
  res.send(await Player.create({
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    homeTown: `${faker.address.city()}, ${faker.address.state()}`,
    birthYear: randomYear(),
    position: 'Bench'
  }));
});

app.delete('/delete/:id', async(req, res, next) => {
  const playerToDelete = await Player.findByPk(req.params.id);
  playerToDelete.destroy();
  res.sendStatus(204);
});

// Sends our index.html (the "single page" of our SPA)
app.get('/', (req, res) => {
  res.sendFile(HTML_PATH);
});

// This middleware will catch any URLs resembling a file extension
// for example: .js, .html, .css
// This allows for proper 404s instead of the wildcard '#<{(|' catching
// URLs that bypass express.static because the given file does not exist.
app.use((req, res, next) => {
  if (path.extname(req.path).length > 0) {
    res.status(404).end();
  }
  else {
    next();
  }
});

// Error catching endware
app.use((err, req, res, next) => {
  console.error(err, typeof next);
  console.error(err.stack);
  res.status(err.status || 500).send(err.message || 'Internal server error.');
});

const init = async() => {
  try {
    await syncAndSeed();
    app.listen(PORT, () => {
      console.log(`Server is listening on PORT: ${PORT}`);
    });
  }
  catch(ex) {
    console.log(ex);
  }
};

init();
