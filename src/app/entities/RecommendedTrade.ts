export class RecommendedTrade {
  constructor(
    public characterId: number,
    public dateCreated: Date,
    public recommendedTradeId: string,
    public status: string,

    public action?: {
      buyVolume: number,
    },
    public state?: {
      maxBuyPrice?: number,
      buyVolume: number,
      minSellPrice?: number,
      sellVolume: number,
    },
    public typeId?: number,
    public typeName?: string,
  ) { }

  getBuyVolume(): number {
    return this.action?.buyVolume || 0;
  }

  getDateCreated(): Date {
    return new Date(this.dateCreated);
  }

  getMaxBuyPrice(): number {
    return this.state?.maxBuyPrice || 0;
  }

  getMinSellPrice(): number {
    return this.state?.minSellPrice || Infinity;
  }

  getProfit(): number {
    return (this.action?.buyVolume || 0) * ((this.state?.minSellPrice || Infinity) - (this.state?.maxBuyPrice || 0));
  }

  getTypeName(): string {
    return this.typeName || "";
  }
}
