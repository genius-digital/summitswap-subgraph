/* eslint-disable prefer-const */
import { BigDecimal, Address, BigInt } from "@graphprotocol/graph-ts/index"
import { Pair, Token, Bundle } from "../generated/schema"
import { ZERO_BD, factoryContract, ADDRESS_ZERO, ONE_BD, fetchPairReserves, convertTokenToDecimal } from "./utils"

let WBNB_ADDRESS = "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c"
let BUSD_WBNB_PAIR = "0x58f876857a02d6762e0101bb5c46a8c1ed44dc16" // created block 589414
let USDT_WBNB_PAIR = "0x16b9a82891338f9ba80e2d6970fdda79d1eb0dae" // created block 648115

export function getBnbPriceInUSD(): BigDecimal {
  // fetch eth prices for each stablecoin
  let usdtReserves = fetchPairReserves(Address.fromString(USDT_WBNB_PAIR))
  let usdtReserve0 = ZERO_BD
  let usdtReserve1 = ZERO_BD
  let usdtPairPrice0 = ZERO_BD
  let usdtPairPrice1 = ZERO_BD

  if (usdtReserves.length > 0) {
    usdtReserve0 = convertTokenToDecimal(usdtReserves[0], BigInt.fromI32(18))
    usdtReserve1 = convertTokenToDecimal(usdtReserves[1], BigInt.fromI32(18))

    if (usdtReserve1.notEqual(ZERO_BD)) usdtPairPrice0 = usdtReserve0.div(usdtReserve1)
    else usdtPairPrice0 = ZERO_BD
    if (usdtReserve0.notEqual(ZERO_BD)) usdtPairPrice1 = usdtReserve1.div(usdtReserve0)
    else usdtPairPrice1 = ZERO_BD
  }

  let busdReserves = fetchPairReserves(Address.fromString(BUSD_WBNB_PAIR))
  let busdReserve0 = ZERO_BD
  let busdReserve1 = ZERO_BD
  let busdPairPrice0 = ZERO_BD
  let busdPairPrice1 = ZERO_BD

  if (busdReserves.length > 0) {
    busdReserve0 = convertTokenToDecimal(busdReserves[0], BigInt.fromI32(18))
    busdReserve1 = convertTokenToDecimal(busdReserves[1], BigInt.fromI32(18))

    if (busdReserve1.notEqual(ZERO_BD)) busdPairPrice0 = busdReserve0.div(busdReserve1)
    else busdPairPrice0 = ZERO_BD
    if (busdReserve0.notEqual(ZERO_BD)) busdPairPrice1 = busdReserve1.div(busdReserve0)
    else busdPairPrice1 = ZERO_BD
  }

  if (usdtReserves.length > 0 && busdReserves.length > 0) {
    let totalLiquidityBNB = busdReserve0.plus(usdtReserve1)
    if (totalLiquidityBNB.notEqual(ZERO_BD)) {
      let busdWeight = busdReserve0.div(totalLiquidityBNB)
      let usdtWeight = usdtReserve1.div(totalLiquidityBNB)
      return busdPairPrice1.times(busdWeight).plus(usdtPairPrice0.times(usdtWeight))
    } else {
      return ZERO_BD
    }
  } else if (busdReserves.length > 0) {
    return busdPairPrice1
  } else if (usdtReserves.length > 0) {
    return usdtPairPrice0
  } else {
    return ZERO_BD
  }
}

// token where amounts should contribute to tracked volume and liquidity
let WHITELIST: string[] = [
  "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c", // WBNB
  "0xe9e7cea3dedca5984780bafc599bd69add087d56", // BUSD
  "0x55d398326f99059ff775485246999027b3197955", // USDT
  "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d", // USDC
  "0x23396cf899ca06c4472205fc903bdb4de249d6fc", // UST
  "0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c", // BTCB
  "0x2170ed0880ac9a755fd29b2688956bd959f933f8", // WETH
  "0x8094e772fa4a60bdeb1dfec56ab040e17dd608d5", // KODA
]

