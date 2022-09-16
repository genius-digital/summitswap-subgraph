/* eslint-disable prefer-const */
import { Address, BigInt } from "@graphprotocol/graph-ts"
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
  ApprovalStatusUpdated as ApprovalStatusUpdatedEvent,
  TitleUpdated as TitleUpdatedEvent,
} from "../generated/templates/Kickstarter/SummitKickstarter"
import {
  convertTokenToDecimal,
  SUMMIT_KICKSTARTER_FACTORY_ADDRESS,
  ZERO_BD,
  ZERO_BI,
  ONE_BI,
  ADDRESS_ZERO,
  fetchTokenDecimals,
  fetchTokenSymbol,
} from "../utils"

export function handleApproved(event: ApprovedEvent): void {
  let kickstarter = Kickstarter.load(event.address.toHex())

  let summitKickstarterFactory = SummitKickstarterFactory.load(SUMMIT_KICKSTARTER_FACTORY_ADDRESS)
  if (kickstarter.approvalStatus == BigInt.fromI32(0)) {
    summitKickstarterFactory.totalWaitingForApprovalKickstarter =
      summitKickstarterFactory.totalWaitingForApprovalKickstarter.minus(ONE_BI)
  } else if (kickstarter.approvalStatus == BigInt.fromI32(1)) {
    summitKickstarterFactory.totalApprovedKickstarter = summitKickstarterFactory.totalApprovedKickstarter.minus(ONE_BI)
  } else if (kickstarter.approvalStatus == BigInt.fromI32(2)) {
    summitKickstarterFactory.totalRejectedKickstarter = summitKickstarterFactory.totalRejectedKickstarter.minus(ONE_BI)
  }
  summitKickstarterFactory.totalApprovedKickstarter = summitKickstarterFactory.totalApprovedKickstarter.plus(ONE_BI)
  summitKickstarterFactory.save()

  let decimals: BigInt = BigInt.fromI32(18)
  if (kickstarter.paymentToken != ADDRESS_ZERO) {
    decimals = fetchTokenDecimals(Address.fromString(kickstarter.paymentToken))
  }
  kickstarter.approvalStatus = BigInt.fromI32(1)
  kickstarter.rejectedReason = ""
  kickstarter.fixFeeAmount = convertTokenToDecimal(event.params.fixFeeAmount, decimals)
  kickstarter.percentageFeeAmount = event.params.percentageFeeAmount
  kickstarter.save()
}

export function handleContribute(event: ContributeEvent): void {
  let kickstarter = Kickstarter.load(event.address.toHex())
  let contribution = new Contribution(event.transaction.hash.toHex())
  contribution.kickstarter = event.address.toHex()
  contribution.contributor = event.params.contributor.toHex()
  let decimals: BigInt = BigInt.fromI32(18)
  if (kickstarter.paymentToken != ADDRESS_ZERO) {
    decimals = fetchTokenDecimals(Address.fromString(kickstarter.paymentToken))
  }

  contribution.amount = convertTokenToDecimal(event.params.amount, BigInt.fromI32(18))
  contribution.createdAt = event.params.timestamp
  contribution.save()

  let account = Account.load(event.params.contributor.toHex())
  if (!account) {
    account = new Account(event.params.contributor.toHex())
    account.totalKickstarter = ZERO_BI
    account.totalBackedKickstarter = ZERO_BI
    account.totalContribution = ZERO_BD
    account.save()
  }
  account.totalContribution = account.totalContribution.plus(contribution.amount)
  account.save()

  kickstarter.totalContribution = kickstarter.totalContribution.plus(contribution.amount)
  kickstarter.save()

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
    summitKickstarterFactory.totalBackedKickstarter = summitKickstarterFactory.totalBackedKickstarter.plus(ONE_BI)
    summitKickstarterFactory.save()

    kickstarter.totalContributor = kickstarter.totalContributor.plus(ONE_BI)
    kickstarter.save()
  }
  backedProject.amount = backedProject.amount.plus(contribution.amount)
  backedProject.lastUpdated = event.block.timestamp
  backedProject.save()

  let summitKickstarterFactory = SummitKickstarterFactory.load(SUMMIT_KICKSTARTER_FACTORY_ADDRESS)
  summitKickstarterFactory.totalContribution = summitKickstarterFactory.totalContribution.plus(contribution.amount)
  summitKickstarterFactory.save()
}

