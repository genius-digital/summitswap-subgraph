/* eslint-disable prefer-const */
import { BigDecimal } from "@graphprotocol/graph-ts"
import { Pair, Token, Bundle, PancakePair, PancakeToken } from "../generated/schema"
import { Sync } from "../generated/templates/SummitPair/Pair"
import { getBnbPriceInUSD, findSummitBnbPerToken, findPancakeBnbPerToken } from "./pricing"
import { convertTokenToDecimal, ZERO_BD } from "./utils"

export function handleSummitSync(event: Sync): void {
  let pair = Pair.load(event.address.toHex())
  let token0 = Token.load(pair.token0)
  let token1 = Token.load(pair.token1)

  pair.reserve0 = convertTokenToDecimal(event.params.reserve0, token0.decimals)
  pair.reserve1 = convertTokenToDecimal(event.params.reserve1, token1.decimals)

  if (pair.reserve1.notEqual(ZERO_BD)) pair.token0Price = pair.reserve0.div(pair.reserve1)
  else pair.token0Price = ZERO_BD
  if (pair.reserve0.notEqual(ZERO_BD)) pair.token1Price = pair.reserve1.div(pair.reserve0)
  else pair.token1Price = ZERO_BD

  let bundle = Bundle.load("1")
  bundle.bnbPrice = getBnbPriceInUSD()
  bundle.save()

  let t0DerivedBNB = findSummitBnbPerToken(token0 as Token)
  token0.derivedBNB = t0DerivedBNB
  token0.derivedUSD = t0DerivedBNB.times(bundle.bnbPrice)
  token0.save()

  let t1DerivedBNB = findSummitBnbPerToken(token1 as Token)
  token1.derivedBNB = t1DerivedBNB
  token1.derivedUSD = t1DerivedBNB.times(bundle.bnbPrice)
  token1.save()

  // use derived amounts within pair
  pair.reserveBNB = pair.reserve0
    .times(token0.derivedBNB as BigDecimal)
    .plus(pair.reserve1.times(token1.derivedBNB as BigDecimal))
  pair.reserveUSD = pair.reserveBNB.times(bundle.bnbPrice)

  // save entities
  pair.save()
  token0.save()
  token1.save()
}

export function handlePancakeSync(event: Sync): void {
  let pair = PancakePair.load(event.address.toHex())
  let token0 = PancakeToken.load(pair.token0)
  let token1 = PancakeToken.load(pair.token1)

  pair.reserve0 = convertTokenToDecimal(event.params.reserve0, token0.decimals)
  pair.reserve1 = convertTokenToDecimal(event.params.reserve1, token1.decimals)

  if (pair.reserve1.notEqual(ZERO_BD)) pair.token0Price = pair.reserve0.div(pair.reserve1)
  else pair.token0Price = ZERO_BD
  if (pair.reserve0.notEqual(ZERO_BD)) pair.token1Price = pair.reserve1.div(pair.reserve0)
  else pair.token1Price = ZERO_BD

  let bundle = Bundle.load("1")
  bundle.bnbPrice = getBnbPriceInUSD()
  bundle.save()

  let t0DerivedBNB = findPancakeBnbPerToken(token0 as PancakeToken)
  token0.derivedBNB = t0DerivedBNB
  token0.derivedUSD = t0DerivedBNB.times(bundle.bnbPrice)
  token0.save()

  let t1DerivedBNB = findPancakeBnbPerToken(token1 as PancakeToken)
  token1.derivedBNB = t1DerivedBNB
  token1.derivedUSD = t1DerivedBNB.times(bundle.bnbPrice)
  token1.save()

  // use derived amounts within pair
  pair.reserveBNB = pair.reserve0
    .times(token0.derivedBNB as BigDecimal)
    .plus(pair.reserve1.times(token1.derivedBNB as BigDecimal))
  pair.reserveUSD = pair.reserveBNB.times(bundle.bnbPrice)

  // save entities
  pair.save()
  token0.save()
  token1.save()
}
