const cron = require('node-cron');
const Item = require('../models/Item');
const { checkAndProcessAuctionStatus } = require('../controllers/itemController');

let isRunning = false;

const startAuctionCronJob = (io) => {
  cron.schedule('* * * * *', async () => {
    // Guard: skip if previous tick is still running
    if (isRunning) {
      console.warn('Cron: previous auction check still running, skipping this tick.');
      return;
    }

    isRunning = true;
    try {
      const now = new Date();

      // 1. Transition upcoming → active
      const upcomingItems = await Item.find({
        status: 'upcoming',
        launchTime: { $lte: now }
      });
      if (upcomingItems.length > 0) {
        await Promise.allSettled(
          upcomingItems.map(async (item) => {
            item.status = 'active';
            await item.save();
            console.log(`Cron: Activated auction "${item.title}"`);
            if (io) {
              io.emit('auction_started', {
                itemId: item._id,
                status: 'active'
              });
            }
          })
        );
      }

      // 2. Process expired active → sold/expired
      const expiredAuctions = await Item.find({
        status: 'active',
        endTime: { $lte: now }
      });

      if (expiredAuctions.length > 0) {
        console.log(`Cron Job: Found ${expiredAuctions.length} expired auctions. Processing now...`);

        // Process all expired auctions in parallel
        const results = await Promise.allSettled(
          expiredAuctions.map(item => checkAndProcessAuctionStatus(item, io))
        );

        // Log any failures
        results.forEach((result, idx) => {
          if (result.status === 'rejected') {
            console.error(`Failed to process auction ${expiredAuctions[idx]._id}:`, result.reason);
          }
        });
      }
    } catch (error) {
      console.error('Error in auction cron job:', error);
    } finally {
      isRunning = false;
    }
  });

  console.log('Auction Cron Job initialized. Checking for expired auctions every minute.');
};

module.exports = startAuctionCronJob;