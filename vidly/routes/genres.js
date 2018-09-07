const express = require("express");
const router = express.Router();
const { Genres, validate } = require("../models/genre");
const authentication = require("../middleware/authentication");

async function getGenres() {
  return await Genres.find().sort("name");
  l;
}

async function getGenreById(id) {
  return await Genres.findById(id);
}

async function createGenre(genre) {
  const genreModel = new Genres(genre);
  return await genreModel.save();
}

async function updateGenre(id, updateObject) {
  return await Genres.findByIdAndUpdate(
    id,
    {
      $set: updateObject
    },
    { new: true }
  );
}

router.get("/", async (req, res) => {
  getGenres()
    .then(genres => res.send(genres))
    .catch(err =>
      logServerErrorAndRespond(err, `Could not get all genres`, res)
    );
});

router.get("/:id", async (req, res) => {
  try {
    const genre = await Genres.findById(req.params.id);
    if (!genre)
      return res
        .status(404)
        .send(`A genre with id ${req.params.id} was not found!`);
    res.send(genre);
  } catch (ex) {
    logServerErrorAndRespond(
      err,
      `Error fetching genre with id: ${req.params.id}`,
      res
    );
  }
});

router.delete("/:id", authentication, (req, res) => {
  Genres.findByIdAndRemove(req.params.id)
    .then(genre => {
      if (!genre)
        return res
          .status(404)
          .send(`A genre with id ${req.params.id} was not found!`);
      res.send(genre);
    })
    .catch(err => {
      logServerErrorAndRespond(
        err,
        `Error trying to delete genre with id: ${req.params.id}`,
        res
      );
    });
});

function logServerErrorAndRespond(err, friendlyMessage, res, statusCode = 500) {
  console.log(friendlyMessage, err.message);
  res.status(statusCode).send(friendlyMessage);
}

router.put("/:id", authentication, (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  Genres.find({ name: req.body.name })
    .then(matchedGenre => {
      if (
        matchedGenre &&
        matchedGenre.length > 0 &&
        matchedGenre[0]._id != req.params.id
      )
        return res
          .status(400)
          .send("Another genre with this name already exists");

      updateGenre(req.params.id, req.body)
        .then(updated => {
          if (!updated)
            return res
              .status(404)
              .send(`A genre with id ${req.params.id} was not found!`);
          res.send(updated);
        })
        .catch(err => {
          logServerErrorAndRespond(
            err,
            `Error trying to update genre with id: ${req.params.id}`,
            res
          );
        });
    })
    .catch(err => {
      logServerErrorAndRespond(err, `Error trying to update genre`, res);
    });

  console.log(`Genre ${req.params.id} updated successfully`);
});

router.post("/", authentication, (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  Genres.find({ name: req.body.name })
    .then(matchedGenre => {
      if (matchedGenre && matchedGenre.length > 0)
        return res
          .status(400)
          .send("Another genre with this name already exists");

      createGenre(req.body)
        .then(newGenre => {
          res.send(newGenre);
        })
        .catch(err => {
          logServerErrorAndRespond(err, `Error trying to create genre`, res);
        });
    })
    .catch(err => {
      logServerErrorAndRespond(err, `Error trying to create genre`, res);
    });
});

module.exports = {
  router: router,
  database: {
    createGenre: createGenre,
    getById: getGenreById
  }
};
