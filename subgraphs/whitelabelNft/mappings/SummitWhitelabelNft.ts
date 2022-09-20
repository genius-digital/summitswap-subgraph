/* eslint-disable prefer-const */
import { BigInt } from "@graphprotocol/graph-ts"
import { Account, WhitelabelNftCollection } from "../generated/schema"
import {
  IsRevealUpdated as IsRevealUpdatedEvent,
  OwnershipTransferred as OwnershipTransferredEvent,
  PhaseUpdated as PhaseUpdatedEvent,
  PreviewImageUrlUpdated as PreviewImageUrlUpdatedEvent,
  PublicMintPriceUpdated as PublicMintPriceUpdatedEvent,
  WhitelistMintPriceUpdated as WhitelistMintPriceUpdatedEvent,
} from "../generated/SummitWhitelabelNftFactory/SummitWhitelabelNft"
import { ADDRESS_ZERO, convertTokenToDecimal, fetchPhase, ONE_BI, ZERO_BI } from "../utils"

export function handleOwnershipTransferred(event: OwnershipTransferredEvent): void {
  let whitelabelNftCollection = WhitelabelNftCollection.load(event.address.toHex())
  let previousAccount = Account.load(event.params.previousOwner.toHex())
  if (!previousAccount) {
    previousAccount = new Account(event.params.previousOwner.toHex())
    previousAccount.totalWhitelabelNft = ZERO_BI
    previousAccount.totalWhitelabelNftPausedPhase = ZERO_BI
    previousAccount.totalWhitelabelNftWhitelistPhase = ZERO_BI
    previousAccount.totalWhitelabelNftPublicPhase = ZERO_BI
    previousAccount.save()
  }

  let newAccount = Account.load(event.params.newOwner.toHex())
  if (!newAccount) {
    newAccount = new Account(event.params.newOwner.toHex())
    newAccount.totalWhitelabelNft = ZERO_BI
    newAccount.totalWhitelabelNftPausedPhase = ZERO_BI
    newAccount.totalWhitelabelNftWhitelistPhase = ZERO_BI
    newAccount.totalWhitelabelNftPublicPhase = ZERO_BI
    newAccount.save()
  }

  let phase = fetchPhase(event.address)

  if (newAccount.id != ADDRESS_ZERO) {
    newAccount.totalWhitelabelNft = newAccount.totalWhitelabelNft.plus(ONE_BI)

    if (phase == 0) {
      newAccount.totalWhitelabelNftPausedPhase = newAccount.totalWhitelabelNftPausedPhase.plus(ONE_BI)
    }
    if (phase == 1) {
      newAccount.totalWhitelabelNftWhitelistPhase = newAccount.totalWhitelabelNftWhitelistPhase.plus(ONE_BI)
    }
    if (phase == 2) {
      newAccount.totalWhitelabelNftPublicPhase = newAccount.totalWhitelabelNftPublicPhase.plus(ONE_BI)
    }
    newAccount.save()
  }

  if (previousAccount.id != ADDRESS_ZERO) {
    previousAccount.totalWhitelabelNft = previousAccount.totalWhitelabelNft.minus(ONE_BI)

    if (phase == 0) {
      previousAccount.totalWhitelabelNftPausedPhase = previousAccount.totalWhitelabelNftPausedPhase.minus(ONE_BI)
    }
    if (phase == 1) {
      previousAccount.totalWhitelabelNftWhitelistPhase = previousAccount.totalWhitelabelNftWhitelistPhase.minus(ONE_BI)
    }
    if (phase == 2) {
      previousAccount.totalWhitelabelNftPublicPhase = previousAccount.totalWhitelabelNftPublicPhase.minus(ONE_BI)
    }
    previousAccount.save()
  }

  whitelabelNftCollection!.owner = event.params.newOwner.toHex()
  whitelabelNftCollection!.save()
}

export function handlePhaseUpdated(event: PhaseUpdatedEvent): void {
  let whitelabelNftCollection = WhitelabelNftCollection.load(event.address.toHex())
  whitelabelNftCollection!.phase = event.params.updatedPhase
  whitelabelNftCollection!.save()

  let account = Account.load(event.address.toHex())
  if (event.params.previousPhase == 0) {
    account!.totalWhitelabelNftPausedPhase = account!.totalWhitelabelNftPausedPhase.minus(ONE_BI)
  }
  if (event.params.previousPhase == 1) {
    account!.totalWhitelabelNftWhitelistPhase = account!.totalWhitelabelNftWhitelistPhase.minus(ONE_BI)
  }
  if (event.params.previousPhase == 2) {
    account!.totalWhitelabelNftPublicPhase = account!.totalWhitelabelNftPublicPhase.minus(ONE_BI)
  }
  if (event.params.updatedPhase == 0) {
    account!.totalWhitelabelNftPausedPhase = account!.totalWhitelabelNftPausedPhase.plus(ONE_BI)
  }
  if (event.params.updatedPhase == 1) {
    account!.totalWhitelabelNftWhitelistPhase = account!.totalWhitelabelNftWhitelistPhase.plus(ONE_BI)
  }
  if (event.params.updatedPhase == 2) {
    account!.totalWhitelabelNftPublicPhase = account!.totalWhitelabelNftPublicPhase.plus(ONE_BI)
  }
  account!.save()
}

export function handleWhitelistMintPriceUpdated(event: WhitelistMintPriceUpdatedEvent): void {
  let decimals = BigInt.fromI32(18)

  let whitelabelNftCollection = WhitelabelNftCollection.load(event.address.toHex())
  whitelabelNftCollection!.whitelistMintPrice = convertTokenToDecimal(event.params.price, decimals)
  whitelabelNftCollection!.save()
}

export function handlePublicMintPriceUpdated(event: PublicMintPriceUpdatedEvent): void {
  let decimals = BigInt.fromI32(18)

  let whitelabelNftCollection = WhitelabelNftCollection.load(event.address.toHex())
  whitelabelNftCollection!.publicMintPrice = convertTokenToDecimal(event.params.price, decimals)
  whitelabelNftCollection!.save()
}

export function handleIsRevealUpdated(event: IsRevealUpdatedEvent): void {
  let whitelabelNftCollection = WhitelabelNftCollection.load(event.address.toHex())
  whitelabelNftCollection!.isReveal = event.params.isReveal
  whitelabelNftCollection!.save()
}

export function handlePreviewImageUrlUpdated(event: PreviewImageUrlUpdatedEvent): void {
  let whitelabelNftCollection = WhitelabelNftCollection.load(event.address.toHex())
  whitelabelNftCollection!.previewImageUrl = event.params.previewImageUrl
  whitelabelNftCollection!.save()
}

// export function handleMint(event: TransferEvent): void {
//   let whitelabelNftCollection = WhitelabelNftCollection.load(event.address.toHex())

//   let phase = fetchTokenInfo<number>(event.address, "phase") || 0
// }
