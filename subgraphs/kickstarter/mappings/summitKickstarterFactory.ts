import { BigInt } from "@graphprotocol/graph-ts"
import { SummitKickstarterFactory, Kickstarter, Account } from "../generated/schema"
import { ProjectCreated } from "../generated/SummitKickstarterFactory/SummitKickstarterFactory"
import { Kickstarter as KickstarterTemplate } from "../generated/templates"
import { convertTokenToDecimal, ONE_BI, SUMMIT_KICKSTARTER_FACTORY_ADDRESS, ZERO_BD, ZERO_BI } from "../utils"

export function handleProjectCreated(event: ProjectCreated): void {
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
  summitKickstarterFactory.totalProjectGoals = convertTokenToDecimal(event.params._projectGoals, BigInt.fromI32(18))
  summitKickstarterFactory.save()

  let kickstarter = Kickstarter.load(event.params._kickstarterAddress.toHex())
  if (kickstarter === null) {
    kickstarter = new Kickstarter(event.params._kickstarterAddress.toHex())
    kickstarter.owner = event.params._owner.toHex()
    kickstarter.title = event.params._title
    kickstarter.creator = event.params._creator
    kickstarter.imageUrl = event.params._imageUrl
    kickstarter.projectDescription = event.params._projectDescription
    kickstarter.rewardDescription = event.params._rewardDescription
    kickstarter.minContribution = convertTokenToDecimal(event.params._minContribution, BigInt.fromI32(18))
    kickstarter.totalContribution = ZERO_BD
    kickstarter.totalContributor = ZERO_BI
    kickstarter.projectGoals = convertTokenToDecimal(event.params._projectGoals, BigInt.fromI32(18))
    kickstarter.rewardDistributionTimestamp = event.params._rewardDistributionTimestamp
    kickstarter.hasDistributedRewards = false
    kickstarter.startTimestamp = event.params._startTimestamp
    kickstarter.endTimestamp = event.params._endTimestamp
    kickstarter.createdAt = event.params.timestamp
    kickstarter.save()
  }

  KickstarterTemplate.create(event.params._kickstarterAddress)
}
