export class RecommendedTrade {
  constructor(
    public action: {
      buyVolume: number,
    },
    public characterId: number,
    public dateCreated: Date,
    public recommendedTradeId: string,
    public state: {
      maxBuyPrice?: number,
      buyVolume: number,
      minSellPrice?: number,
      sellVolume: number,
    },
    public status: string,
    public typeId: number,
    public typeName: string,
  ) { }

  getDateCreated(): Date {
    return new Date(this.dateCreated);
  }

  getMaxBuyPrice(): number {
    return this.state.maxBuyPrice || 0;
  }

  getMinSellPrice(): number {
    return this.state.minSellPrice || Infinity;
  }

  get profit() {
    return this.action.buyVolume * ((this.state.minSellPrice || Infinity) - (this.state.maxBuyPrice || 0));
  }
}
