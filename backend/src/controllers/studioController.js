const studioService = require('../services/studioService');

async function createStudio(req, res, next) {
  try {
    const studio = await studioService.createStudio(req.user.id, req.body);
    res.status(201).json(studio);
  } catch (err) {
    next(err);
  }
}

async function listStudios(req, res, next) {
  try {
    const studios = await studioService.listStudios();
    res.json(studios);
  } catch (err) {
    next(err);
  }
}

async function getStudio(req, res, next) {
  try {
    const studio = await studioService.getStudio(req.params.id);
    res.json(studio);
  } catch (err) {
    next(err);
  }
}

async function updateStudio(req, res, next) {
  try {
    const studio = await studioService.updateStudio(req.params.id, req.user.id, req.body);
    res.json(studio);
  } catch (err) {
    next(err);
  }
}

async function deleteStudio(req, res, next) {
  try {
    await studioService.deleteStudio(req.params.id, req.user.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { createStudio, listStudios, getStudio, updateStudio, deleteStudio };
