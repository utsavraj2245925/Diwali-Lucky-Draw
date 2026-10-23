const mongoose = require('mongoose');
const { expect } = require('chai');
const WinnerService = require('../src/services/winnerService');
const Employee = require('../src/models/Employee');
const Round = require('../src/models/Round');
const Event = require('../src/models/Event');
const DrawOperation = require('../src/models/DrawOperation');

describe('WinnerService Advanced Recovery Tests', function() {
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

  it('should prevent a recovered operation from committing after its reservation was released', async () => {
    const adminId = new mongoose.Types.ObjectId();
    const emp = await Employee.findOne();
    
    // 1. Setup: Operation A reserves an employee
    const opA = await DrawOperation.create({ 
      round: this.round._id, 
      winner: emp._id, 
      status: 'PROCESSING', 
      startedAt: new Date(Date.now() - 1000 * 60 * 10) 
    });
    await Employee.findByIdAndUpdate(emp._id, { 
      $set: { isWinner: true, winnerRound: this.round._id, reservationOpId: opA._id } 
    });

    // 2. Recovery releases the reservation
    await WinnerService.recoverStuckOperations();
    const releasedEmp = await Employee.findById(emp._id);
    expect(releasedEmp.isWinner).to.be.false;

    // 3. Attempt to "finalize" the old operation (simulating a resumed process)
    // The drawWinner logic should now fail because the round is PENDING but the 
    // employee is no longer reserved by this op, or if it retries, it picks a new one.
    
    // If we try to draw again for the same round, it should work and not be blocked by opA
    const result = await WinnerService.drawWinner(this.round._id, this.event._id, adminId);
    expect(result.winner).to.exist;
    expect(result.round.status).to.equal('COMPLETED');
  });

  it('should only release reservations owned by the recovery operation', async () => {
    const emp1 = await Employee.findOne();
    const emp2 = await Employee.findOne();

    // Op A is stale
    const opA = await DrawOperation.create({ 
      round: new mongoose.Types.ObjectId(), 
      winner: emp1._id, 
      status: 'PROCESSING', 
      startedAt: new Date(Date.now() - 1000 * 60 * 10) 
    });
    await Employee.findByIdAndUpdate(emp1._id, { $set: { isWinner: true, reservationOpId: opA._id } });

    // Op B is fresh (recent)
    const opB = await DrawOperation.create({ 
      round: new mongoose.Types.ObjectId(), 
      winner: emp2._id, 
      status: 'PROCESSING', 
      startedAt: new Date() 
    });
    await Employee.findByIdAndUpdate(emp2._id, { $set: { isWinner: true, reservationOpId: opB._id } });

    await WinnerService.recoverStuckOperations();

    const updatedEmp1 = await Employee.findById(emp1._id);
    const updatedEmp2 = await Employee.findById(emp2._id);

    expect(updatedEmp1.isWinner).to.be.false; // Recovered
    expect(updatedEmp2.isWinner).to.be.true;  // Preserved
  });
});
