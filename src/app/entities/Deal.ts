export class Deal {
  constructor(
    public buyPrice: number,
    public feesPerUnit: number,
    public sellPrice: number,
    public typeName: string,
    public volume: number,
  ) { }

  get profit() {
    return this.volume * (this.sellPrice - this.buyPrice - this.feesPerUnit);
  }
}
