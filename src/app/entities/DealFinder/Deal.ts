import { Type } from 'src/app/entities/Type';

export class Deal {

    constructor(
        public type: Type,
        public volume: number,
        public buyPrice: number,
        public sellPrice: number,
        public fees: number
    ) { }

    get profit() {
        return this.volume * (this.sellPrice - this.buyPrice) - this.fees;
    }

}