export function handleCreatorUpdated(event: CreatorUpdatedEvent): void {
  let kickstarter = Kickstarter.load(event.address.toHex())
  kickstarter.creator = event.params.creator
  kickstarter.save()
}

export function handleEndTimestampUpdated(event: EndTimestampUpdatedEvent): void {
  let kickstarter = Kickstarter.load(event.address.toHex())
  kickstarter.endTimestamp = event.params.endTimestamp
  kickstarter.save()
}

export function handleFixFeeAmountUpdated(event: FixFeeAmountUpdatedEvent): void {
  let kickstarter = Kickstarter.load(event.address.toHex())
  let decimals: BigInt = BigInt.fromI32(18)
  if (kickstarter.paymentToken != ADDRESS_ZERO) {
    decimals = fetchTokenDecimals(Address.fromString(kickstarter.paymentToken))
  }
  kickstarter.fixFeeAmount = convertTokenToDecimal(event.params.fixFeeAmount, decimals)
  kickstarter.save()
}

export function handleImageUrlUpdated(event: ImageUrlUpdatedEvent): void {
  let kickstarter = Kickstarter.load(event.address.toHex())
  kickstarter.imageUrl = event.params.imageUrl
  kickstarter.save()
}

export function handleKickstarterUpdated(event: KickstarterUpdatedEvent): void {
  let kickstarter = Kickstarter.load(event.address.toHex())
  let account = Account.load(kickstarter.owner)

  let newPaymentToken = event.params.kickstarter.paymentToken

  let decimals: BigInt = BigInt.fromI32(18)
  if (newPaymentToken.toHex() != ADDRESS_ZERO) {
    decimals = fetchTokenDecimals(newPaymentToken)
  }

  kickstarter.paymentToken = newPaymentToken.toHex()
  kickstarter.tokenSymbol = fetchTokenSymbol(newPaymentToken)
  kickstarter.title = event.params.kickstarter.title
  kickstarter.creator = event.params.kickstarter.creator
  kickstarter.imageUrl = event.params.kickstarter.imageUrl
  kickstarter.projectDescription = event.params.kickstarter.projectDescription
  kickstarter.rewardDescription = event.params.kickstarter.rewardDescription
  kickstarter.minContribution = convertTokenToDecimal(event.params.kickstarter.minContribution, decimals)
  kickstarter.projectGoals = convertTokenToDecimal(event.params.kickstarter.projectGoals, decimals)
  kickstarter.rewardDistributionTimestamp = event.params.kickstarter.rewardDistributionTimestamp
  kickstarter.startTimestamp = event.params.kickstarter.startTimestamp
  kickstarter.endTimestamp = event.params.kickstarter.endTimestamp
  kickstarter.save()

  account.save()
}

export function handleKickstarterUpdatedByFactoryAdmin(event: KickstarterUpdatedByFactoryAdminEvent): void {
  let kickstarter = Kickstarter.load(event.address.toHex())
  let account = Account.load(kickstarter.owner)
  let summitKickstarterFactory = SummitKickstarterFactory.load(SUMMIT_KICKSTARTER_FACTORY_ADDRESS)
  if (kickstarter.approvalStatus == BigInt.fromI32(0)) {
    summitKickstarterFactory.totalWaitingForApprovalKickstarter =
      summitKickstarterFactory.totalWaitingForApprovalKickstarter.minus(ONE_BI)
  } else if (kickstarter.approvalStatus == BigInt.fromI32(1)) {
    summitKickstarterFactory.totalApprovedKickstarter = summitKickstarterFactory.totalApprovedKickstarter.minus(ONE_BI)
  } else if (kickstarter.approvalStatus == BigInt.fromI32(2)) {
    summitKickstarterFactory.totalRejectedKickstarter = summitKickstarterFactory.totalRejectedKickstarter.minus(ONE_BI)
  }
  if (BigInt.fromI32(event.params.approvalStatus) == BigInt.fromI32(0)) {
    summitKickstarterFactory.totalWaitingForApprovalKickstarter =
      summitKickstarterFactory.totalWaitingForApprovalKickstarter.plus(ONE_BI)
  } else if (BigInt.fromI32(event.params.approvalStatus) == BigInt.fromI32(1)) {
    summitKickstarterFactory.totalApprovedKickstarter = summitKickstarterFactory.totalApprovedKickstarter.plus(ONE_BI)
  } else if (BigInt.fromI32(event.params.approvalStatus) == BigInt.fromI32(2)) {
    summitKickstarterFactory.totalRejectedKickstarter = summitKickstarterFactory.totalRejectedKickstarter.plus(ONE_BI)
  }
  summitKickstarterFactory.save()

  let newPaymentToken = event.params.kickstarter.paymentToken

  let decimals: BigInt = BigInt.fromI32(18)
  if (newPaymentToken.toHex() != ADDRESS_ZERO) {
    decimals = fetchTokenDecimals(newPaymentToken)
  }

  kickstarter.paymentToken = newPaymentToken.toHex()
  kickstarter.tokenSymbol = fetchTokenSymbol(newPaymentToken)
  kickstarter.approvalStatus = BigInt.fromI32(event.params.approvalStatus)
  kickstarter.title = event.params.kickstarter.title
  kickstarter.creator = event.params.kickstarter.creator
  kickstarter.imageUrl = event.params.kickstarter.imageUrl
  kickstarter.projectDescription = event.params.kickstarter.projectDescription
  kickstarter.rewardDescription = event.params.kickstarter.rewardDescription
  kickstarter.minContribution = convertTokenToDecimal(event.params.kickstarter.minContribution, decimals)
  kickstarter.projectGoals = convertTokenToDecimal(event.params.kickstarter.projectGoals, decimals)
  kickstarter.rewardDistributionTimestamp = event.params.kickstarter.rewardDistributionTimestamp
  kickstarter.startTimestamp = event.params.kickstarter.startTimestamp
  kickstarter.endTimestamp = event.params.kickstarter.endTimestamp
  kickstarter.percentageFeeAmount = event.params.percentageFeeAmount
  kickstarter.fixFeeAmount = convertTokenToDecimal(event.params.fixFeeAmount, decimals)
  kickstarter.save()

  account.save()
}

