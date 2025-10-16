export function handleMarketCreated(event, context) {
  const { Market } = context.entities;

  const market = new Market({
    id: event.params.market,
    creator: event.params.creator,
    question: event.params.question,
    resolveTimestamp: event.params.resolveTimestamp,
    blockNumber: event.block.number,
    transactionHash: event.transaction.hash,
  });

  market.save();
}
