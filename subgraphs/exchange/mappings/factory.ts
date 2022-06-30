import { Address, BigInt } from "@graphprotocol/graph-ts" /* eslint-disable prefer-const */
import { SummitFactory, Pair, Token, Bundle } from "../generated/schema"
import { Pair as PairTemplate } from "../generated/templates"
import { PairCreated } from "../generated/Factory/Factory"
import {
  FACTORY_ADDRESS,
  ZERO_BD,
  ZERO_BI,
  ONE_BI,
  fetchTokenSymbol,
  fetchTokenName,
  fetchTokenDecimals,
  convertTokenToDecimal,
} from "./utils"
import { Sync } from "../generated/templates/Pair/Pair"

export function handlePairCreated(event: PairCreated): void {
  let factory = SummitFactory.load(FACTORY_ADDRESS)
  if (factory === null) {
    factory = new SummitFactory(FACTORY_ADDRESS)
    factory.totalPairs = ZERO_BI
    factory.totalTransactions = ZERO_BI
    factory.totalVolumeBNB = ZERO_BD
    factory.totalLiquidityBNB = ZERO_BD
    factory.totalVolumeUSD = ZERO_BD
    factory.untrackedVolumeUSD = ZERO_BD
    factory.totalLiquidityUSD = ZERO_BD

    let bundle = new Bundle("1")
    bundle.bnbPrice = ZERO_BD
    bundle.save()
  }
  factory.totalPairs = factory.totalPairs.plus(ONE_BI)
  factory.save()

  let token0 = Token.load(event.params.token0.toHex())
  if (token0 === null) {
    token0 = new Token(event.params.token0.toHex())
    token0.name = fetchTokenName(event.params.token0)
    token0.symbol = fetchTokenSymbol(event.params.token0)
    let decimals = fetchTokenDecimals(event.params.token0)
    if (decimals === null) {
      return
    }
    token0.decimals = decimals
    token0.derivedBNB = ZERO_BD
    token0.derivedUSD = ZERO_BD
    token0.tradeVolume = ZERO_BD
    token0.tradeVolumeUSD = ZERO_BD
    token0.untrackedVolumeUSD = ZERO_BD
    token0.totalLiquidity = ZERO_BD
    token0.totalTransactions = ZERO_BI
    token0.save()
  }

  let token1 = Token.load(event.params.token1.toHex())
  if (token1 === null) {
    token1 = new Token(event.params.token1.toHex())
    token1.name = fetchTokenName(event.params.token1)
    token1.symbol = fetchTokenSymbol(event.params.token1)
    let decimals = fetchTokenDecimals(event.params.token1)
    if (decimals === null) {
      return
    }
    token1.decimals = decimals
    token1.derivedBNB = ZERO_BD
    token1.derivedUSD = ZERO_BD
    token1.tradeVolume = ZERO_BD
    token1.tradeVolumeUSD = ZERO_BD
    token1.untrackedVolumeUSD = ZERO_BD
    token1.totalLiquidity = ZERO_BD
    token1.totalTransactions = ZERO_BI
    token1.save()
  }

  let pair = new Pair(event.params.pair.toHex()) as Pair
  pair.token0 = token0.id
  pair.token1 = token1.id
  pair.name = token0.symbol.concat("-").concat(token1.symbol)
  pair.totalTransactions = ZERO_BI
  pair.reserve0 = ZERO_BD
  pair.reserve1 = ZERO_BD
  pair.trackedReserveBNB = ZERO_BD
  pair.reserveBNB = ZERO_BD
  pair.reserveUSD = ZERO_BD
  pair.totalSupply = ZERO_BD
  pair.volumeToken0 = ZERO_BD
  pair.volumeToken1 = ZERO_BD
  pair.volumeUSD = ZERO_BD
  pair.untrackedVolumeUSD = ZERO_BD
  pair.token0Price = ZERO_BD
  pair.token1Price = ZERO_BD
  pair.block = event.block.number
  pair.timestamp = event.block.timestamp
  pair.save()

  PairTemplate.create(event.params.pair)
}

export function handleSyncBnbBusdPair(event: Sync): void {
  const wbnbAddress = "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c"
  const busdAddress = "0xe9e7cea3dedca5984780bafc599bd69add087d56"

  let token0 = Token.load(wbnbAddress)
  if (token0 === null) {
    token0 = new Token(wbnbAddress)
    token0.name = fetchTokenName(Address.fromString(wbnbAddress))
    token0.symbol = fetchTokenSymbol(Address.fromString(wbnbAddress))
    let decimals = fetchTokenDecimals(Address.fromString(wbnbAddress))
    if (decimals === null) {
      return
    }
    token0.decimals = decimals
    token0.derivedBNB = ZERO_BD
    token0.derivedUSD = ZERO_BD
    token0.tradeVolume = ZERO_BD
    token0.tradeVolumeUSD = ZERO_BD
    token0.untrackedVolumeUSD = ZERO_BD
    token0.totalLiquidity = ZERO_BD
    token0.totalTransactions = ZERO_BI
    token0.save()
  }

  let token1 = Token.load(busdAddress)
  if (token1 === null) {
    token1 = new Token(busdAddress)
    token1.name = fetchTokenName(Address.fromString(busdAddress))
    token1.symbol = fetchTokenSymbol(Address.fromString(busdAddress))
    let decimals = fetchTokenDecimals(Address.fromString(busdAddress))
    if (decimals === null) {
      return
    }
    token1.decimals = decimals
    token1.derivedBNB = ZERO_BD
    token1.derivedUSD = ZERO_BD
    token1.tradeVolume = ZERO_BD
    token1.tradeVolumeUSD = ZERO_BD
    token1.untrackedVolumeUSD = ZERO_BD
    token1.totalLiquidity = ZERO_BD
    token1.totalTransactions = ZERO_BI
    token1.save()
  }

  let pair = Pair.load(event.address.toHex())
  if (pair === null) {
    pair = new Pair(event.address.toHex()) as Pair
    pair.token0 = wbnbAddress
    pair.token1 = busdAddress
    pair.name = "WBNB-BUSD"
    pair.totalTransactions = ZERO_BI
    pair.reserve0 = ZERO_BD
    pair.reserve1 = ZERO_BD
    pair.trackedReserveBNB = ZERO_BD
    pair.reserveBNB = ZERO_BD
    pair.reserveUSD = ZERO_BD
    pair.totalSupply = ZERO_BD
    pair.volumeToken0 = ZERO_BD
    pair.volumeToken1 = ZERO_BD
    pair.volumeUSD = ZERO_BD
    pair.untrackedVolumeUSD = ZERO_BD
    pair.token0Price = ZERO_BD
    pair.token1Price = ZERO_BD
    pair.block = event.block.number
    pair.timestamp = event.block.timestamp
    pair.save()
  }
  pair.reserve0 = convertTokenToDecimal(event.params.reserve0, BigInt.fromI32(18))
  pair.reserve1 = convertTokenToDecimal(event.params.reserve1, BigInt.fromI32(18))
  pair.token0Price = pair.reserve0.div(pair.reserve1)
  pair.token1Price = pair.reserve1.div(pair.reserve0)
  pair.save()
}
