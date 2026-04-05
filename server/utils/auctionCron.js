const cron = require('node-cron');
const Item = require('../models/Item');
// Adjust this path if your controller is in a different folder
const { checkAndProcessAuctionStatus } = require('../controllers/itemController'); 

const startAuctionCronJob = () => {
  // This string '* * * * *' tells it to run every single minute
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      
      // 1. Find all items that are currently 'active' but their endTime is in the past
      const expiredAuctions = await Item.find({
        status: 'active',
        endTime: { $lte: now }
      });

      // 2. If we found any, process them immediately
      if (expiredAuctions.length > 0) {
        console.log(`Cron Job: Found ${expiredAuctions.length} expired auctions. Processing now...`);
        
        for (const item of expiredAuctions) {
          // This uses your existing logic to find the winner and send all emails!
          await checkAndProcessAuctionStatus(item);
        }
      }
      
    } catch (error) {
      console.error('Error in auction cron job:', error);
    }
  });
  
//   console.log('Auction Cron Job initialized. Checking for expired auctions every minute.');
};

module.exports = startAuctionCronJob;