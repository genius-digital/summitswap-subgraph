import { SummitWhitelabelNftFactory, WhitelabelNft } from "../generated/schema"
import { CreateNft } from "../generated/SummitWhitelabelNftFactory/SummitWhitelabelNftFactory"
import { WhitelabelNft as WhitelabelNftTemplate } from "../generated/templates"
import { ONE_BI, SUMMIT_WHITELABEL_NFT_FACTORY_ADDRESS, ZERO_BI } from "../utils"

export function handleCreateNft(event: CreateNft): void {
  let summitWhitelabelNftFactory = SummitWhitelabelNftFactory.load(SUMMIT_WHITELABEL_NFT_FACTORY_ADDRESS)
  if (summitWhitelabelNftFactory === null) {
    summitWhitelabelNftFactory = new SummitWhitelabelNftFactory(SUMMIT_WHITELABEL_NFT_FACTORY_ADDRESS)
    summitWhitelabelNftFactory.totalWhitelabelNft = ZERO_BI
    summitWhitelabelNftFactory.save()
  }
  summitWhitelabelNftFactory.totalWhitelabelNft = summitWhitelabelNftFactory.totalWhitelabelNft.plus(ONE_BI)
  summitWhitelabelNftFactory.save()

  let whitelabelNft = WhitelabelNft.load(event.params.nftAddress.toHex())
  if (whitelabelNft === null) {
    whitelabelNft = new WhitelabelNft(event.params.nftAddress.toHex())
    whitelabelNft.owner = event.params.owner.toHex()
    whitelabelNft.name = event.params.name
    whitelabelNft.symbol = event.params.symbol
    whitelabelNft.maxSupply = event.params.maxSupply
    whitelabelNft.whitelistMintPrice = event.params.whitelistMintPrice
    whitelabelNft.publicMintPrice = event.params.publicMintPrice
    whitelabelNft.phase = event.params.phase
    whitelabelNft.createdAt = event.params.timestamp
    whitelabelNft.save()
  }

  WhitelabelNftTemplate.create(event.params.nftAddress)
}
