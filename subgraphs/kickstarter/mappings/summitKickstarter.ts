/* eslint-disable prefer-const */
import { BigInt } from "@graphprotocol/graph-ts"
import { SummitKickstarterFactory, Kickstarter, Account, Contribution, Refund } from "../generated/schema"
import {
  OwnershipTransferred as OwnershipTransferredEvent,
  Contribute as ContributeEvent,
  Refund as RefundEvent,
  TitleUpdated as TitleUpdatedEvent,
  CreatorUpdated as CreatorUpdatedEvent,
  ProjectDescriptionUpdated as ProjectDescriptionUpdatedEvent,
  RewardDescriptionUpdated as RewardDescriptionUpdatedEvent,
  MinContributionUpdated as MinContributionUpdatedEvent,
  ProjectGoalsUpdated as ProjectGoalsUpdatedEvent,
  RewardDistributionTimestampUpdated as RewardDistributionTimestampUpdatedEvent,
  StartTimestampUpdated as StartTimestampUpdatedEvent,
  EndTimestampUpdated as EndTimestampUpdatedEvent,
  HasDistributedRewardsUpdated as HasDistributedRewardsUpdatedEvent,
  KickstarterUpdated as KickstarterUpdatedEvent,
} from "../generated/SummitKickstarterFactory/SummitKickstarter"
import {
  convertTokenToDecimal,
  SUMMIT_KICKSTARTER_FACTORY_ADDRESS,
  ZERO_BD,
  ZERO_BI,
  ONE_BI,
  ADDRESS_ZERO,
} from "../utils"

export function handleOwnershipTransferred(event: OwnershipTransferredEvent): void {
  let kickstarter = Kickstarter.load(event.address.toHex())
  let previousAccount = Account.load(event.params.previousOwner.toHex())
  if (!previousAccount) {
    previousAccount = new Account(event.params.previousOwner.toHex())
    previousAccount.totalKickstarter = ZERO_BI
    previousAccount.totalProjectGoals = ZERO_BD
    previousAccount.totalContribution = ZERO_BD
    previousAccount.totalRefund = ZERO_BD
    previousAccount.save()
  }

  let newAccount = Account.load(event.params.newOwner.toHex())
  if (!newAccount) {
    newAccount = new Account(event.params.newOwner.toHex())
    newAccount.totalKickstarter = ZERO_BI
    newAccount.totalProjectGoals = ZERO_BD
    newAccount.totalContribution = ZERO_BD
    newAccount.totalRefund = ZERO_BD
    newAccount.save()
  }

  if (newAccount.id != ADDRESS_ZERO) {
    newAccount.totalKickstarter = newAccount.totalKickstarter.plus(ONE_BI)
    newAccount.totalProjectGoals = newAccount.totalProjectGoals.plus(kickstarter!.projectGoals)
    newAccount.save()
  }

  if (previousAccount.id != ADDRESS_ZERO) {
    previousAccount!.totalKickstarter = previousAccount!.totalKickstarter.minus(ONE_BI)
    previousAccount!.totalProjectGoals = previousAccount!.totalProjectGoals.minus(kickstarter!.projectGoals)
    previousAccount!.save()
  }

  kickstarter!.owner = event.params.newOwner.toHex()
  kickstarter!.save()
}

