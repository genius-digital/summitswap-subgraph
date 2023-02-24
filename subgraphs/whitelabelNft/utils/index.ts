/* eslint-disable prefer-const */
import { BigDecimal, BigInt } from "@graphprotocol/graph-ts"

export let SUMMIT_WHITELABEL_NFT_FACTORY_ADDRESS = "0x1549d28F1c56A23864D63f5b00Ad1aeA1c7609A4"
export let ADDRESS_ZERO = "0x0000000000000000000000000000000000000000"

export let ZERO_BI = BigInt.fromI32(0)
export let ONE_BI = BigInt.fromI32(1)
export let ZERO_BD = BigDecimal.fromString("0")
export let ONE_BD = BigDecimal.fromString("1")
export let BI_18 = BigInt.fromI32(18)

export function exponentToBigDecimal(decimals: BigInt): BigDecimal {
  let bd = BigDecimal.fromString("1")
  for (let i = ZERO_BI; i.lt(decimals as BigInt); i = i.plus(ONE_BI)) {
    bd = bd.times(BigDecimal.fromString("10"))
  }
  return bd
}

export function convertTokenToDecimal(tokenAmount: BigInt, exchangeDecimals: BigInt): BigDecimal {
  if (exchangeDecimals == ZERO_BI) {
    return tokenAmount.toBigDecimal()
  }
  return tokenAmount.toBigDecimal().div(exponentToBigDecimal(exchangeDecimals))
}
