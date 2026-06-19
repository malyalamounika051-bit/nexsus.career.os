/**
 * Reminder Service – Deadline Notification Generator
 * ---------------------------------------------------
 * Scans UserOpportunity records for registered or applied users,
 * calculates days remaining until deadlines, and generates tiered
 * reminder objects (7-day, 3-day, 1-day, same-day).
 *
 * Each reminder tier is tracked via `remindersSent` flags on the
 * UserOpportunity document so reminders are never sent twice.
 *
 * @module services/reminderService
 */

const UserOpportunity = require('../models/UserOpportunity');
const Opportunity = require('../models/Opportunity');

/**
 * Calculate the number of whole days remaining from now until a target date.
 * Returns a negative number if the deadline has already passed.
 *
 * @param {Date} targetDate - The deadline or submission date
 * @returns {number} Days remaining (floor-rounded)
 */
const calcDaysRemaining = (targetDate) => {
  if (!targetDate) return Infinity;
  const now = new Date();
  const diffMs = new Date(targetDate).getTime() - now.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
};

/**
 * Determine which reminder tier applies based on days remaining.
 * Returns null if no reminder should fire.
 *
 * @param {number} daysLeft - Days until deadline
 * @param {Object} sentFlags - The remindersSent sub-document
 * @returns {{ tier: string, flag: string } | null}
 */
const getApplicableTier = (daysLeft, sentFlags = {}) => {
  if (daysLeft <= 0 && !sentFlags.sameDay) {
    return { tier: 'same-day', flag: 'sameDay' };
  }
  if (daysLeft <= 1 && !sentFlags.oneDay) {
    return { tier: '1-day', flag: 'oneDay' };
  }
  if (daysLeft <= 3 && !sentFlags.threeDay) {
    return { tier: '3-day', flag: 'threeDay' };
  }
  if (daysLeft <= 7 && !sentFlags.sevenDay) {
    return { tier: '7-day', flag: 'sevenDay' };
  }
  return null;
};

/**
 * Scan all registered/applied UserOpportunity records and generate
 * reminder objects for upcoming deadlines.
 *
 * For each qualifying record the function:
 *   1. Resolves the parent Opportunity's deadline & submissionDeadline
 *   2. Picks the earliest upcoming date
 *   3. Determines the applicable reminder tier
 *   4. Marks the tier as sent and saves the document
 *   5. Pushes a reminder object to the return array
 *
 * @returns {Promise<Array<{
 *   userId: string,
 *   opportunityId: string,
 *   opportunityTitle: string,
 *   daysLeft: number,
 *   type: string
 * }>>} Array of generated reminder objects
 */
const checkAndGenerateReminders = async () => {
  console.log('🔔 Reminder Service: Scanning for upcoming deadlines...');

  try {
    // Find all active registrations / applications
    const userOpps = await UserOpportunity.find({
      $or: [{ registered: true }, { applied: true }]
    });

    if (userOpps.length === 0) {
      console.log('🔔 Reminder Service: No registered/applied opportunities found.');
      return [];
    }

    const reminders = [];

    for (const uo of userOpps) {
      try {
        // Populate the parent opportunity
        const opp = await Opportunity.findById(uo.opportunityId);
        if (!opp || opp.opportunityStatus !== 'active') continue;

        // Pick the soonest relevant deadline
        const deadlineDays = calcDaysRemaining(opp.deadline);
        const submissionDays = calcDaysRemaining(opp.submissionDeadline);
        const daysLeft = Math.min(deadlineDays, submissionDays);

        // Skip if both deadlines are missing or far away
        if (daysLeft === Infinity || daysLeft > 7) continue;

        // Skip if deadline already passed and same-day already sent
        if (daysLeft < 0) continue;

        // Ensure remindersSent sub-doc exists
        if (!uo.remindersSent) {
          uo.remindersSent = {
            sevenDay: false,
            threeDay: false,
            oneDay: false,
            sameDay: false
          };
        }

        const tier = getApplicableTier(daysLeft, uo.remindersSent);
        if (!tier) continue;

        // Mark this tier as sent and persist
        uo.remindersSent[tier.flag] = true;
        await uo.save();

        reminders.push({
          userId: uo.userId,
          opportunityId: uo.opportunityId.toString(),
          opportunityTitle: opp.title,
          daysLeft,
          type: tier.tier
        });
      } catch (entryErr) {
        console.error(`❌ Reminder error for UserOpp ${uo._id}:`, entryErr.message);
        // Continue processing remaining records
      }
    }

    console.log(`🔔 Reminder Service: Generated ${reminders.length} reminders.`);
    return reminders;
  } catch (err) {
    console.error('❌ Reminder Service: Fatal error:', err.message);
    return [];
  }
};

/**
 * Retrieve upcoming deadlines for a specific user.
 * Returns a sorted list (soonest first) of the user's registered
 * and applied opportunities with days-remaining info.
 *
 * @param {string} userId - The user's ID
 * @returns {Promise<Array<{
 *   opportunityId: string,
 *   opportunityTitle: string,
 *   deadline: Date|null,
 *   submissionDeadline: Date|null,
 *   daysLeft: number,
 *   registered: boolean,
 *   applied: boolean,
 *   submissionStatus: string
 * }>>} Sorted array of upcoming deadlines
 */
const getRemindersForUser = async (userId) => {
  try {
    const userOpps = await UserOpportunity.find({
      userId,
      $or: [{ registered: true }, { applied: true }]
    });

    if (userOpps.length === 0) return [];

    const results = [];

    for (const uo of userOpps) {
      const opp = await Opportunity.findById(uo.opportunityId);
      if (!opp || opp.opportunityStatus !== 'active') continue;

      const deadlineDays = calcDaysRemaining(opp.deadline);
      const submissionDays = calcDaysRemaining(opp.submissionDeadline);
      const daysLeft = Math.min(deadlineDays, submissionDays);

      // Only include future (or same-day) deadlines
      if (daysLeft < 0) continue;

      results.push({
        opportunityId: uo.opportunityId.toString(),
        opportunityTitle: opp.title,
        deadline: opp.deadline || null,
        submissionDeadline: opp.submissionDeadline || null,
        daysLeft,
        registered: uo.registered || false,
        applied: uo.applied || false,
        submissionStatus: uo.submissionStatus || 'not-started'
      });
    }

    // Sort by soonest deadline first
    results.sort((a, b) => a.daysLeft - b.daysLeft);

    return results;
  } catch (err) {
    console.error(`❌ Reminder Service: Error fetching reminders for user ${userId}:`, err.message);
    return [];
  }
};

module.exports = {
  checkAndGenerateReminders,
  getRemindersForUser
};
