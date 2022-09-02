/* eslint-disable prefer-const */
import { BigInt } from "@graphprotocol/graph-ts"
import { SummitKickstarterFactory, Kickstarter, Account, Contribution, BackedKickstarter } from "../generated/schema"
import {
  Approved as ApprovedEvent,
  Contribute as ContributeEvent,
  CreatorUpdated as CreatorUpdatedEvent,
  EndTimestampUpdated as EndTimestampUpdatedEvent,
  FixFeeAmountUpdated as FixFeeAmountUpdatedEvent,
  ImageUrlUpdated as ImageUrlUpdatedEvent,
  KickstarterUpdated as KickstarterUpdatedEvent,
  KickstarterUpdatedByFactoryAdmin as KickstarterUpdatedByFactoryAdminEvent,
  MinContributionUpdated as MinContributionUpdatedEvent,
  OwnershipTransferred as OwnershipTransferredEvent,
  PercentageFeeAmountUpdated as PercentageFeeAmountUpdatedEvent,
  ProjectDescriptionUpdated as ProjectDescriptionUpdatedEvent,
  ProjectGoalsUpdated as ProjectGoalsUpdatedEvent,
  Rejected as RejectedEvent,
  RewardDescriptionUpdated as RewardDescriptionUpdatedEvent,
  RewardDistributionTimestampUpdated as RewardDistributionTimestampUpdatedEvent,
  StartTimestampUpdated as StartTimestampUpdatedEvent,
  StatusUpdated as StatusUpdatedEvent,
  TitleUpdated as TitleUpdatedEvent,
} from "../generated/SummitKickstarterFactory/SummitKickstarter"
import {
  convertTokenToDecimal,
  SUMMIT_KICKSTARTER_FACTORY_ADDRESS,
  ZERO_BD,
  ZERO_BI,
  ONE_BI,
  ADDRESS_ZERO,
  fetchTokenDecimals,
} from "../utils"

export function handleApproved(event: ApprovedEvent): void {
  let kickstarter = Kickstarter.load(event.address.toHex())
  let decimals: BigInt = BigInt.fromI32(18)
  if (kickstarter!.paymentToken != ADDRESS_ZERO) {
    decimals = fetchTokenDecimals(event.address)
  }
  kickstarter!.status = BigInt.fromI32(1)
  kickstarter!.rejectReason = ""
  kickstarter!.fixFeeAmount = convertTokenToDecimal(event.params.fixFeeAmount, decimals)
  kickstarter!.percentageFeeAmount = event.params.percentageFeeAmount
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
    account.totalBackedKickstarter = ZERO_BI
    account.totalProjectGoals = ZERO_BD
    account.totalContribution = ZERO_BD
    account.save()
  }
  account.totalContribution = account.totalContribution.plus(contribution.amount)
  account.save()

  let kickstarter = Kickstarter.load(event.address.toHex())
  kickstarter!.totalContribution = kickstarter!.totalContribution.plus(contribution.amount)
  kickstarter!.save()

  let backedProject = BackedKickstarter.load(event.address.toHex() + "-" + event.params.contributor.toHex())
  if (!backedProject) {
    backedProject = new BackedKickstarter(event.address.toHex() + "-" + event.params.contributor.toHex())
    backedProject.kickstarter = event.address.toHex()
    backedProject.contributor = event.params.contributor.toHex()
    backedProject.amount = ZERO_BD
    backedProject.lastUpdated = event.block.timestamp
    backedProject.save()

    account.totalBackedKickstarter = account.totalBackedKickstarter.plus(ONE_BI)
    account.save()

    let summitKickstarterFactory = SummitKickstarterFactory.load(SUMMIT_KICKSTARTER_FACTORY_ADDRESS)
    summitKickstarterFactory!.totalBackedKickstarter = summitKickstarterFactory!.totalBackedKickstarter.plus(ONE_BI)
    summitKickstarterFactory!.save()

    kickstarter!.totalContributor = kickstarter!.totalContributor.plus(ONE_BI)
    kickstarter!.save()
  }
  backedProject.email = event.params.email
  backedProject.amount = backedProject.amount.plus(contribution.amount)
  backedProject.lastUpdated = event.block.timestamp
  backedProject.save()

  let summitKickstarterFactory = SummitKickstarterFactory.load(SUMMIT_KICKSTARTER_FACTORY_ADDRESS)
  summitKickstarterFactory!.totalContribution = summitKickstarterFactory!.totalContribution.plus(contribution.amount)
  summitKickstarterFactory!.save()
}

