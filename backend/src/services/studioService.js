const studioRepository = require('../repositories/studioRepository');

class StudioService {
  async createStudio(engineerId, data) {
    if (!data.name || !data.hourlyRate) {
      const err = new Error('Studio name and hourlyRate are required');
      err.statusCode = 400;
      throw err;
    }
    return studioRepository.create({ ...data, engineerId });
  }

  async listStudios() {
    return studioRepository.findAll();
  }

  async getStudio(id) {
    const studio = await studioRepository.findById(id);
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
    return studioRepository.update(id, data);
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
