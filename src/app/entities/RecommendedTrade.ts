export class RecommendedTrade {
  constructor(
    public characterId: number,
    public timestamp: number,
    public recommendedTradeId: string,
    public typeId: number,
    public typeName: string,
    public action: {
      buyVolume: number,
    },
    public state: {
      maxBuyPrice: number,
      buyVolume: number,
      minSellPrice: number,
      sellVolume: number,
    },
  ) { }

  get profit() {
    return this.action.buyVolume * (this.state.minSellPrice - this.state.maxBuyPrice);
  }
}