export function handleCreatorUpdated(event: CreatorUpdatedEvent): void {
  let kickstarter = Kickstarter.load(event.address.toHex())
  kickstarter!.creator = event.params.newCreator
  kickstarter!.save()
}

export function handleEndTimestampUpdated(event: EndTimestampUpdatedEvent): void {
  let kickstarter = Kickstarter.load(event.address.toHex())
  kickstarter!.endTimestamp = event.params.newEndTimestamp
  kickstarter!.save()
}

export function handleFixFeeAmountUpdated(event: FixFeeAmountUpdatedEvent): void {
  let kickstarter = Kickstarter.load(event.address.toHex())
  let decimals: BigInt = BigInt.fromI32(18)
  if (kickstarter!.paymentToken != ADDRESS_ZERO) {
    decimals = fetchTokenDecimals(event.address)
  }
  kickstarter!.fixFeeAmount = convertTokenToDecimal(event.params.newFixFeeAmount, decimals)
  kickstarter!.save()
}

export function handleImageUrlUpdated(event: ImageUrlUpdatedEvent): void {
  let kickstarter = Kickstarter.load(event.address.toHex())
  kickstarter!.imageUrl = event.params.newImageUrl
  kickstarter!.save()
}

export function handleKickstarterUpdated(event: KickstarterUpdatedEvent): void {
  let kickstarter = Kickstarter.load(event.address.toHex())
  let account = Account.load(kickstarter!.owner)
  account!.totalProjectGoals = account!.totalProjectGoals.minus(kickstarter!.projectGoals)

  let decimals: BigInt = BigInt.fromI32(18)
  if (kickstarter!.paymentToken != ADDRESS_ZERO) {
    decimals = fetchTokenDecimals(event.address)
  }

  kickstarter!.paymentToken = event.params.kickstarter.paymentToken.toHex()
  kickstarter!.title = event.params.kickstarter.title
  kickstarter!.creator = event.params.kickstarter.creator
  kickstarter!.imageUrl = event.params.kickstarter.imageUrl
  kickstarter!.projectDescription = event.params.kickstarter.projectDescription
  kickstarter!.rewardDescription = event.params.kickstarter.rewardDescription
  kickstarter!.minContribution = convertTokenToDecimal(
    event.params.kickstarter.minContribution,
    BigInt.fromI32(decimals)
  )
  kickstarter!.projectGoals = convertTokenToDecimal(event.params.kickstarter.projectGoals, BigInt.fromI32(decimals))
  kickstarter!.rewardDistributionTimestamp = event.params.kickstarter.rewardDistributionTimestamp
  kickstarter!.startTimestamp = event.params.kickstarter.startTimestamp
  kickstarter!.endTimestamp = event.params.kickstarter.endTimestamp
  kickstarter!.save()

  account!.totalProjectGoals = account!.totalProjectGoals.plus(kickstarter!.projectGoals)
  account!.save()
}

// export function handleKickstarterUpdatedByFactoryAdmin(event: KickstarterUpdatedByFactoryAdminEvent): void {}

// export function handleMinContributionUpdated(event: MinContributionUpdatedEvent): void {}

// export function handleOwnershipTransferred(event: OwnershipTransferredEvent): void {}

// export function handlePercentageFeeAmountUpdated(event: PercentageFeeAmountUpdatedEvent): void {}

// export function handleProjectDescriptionUpdated(event: ProjectDescriptionUpdatedEvent): void {}

// export function handleProjectGoalsUpdated(event: ProjectGoalsUpdatedEvent): void {}

// export function handleRejected(event: RejectedEvent): void {}

// export function handleRewardDescriptionUpdated(event: RewardDescriptionUpdatedEvent): void {}

// export function handleRewardDistributionTimestampUpdated(event: RewardDistributionTimestampUpdatedEvent): void {}