export function handleMinContributionUpdated(event: MinContributionUpdatedEvent): void {
  let kickstarter = Kickstarter.load(event.address.toHex())
  let decimals: BigInt = BigInt.fromI32(18)
  if (kickstarter.paymentToken != ADDRESS_ZERO) {
    decimals = fetchTokenDecimals(Address.fromString(kickstarter.paymentToken))
  }
  kickstarter.minContribution = convertTokenToDecimal(event.params.minContribution, decimals)
  kickstarter.save()
}

export function handleOwnershipTransferred(event: OwnershipTransferredEvent): void {
  let kickstarter = Kickstarter.load(event.address.toHex())
  let previousAccount = Account.load(event.params.previousOwner.toHex())
  if (!previousAccount) {
    previousAccount = new Account(event.params.previousOwner.toHex())
    previousAccount.totalKickstarter = ZERO_BI
    previousAccount.totalBackedKickstarter = ZERO_BI
    previousAccount.totalContribution = ZERO_BD
    previousAccount.save()
  }

  let newAccount = Account.load(event.params.newOwner.toHex())
  if (!newAccount) {
    newAccount = new Account(event.params.newOwner.toHex())
    newAccount.totalKickstarter = ZERO_BI
    newAccount.totalBackedKickstarter = ZERO_BI
    newAccount.totalContribution = ZERO_BD
    newAccount.save()
  }

  if (newAccount.id != ADDRESS_ZERO) {
    newAccount.totalKickstarter = newAccount.totalKickstarter.plus(ONE_BI)
    newAccount.save()
  }

  if (previousAccount.id != ADDRESS_ZERO) {
    previousAccount.totalKickstarter = previousAccount.totalKickstarter.minus(ONE_BI)
    previousAccount.save()
  }

  kickstarter.owner = event.params.newOwner.toHex()
  kickstarter.save()
}

export function handlePercentageFeeAmountUpdated(event: PercentageFeeAmountUpdatedEvent): void {
  let kickstarter = Kickstarter.load(event.address.toHex())
  kickstarter.percentageFeeAmount = event.params.percentageFeeAmount
  kickstarter.save()
}

export function handleProjectDescriptionUpdated(event: ProjectDescriptionUpdatedEvent): void {
  let kickstarter = Kickstarter.load(event.address.toHex())
  kickstarter.projectDescription = event.params.projectDescription
  kickstarter.save()
}

export function handleProjectGoalsUpdated(event: ProjectGoalsUpdatedEvent): void {
  let kickstarter = Kickstarter.load(event.address.toHex())
  let decimals: BigInt = BigInt.fromI32(18)
  if (kickstarter.paymentToken != ADDRESS_ZERO) {
    decimals = fetchTokenDecimals(Address.fromString(kickstarter.paymentToken))
  }

  let account = Account.load(kickstarter.owner)

  kickstarter.projectGoals = convertTokenToDecimal(event.params.projectGoals, decimals)
  kickstarter.save()

  account.save()
}