export function handleContribute(event: ContributeEvent): void {
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

export function handleRefund(event: RefundEvent): void {
  let refund = new Refund(event.transaction.hash.toHex())
  refund.kickstarter = event.address.toHex()
  refund.contributor = event.params.contributor.toHex()
  refund.amount = convertTokenToDecimal(event.params.amount, BigInt.fromI32(18))
  refund.createdAt = event.params.timestamp
  refund.save()

  let account = Account.load(event.params.contributor.toHex())
  if (!account) {
    account = new Account(event.params.contributor.toHex())
    account.totalKickstarter = ZERO_BI
    account.totalProjectGoals = ZERO_BD
    account.totalContribution = ZERO_BD
    account.totalRefund = ZERO_BD
    account.save()
  }
  account.totalRefund = account.totalRefund.plus(refund.amount)
  account.save()

  let kickstarter = Kickstarter.load(event.address.toHex())
  kickstarter!.totalContribution = kickstarter!.totalContribution.minus(refund.amount)
  kickstarter!.save()

  let summitKickstarterFactory = SummitKickstarterFactory.load(SUMMIT_KICKSTARTER_FACTORY_ADDRESS)
  summitKickstarterFactory!.totalRefund = summitKickstarterFactory!.totalRefund.plus(refund.amount)
  summitKickstarterFactory!.save()
}

export function handleTitleUpdated(event: TitleUpdatedEvent): void {
  let kickstarter = Kickstarter.load(event.address.toHex())
  kickstarter!.title = event.params.newTitle
  kickstarter!.save()
}

export function handleCreatorUpdated(event: CreatorUpdatedEvent): void {
  let kickstarter = Kickstarter.load(event.address.toHex())
  kickstarter!.creator = event.params.newCreator
  kickstarter!.save()
}

export function handleProjectDescriptionUpdated(event: ProjectDescriptionUpdatedEvent): void {
  let kickstarter = Kickstarter.load(event.address.toHex())
  kickstarter!.projectDescription = event.params.newProjectDescription
  kickstarter!.save()
}

export function handleRewardDescriptionUpdated(event: RewardDescriptionUpdatedEvent): void {
  let kickstarter = Kickstarter.load(event.address.toHex())
  kickstarter!.rewardDescription = event.params.newRewardDescription
  kickstarter!.save()
}

export function handleMinContributionUpdated(event: MinContributionUpdatedEvent): void {
  let kickstarter = Kickstarter.load(event.address.toHex())
  kickstarter!.minContribution = convertTokenToDecimal(event.params.newMinContribution, BigInt.fromI32(18))
  kickstarter!.save()
}

export function handleProjectGoalsUpdated(event: ProjectGoalsUpdatedEvent): void {
  let kickstarter = Kickstarter.load(event.address.toHex())

  let account = Account.load(kickstarter!.owner)
  account!.totalProjectGoals = account!.totalProjectGoals.minus(kickstarter!.projectGoals)

  kickstarter!.projectGoals = convertTokenToDecimal(event.params.newProjectGoals, BigInt.fromI32(18))
  kickstarter!.save()

  account!.totalProjectGoals = account!.totalProjectGoals.plus(kickstarter!.projectGoals)
  account!.save()
}

export function handleRewardDistributionTimestampUpdated(event: RewardDistributionTimestampUpdatedEvent): void {
  let kickstarter = Kickstarter.load(event.address.toHex())
  kickstarter!.rewardDistributionTimestamp = event.params.newRewardDistributionTimestamp
  kickstarter!.save()
}

export function handleStartTimestampUpdated(event: StartTimestampUpdatedEvent): void {
  let kickstarter = Kickstarter.load(event.address.toHex())
  kickstarter!.startTimestamp = event.params.newStartTimestamp
  kickstarter!.save()
}

export function handleEndTimestampUpdated(event: EndTimestampUpdatedEvent): void {
  let kickstarter = Kickstarter.load(event.address.toHex())
  kickstarter!.endTimestamp = event.params.newEndTimestamp
  kickstarter!.save()
}

export function handleHasDistributedRewardsUpdated(event: HasDistributedRewardsUpdatedEvent): void {
  let kickstarter = Kickstarter.load(event.address.toHex())
  kickstarter!.hasDistributedRewards = event.params.newHasDistributedRewards
  kickstarter!.save()
}

export function handleKickstarterUpdated(event: KickstarterUpdatedEvent): void {
  let kickstarter = Kickstarter.load(event.address.toHex())

  let account = Account.load(kickstarter!.owner)
  account!.totalProjectGoals = account!.totalProjectGoals.minus(kickstarter!.projectGoals)

  kickstarter!.title = event.params.newTitle
  kickstarter!.creator = event.params.newCreator
  kickstarter!.projectDescription = event.params.newProjectDescription
  kickstarter!.rewardDescription = event.params.newRewardDescription
  kickstarter!.minContribution = convertTokenToDecimal(event.params.newMinContribution, BigInt.fromI32(18))
  kickstarter!.projectGoals = convertTokenToDecimal(event.params.newProjectGoals, BigInt.fromI32(18))
  kickstarter!.rewardDistributionTimestamp = event.params.newRewardDistributionTimestamp
  kickstarter!.startTimestamp = event.params.newStartTimestamp
  kickstarter!.endTimestamp = event.params.newEndTimestamp
  kickstarter!.hasDistributedRewards = event.params.newHasDistributedRewards
  kickstarter!.save()

  account!.totalProjectGoals = account!.totalProjectGoals.plus(kickstarter!.projectGoals)
  account!.save()
}
