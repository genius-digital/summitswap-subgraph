/* eslint-disable prefer-const */
import { BigInt } from "@graphprotocol/graph-ts"
import { SummitKickstarterFactory, Kickstarter, Account, Contribution } from "../generated/schema"
import { Contribute, Refund } from "../generated/SummitKickstarterFactory/SummitKickstarter"
import { convertTokenToDecimal, ONE_BI, SUMMIT_KICKSTARTER_FACTORY_ADDRESS, ZERO_BD, ZERO_BI } from "../utils"

export function handleContribute(event: Contribute): void {
  let contribution = new Contribution(event.transaction.hash.toHex())
  contribution.kickstarter = event.address.toHex()
  contribution.contributor = event.params.contributor.toHex()
  contribution.amount = convertTokenToDecimal(event.params.amount, BigInt.fromI32(18))
  contribution.createdAt = event.params.timestamp
  contribution.save()

  let account = Account.load(event.params.contributor.toHex())
  if (!account) {
    account = new Account(event.params.contributor.toHex())
    account.totalKickstarter = ZERO_BI
    account.totalProjectGoals = ZERO_BD
    account.totalContribution = ZERO_BD
    account.totalRefund = ZERO_BD
    account.save()
  }
  account.totalContribution = account.totalContribution.plus(contribution.amount)
  account.save()

  let kickstarter = Kickstarter.load(event.address.toHex())
  kickstarter!.totalContribution = kickstarter!.totalContribution.plus(contribution.amount)
  kickstarter!.save()

  let summitKickstarterFactory = SummitKickstarterFactory.load(SUMMIT_KICKSTARTER_FACTORY_ADDRESS)
  summitKickstarterFactory!.totalContribution = summitKickstarterFactory!.totalContribution.plus(contribution.amount)
  summitKickstarterFactory!.save()
}

export function handleRefund(event: Refund): void {
  console.log("handleRefund")
}
