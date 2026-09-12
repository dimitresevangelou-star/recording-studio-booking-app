jest.mock('../src/repositories/bookingRepository');
jest.mock('../src/repositories/studioRepository');

const bookingRepository = require('../src/repositories/bookingRepository');
const studioRepository = require('../src/repositories/studioRepository');
const bookingService = require('../src/services/bookingService');

const ADMIN = { id: 100, role: 'admin' };
const ENGINEER_OWNER = { id: 1, role: 'engineer' };
const ENGINEER_OTHER = { id: 2, role: 'engineer' };

// Always generate dates relative to "now" so these tests never go stale/fail
// just because real time has passed a hardcoded date (see past-date validation).
function futureISO(hoursFromNow) {
  return new Date(Date.now() + hoursFromNow * 60 * 60 * 1000).toISOString();
}

describe('bookingService.createBooking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws 400 for a non-numeric studioId', async () => {
    await expect(
      bookingService.createBooking(1, {
        studioId: 'abc',
        startTime: futureISO(24),
        endTime: futureISO(26),
      })
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(studioRepository.findById).not.toHaveBeenCalled();
  });

  it('throws 404 when the studio does not exist', async () => {
    studioRepository.findById.mockResolvedValue(null);

    await expect(
      bookingService.createBooking(1, {
        studioId: 999,
        startTime: futureISO(24),
        endTime: futureISO(26),
      })
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 400 when endTime is before or equal to startTime', async () => {
    studioRepository.findById.mockResolvedValue({ id: 1, hourly_rate: 20 });

    await expect(
      bookingService.createBooking(1, {
        studioId: 1,
        startTime: futureISO(26),
        endTime: futureISO(24),
      })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('throws 400 for invalid/unparseable dates instead of hitting the database', async () => {
    studioRepository.findById.mockResolvedValue({ id: 1, hourly_rate: 20 });

    await expect(
      bookingService.createBooking(1, {
        studioId: 1,
        startTime: 'not-a-date',
        endTime: 'also-not-a-date',
      })
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(bookingRepository.create).not.toHaveBeenCalled();
  });

  it('throws 400 when startTime is in the past', async () => {
    studioRepository.findById.mockResolvedValue({ id: 1, hourly_rate: 20 });
    const pastStart = new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString();
    const pastEnd = new Date(Date.now() - 1000 * 60 * 60 * 23).toISOString();

    await expect(
      bookingService.createBooking(1, { studioId: 1, startTime: pastStart, endTime: pastEnd })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('throws 409 when the studio is already booked for that time slot', async () => {
    studioRepository.findById.mockResolvedValue({ id: 1, hourly_rate: 20 });
    bookingRepository.findOverlapping.mockResolvedValue([{ id: 5 }]);

    await expect(
      bookingService.createBooking(1, {
        studioId: 1,
        startTime: futureISO(24),
        endTime: futureISO(26),
      })
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('calculates total price correctly based on hourly rate and duration', async () => {
    studioRepository.findById.mockResolvedValue({ id: 1, hourly_rate: 25 });
    bookingRepository.findOverlapping.mockResolvedValue([]);
    bookingRepository.create.mockImplementation((data) => Promise.resolve({ id: 1, ...data }));

    await bookingService.createBooking(1, {
      studioId: 1,
      startTime: futureISO(24),
      endTime: futureISO(26.5), // 2.5 hours
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
      startTime: futureISO(24),
      endTime: futureISO(26),
    });

    expect(result.id).toBe(42);
  });
});

describe('bookingService.listAllBookings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns every booking for an admin', async () => {
    bookingRepository.findAll.mockResolvedValue([{ id: 1 }, { id: 2 }]);

    const result = await bookingService.listAllBookings(ADMIN);

    expect(bookingRepository.findAll).toHaveBeenCalled();
    expect(bookingRepository.findByEngineer).not.toHaveBeenCalled();
    expect(result).toHaveLength(2);
  });

  it('returns only bookings for the engineer\'s own studios', async () => {
    bookingRepository.findByEngineer.mockResolvedValue([{ id: 3 }]);

    const result = await bookingService.listAllBookings(ENGINEER_OWNER);

    expect(bookingRepository.findByEngineer).toHaveBeenCalledWith(ENGINEER_OWNER.id);
    expect(bookingRepository.findAll).not.toHaveBeenCalled();
    expect(result).toEqual([{ id: 3 }]);
  });
});

describe('bookingService.updateStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects invalid status values', async () => {
    await expect(
      bookingService.updateStatus(1, 'not-a-real-status', ADMIN)
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('throws 404 when the booking does not exist', async () => {
    bookingRepository.findById.mockResolvedValue(null);

    await expect(bookingService.updateStatus(1, 'confirmed', ADMIN)).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('admin can update the status of any booking', async () => {
    bookingRepository.findById.mockResolvedValue({ id: 1, studio_id: 9 });
    bookingRepository.updateStatus.mockResolvedValue({ id: 1, status: 'confirmed' });

    const result = await bookingService.updateStatus(1, 'confirmed', ADMIN);
    expect(result.status).toBe('confirmed');
  });

  it('lets an engineer update a booking for a studio they own', async () => {
    bookingRepository.findById.mockResolvedValue({ id: 1, studio_id: 9 });
    studioRepository.findById.mockResolvedValue({ id: 9, engineer_id: ENGINEER_OWNER.id });
    bookingRepository.updateStatus.mockResolvedValue({ id: 1, status: 'confirmed' });

    const result = await bookingService.updateStatus(1, 'confirmed', ENGINEER_OWNER);
    expect(result.status).toBe('confirmed');
  });

  it('SECURITY: blocks an engineer from updating a booking for a studio they do NOT own', async () => {
    bookingRepository.findById.mockResolvedValue({ id: 1, studio_id: 9 });
    studioRepository.findById.mockResolvedValue({ id: 9, engineer_id: ENGINEER_OWNER.id });

    await expect(
      bookingService.updateStatus(1, 'confirmed', ENGINEER_OTHER)
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(bookingRepository.updateStatus).not.toHaveBeenCalled();
  });
});

describe('bookingService.cancelOwnBooking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lets an artist cancel their own booking', async () => {
    bookingRepository.findById.mockResolvedValue({ id: 1, artist_id: 7 });
    bookingRepository.updateStatus.mockResolvedValue({ id: 1, status: 'cancelled' });

    const result = await bookingService.cancelOwnBooking(1, 7);

    expect(bookingRepository.updateStatus).toHaveBeenCalledWith(1, 'cancelled');
    expect(result.status).toBe('cancelled');
  });

  it('SECURITY: blocks an artist from cancelling another artist\'s booking', async () => {
    bookingRepository.findById.mockResolvedValue({ id: 1, artist_id: 7 });

    await expect(bookingService.cancelOwnBooking(1, 8)).rejects.toMatchObject({ statusCode: 403 });
    expect(bookingRepository.updateStatus).not.toHaveBeenCalled();
  });

  it('throws 404 when the booking does not exist', async () => {
    bookingRepository.findById.mockResolvedValue(null);

    await expect(bookingService.cancelOwnBooking(999, 7)).rejects.toMatchObject({ statusCode: 404 });
  });
});