export function handleStartTimestampUpdated(event: StartTimestampUpdatedEvent): void {
  let kickstarter = Kickstarter.load(event.address.toHex())
  kickstarter!.startTimestamp = event.params.newStartTimestamp
  kickstarter!.save()
}

// export function handleStatusUpdated(event: StatusUpdatedEvent): void {}

// export function handleTitleUpdated(event: TitleUpdatedEvent): void {}

// export function handleOwnershipTransferred(event: OwnershipTransferredEvent): void {
//   let kickstarter = Kickstarter.load(event.address.toHex())
//   let previousAccount = Account.load(event.params.previousOwner.toHex())
//   if (!previousAccount) {
//     previousAccount = new Account(event.params.previousOwner.toHex())
//     previousAccount.totalKickstarter = ZERO_BI
//     previousAccount.totalBackedKickstarter = ZERO_BI
//     previousAccount.totalProjectGoals = ZERO_BD
//     previousAccount.totalContribution = ZERO_BD
//     previousAccount.save()
//   }

//   let newAccount = Account.load(event.params.newOwner.toHex())
//   if (!newAccount) {
//     newAccount = new Account(event.params.newOwner.toHex())
//     newAccount.totalKickstarter = ZERO_BI
//     newAccount.totalBackedKickstarter = ZERO_BI
//     newAccount.totalProjectGoals = ZERO_BD
//     newAccount.totalContribution = ZERO_BD
//     newAccount.save()
//   }

//   if (newAccount.id != ADDRESS_ZERO) {
//     newAccount.totalKickstarter = newAccount.totalKickstarter.plus(ONE_BI)
//     newAccount.totalProjectGoals = newAccount.totalProjectGoals.plus(kickstarter!.projectGoals)
//     newAccount.save()
//   }

//   if (previousAccount.id != ADDRESS_ZERO) {
//     previousAccount!.totalKickstarter = previousAccount!.totalKickstarter.minus(ONE_BI)
//     previousAccount!.totalProjectGoals = previousAccount!.totalProjectGoals.minus(kickstarter!.projectGoals)
//     previousAccount!.save()
//   }

//   kickstarter!.owner = event.params.newOwner.toHex()
//   kickstarter!.save()
// }

// export function handleTitleUpdated(event: TitleUpdatedEvent): void {
//   let kickstarter = Kickstarter.load(event.address.toHex())
//   kickstarter!.title = event.params.newTitle
//   kickstarter!.save()
// }

// export function handleProjectDescriptionUpdated(event: ProjectDescriptionUpdatedEvent): void {
//   let kickstarter = Kickstarter.load(event.address.toHex())
//   kickstarter!.projectDescription = event.params.newProjectDescription
//   kickstarter!.save()
// }

// export function handleRewardDescriptionUpdated(event: RewardDescriptionUpdatedEvent): void {
//   let kickstarter = Kickstarter.load(event.address.toHex())
//   kickstarter!.rewardDescription = event.params.newRewardDescription
//   kickstarter!.save()
// }

// export function handleMinContributionUpdated(event: MinContributionUpdatedEvent): void {
//   let kickstarter = Kickstarter.load(event.address.toHex())
//   kickstarter!.minContribution = convertTokenToDecimal(event.params.newMinContribution, BigInt.fromI32(18))
//   kickstarter!.save()
// }

// export function handleProjectGoalsUpdated(event: ProjectGoalsUpdatedEvent): void {
//   let kickstarter = Kickstarter.load(event.address.toHex())

//   let account = Account.load(kickstarter!.owner)
//   account!.totalProjectGoals = account!.totalProjectGoals.minus(kickstarter!.projectGoals)

//   kickstarter!.projectGoals = convertTokenToDecimal(event.params.newProjectGoals, BigInt.fromI32(18))
//   kickstarter!.save()

//   account!.totalProjectGoals = account!.totalProjectGoals.plus(kickstarter!.projectGoals)
//   account!.save()
// }

// export function handleRewardDistributionTimestampUpdated(event: RewardDistributionTimestampUpdatedEvent): void {
//   let kickstarter = Kickstarter.load(event.address.toHex())
//   kickstarter!.rewardDistributionTimestamp = event.params.newRewardDistributionTimestamp
//   kickstarter!.save()
// }
