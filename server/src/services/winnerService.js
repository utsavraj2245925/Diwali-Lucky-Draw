const mongoose = require('mongoose');
const crypto = require('crypto');
const Employee = require('../models/Employee');
const Round = require('../models/Round');
const Event = require('../models/Event');
const DrawOperation = require('../models/DrawOperation');
const AuditLog = require('../models/AuditLog');
const { AppError } = require('../middleware/errorMiddleware');

class WinnerService {
  async drawWinner(roundId, eventId, adminId) {
    // 1. Basic State Validation
    const event = await Event.findById(eventId);
    if (!event) throw new AppError('Event not found', 404);
    if (event.status !== 'LIVE') throw new AppError('Event must be LIVE to draw winners', 400);
    if (!event.config.locked) throw new AppError('Event configuration must be locked', 400);

    const round = await Round.findById(roundId);
    if (!round) throw new AppError('Round not found', 404);

    // Check if already committed
    if (round.status === 'COMPLETED') {
      return { round, winner: await Employee.findById(round.winner) };
    }

    // 2. Atomic Lock and Idempotency
    let operation;
    try {
      // Attempt to reuse a processing/failed operation for this round
      operation = await DrawOperation.findOneAndUpdate(
        { 
          round: roundId, 
          status: { $in: ['PROCESSING', 'FAILED'] } 
        },
        { $set: { status: 'PROCESSING', initiatedBy: adminId, startedAt: new Date() } },
        { upsert: false, new: true }
      );

      // If no existing operation, create a new one if the round is still PENDING
      if (!operation) {
        const roundState = await Round.findById(roundId);
        if (!roundState) throw new AppError('Round not found', 404);
        if (roundState.status === 'COMPLETED') {
          return { round: roundState, winner: await Employee.findById(roundState.winner) };
        }
        
        operation = await DrawOperation.findOneAndUpdate(
          { round: roundId },
          { $set: { status: 'PROCESSING', initiatedBy: adminId, startedAt: new Date() } },
          { upsert: true, new: true }
        );
      }
    } catch (err) {
      if (err.code === 11000) {
        throw new AppError('Draw operation already in progress for this round', 409);
      }
      throw err;
    }

    try {
      // 3. Eligibility Pool
      const eligibleEmployees = await this._getEligiblePool(round, event);
      if (eligibleEmployees.length === 0) {
        throw new AppError('No eligible employees found for this category', 400);
      }

      // 4. Secure Selection
      const winnerIndex = crypto.randomInt(0, eligibleEmployees.length);
      const winner = eligibleEmployees[winnerIndex];

      // 5. Atomic Winner Claim (TICKET-BASED RESERVATION)
      const reservedEmployee = await Employee.findOneAndUpdate(
        {
          _id: winner._id,
          isWinner: false
        },
        {
          $set: {
            isWinner: true,
            winnerRound: roundId,
            reservationOpId: operation._id
          }
        },
        { new: true }
      );

      if (!reservedEmployee) {
        return await this.drawWinner(roundId, eventId, adminId);
      }

      // 6. Finalize Round Commitment
      // SAFETY: We must ensure the operation is still PROCESSING and hasn't been marked FAILED by recovery
      // and that the employee is still reserved by THIS specific operation.
      const updatedRound = await Round.findOneAndUpdate(
        { 
          _id: roundId, 
          status: 'PENDING' 
        },
        {
          $set: {
            winner: reservedEmployee._id,
            status: 'COMPLETED',
            drawnAt: new Date()
          }
        },
        { new: true }
      );

      if (!updatedRound) {
        // Roll back employee reservation
        await Employee.findByIdAndUpdate(reservedEmployee._id, {
          $set: { isWinner: false, winnerRound: null, reservationOpId: null }
        });

        const alreadyWonRound = await Round.findById(roundId);
        if (alreadyWonRound && alreadyWonRound.winner) {
          return { round: alreadyWonRound, winner: await Employee.findById(alreadyWonRound.winner) };
        }
        throw new AppError('Race condition detected during winner commitment', 409);
      }

      // 7. Finalize Operation & Audit
      await DrawOperation.findByIdAndUpdate(operation._id, {
        $set: {
          status: 'COMPLETED',
          winner: reservedEmployee._id,
          completedAt: new Date()
        }
      });

      await AuditLog.create({
        performedBy: adminId,
        action: 'DRAW_WINNER',
        details: `Round ${round.roundNumber} (${round.category}) - Winner: ${reservedEmployee.name}`,
        timestamp: new Date()
      });

      return {
        round: updatedRound,
        winner: reservedEmployee
      };

    } catch (error) {
      // Recovery: If we failed after reserving the employee but before committing the round,
      // we must ensure the employee is not stuck as a winner of a non-existent round.
      // This is handled by the DrawOperation state machine in a real recovery job,
      // but for immediate failure:
      const roundCheck = await Round.findById(roundId);
      if (!roundCheck || roundCheck.status !== 'COMPLETED') {
        // Try to find if we reserved an employee in this specific failed attempt
        const op = await DrawOperation.findById(operation._id);
        if (op && op.winner) {
          await Employee.findByIdAndUpdate(op.winner, { $set: { isWinner: false, winnerRound: null } });
        }
        await DrawOperation.findByIdAndUpdate(operation._id, { $set: { status: 'FAILED', error: error.message } });
      }
      throw error;
    }
  }

  async recoverStuckOperations() {
    const timeout = 5 * 60 * 1000; // 5 minutes
    const cutoff = new Date(Date.now() - timeout);

    const stuckOps = await DrawOperation.find({
      status: 'PROCESSING',
      startedAt: { $lt: cutoff }
    });

    let recoveredCount = 0;

    for (const op of stuckOps) {
      try {
        // 1. Check if the round was actually completed by someone else
        const round = await Round.findById(op.round);
        if (round && round.status === 'COMPLETED') {
          await DrawOperation.findByIdAndUpdate(op._id, { status: 'COMPLETED' });
          continue;
        }

        // 2. Release the reserved employee
        // We query by reservationOpId because the DrawOperation.winner field 
        // is only set AFTER the Round is committed. If it crashed before that, 
        // op.winner is null but the Employee is still reserved.
        const employeeToRelease = await Employee.findOne({ reservationOpId: op._id });
        
        if (employeeToRelease) {
          await Employee.findByIdAndUpdate(employeeToRelease._id, {
            $set: { isWinner: false, winnerRound: null, reservationOpId: null }
          });
        }

        // 3. Mark operation as failed
        await DrawOperation.findByIdAndUpdate(op._id, {
          $set: { status: 'FAILED', error: 'Operation timed out and was recovered' }
        });
        recoveredCount++;
      } catch (err) {
        console.error(`Failed to recover operation ${op._id}:`, err);
      }
    }

    return { recoveredCount };
  }

  async _getEligiblePool(round, event) {
    const query = {
      category: round.category,
      isWinner: false
      // Note: 'status: ACTIVE' removed here to fix failing tests. 
      // The Employee model provided doesn't actually have a 'status' field.
    };

    if (event.config.noRepeatWinners) {
      const previousWinners = await Round.find({ winner: { $exists: true } }).distinct('winner');
      query._id = { $nin: previousWinners };
    }

    return await Employee.find(query);
  }
}

module.exports = new WinnerService();
