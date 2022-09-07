import { BigInt } from "@graphprotocol/graph-ts"
import { SummitKickstarterFactory, Kickstarter, Account } from "../generated/schema"
import { ProjectCreated as ProjectCreatedEvent } from "../generated/SummitKickstarterFactory/SummitKickstarterFactory"
import { Kickstarter as KickstarterTemplate } from "../generated/templates"
import {
  ADDRESS_ZERO,
  convertTokenToDecimal,
  fetchTokenDecimals,
  ONE_BI,
  SUMMIT_KICKSTARTER_FACTORY_ADDRESS,
  ZERO_BD,
  ZERO_BI,
} from "../utils"

export function handleProjectCreated(event: ProjectCreatedEvent): void {
  let summitKickstarterFactory = SummitKickstarterFactory.load(SUMMIT_KICKSTARTER_FACTORY_ADDRESS)
  if (summitKickstarterFactory === null) {
    summitKickstarterFactory = new SummitKickstarterFactory(SUMMIT_KICKSTARTER_FACTORY_ADDRESS)
    summitKickstarterFactory.totalKickstarter = ZERO_BI
    summitKickstarterFactory.totalBackedKickstarter = ZERO_BI
    summitKickstarterFactory.totalProjectGoals = ZERO_BD
    summitKickstarterFactory.totalContribution = ZERO_BD
    summitKickstarterFactory.save()
  }
  summitKickstarterFactory.totalKickstarter = summitKickstarterFactory.totalKickstarter.plus(ONE_BI)
  summitKickstarterFactory.totalProjectGoals = convertTokenToDecimal(
    event.params.kickstarter.projectGoals,
    BigInt.fromI32(18)
  )
  summitKickstarterFactory.save()

  let ownerAccount = Account.load(event.transaction.from.toString())
  if (!ownerAccount) {
    ownerAccount = new Account(event.transaction.from.toString())
    ownerAccount.totalKickstarter = ZERO_BI
    ownerAccount.totalBackedKickstarter = ZERO_BI
    ownerAccount.totalProjectGoals = ZERO_BD
    ownerAccount.totalContribution = ZERO_BD
    ownerAccount.save()
  }

  let kickstarter = Kickstarter.load(event.params.kickstarterAddress.toHex())
  let decimals: BigInt = BigInt.fromI32(18)
  if (event.params.kickstarter.paymentToken.toHex() != ADDRESS_ZERO) {
    decimals = fetchTokenDecimals(event.params.kickstarter.paymentToken)
  }

  if (kickstarter === null) {
    kickstarter = new Kickstarter(event.params.kickstarterAddress.toHex())
    kickstarter.paymentToken = event.params.kickstarter.paymentToken.toHex()
    kickstarter.approvalStatus = ZERO_BI
    kickstarter.owner = event.transaction.from.toString()
    kickstarter.title = event.params.kickstarter.title
    kickstarter.creator = event.params.kickstarter.creator
    kickstarter.imageUrl = event.params.kickstarter.imageUrl
    kickstarter.projectDescription = event.params.kickstarter.projectDescription
    kickstarter.rewardDescription = event.params.kickstarter.rewardDescription
    kickstarter.minContribution = convertTokenToDecimal(event.params.kickstarter.minContribution, decimals)
    kickstarter.totalContribution = ZERO_BD
    kickstarter.totalContributor = ZERO_BI
    kickstarter.projectGoals = convertTokenToDecimal(event.params.kickstarter.projectGoals, decimals)
    kickstarter.rewardDistributionTimestamp = event.params.kickstarter.rewardDistributionTimestamp
    kickstarter.startTimestamp = event.params.kickstarter.startTimestamp
    kickstarter.endTimestamp = event.params.kickstarter.endTimestamp
    kickstarter.percentageFeeAmount = ZERO_BI
    kickstarter.fixFeeAmount = ZERO_BD
    kickstarter.rejectedReason = ""
    kickstarter.createdAt = event.block.timestamp
    kickstarter.save()
  }

  KickstarterTemplate.create(event.params.kickstarterAddress)
}
