jest.mock('../src/repositories/bookingRepository');
jest.mock('../src/repositories/studioRepository');

const bookingRepository = require('../src/repositories/bookingRepository');
const studioRepository = require('../src/repositories/studioRepository');
const bookingService = require('../src/services/bookingService');

describe('bookingService.createBooking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws 404 when the studio does not exist', async () => {
    studioRepository.findById.mockResolvedValue(null);

    await expect(
      bookingService.createBooking(1, {
        studioId: 999,
        startTime: '2026-09-10T10:00:00Z',
        endTime: '2026-09-10T12:00:00Z',
      })
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 400 when endTime is before or equal to startTime', async () => {
    studioRepository.findById.mockResolvedValue({ id: 1, hourly_rate: 20 });

    await expect(
      bookingService.createBooking(1, {
        studioId: 1,
        startTime: '2026-09-10T12:00:00Z',
        endTime: '2026-09-10T10:00:00Z',
      })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('throws 409 when the studio is already booked for that time slot', async () => {
    studioRepository.findById.mockResolvedValue({ id: 1, hourly_rate: 20 });
    bookingRepository.findOverlapping.mockResolvedValue([{ id: 5 }]);

    await expect(
      bookingService.createBooking(1, {
        studioId: 1,
        startTime: '2026-09-10T10:00:00Z',
        endTime: '2026-09-10T12:00:00Z',
      })
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('calculates total price correctly based on hourly rate and duration', async () => {
    studioRepository.findById.mockResolvedValue({ id: 1, hourly_rate: 25 });
    bookingRepository.findOverlapping.mockResolvedValue([]);
    bookingRepository.create.mockImplementation((data) => Promise.resolve({ id: 1, ...data }));

    await bookingService.createBooking(1, {
      studioId: 1,
      startTime: '2026-09-10T10:00:00Z',
      endTime: '2026-09-10T12:30:00Z', // 2.5 hours
    });

    expect(bookingRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ totalPrice: 62.5 })
    );
  });

  it('creates the booking successfully when there is no overlap', async () => {
    studioRepository.findById.mockResolvedValue({ id: 1, hourly_rate: 20 });
    bookingRepository.findOverlapping.mockResolvedValue([]);
    bookingRepository.create.mockResolvedValue({ id: 42, totalPrice: 40 });

    const result = await bookingService.createBooking(1, {
      studioId: 1,
      startTime: '2026-09-10T10:00:00Z',
      endTime: '2026-09-10T12:00:00Z',
    });

    expect(result.id).toBe(42);
  });
});

describe('bookingService.updateStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects invalid status values', async () => {
    await expect(bookingService.updateStatus(1, 'not-a-real-status')).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('throws 404 when the booking does not exist', async () => {
    bookingRepository.updateStatus.mockResolvedValue(null);

    await expect(bookingService.updateStatus(1, 'confirmed')).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('updates status successfully for a valid value', async () => {
    bookingRepository.updateStatus.mockResolvedValue({ id: 1, status: 'confirmed' });

    const result = await bookingService.updateStatus(1, 'confirmed');
    expect(result.status).toBe('confirmed');
  });
});
