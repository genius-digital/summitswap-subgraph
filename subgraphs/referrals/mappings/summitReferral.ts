/* eslint-disable prefer-const */
import { BigDecimal } from "@graphprotocol/graph-ts"
import { SummitReferral, Account, Token, ReferralRecorded, ReferralReward } from "../generated/schema"
import {
  ReferralRecorded as ReferralRecordedEvent,
  ReferralReward as ReferralRewardEvent,
} from "../generated/SummitReferral/SummitReferral"
import {
  convertTokenToDecimal,
  fetchTokenDecimals,
  fetchTokenName,
  fetchTokenSymbol,
  ZERO_BI,
  ONE_BI,
  ZERO_BD,
  REFERRAL_ADDRESS,
} from "./utils"

export function handleReferralRecorded(event: ReferralRecordedEvent): void {
  let referrer = Account.load(event.params.referrer.toHex())
  if (referrer === null) {
    referrer = new Account(event.params.referrer.toHex())
    referrer.tokens = []
    referrer.totalReferees = ZERO_BI
    referrer.totalRewardUSD = ZERO_BD
    referrer.totalRewardBNB = ZERO_BD
  }
  referrer.totalReferees = referrer.totalReferees.plus(ONE_BI)
  referrer.save()

  let referee = Account.load(event.params.referee.toHex())
  if (referee === null) {
    referee = new Account(event.params.referee.toHex())
    referee.tokens = []
    referee.totalReferees = ZERO_BI
    referee.totalRewardUSD = ZERO_BD
    referee.totalRewardBNB = ZERO_BD
  }
  let referredToken = referee.tokens
  referredToken.push(event.params.outputToken.toHex())
  referee.tokens = referredToken
  referee.save()

  let outputToken = Token.load(event.params.outputToken.toHex())
  if (outputToken === null) {
    outputToken = new Token(event.params.outputToken.toHex())
    outputToken.name = fetchTokenName(event.params.outputToken)
    outputToken.symbol = fetchTokenSymbol(event.params.outputToken)
    outputToken.decimals = fetchTokenDecimals(event.params.outputToken)
    outputToken.totalRewardUSD = ZERO_BD
    outputToken.totalRewardBNB = ZERO_BD
  }
  outputToken.save()

  let referralRecorded = ReferralRecorded.load(event.transaction.hash.toHex())
  if (referralRecorded === null) {
    referralRecorded = new ReferralRecorded(event.transaction.hash.toHex())
    referralRecorded.timestamp = event.block.timestamp
    referralRecorded.referee = referee.id
    referralRecorded.referrer = referrer.id
    referralRecorded.outputToken = outputToken.id
  }
  referralRecorded.save()

  let summitReferral = SummitReferral.load(REFERRAL_ADDRESS)
  if (summitReferral === null) {
    summitReferral = new SummitReferral(REFERRAL_ADDRESS)
    summitReferral.totalReferees = ZERO_BI
    summitReferral.totalRewardUSD = ZERO_BD
    summitReferral.totalRewardBNB = ZERO_BD
  }
  summitReferral.totalReferees = summitReferral.totalReferees.plus(ONE_BI)
  summitReferral.save()
}

