/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 */
const {
 MarketFactory,
} = require("generated");

MarketFactory.MarketCreated.handler(async ({event, context}) => {
  const entity = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    market: event.params.market,
    creator: event.params.creator,
  };

  context.MarketFactory_MarketCreated.set(entity);
});

