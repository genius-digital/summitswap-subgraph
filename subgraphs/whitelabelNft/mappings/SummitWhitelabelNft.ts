/* eslint-disable prefer-const */
import { Account, WhitelabelNftCollection } from "../generated/schema"
import { OwnershipTransferred as OwnershipTransferredEvent } from "../generated/SummitWhitelabelNftFactory/SummitWhitelabelNft"
import { ADDRESS_ZERO, ONE_BI, ZERO_BI } from "../utils"

export function handleOwnershipTransferred(event: OwnershipTransferredEvent): void {
  let whitelabelNftCollection = WhitelabelNftCollection.load(event.address.toHex())
  let previousAccount = Account.load(event.params.previousOwner.toHex())
  if (!previousAccount) {
    previousAccount = new Account(event.params.previousOwner.toHex())
    previousAccount.totalWhitelabelNft = ZERO_BI
    previousAccount.save()
  }

  let newAccount = Account.load(event.params.newOwner.toHex())
  if (!newAccount) {
    newAccount = new Account(event.params.newOwner.toHex())
    newAccount.totalWhitelabelNft = ZERO_BI
    newAccount.save()
  }

  if (newAccount.id != ADDRESS_ZERO) {
    newAccount.totalWhitelabelNft = newAccount.totalWhitelabelNft.plus(ONE_BI)
    newAccount.save()
  }

  if (previousAccount.id != ADDRESS_ZERO) {
    previousAccount.totalWhitelabelNft = previousAccount.totalWhitelabelNft.minus(ONE_BI)
    previousAccount.save()
  }

  whitelabelNftCollection!.owner = event.params.newOwner.toHex()
  whitelabelNftCollection!.save()
}
