/* eslint-disable prefer-const */
import { BigInt, BigDecimal, Address } from "@graphprotocol/graph-ts"
import { SummitWhitelabelNft } from "../generated/SummitWhitelabelNftFactory/SummitWhitelabelNft"

export let SUMMIT_WHITELABEL_NFT_FACTORY_ADDRESS = "0x825b51df8d9efe9d089723bc03c267372c2271ff"
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

export function fetchPhase(whitelabelNftAddress: Address): number {
  let contract = SummitWhitelabelNft.bind(whitelabelNftAddress)
  let tokenInfoValue = 0
  let tokenInfoResult = contract.try_tokenInfo()
  if (!tokenInfoResult.reverted) {
    tokenInfoValue = tokenInfoResult.value.value7
  }
  return tokenInfoValue
}

export function fetchBalanceOf(whitelabelNftAddress: Address, owner: Address): number {
  let contract = SummitWhitelabelNft.bind(whitelabelNftAddress)
  let balanceValue = 0
  let balanceResult = contract.try_balanceOf(owner)
  if (!balanceResult.reverted) {
    balanceValue = balanceResult.value.toI32()
  }
  return balanceValue
}
