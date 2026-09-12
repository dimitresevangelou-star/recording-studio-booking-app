const studioRepository = require('../repositories/studioRepository');

function parseId(id) {
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    const err = new Error('Invalid id');
    err.statusCode = 400;
    throw err;
  }
  return numericId;
}

function parseHourlyRate(hourlyRate) {
  const numericRate = Number(hourlyRate);
  if (!Number.isFinite(numericRate) || numericRate < 0) {
    const err = new Error('hourlyRate must be a non-negative number');
    err.statusCode = 400;
    throw err;
  }
  return numericRate;
}

class StudioService {
  async createStudio(engineerId, data) {
    if (!data.name || data.hourlyRate === undefined || data.hourlyRate === null || data.hourlyRate === '') {
      const err = new Error('Studio name and hourlyRate are required');
      err.statusCode = 400;
      throw err;
    }
    const hourlyRate = parseHourlyRate(data.hourlyRate);
    return studioRepository.create({ ...data, hourlyRate, engineerId });
  }

  async listStudios() {
    return studioRepository.findAll();
  }

  async getStudio(id) {
    const numericId = parseId(id);
    const studio = await studioRepository.findById(numericId);
    if (!studio) {
      const err = new Error('Studio not found');
      err.statusCode = 404;
      throw err;
    }
    return studio;
  }

  async updateStudio(id, engineerId, data) {
    const studio = await this.getStudio(id);
    if (studio.engineer_id !== engineerId) {
      const err = new Error('Not authorized to edit this studio');
      err.statusCode = 403;
      throw err;
    }
    const update = { ...data };
    if (data.hourlyRate !== undefined) {
      update.hourlyRate = parseHourlyRate(data.hourlyRate);
    }
    return studioRepository.update(studio.id, update);
  }

  async deleteStudio(id, engineerId) {
    const studio = await this.getStudio(id);
    if (studio.engineer_id !== engineerId) {
      const err = new Error('Not authorized to delete this studio');
      err.statusCode = 403;
      throw err;
    }
    return studioRepository.delete(id);
  }
}

module.exports = new StudioService();
