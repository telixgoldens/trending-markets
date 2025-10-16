
const assert = require("assert");
const { TestHelpers } = require("generated");
const { MockDb, MarketFactory } = TestHelpers;

describe("MarketFactory contract MarketCreated event tests", () => {
  // Create mock db
  const mockDb = MockDb.createMockDb();

  // Creating mock for MarketFactory contract MarketCreated event
  const event = MarketFactory.MarketCreated.createMockEvent({/* It mocks event fields with default values. You can overwrite them if you need */});

  it("MarketFactory_MarketCreated is created correctly", async () => {
    // Processing the event
    const mockDbUpdated = await MarketFactory.MarketCreated.processEvent({
      event,
      mockDb,
    });

    // Getting the actual entity from the mock database
    let actualMarketFactoryMarketCreated = mockDbUpdated.entities.MarketFactory_MarketCreated.get(
      `${event.chainId}_${event.block.number}_${event.logIndex}`
    );

    // Creating the expected entity
    const expectedMarketFactoryMarketCreated = {
      id:`${event.chainId}_${event.block.number}_${event.logIndex}`,
      market: event.params.market,
      creator: event.params.creator,
    };
    // Asserting that the entity in the mock database is the same as the expected entity
    assert.deepEqual(
      actualMarketFactoryMarketCreated,
      expectedMarketFactoryMarketCreated,
      "Actual MarketFactoryMarketCreated should be the same as the expectedMarketFactoryMarketCreated"
    );
  });
});
