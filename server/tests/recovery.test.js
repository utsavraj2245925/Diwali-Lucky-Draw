const mongoose = require('mongoose');
const { expect } = require('chai');
const WinnerService = require('../src/services/winnerService');
const Employee = require('../src/models/Employee');
const Round = require('../src/models/Round');
const Event = require('../src/models/Event');
const DrawOperation = require('../src/models/DrawOperation');

describe('WinnerService Recovery & Concurrency Tests', function() {
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

    this.event = await Event.create({ 
      name: 'Test Event', 
      status: 'LIVE', 
      config: { locked: true, noRepeatWinners: true } 
    });

    this.round = await Round.create({ 
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
  });

  it('should recover from a crash after employee reservation but before round commitment', async () => {
    const emp = await Employee.findOne();
    const op = await DrawOperation.create({
      round: this.round._id,
      winner: null, // Simulate crash before op.winner was set
      status: 'PROCESSING',
      startedAt: new Date(Date.now() - 1000 * 60 * 10) // 10 mins ago
    });
    await Employee.findByIdAndUpdate(emp._id, {
      $set: { isWinner: true, winnerRound: this.round._id, reservationOpId: op._id }
    });

    const result = await WinnerService.recoverStuckOperations();
    expect(result.recoveredCount).to.equal(1);

    const updatedEmp = await Employee.findById(emp._id);
    expect(updatedEmp.isWinner).to.be.false;

    const updatedOp = await DrawOperation.findOne({ round: this.round._id });
    expect(updatedOp.status).to.equal('FAILED');
  });

  it('should not let two different rounds claim the same employee', async () => {
    const round2 = await Round.create({ 
      category: 'Manager', 
      roundNumber: 2, 
      order: 2, 
      status: 'PENDING',
      prize: new mongoose.Types.ObjectId()
    });

    const adminId = new mongoose.Types.ObjectId();
    const results = await Promise.allSettled([
      WinnerService.drawWinner(this.round._id, this.event._id, adminId),
      WinnerService.drawWinner(round2._id, this.event._id, adminId)
    ]);

    const winners = results
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value.winner._id.toString());

    expect(winners).to.have.lengthOf(2);
    expect(winners[0]).to.not.equal(winners[1]);
  });

  it('should return the original winner on retry after commitment', async () => {
    const adminId = new mongoose.Types.ObjectId();
    const firstResult = await WinnerService.drawWinner(this.round._id, this.event._id, adminId);
    const secondResult = await WinnerService.drawWinner(this.round._id, this.event._id, adminId);
    expect(secondResult.winner._id.toString()).to.equal(firstResult.winner._id.toString());
  });
});