export function handleReferralReward(event: ReferralRewardEvent): void {
  let referrer = Account.load(event.params.referrer.toHex())
  if (referrer === null) {
    referrer = new Account(event.params.referrer.toHex())
    referrer.tokens = []
    referrer.totalReferees = ZERO_BI
    referrer.totalRewardUSD = ZERO_BD
    referrer.totalRewardBNB = ZERO_BD
  }

  let lead = Account.load(event.params.lead.toHex())
  if (lead === null) {
    lead = new Account(event.params.lead.toHex())
    lead.tokens = []
    lead.totalReferees = ZERO_BI
    lead.totalRewardUSD = ZERO_BD
    lead.totalRewardBNB = ZERO_BD
  }

  let inputToken = Token.load(event.params.inputToken.toHex())
  if (inputToken === null) {
    inputToken = new Token(event.params.inputToken.toHex())
    inputToken.name = fetchTokenName(event.params.inputToken)
    inputToken.symbol = fetchTokenSymbol(event.params.inputToken)
    inputToken.decimals = fetchTokenDecimals(event.params.inputToken)
    inputToken.totalTokenAsOutput = ZERO_BD
    inputToken.totalTokenAsReward = ZERO_BD
    inputToken.totalRewardUSD = ZERO_BD
    inputToken.totalRewardBNB = ZERO_BD
  }
  inputToken.save()

  let outputToken = Token.load(event.params.outputToken.toHex())
  if (outputToken === null) {
    outputToken = new Token(event.params.outputToken.toHex())
    outputToken.name = fetchTokenName(event.params.outputToken)
    outputToken.symbol = fetchTokenSymbol(event.params.outputToken)
    outputToken.decimals = fetchTokenDecimals(event.params.outputToken)
    outputToken.totalTokenAsOutput = ZERO_BD
    outputToken.totalTokenAsReward = ZERO_BD
    outputToken.totalRewardUSD = ZERO_BD
    outputToken.totalRewardBNB = ZERO_BD
  }

  let summitReferral = SummitReferral.load(REFERRAL_ADDRESS)
  if (summitReferral === null) {
    summitReferral = new SummitReferral(REFERRAL_ADDRESS)
    summitReferral.totalReferees = ZERO_BI
    summitReferral.totalRewardUSD = ZERO_BD
    summitReferral.totalRewardBNB = ZERO_BD
  }

  let referrerReward = convertTokenToDecimal(event.params.referrerReward, outputToken.decimals)
  let referrerRewardInBNB = referrerReward.times(outputToken.derivedBNB as BigDecimal)
  let referrerRewardInUSD = referrerReward.times(outputToken.derivedUSD as BigDecimal)

  let leadReward = convertTokenToDecimal(event.params.leadReward, outputToken.decimals)
  let leadRewardInBNB = leadReward.times(outputToken.derivedBNB as BigDecimal)
  let leadRewardInUSD = leadReward.times(outputToken.derivedUSD as BigDecimal)

  let devReward = convertTokenToDecimal(event.params.devReward, outputToken.decimals)
  let devRewardInBNB = devReward.times(outputToken.derivedBNB as BigDecimal)
  let devRewardInUSD = devReward.times(outputToken.derivedUSD as BigDecimal)

  let outputTokenAmount = convertTokenToDecimal(event.params.outputTokenAmount, outputToken.decimals)

  let referralReward = ReferralReward.load(event.transaction.hash.toHex())
  if (referralReward === null) {
    referralReward = new ReferralReward(event.transaction.hash.toHex())
    referralReward.referee = event.transaction.from.toHex()
    referralReward.referrer = referrer.id
    referralReward.leadInf = lead.id
    referralReward.timestamp = event.block.timestamp

    referralReward.inputToken = inputToken.id
    referralReward.inputTokenAmount = convertTokenToDecimal(event.params.inputTokenAmount, inputToken.decimals)
    referralReward.outputToken = outputToken.id
    referralReward.outputTokenAmount = outputTokenAmount

    referralReward.referrerReward = referrerReward
    referralReward.leadReward = leadReward
    referralReward.devReward = devReward
  }
  referralReward.save()

  let referrerRewards = referrer.referralRewards
  referrerRewards.push(referralReward.id)
  referrer.referralRewards = referrerRewards
  referrer.totalRewardBNB = referrer.totalRewardBNB.plus(referrerRewardInBNB)
  referrer.totalRewardUSD = referrer.totalRewardUSD.plus(referrerRewardInUSD)
  referrer.save()

  let leadRewards = lead.referralRewards
  leadRewards.push(referralReward.id)
  lead.referralRewards = leadRewards
  lead.totalRewardBNB = lead.totalRewardBNB.plus(leadRewardInBNB)
  lead.totalRewardUSD = lead.totalRewardUSD.plus(leadRewardInUSD)
  lead.save()

  let totalReward = referrerReward.plus(leadReward).plus(devReward)
  let totalRewardInBNB = referrerRewardInBNB.plus(leadRewardInBNB).plus(devRewardInBNB)
  let totalRewardInUSD = referrerRewardInUSD.plus(leadRewardInUSD).plus(devRewardInUSD)

  outputToken.totalTokenAsOutput = outputToken.totalTokenAsOutput.plus(outputTokenAmount)
  outputToken.totalTokenAsReward = outputToken.totalTokenAsReward.plus(totalReward)
  outputToken.totalRewardUSD = outputToken.totalRewardUSD.plus(totalRewardInUSD)
  outputToken.totalRewardBNB = outputToken.totalRewardBNB.plus(totalRewardInBNB)
  outputToken.save()

  summitReferral.totalRewardUSD = totalRewardInBNB
  summitReferral.totalRewardBNB = totalRewardInUSD
  summitReferral.save()
}
