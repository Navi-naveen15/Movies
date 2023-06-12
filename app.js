const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();

const dbPath = path.join(__dirname, "moviesData.db");
app.use(express.json());

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

function converting(eachObj) {
  return { movieName: eachObj.movie_name };
}

app.get("/movies/", async (request, response) => {
  const getMovie = `
    SELECT movie_name
    FROM movie;`;
  const moviesArray = await db.all(getMovie);
  response.send(moviesArray.map((eachObj) => converting(eachObj)));
});

app.post("/movies/", async (request, response) => {
  const { directorId, movieName, leadActor } = request.body;

  const addPlayerQuery = `
    INSERT INTO
       movie(director_id,movie_name,lead_actor)
    VALUES (
        '${directorId}',
        '${movieName}',
        '${leadActor}'
    );`;
  await db.run(addPlayerQuery);
  response.send("Movie Successfully Added");
});

app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const getMovieOnMovieId = `
      SELECT
        movie_id AS movieId,
        director_id AS directorId,
        movie_name AS movieName,
        lead_actor AS leadActor
      FROM
        movie
      WHERE
        movie_id = ${movieId};`;
  const result = await db.get(getMovieOnMovieId);
  response.send(result);
});

app.put("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const playerDetails = request.body;
  const { directorId, movieName, leadActor } = playerDetails;
  const updateMovieQuery = `
    UPDATE
      movie
    SET
      director_id = '${directorId}',
      movie_name = '${movieName}',
      lead_actor = '${leadActor}'
    WHERE
      movie_id = ${movieId};`;

  await db.run(updateMovieQuery);
  response.send("Movie Details Updated");
});

app.delete("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const deleteMovieQuery = `
    DELETE FROM
      movie
    WHERE
      movie_id = ${movieId};`;

  await db.run(deleteMovieQuery);
  response.send("Movie Removed");
});

function convertingCase(eachObj) {
  return {
    directorId: eachObj.director_id,
    directorName: eachObj.director_name,
  };
}

app.get("/directors/", async (request, response) => {
  const getDirector = `
    SELECT director_id,director_name
    FROM director;`;
  const directorsArray = await db.all(getDirector);
  response.send(directorsArray.map((eachObj) => convertingCase(eachObj)));
});

app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const responseQuery = `
      SELECT
        movie.movie_name AS movieName
      FROM
        director NATURAL JOIN movie
      WHERE
        director.director_id = ${directorId};`;
  const result = await db.all(responseQuery);
  response.send(result);
});

module.exports = app;
