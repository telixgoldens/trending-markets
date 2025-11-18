import { BigInt } from "@graphprotocol/graph-ts"
import { MarketCreated } from "../generated/MarketFactory/MarketFactory"
import { BinaryMarket } from "../generated/templates"
import {
  LiquidityAdded,
  Swap as SwapEvent,
  MarketResolved,
  Redeemed
} from "../generated/templates/BinaryMarket/BinaryMarket"
import { Market, LiquidityEvent, Swap, Resolution, Redemption } from "../generated/schema"

function getIdFromEvent(eventId: string, address: string, index: BigInt): string {
  return address + "-" + index.toString()
}

export function handleMarketCreated(event: MarketCreated): void {
  let market = new Market(event.params.market.toHex())
  market.address = event.params.market
  market.creator = event.params.creator
  market.question = event.params.question
  market.resolveTimestamp = event.params.resolveTimestamp
  market.resolved = false
  market.winningOutcome = null
  market.save()

  BinaryMarket.create(event.params.market)
}


export function handleLiquidityAdded(event: LiquidityAdded): void {
  let id = event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  let e = new LiquidityEvent(id)
  e.market = event.address.toHex()
  e.provider = event.params.provider
  e.yesAmount = event.params.yesAmount
  e.noAmount = event.params.noAmount
  e.shares = event.params.shares
  e.timestamp = event.block.timestamp
  e.save()
}

export function handleSwap(event: SwapEvent): void {
  let id = event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  let s = new Swap(id)
  s.market = event.address.toHex()
  s.trader = event.params.trader
  s.outcomeIndex = BigInt.fromI32(event.params.outcomeIndex)  
  s.collateralIn = event.params.collateralIn
  s.tokensOut = event.params.tokensOut
  s.fee = event.params.fee
  s.timestamp = event.block.timestamp
  s.save()
}

export function handleMarketResolved(event: MarketResolved): void {
  let market = Market.load(event.address.toHex())
  if (market == null) return
  market.resolved = true
  market.winningOutcome = BigInt.fromI32(event.params.winningOutcome) 
  market.save()

  let id = event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  let r = new Resolution(id)
  r.market = market.id
  r.winningOutcome = BigInt.fromI32(event.params.winningOutcome)
  r.timestamp = event.block.timestamp
  r.save()
}

export function handleRedeemed(event: Redeemed): void {
  let id = event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  let redemption = new Redemption(id)
  redemption.market = event.address.toHex()
  redemption.redeemer = event.params.redeemer
  redemption.tokensRedeemed = event.params.tokensRedeemed
  redemption.payout = event.params.payout
  redemption.timestamp = event.block.timestamp
  redemption.save()
}
