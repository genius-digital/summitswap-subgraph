/* eslint-disable prefer-const */
import { BigInt } from "@graphprotocol/graph-ts"
import { WhitelabelNftFactory, WhitelabelNftCollection, Account } from "../generated/schema"
import { CreateNft } from "../generated/SummitWhitelabelNftFactory/SummitWhitelabelNftFactory"
import { WhitelabelNft as WhitelabelNftTemplate } from "../generated/templates"
import { convertTokenToDecimal, ONE_BI, SUMMIT_WHITELABEL_NFT_FACTORY_ADDRESS, ZERO_BI } from "../utils"

export function handleCreateNft(event: CreateNft): void {
  let whitelabelNftFactory = WhitelabelNftFactory.load(SUMMIT_WHITELABEL_NFT_FACTORY_ADDRESS)
  if (whitelabelNftFactory === null) {
    whitelabelNftFactory = new WhitelabelNftFactory(SUMMIT_WHITELABEL_NFT_FACTORY_ADDRESS)
    whitelabelNftFactory.totalWhitelabelNft = ZERO_BI
    whitelabelNftFactory.totalWhitelabelNftPausedPhase = ZERO_BI
    whitelabelNftFactory.totalWhitelabelNftWhitelistPhase = ZERO_BI
    whitelabelNftFactory.totalWhitelabelNftPublicPhase = ZERO_BI
    whitelabelNftFactory.save()
  }
  whitelabelNftFactory.totalWhitelabelNft = whitelabelNftFactory.totalWhitelabelNft.plus(ONE_BI)
  whitelabelNftFactory.totalWhitelabelNftPausedPhase = whitelabelNftFactory.totalWhitelabelNftPausedPhase.plus(ONE_BI)
  whitelabelNftFactory.save()

  let ownerAccount = Account.load(event.params.owner.toHex())
  if (!ownerAccount) {
    ownerAccount = new Account(event.params.owner.toHex())
    ownerAccount.totalWhitelabelNft = ZERO_BI
    ownerAccount.totalWhitelabelNftPausedPhase = ZERO_BI
    ownerAccount.totalWhitelabelNftWhitelistPhase = ZERO_BI
    ownerAccount.totalWhitelabelNftPublicPhase = ZERO_BI
    ownerAccount.save()
  }

  let decimals = BigInt.fromI32(18)

  let whitelabelNftCollection = WhitelabelNftCollection.load(event.params.nftAddress.toHex())
  if (whitelabelNftCollection === null) {
    whitelabelNftCollection = new WhitelabelNftCollection(event.params.nftAddress.toHex())
    whitelabelNftCollection.owner = event.params.owner.toHex()
    whitelabelNftCollection.name = event.params.tokenInfo.name
    whitelabelNftCollection.symbol = event.params.tokenInfo.symbol
    whitelabelNftCollection.description = event.params.tokenInfo.description
    whitelabelNftCollection.previewImageUrl = event.params.tokenInfo.previewImageUrl
    whitelabelNftCollection.baseTokenURI = event.params.initialURI
    whitelabelNftCollection.maxSupply = event.params.tokenInfo.maxSupply
    whitelabelNftCollection.whitelistMintPrice = convertTokenToDecimal(event.params.tokenInfo.whitelistMintPrice, decimals)
    whitelabelNftCollection.publicMintPrice = convertTokenToDecimal(event.params.tokenInfo.publicMintPrice, decimals)
    whitelabelNftCollection.phase = event.params.tokenInfo.phase
    whitelabelNftCollection.isReveal = event.params.tokenInfo.isReveal
    whitelabelNftCollection.totalOwner = ZERO_BI
    whitelabelNftCollection.createdAt = event.block.timestamp
    whitelabelNftCollection.save()
  }

  WhitelabelNftTemplate.create(event.params.nftAddress)
}
