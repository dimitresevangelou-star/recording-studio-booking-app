jest.mock('../src/repositories/studioRepository');

const studioRepository = require('../src/repositories/studioRepository');
const studioService = require('../src/services/studioService');

describe('studioService.createStudio', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws 400 for a negative hourlyRate instead of hitting the database', async () => {
    await expect(
      studioService.createStudio(1, { name: 'Studio', hourlyRate: -50 })
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(studioRepository.create).not.toHaveBeenCalled();
  });

  it('throws 400 for a non-numeric hourlyRate instead of hitting the database', async () => {
    await expect(
      studioService.createStudio(1, { name: 'Studio', hourlyRate: 'abc' })
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(studioRepository.create).not.toHaveBeenCalled();
  });

  it('accepts hourlyRate of 0 (free studio)', async () => {
    studioRepository.create.mockResolvedValue({ id: 1, hourly_rate: 0 });
    await studioService.createStudio(1, { name: 'Free Studio', hourlyRate: 0 });
    expect(studioRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ hourlyRate: 0 })
    );
  });

  it('throws 400 when name is missing', async () => {
    await expect(
      studioService.createStudio(1, { hourlyRate: 20 })
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});

describe('studioService.getStudio', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws 400 for a non-numeric id instead of hitting the database', async () => {
    await expect(studioService.getStudio('not-a-number')).rejects.toMatchObject({
      statusCode: 400,
    });
    expect(studioRepository.findById).not.toHaveBeenCalled();
  });

  it('throws 404 when the studio does not exist', async () => {
    studioRepository.findById.mockResolvedValue(null);
    await expect(studioService.getStudio(999)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('returns the studio for a valid id', async () => {
    studioRepository.findById.mockResolvedValue({ id: 1, name: 'Studio' });
    const result = await studioService.getStudio(1);
    expect(result.id).toBe(1);
  });
});

describe('studioService.updateStudio', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws 403 when a non-owner engineer tries to update the studio', async () => {
    studioRepository.findById.mockResolvedValue({ id: 1, engineer_id: 5 });
    await expect(
      studioService.updateStudio(1, 6, { name: 'x', hourlyRate: 10 })
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('throws 400 for a negative hourlyRate on update', async () => {
    studioRepository.findById.mockResolvedValue({ id: 1, engineer_id: 5 });
    await expect(
      studioService.updateStudio(1, 5, { name: 'x', hourlyRate: -1 })
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(studioRepository.update).not.toHaveBeenCalled();
  });
});
