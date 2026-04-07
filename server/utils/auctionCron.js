const cron = require('node-cron');
const Item = require('../models/Item');
const User = require('../models/User');
const { checkAndProcessAuctionStatus } = require('../controllers/itemController');
const { dispatchNotification } = require('../controllers/notificationController');

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

      // 3. Notify Watchlist Users for items ending in exactly 1 hour (between 60 and 59 mins from now)
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
      const oneHourMinusOneMin = new Date(now.getTime() + 59 * 60 * 1000);
      
      const endingSoonItems = await Item.find({
        status: 'active',
        endTime: { $lte: oneHourFromNow, $gt: oneHourMinusOneMin }
      });

      if (endingSoonItems.length > 0) {
        for (const item of endingSoonItems) {
           const usersWatching = await User.find({ watchlist: item._id }).select('email');
           for (const watcher of usersWatching) {
               await dispatchNotification({
                   userId: watcher._id,
                   userEmail: watcher.email,
                   type: 'watchlist_ending',
                   message: `An item on your watchlist, "${item.title}", is ending in less than 1 hour. Get your final bids in!`,
                   relatedItemId: item._id,
                   subject: `Ending Soon: ${item.title}!`
               });
           }
        }
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