// minimum liquidity for price to get tracked
let MINIMUM_LIQUIDITY_THRESHOLD_BNB = BigDecimal.fromString("10")

/**
 * Search through graph to find derived BNB per token.
 * @todo update to be derived BNB (add stablecoin estimates)
 **/
export function findBnbPerToken(token: Token): BigDecimal {
  if (token.id == WBNB_ADDRESS) {
    return ONE_BD
  }
  // loop through whitelist and check if paired with any
  for (let i = 0; i < WHITELIST.length; ++i) {
    let pairAddress = factoryContract.getPair(Address.fromString(token.id), Address.fromString(WHITELIST[i]))
    if (pairAddress.toHex() != ADDRESS_ZERO) {
      let pair = Pair.load(pairAddress.toHex())
      if (pair.token0 == token.id && pair.reserveBNB.gt(MINIMUM_LIQUIDITY_THRESHOLD_BNB)) {
        let token1 = Token.load(pair.token1)
        return pair.token1Price.times(token1.derivedBNB as BigDecimal) // return token1 per our token * BNB per token 1
      }
      if (pair.token1 == token.id && pair.reserveBNB.gt(MINIMUM_LIQUIDITY_THRESHOLD_BNB)) {
        let token0 = Token.load(pair.token0)
        return pair.token0Price.times(token0.derivedBNB as BigDecimal) // return token0 per our token * BNB per token 0
      }
    }
  }
  return ZERO_BD // nothing was found return 0
}

/**
 * Accepts tokens and amounts, return tracked amount based on token whitelist
 * If one token on whitelist, return amount in that token converted to USD.
 * If both are, return average of two amounts
 * If neither is, return 0
 */
export function getTrackedVolumeUSD(
  bundle: Bundle,
  tokenAmount0: BigDecimal,
  token0: Token,
  tokenAmount1: BigDecimal,
  token1: Token
): BigDecimal {
  let price0 = token0.derivedBNB.times(bundle.bnbPrice)
  let price1 = token1.derivedBNB.times(bundle.bnbPrice)

  // both are whitelist tokens, take average of both amounts
  if (WHITELIST.includes(token0.id) && WHITELIST.includes(token1.id)) {
    return tokenAmount0.times(price0).plus(tokenAmount1.times(price1)).div(BigDecimal.fromString("2"))
  }

  // take full value of the whitelisted token amount
  if (WHITELIST.includes(token0.id) && !WHITELIST.includes(token1.id)) {
    return tokenAmount0.times(price0)
  }

  // take full value of the whitelisted token amount
  if (!WHITELIST.includes(token0.id) && WHITELIST.includes(token1.id)) {
    return tokenAmount1.times(price1)
  }

  // neither token is on white list, tracked volume is 0
  return ZERO_BD
}

/**
 * Accepts tokens and amounts, return tracked amount based on token whitelist
 * If one token on whitelist, return amount in that token converted to USD * 2.
 * If both are, return sum of two amounts
 * If neither is, return 0
 */
export function getTrackedLiquidityUSD(
  bundle: Bundle,
  tokenAmount0: BigDecimal,
  token0: Token,
  tokenAmount1: BigDecimal,
  token1: Token
): BigDecimal {
  let price0 = token0.derivedBNB.times(bundle.bnbPrice)
  let price1 = token1.derivedBNB.times(bundle.bnbPrice)

  // both are whitelist tokens, take average of both amounts
  if (WHITELIST.includes(token0.id) && WHITELIST.includes(token1.id)) {
    return tokenAmount0.times(price0).plus(tokenAmount1.times(price1))
  }

  // take double value of the whitelisted token amount
  if (WHITELIST.includes(token0.id) && !WHITELIST.includes(token1.id)) {
    return tokenAmount0.times(price0).times(BigDecimal.fromString("2"))
  }

  // take double value of the whitelisted token amount
  if (!WHITELIST.includes(token0.id) && WHITELIST.includes(token1.id)) {
    return tokenAmount1.times(price1).times(BigDecimal.fromString("2"))
  }

  // neither token is on white list, tracked volume is 0
  return ZERO_BD
}
