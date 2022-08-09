# SummitSwap Subgraph

TheGraph exposes a GraphQL endpoint to query the events and entities within the Binance Smart Chain and SummitSwap ecosystem.

Currently, there are multiple subgraphs, but additional subgraphs can be added to this repository, following the current architecture.

## Subgraphs

1. **[Blocks](https://thegraph.com/legacy-explorer/subgraph/koda-finance/blocks)**: Tracks all blocks on Binance Smart Chain.

2. **[Exchange](https://thegraph.com/legacy-explorer/subgraph/koda-finance/summitswap-exchange)**: Tracks all SummitSwap Exchange data with price, volume, liquidity, ...

3. **[Pairs](https://thegraph.com/legacy-explorer/subgraph/koda-finance/summitswap-pairs)**: Tracks all SummitSwap Pairs and Tokens.

## Dependencies

- [Graph CLI](https://github.com/graphprotocol/graph-cli)
    - Required to generate and build local GraphQL dependencies.

```shell
yarn global add @graphprotocol/graph-cli
```

## Deployment

For any of the subgraph: `blocks` as `[subgraph]`

1. Run the `cd subgraphs/[subgraph]` command to move to the subgraph directory.

2. Run the `yarn codegen` command to prepare the TypeScript sources for the GraphQL (generated/*).

3. Run the `yarn build` command to build the subgraph, and check compilation errors before deploying.

4. Run `graph auth --product hosted-service '<ACCESS_TOKEN>'`

5. Deploy via `yarn deploy`.

