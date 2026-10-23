const mongoose = require('mongoose');
const { expect } = require('chai');
const WinnerService = require('../src/services/winnerService');
const Employee = require('../src/models/Employee');
const Round = require('../src/models/Round');
const Event = require('../src/models/Event');
const DrawOperation = require('../src/models/DrawOperation');

describe('WinnerService Integration Tests', function() {
  this.timeout(15000);

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/diwali_test');
    }
  });

  after(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Employee.deleteMany({});
    await Round.deleteMany({});
    await Event.deleteMany({});
    await DrawOperation.deleteMany({});

    const mockEvent = await Event.create({ 
      name: 'Test Event', 
      status: 'LIVE', 
      config: { locked: true, noRepeatWinners: true } 
    });

    const mockRound = await Round.create({ 
      category: 'Manager', 
      roundNumber: 1, 
      order: 1, 
      status: 'PENDING',
      prize: new mongoose.Types.ObjectId()
    });

    await Employee.create([
      { employeeId: 'E1', name: 'User 1', category: 'Manager', isWinner: false },
      { employeeId: 'E2', name: 'User 2', category: 'Manager', isWinner: false }
    ]);

    this.event = mockEvent;
    this.round = mockRound;
  });

  it('should select a winner and mark them as isWinner', async () => {
    const result = await WinnerService.drawWinner(this.round._id, this.event._id, new mongoose.Types.ObjectId());
    expect(result.winner).to.exist;
    const emp = await Employee.findById(result.winner._id);
    expect(emp.isWinner).to.be.true;
    const round = await Round.findById(this.round._id);
    expect(round.status).to.equal('COMPLETED');
  });

  it('should prevent the same employee from winning twice (no-repeat)', async () => {
    await WinnerService.drawWinner(this.round._id, this.event._id, new mongoose.Types.ObjectId());
    
    const round2 = await Round.create({ 
      category: 'Manager', 
      roundNumber: 2, 
      order: 2, 
      status: 'PENDING',
      prize: new mongoose.Types.ObjectId()
    });

    const result2 = await WinnerService.drawWinner(round2._id, this.event._id, new mongoose.Types.ObjectId());
    
    const round1 = await Round.findById(this.round._id);
    expect(round1.winner.toString()).to.not.equal(result2.winner._id.toString());
  });

  it('should handle concurrent requests for the same round atomically', async () => {
    const adminId = new mongoose.Types.ObjectId();
    
    const results = await Promise.allSettled([
      WinnerService.drawWinner(this.round._id, this.event._id, adminId),
      WinnerService.drawWinner(this.round._id, this.event._id, adminId)
    ]);

    const fulfilled = results.filter(r => r.status === 'fulfilled').map(r => r.value);
    
    if (fulfilled.length === 2) {
      expect(fulfilled[0].winner._id.toString()).to.equal(fulfilled[1].winner._id.toString());
    }
  });

  it('should reject draws for an event that is not LIVE', async () => {
    this.event.status = 'DRAFT';
    await this.event.save();
    try {
      await WinnerService.drawWinner(this.round._id, this.event._id, new mongoose.Types.ObjectId());
      throw new Error('Should have failed');
    } catch (err) {
      expect(err.statusCode).to.equal(400);
    }
  });

  it('should reject draw if no eligible employees exist', async () => {
    await Employee.deleteMany({});
    try {
      await WinnerService.drawWinner(this.round._id, this.event._id, new mongoose.Types.ObjectId());
      throw new Error('Should have failed');
    } catch (err) {
      expect(err.statusCode).to.equal(400);
      expect(err.message).to.contain('No eligible employees');
    }
  });
});