export function handleRejected(event: RejectedEvent): void {
  let kickstarter = Kickstarter.load(event.address.toHex())
  let summitKickstarterFactory = SummitKickstarterFactory.load(SUMMIT_KICKSTARTER_FACTORY_ADDRESS)
  if (kickstarter.approvalStatus == BigInt.fromI32(0)) {
    summitKickstarterFactory.totalWaitingForApprovalKickstarter =
      summitKickstarterFactory.totalWaitingForApprovalKickstarter.minus(ONE_BI)
  } else if (kickstarter.approvalStatus == BigInt.fromI32(1)) {
    summitKickstarterFactory.totalApprovedKickstarter = summitKickstarterFactory.totalApprovedKickstarter.minus(ONE_BI)
  } else if (kickstarter.approvalStatus == BigInt.fromI32(2)) {
    summitKickstarterFactory.totalRejectedKickstarter = summitKickstarterFactory.totalRejectedKickstarter.minus(ONE_BI)
  }
  summitKickstarterFactory.totalRejectedKickstarter = summitKickstarterFactory.totalRejectedKickstarter.plus(ONE_BI)
  summitKickstarterFactory.save()

  kickstarter.approvalStatus = BigInt.fromI32(2)
  kickstarter.rejectedReason = event.params.rejectedReason
  kickstarter.save()
}

export function handleRewardDescriptionUpdated(event: RewardDescriptionUpdatedEvent): void {
  let kickstarter = Kickstarter.load(event.address.toHex())
  kickstarter.rewardDescription = event.params.rewardDescription
  kickstarter.save()
}

export function handleRewardDistributionTimestampUpdated(event: RewardDistributionTimestampUpdatedEvent): void {
  let kickstarter = Kickstarter.load(event.address.toHex())
  kickstarter.rewardDistributionTimestamp = event.params.rewardDistributionTimestamp
  kickstarter.save()
}

export function handleStartTimestampUpdated(event: StartTimestampUpdatedEvent): void {
  let kickstarter = Kickstarter.load(event.address.toHex())
  kickstarter.startTimestamp = event.params.startTimestamp
  kickstarter.save()
}

export function handleApprovalStatusUpdated(event: ApprovalStatusUpdatedEvent): void {
  let kickstarter = Kickstarter.load(event.address.toHex())
  let summitKickstarterFactory = SummitKickstarterFactory.load(SUMMIT_KICKSTARTER_FACTORY_ADDRESS)
  if (kickstarter.approvalStatus == BigInt.fromI32(0)) {
    summitKickstarterFactory.totalWaitingForApprovalKickstarter =
      summitKickstarterFactory.totalWaitingForApprovalKickstarter.minus(ONE_BI)
  } else if (kickstarter.approvalStatus == BigInt.fromI32(1)) {
    summitKickstarterFactory.totalApprovedKickstarter = summitKickstarterFactory.totalApprovedKickstarter.minus(ONE_BI)
  } else if (kickstarter.approvalStatus == BigInt.fromI32(2)) {
    summitKickstarterFactory.totalRejectedKickstarter = summitKickstarterFactory.totalRejectedKickstarter.minus(ONE_BI)
  }
  if (BigInt.fromI32(event.params.approvalStatus) == BigInt.fromI32(0)) {
    summitKickstarterFactory.totalWaitingForApprovalKickstarter =
      summitKickstarterFactory.totalWaitingForApprovalKickstarter.plus(ONE_BI)
  } else if (BigInt.fromI32(event.params.approvalStatus) == BigInt.fromI32(1)) {
    summitKickstarterFactory.totalApprovedKickstarter = summitKickstarterFactory.totalApprovedKickstarter.plus(ONE_BI)
  } else if (BigInt.fromI32(event.params.approvalStatus) == BigInt.fromI32(2)) {
    summitKickstarterFactory.totalRejectedKickstarter = summitKickstarterFactory.totalRejectedKickstarter.plus(ONE_BI)
  }
  summitKickstarterFactory.save()
  kickstarter.approvalStatus = BigInt.fromI32(event.params.approvalStatus)
  kickstarter.save()
}

export function handleTitleUpdated(event: TitleUpdatedEvent): void {
  let kickstarter = Kickstarter.load(event.address.toHex())
  kickstarter.title = event.params.title
  kickstarter.save()
}
