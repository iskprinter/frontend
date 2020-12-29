
import { AuthenticatorInterface } from 'src/app/services/authenticator/authenticator.interface';
import { Character } from 'src/app/entities/Character';
import { Deal } from 'src/app/entities/DealFinder/Deal';
import { FakeLocalStorage } from './FakeLocalStorage';
import { LocalStorageInterface } from './LocalStorageInterface';
import { Order } from 'src/app/entities/Order';
import { Type } from 'src/app/entities/Type';
import { WorkerPool } from 'src/app/entities/WorkerPool';

// Establish a global state.
const ip: any = { charData: {} };

const fakeLocalStorage = new FakeLocalStorage();

const RESERVEDORDERS = 0;
const TAXFEEFACTOR = 0;
const ORDER_DAYS = 1;
const OPTS = {};

let itemData = {};
const marketData = {};
let typeNames = {};
let dataIsFresh;
let maxId;
let verbose;
let itemVolHistory = {};

interface EveOrder {
    type_id: number;
    is_buy_order: boolean;
    price: number;
    issued: Date;
}

export class DealFinder {

    static readonly BASE_SALES_TAX = 0.05;
    // If there are no sell orders present on the market,
    // is multiplied by the following factor to compute a sell price.
    // The maximum transaction price in the historical data
    static readonly HISTORICAL_SELL_FACTOR = 1.05;
    static readonly MAX_ORDER_DAYS = 1;
    static readonly MIN_BUY_PRICE = 0.01;

    static readonly TYPE_CACHE_DURATION = 14; // days
    static readonly HISTORICAL_DATA_CACHE_DURATION = 5; // days

    authenticatorService: AuthenticatorInterface;
    localStorage: LocalStorageInterface;
    types: Type[];
    historicalData: { [key: number]: any } = {};
    structureOrders: Order[];
    suggestedDeals: Deal[];
    verbose: boolean;

    constructor(authenticatorService: AuthenticatorInterface, localStorage?: LocalStorageInterface) {
        this.authenticatorService = authenticatorService;
        this.localStorage = localStorage || new FakeLocalStorage();
    }

    async findDeals(character: Character): Promise<Deal[]> {

        this.types = await this.getMarketableTypes();

        const [
            currentPrices,
            _1,
            _2,
            _3,
            _4,
        ] = await Promise.all<any>([
            this.getCurrentPrices(character.location.structureId),
            this.getHistoricalData(character.location.regionId, this.types.map((type) => type.typeId)),
            character.skills ? Promise.resolve() : character.getSkills(),
            character.walletBalance ? Promise.resolve() : character.getWalletBalance(),
            character.orders ? Promise.resolve() : character.getOrders()
        ]);
        let deals: Deal[] = this.computeDeals(currentPrices, this.historicalData, character);
        deals = this.scaleOrFilterByAffordability(deals, character.walletBalance);
        return deals
            .filter((deal) => deal.profit > 0)
            // Only include deals for which there is NOT an existing order for the same typeId and location.
            .filter((deal) => !character.orders.some((order) =>
                order.typeId === deal.type.typeId
                && order.locationId === character.location.structureId
            ))
            .sort((deal1, deal2) => deal2.profit - deal1.profit);

    }

    private async getMarketableTypes(): Promise<Type[]> {
        const typeResponse = await this.authenticatorService.backendRequest('get', '/types');
        const types = typeResponse.body as Type[];
        return types;
    }

    private async getHistoricalData(regionId: number, typeIds: number[]): Promise<PromiseSettledResult<any>[]> {
        const storedHistoricalDataString = this.localStorage.getItem('historicalData');
        const storedHistoricalData = storedHistoricalDataString ? JSON.parse(storedHistoricalDataString) : {};

        const workerPool = new WorkerPool();
        return Promise.allSettled(typeIds.map((typeId) => workerPool.runTask(async () => {

            // Check the in-memory data
            if (this.historicalData?.[typeId]) {
                return;
            }

            // Check the localStorage data
            if (storedHistoricalData[typeId]?.timestamp > (Date.now() - 1000 * 60 * 60 * 24 * DealFinder.HISTORICAL_DATA_CACHE_DURATION)) {
                this.historicalData[typeId] = storedHistoricalData[typeId].data;
                return;
            }

            // Fetch fresh data
            let analyzedHistory;
            try {
                const response = await this.authenticatorService.requestWithAuth(
                    'get',
                    `https://esi.evetech.net/latest/markets/${regionId}/history`,
                    { params: { type_id: typeId } }
                );
                const history = response.body;
                analyzedHistory = this.analyzeHistory(history);
            } catch (err) {
                if (err.status === 404) {
                    analyzedHistory = {
                        maxPrice: 0,
                        avgDailyBuyVol: 0,
                        avgDailySellVol: 0,
                    };
                } else {
                    console.log('Unhandled error:');
                    throw err;
                }
            }

            this.historicalData[typeId] = analyzedHistory;

            // Save to localStorage
            const storedHistoryString = this.localStorage.getItem('historicalData');
            const storedHistory = storedHistoryString ? JSON.parse(storedHistoryString) : {};
            storedHistory[typeId] = {
                timestamp: Date.now(),
                data: analyzedHistory
            };
            this.localStorage.setItem('historicalData', JSON.stringify(storedHistory));

        })));

    }

    analyzeHistory(data) {

        let maxPrice = 0;

        const workingData = {
            totalVolumeOfBuys: 0,
            totalVolumeOfSells: 0,
            movingMaxBuyTotal: 0,
            movingMinSellTotal: 0,
            maxBuyMovingAvg: 0, // = itemData[typeId].maxBuy;
            minSellMovingAvg: 0, // = itemData[typeId].minSell;
        };

        if (data.length === 0) {
            return {
                maxPrice: 0,
                avgDailyBuyVol: 0,
                avgDailySellVol: 0,
            };
        }

        let buyFraction;
        const firstDate: number = Number(new Date(data[0].date));
        let dateSpan;

        for (let i = 0; i < data.length; i += 1) {

            maxPrice = Math.max(maxPrice, data[i].highest);

            let a = [
                [
                    data[i].highest,              // [0][0]
                    data[i].lowest                // [0][1]
                ],
                [
                    workingData.minSellMovingAvg, // [1][0]
                    workingData.maxBuyMovingAvg   // [1][1]
                ]
            ];

            //TODO Use linear algebra to identify the option with minimum error.
            let x = [
                data[i].highest,
                data[i].lowest
            ];
            let y = [
                workingData.minSellMovingAvg,
                workingData.maxBuyMovingAvg
            ];
            //let beta = Math.transpose(x);

            // Calculate the simple error for each option.
            let b = [
                [a[0][0] - a[1][0],    // [0][0] = highest - minSell
                a[0][0] - a[1][1]],  // [0][1] = highest - maxBuy
                [a[0][1] - a[1][0],    // [1][0] = lowest - minSell
                a[0][1] - a[1][1]]   // [1][1] = lowest - maxBuy
            ];

            // Square the errors.
            for (let j = 0; j < b.length; j += 1) {
                for (let k = 0; k < b[j].length; k += 1) {
                    b[j][k] *= b[j][k];
                }
            }

            // Calculate the total error for each possibility.
            let error = [
                [b[0][0] + b[1][0],  // [0][0] = highestIsSell and LowestIsSell
                b[0][0] + b[1][1]], // [0][1] = highestIsSell and LowestIsBuy
                [b[0][1] + b[1][0],  // [1][0] = highestIsBuy and LowestIsSell
                b[0][1] + b[1][1]]  // [1][1] = highestIsBuy and LowestIsBuy
            ];

            // Initialize a pair of indices that will correspond to the min error.
            let minIndex = {
                j: 0,
                k: 0
            };

            // Find the option with the minimum error.
            for (let j = 0; j < error.length; j += 1) {
                for (let k = 0; k < error[j].length; k += 1) {
                    if (error[j][k] < error[minIndex.j][minIndex.k]) {
                        minIndex.j = j;
                        minIndex.k = k;
                    }
                }
            }

            buyFraction = this.getBuyFraction(workingData, data, i, minIndex);
            this.updateCumulativeTotals(workingData, data, i, buyFraction);

            let finalDate = Number(new Date(data[i].date));
            dateSpan = 1 + (finalDate - firstDate) / 1000 / 60 / 60 / 24;

        }
        let avgBuyVolumePerDay = workingData.totalVolumeOfBuys / dateSpan;
        let avgSellVolumePerDay = workingData.totalVolumeOfSells / dateSpan;
        return {
            maxPrice,
            avgDailyBuyVol: avgBuyVolumePerDay,
            avgDailySellVol: avgSellVolumePerDay,
        };

    }

    // WARNING: This is a temporary refactor.
    // This function will MUTATE the workingData parameter.
    getBuyFraction(workingData, data, i, minIndex) {
        switch (10 * minIndex.j + minIndex.k) {
            case 0:
                // Highest and lowest are both sell.
                return 0;
            case 1:
                // Highest price is sell and lowest price is buy.
                return (data[i].highest - data[i].average)
                    / (data[i].highest - data[i].lowest);
            case 10:
                // Highest is buy and lowest is sell.
                // This is not possible. Make an assumption.
                let totalCumulativeVolume = workingData.totalVolumeOfBuys + workingData.totalVolumeOfSells;
                if (totalCumulativeVolume == 0) {
                    // If there's nothing to go on, assume they're 50-50 split.
                    return 0.5;
                } else {
                    // If we do have prior volume data, then assume it has the same
                    // distribution as what has already been seen.
                    return workingData.totalVolumeOfBuys / totalCumulativeVolume;
                }
            case 11:
                // Highest and lowest are both buy.
                return 1;
            default:
                throw new Error('Impossible combination if j and k. Please debug me.');
        }

    }

    // WARNING: This is a temporary refactor.
    // This function will MUTATE the workingData parameter.
    updateCumulativeTotals(workingData, data, i, buyFraction) {

        let buyVolume = data[i].volume * buyFraction;
        let sellVolume = data[i].volume - buyVolume;

        workingData.totalVolumeOfBuys += buyVolume;
        workingData.totalVolumeOfSells += sellVolume;

        workingData.movingMaxBuyTotal += buyVolume * data[i].lowest;
        workingData.movingMinSellTotal += sellVolume * data[i].highest;
        if (workingData.totalVolumeOfBuys > 0) {
            workingData.maxBuyMovingAvg = workingData.movingMaxBuyTotal / workingData.totalVolumeOfBuys;
        }
        if (workingData.totalVolumeOfSells > 0) {
            workingData.minSellMovingAvg = workingData.movingMinSellTotal / workingData.totalVolumeOfSells;
        }
    }

    // Use structure id to get structure orders.
    private async getCurrentPrices(structureId: number): Promise<{ [key: number]: any }> {
        console.log('Getting current prices...');

        const response = await this.authenticatorService.requestWithAuth(
            'get',
            `https://esi.evetech.net/latest/markets/structures/${structureId}`,
        );
        const totalPages = Number(response.headers.get('x-pages'));

        const pages = [];
        for (let i = 1; i <= totalPages; i += 1) {
            pages.push(i);
        }
        const currentPrices = await pages
            .map(async (pageNumber: number) => {
                let response;
                response = await this.authenticatorService.requestWithAuth(
                    'get',
                    `https://esi.evetech.net/latest/markets/structures/${structureId}`,
                    { params: { page: pageNumber } }
                );
                const orders = response.body as EveOrder[];
                return orders;
            })
            .map(async (page: Promise<EveOrder[]>) => {

                const pageSummary: { [key: number]: any } = {};

                (await page).forEach((order) => {
                    if (pageSummary[order.type_id] === undefined) {
                        pageSummary[order.type_id] = {}
                    }
                    if (order.is_buy_order) {
                        if (
                            pageSummary[order.type_id].maxBuy === undefined
                            || order.price > pageSummary[order.type_id].maxBuy
                        ) { pageSummary[order.type_id].maxBuy = order.price; }
                    } else {
                        if (
                            pageSummary[order.type_id].minSell === undefined
                            || order.price < pageSummary[order.type_id].minSell
                        ) { pageSummary[order.type_id].minSell = order.price; }
                    }

                });

                return pageSummary;

            })
            .reduce(async (completeSummary, pageSummary) => {

                const completeSummaryClone = { ...(await completeSummary) };

                Object.entries(await pageSummary).forEach(([typeId, typeSummary]) => {

                    if (completeSummaryClone[typeId] === undefined) {
                        completeSummaryClone[typeId] = typeSummary;
                        return;
                    }
                    if (
                        completeSummaryClone[typeId].maxBuy === undefined
                        || typeSummary.maxBuy > completeSummaryClone[typeId].maxBuy
                    ) { completeSummaryClone[typeId].maxBuy = typeSummary.maxBuy; }
                    if (
                        completeSummaryClone[typeId].minSell === undefined
                        || typeSummary.minSell < completeSummaryClone[typeId].minSell
                    ) { completeSummaryClone[typeId].minSell = typeSummary.minSell; }

                });

                return completeSummaryClone;
            });
        return currentPrices;
    }

    private computeDeals(
        currentPrices: { [key: number]: any },
        historicalData: { [key: number]: any },
        character: Character,
    ): Deal[] {

        const brokerRelationsSkillLevel = character.skills
            .filter((skill) => skill.skillId === 3446)[0]
            .activeSkillLevel;
        const accountingSkillLevel = character.skills
            .filter((skill) => skill.skillId === 16622)[0]
            .activeSkillLevel;

        const stationIsNpc = false; // TODO: retrieve this from the current structure info
        let brokerFee;
        if (stationIsNpc) {
            const npcStructureBrokerFee = 0.05; // TODO: retrieve this from the current structure info
            brokerFee = npcStructureBrokerFee - 0.003 * brokerRelationsSkillLevel;
        } else {
            const firstImperialPalaceBrokerFee = 0.02;  // TODO: retrieve from current structure
            brokerFee = firstImperialPalaceBrokerFee;
        }

        const salesTax = DealFinder.BASE_SALES_TAX * (1 - 0.011 * accountingSkillLevel);

        const buyFeeAndTaxRate = brokerFee;
        const sellFeeAndTaxRate = brokerFee + salesTax;

        let deals: Deal[] = [];

        for (const [typeId, historicalDatum] of Object.entries(historicalData)) {

            const volume = DealFinder.MAX_ORDER_DAYS * Math.min(historicalDatum.avgDailyBuyVol, historicalDatum.avgDailySellVol);
            let buyPrice = DealFinder.MIN_BUY_PRICE;
            if (currentPrices[typeId]?.maxBuy) {
                buyPrice = Math.max(buyPrice, 1.001 * currentPrices[typeId].maxBuy);
            }
            let sellPrice = DealFinder.HISTORICAL_SELL_FACTOR * historicalDatum.maxPrice;
            if (currentPrices[typeId]?.minSell) {
                sellPrice = Math.min(sellPrice, 0.999 * currentPrices[typeId].minSell);
            }
            const buyFeeAndTax = Math.max(100, volume * buyPrice * buyFeeAndTaxRate);
            const sellFeeAndTax = Math.max(100, volume * sellPrice * sellFeeAndTaxRate);
            const fees = buyFeeAndTax + sellFeeAndTax;
            const type = this.types.find((type) => type.typeId === Number(typeId));
            deals.push(new Deal(type, volume, buyPrice, sellPrice, fees));
        }
        return deals;
    }

    private scaleOrFilterByAffordability(deals: Deal[], walletBalance: number) {
        const affordableDeals: Deal[] = [];
        for (const deal of deals) {
            if (deal.volume * deal.buyPrice + deal.fees > walletBalance) {
                const feePerUnit = deal.fees / deal.volume;
                const maxVolume = Math.floor(walletBalance / (deal.buyPrice + feePerUnit));
                if (maxVolume > 0) {
                    affordableDeals.push(new Deal(
                        deal.type,
                        maxVolume,
                        deal.buyPrice,
                        deal.sellPrice,
                        deal.fees * maxVolume / deal.volume
                    ));
                }
            } else {
                affordableDeals.push(new Deal(
                    deal.type,
                    deal.volume,
                    deal.buyPrice,
                    deal.sellPrice,
                    deal.fees
                ));
            }
        }
        return affordableDeals;
    }

    private async getMarketOrdersInStructure(structureId: number): Promise<EveOrder[]> {

        const response = await this.authenticatorService.requestWithAuth(
            'get',
            `https://esi.evetech.net/latest/markets/structures/${structureId}`,
        );
        const orders = (<EveOrder[]>response.body).map((order) => ({
            ...order,
            issued: new Date(order.issued)
        }));
        return orders;

    }

    refreshToken() {
        return new Promise((resolve, reject) => {

            let char_id = this.getIdOfActiveCharacter();
            if (!char_id) {
                return reject();
            }
            let options = {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    //   'Content-Type': 'application/json',
                },
                method: 'GET',
            };
            fetch(`${ip.REDIRECTURI}api/characters/${char_id}/this.refreshToken`, options)
                .then(response => response.text())
                .then(data => {
                    if (!ip.accessToken) ip.accessToken = {};
                    ip.accessToken.tokenString = data;
                    ip.accessToken.expiryTimestamp = Date.now() + 1199 * 1000;
                    fakeLocalStorage.setItem('mostRecentAccessToken', JSON.stringify(ip.accessToken));
                    return resolve();
                });
        });
    }

    getIdOfActiveCharacter() {
        return ip.charData.id;
    }

    // Retrieve the character's id, which is used for all other functions.
    getCharId() {
        this.consoleAndStatus('Retrieving character id...');

        return new Promise((resolve, reject) => {

            let options = {
                headers: { Authorization: 'Bearer ' + ip.accessToken.tokenString },
                method: 'get',
            };

            fetch('https://esi.tech.ccp.is/verify/', options)
                .then(response => {
                    if (response == undefined || !response.ok) {
                        this.consoleAndStatus('Encountered id retrieval error. Retrying in ' + ip.WAITDELAY + ' seconds...');
                        window.setTimeout(() => {
                            this.getCharId().then(() => resolve());
                        }, ip.WAITDELAY * 1000);
                    } else {
                        response.json()
                            .then(data => {
                                ip.charData.id = data.CharacterID;
                                resolve();
                            });
                    }
                });
        });
    }

    // Retrieve data from CCP.
    async retrieveData(): Promise<void> {
        await Promise.all([
            this.getCharOrders(ip.charData.id),
            this.getCharSkills(ip.charData.id),
            this.getCharStats(ip.charData.id),
            this.getCharTransactions(ip.charData.id),
            this.getCharWalletBal(ip.charData.id),
            this.getCurrentLocation(ip.charData.id),
            this.getReprocessedValues(),
            this.getCurrentPrices(undefined)
        ]);
    }

    // Get the current location of the character.
    getCurrentLocation(characterId) {
        return new Promise((resolve, reject) => {
            this.consoleAndStatus('Getting location info...');

            this.getCharacterLocation(characterId)
                .then((data) => this.getSolarSystemInfo(data.solar_system_id))
                .then((data: any) => this.getConstellationInfo(data.constellation_id))
                .then((data) => resolve());
        });
    }

    // Get solar system info.
    getCharacterLocation(characterId) {
        this.consoleAndStatus('Getting character location...');
        let options: any = OPTS;
        options.token = ip.accessToken.tokenString;
        return this.wrapperForFetch(
            ip.esiApis.location,
            'getCharactersCharacterIdLocation',
            characterId,
            options
        ).then((response: any) => {
            if (!response.data.structure_id) {
                this.consoleAndStatus('Please dock your character the station in which you want to trade.');
                return new Error('Character is not docked.');
            } else {
                ip.structureId = response.data.structure_id;
                return response.data;
            }
        });
    }

    // Get solar system info.
    getSolarSystemInfo(solarSystemId) {
        return new Promise((resolve, reject) => {
            this.consoleAndStatus('Getting solar system info...');
            let options = OPTS;
            // options.token = ip.accessToken.tokenString;
            return this.wrapperForFetch(
                ip.esiApis.universe,
                'getUniverseSystemsSystemId',
                solarSystemId,
                options)
                .then((response: any) => {
                    resolve(response.data);
                })
        });
    }

    // Get constellation info.
    getConstellationInfo(constellationId) {
        return new Promise((resolve, reject) => {
            this.consoleAndStatus('Getting constellation info...');
            let options = OPTS;
            // options.token = ip.accessToken.tokenString;
            return this.wrapperForFetch(
                ip.esiApis.universe,
                'getUniverseConstellationsConstellationId',
                constellationId,
                options)
                .then((response: any) => {
                    ip.regionId = response.data.region_id;
                    resolve(response.data);
                })
        });
    }

    getReprocessedValues() {
        return new Promise((resolve, reject) => {
            this.consoleAndStatus('Downloading reprocessing data...');
            let options = {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    //   'Content-Type': 'application/json',
                },
                method: 'GET',
            };
            fetch(`${ip.REDIRECTURI}api/types/materialsIndex`, options)
                .then(response => response.text())
                .then(dataString => JSON.parse(dataString))
                .then(data => {
                    ip.reprocessingData = data;
                    return resolve();
                });
        });
    }

    buildItemList() {
        if (dataIsFresh) return Promise.resolve();

        return new Promise((resolve, reject) => {

            this.consoleAndStatus('Building item list...');

            let allOrders = marketData[ip.structureId].orders;
            itemData = {};

            for (let i = 0; i < allOrders.length; i += 1) {

                let order = allOrders[i];
                let typeId = order.type_id;

                if (!itemData[typeId]) {
                    itemData[typeId] = {};
                    itemData[typeId].typeId = typeId;
                    itemData[typeId].buyOrders = 0;
                    itemData[typeId].sellOrders = 0;
                }

                if (order.is_buy_order) {
                    itemData[typeId].buyOrders += 1;

                    if (!itemData[typeId].maxBuy || (order.price > itemData[typeId].maxBuy)) {
                        itemData[typeId].maxBuy = order.price;
                    }
                } else {
                    itemData[typeId].sellOrders += 1;

                    if (!itemData[typeId].minSell || (order.price < itemData[typeId].minSell)) {
                        itemData[typeId].minSell = order.price;
                    }
                }
                this.status('Processed data... Order ' + (i + 1) + ' of ' + allOrders.length);
            }
            fakeLocalStorage.setItem('itemData', JSON.stringify(itemData));
            maxId = Math.max(...Object.keys(itemData).map((key) => Number(key)));
            resolve();
        });
    }

    removeAlreadyTrading() {
        this.consoleAndStatus('Omitting items already being traded...');
        return new Promise((resolve, reject) => {
            let id;
            for (let i = 0; i < ip.charData.alreadyTrading.length; i += 1) {
                id = ip.charData.alreadyTrading[i];
                if (itemData[id]) {
                    delete itemData[id];
                }
            }
            resolve();
        });
    }

    removeExpiredItems() {
        return new Promise((resolve, reject) => {
            for (let typeId in itemData) {
                if (typeNames[typeId].toLowerCase().includes('expired') && itemData[typeId]) {
                    delete itemData[typeId];
                }
            }
            maxId = Math.max(...Object.keys(itemData).map((key) => Number(key)));
            resolve();
        });
    }

    // Save the downloaded data.
    saveAndOverwrite() {
        return new Promise((resolve, reject) => {

            if (dataIsFresh) {
                return resolve();
            }
            this.consoleAndStatus('Saving...');
            //ip.charData.timestamp = Date.now();
            //fakeLocalStorage.setItem(ip.charData.id, JSON.stringify(ip.charData));
            fakeLocalStorage.setItem('typeNames', JSON.stringify(typeNames));
            fakeLocalStorage.setItem('itemVolHistory', JSON.stringify(itemVolHistory));
            //fakeLocalStorage.setItem('itemData', JSON.stringify(itemData));
            resolve();
        });
    }

    // Print the results.
    printResults() {
        return new Promise((resolve, reject) => {

            console.log(this.suggestedDeals);

            resolve();
        });
    }

    // Send to the console and also update the status shown on the page.
    consoleAndStatus(content) {
        if (verbose) {
            this.status(content);
        }
        console.log(content);
    }

    // Update the status shown on the page.
    status(content) {
        // no op
    }

    // Used to call functions that could return an error due to bad server response.
    wrapperForFetch(api, fetchFunctionName, ...fetchArgs) {
        return new Promise((resolve, reject) => {
            let result;
            api[fetchFunctionName](...fetchArgs, (error, data, response) => {
                result = { error: error, data: data, response: response };
                resolve(result);
            });
        }).then((result: any) => {
            return new Promise((resolve, reject) => {
                if (!result.response || Math.floor(result.response.status / 100) == 5) {
                    this.consoleAndStatus('Encountered server-side 5xx error.\nRetrying in ' + ip.WAITDELAY + ' seconds...');
                    window.setTimeout(() => {
                        resolve(this.wrapperForFetch(api, fetchFunctionName, ...fetchArgs));
                    }, ip.WAITDELAY * 1000);
                } else if (result.response.status == 404) {
                    // Remove this item from the data.
                    reject(404);
                } else {
                    resolve(result);
                }
            });
        });
    }

    loadTypeNames() {
        return new Promise((resolve, reject) => {
            let typeNamesString = fakeLocalStorage.getItem('typeNames');
            if (typeNamesString == null || typeNamesString == 'undefined') {
                typeNames = {};
            } else {
                typeNames = JSON.parse(fakeLocalStorage.getItem('typeNames'))
            }
            return resolve();
        });
    }

    // ---- Beginning of Standard Eve API Requests ---- //

    // Use character id to get character stats.
    getCharStats(characterId) {
        if (dataIsFresh) return Promise.resolve();

        return new Promise(function (resolve, reject) {
            this.consoleAndStatus('Downloading character stats...');
            ip.esiApis.character.getCharactersCharacterId(characterId, {}, (error, data, response) => {
                if (!response.ok) {
                    reject(response.statusText);
                } else {
                    ip.charData.charStats = data;
                    resolve();
                }
            });
        });
    }

    // Use character id to get character orders.
    getCharOrders(characterId) {
        //if (dataIsFresh) return Promise.resolve();

        this.consoleAndStatus('Downloading character orders...');
        let options: any = OPTS;
        options.token = ip.accessToken.tokenString;
        return this.wrapperForFetch(ip.esiApis.market, 'getCharactersCharacterIdOrders', characterId, options)
            .then((response: any) => {
                ip.charData.usedOrders = response.data.length;
                ip.charData.additionalIskToCover = 0;
                ip.charData.alreadyTrading = [];
                for (let i = 0; i < response.data.length; i += 1) {
                    if (response.data[i].is_buy_order) {
                        ip.charData.additionalIskToCover += (response.data[i].price * response.data[i].volume_remain - response.data[i].escrow);
                    }
                    ip.charData.alreadyTrading.push(response.data[i].type_id);
                }
            });
    }

    // Use character id to get character skills.
    getCharSkills(characterId) {
        //if (dataIsFresh) return Promise.resolve();

        this.consoleAndStatus('Downloading character skills...');
        let options: any = OPTS;
        options.token = ip.accessToken.tokenString;
        return this.wrapperForFetch(ip.esiApis.skills, 'getCharactersCharacterIdSkills', characterId, options)
            .then((response: any) => {
                ip.charData.skills = response.data.skills;
            });
    }

    // Use character id to get character transactions.
    getCharTransactions(characterId) {
        if (dataIsFresh) return Promise.resolve();

        return new Promise(function (resolve, reject) {
            this.consoleAndStatus('Downloading character transactions...');
            let options: any = OPTS;
            options.token = ip.accessToken.tokenString;
            ip.esiApis.wallet.getCharactersCharacterIdWalletTransactions(characterId, options, (error, data, response) => {
                if (error) {
                    reject(response.statusText);
                } else {
                    ip.charData.charTransactions = data;
                    resolve();
                }
            });
        });
    }

    // Use character id to get character wallet balance.
    getCharWalletBal(characterId) {
        this.consoleAndStatus('Downloading character wallet balance...');
        let options: any = OPTS;
        options.token = ip.accessToken.tokenString;
        return this.wrapperForFetch(
            ip.esiApis.wallet,
            'getCharactersCharacterIdWallet',
            characterId,
            options
        ).then((response: any) => {
            ip.charData.walletBal = response.data;
        });
    }

    readSkills() {
        //if (dataIsFresh) {return Promise.resolve();}

        this.consoleAndStatus('Calculating, taxes, fees, and available orders...');
        return new Promise((resolve, reject) => {
            ip.charData.salesTax = 0.02;
            ip.charData.brokerFees = 0.03;
            ip.charData.availOrders = 5;
            for (let i = 0; i < ip.charData.skills.length; i += 1) {
                switch (ip.charData.skills[i].skill_id) {
                    case 3443: // Trade
                        ip.charData.availOrders += 4 * ip.charData.skills[i].trained_skill_level;
                        break;
                    case 3444: // Retail
                        ip.charData.availOrders += 8 * ip.charData.skills[i].trained_skill_level;
                        break;
                    case 16596: // Wholesale
                        ip.charData.availOrders += 16 * ip.charData.skills[i].trained_skill_level;
                        break;
                    case 18580: // Tycoon
                        ip.charData.availOrders += 32 * ip.charData.skills[i].trained_skill_level;
                        break;
                    case 16622: // Accounting
                        ip.charData.salesTax -= 0.10 * ip.charData.salesTax * ip.charData.skills[i].trained_skill_level;
                        break;
                    case 3446: // Broker Relations
                        ip.charData.brokerFees -= 0.001 * ip.charData.skills[i].trained_skill_level;
                        break;
                }
            }

            ip.charData.buyFeeAndTax = ip.charData.brokerFees;
            console.log("Buy fee and tax = " + ip.charData.buyFeeAndTax);
            ip.charData.sellFeeAndTax = ip.charData.brokerFees + ip.charData.salesTax;
            console.log("Sell fee and tax = " + ip.charData.sellFeeAndTax);

            ip.charData.availOrders -= ip.charData.usedOrders;
            ip.charData.availOrders -= RESERVEDORDERS;
            ip.charData.availOrders = Math.max(0, ip.charData.availOrders);
            console.log("Available orders to use = " + ip.charData.availOrders);
            resolve();
        });
    }

    fillDataGaps() {
        return new Promise((resolve, reject) => {
            for (let typeId in itemData) {
                if (!itemData[typeId].maxBuy) itemData[typeId].maxBuy = 0;
                if (!itemData[typeId].minSell) itemData[typeId].minSell = 0;
                if (!itemData[typeId].margin) itemData[typeId].margin = 0;
                if (!itemVolHistory[ip.regionId][typeId].avgBuyVol) itemVolHistory[ip.regionId][typeId].avgBuyVol = 0;
                if (!itemVolHistory[ip.regionId][typeId].avgSellVol) itemVolHistory[ip.regionId][typeId].avgSellVol = 0;
                if (!itemData[typeId].buyOrders) itemData[typeId].buyOrders = 0;
                if (!itemData[typeId].sellOrders) itemData[typeId].sellOrders = 0;
                if (!itemData[typeId].score) itemData[typeId].score = 0;
            }
            resolve();
        });
    }

    calcIskToInvest() {
        return new Promise((resolve, reject) => {
            console.log('Calculating investable ISK...');

            // TODO Also subtract value of most expensive ship + associated fittings.
            ip.charData.iskToInvest = Math.max(0, ip.charData.walletBal - ip.charData.additionalIskToCover);
            console.log("Isk to invest = " + ip.charData.iskToInvest);

            resolve();
        });
    }

    calcScores() {
        console.log('Calculating item scores...');
        const p = [];
        for (let typeId in itemData) {
            p.push(this.reprocessedValue(typeId).then((reprocessedValue: number) => {
                itemData[typeId].this.reprocessedValue = this.reprocessedValue;
                itemData[typeId].priceFloor = Math.max(itemData[typeId].maxBuy + 0.01, reprocessedValue * 0.67);
                itemData[typeId].priceCeiling = itemData[typeId].minSell == 0 ? itemVolHistory[ip.regionId][typeId].maxPrice * 1.05 : itemData[typeId].minSell - 0.01;
                itemData[typeId].margin = itemData[typeId].priceCeiling * (1 - TAXFEEFACTOR * ip.charData.sellFeeAndTax) - itemData[typeId].priceFloor * (1 + TAXFEEFACTOR * ip.charData.buyFeeAndTax);
                let maxBuyPossible = Math.floor(ip.charData.iskToInvest / (itemData[typeId].priceFloor * (1 + ip.charData.buyFeeAndTax)));
                let maxSuggested = ORDER_DAYS * Math.min(itemVolHistory[ip.regionId][typeId].avgBuyVol / (itemData[typeId].buyOrders + 1), itemVolHistory[ip.regionId][typeId].avgSellVol / (itemData[typeId].sellOrders + 1));
                itemData[typeId].amountToBuy = Math.min(maxBuyPossible, maxSuggested);
                itemData[typeId].score = itemData[typeId].margin * itemData[typeId].amountToBuy;
                itemData[typeId].amountToBuy = Math.ceil(itemData[typeId].amountToBuy);
                itemData[typeId].profitRatio = itemData[typeId].score / itemData[typeId].priceFloor;
            }));
        }
        return Promise.all(p);
    }

    reprocessedValue(feedTypeId) {
        return new Promise((resolve, reject) => {
            let reprocessedValue = 0;
            let productPrice;
            for (let productTypeId in ip.reprocessingData[feedTypeId]) {
                if (itemData[productTypeId]) {
                    if (itemData[productTypeId].minSell) {
                        productPrice = itemData[productTypeId].minSell;
                    } else if (itemData[productTypeId].maxBuy) {
                        productPrice = itemData[productTypeId].maxBuy;
                    } else {
                        productPrice = 0;
                    }
                    const productQuantity = ip.reprocessingData[feedTypeId][productTypeId];

                    reprocessedValue += productQuantity * productPrice;
                }
            }
            if (ip.reprocessingData[feedTypeId]) {
                reprocessedValue /= ip.reprocessingData[feedTypeId].feedQuantity;
            }
            return resolve(this.reprocessedValue);
        });
    }


    async suggestOrders(): Promise<Deal[]> {
        this.consoleAndStatus('Determining orders to suggest...');

        const allResults = [];
        for (let typeId in itemData) {
            allResults.push(itemData[typeId]);
        }
        allResults.sort((a, b) => {
            return a.score > b.score ? -1 : 1;
        });

        let bestRoster = [];
        let currentRoster = [];
        let bestScore = 0;
        let currentScore = 0;
        let i = 0;
        let iskUsed;
        let ordersUsed = 0;

        let remainingBudget = ip.charData.iskToInvest;

        while ((i < allResults.length) && (ordersUsed < ip.charData.availOrders)) {
            if (this.totalCost(allResults[i]) <= remainingBudget) {
                currentRoster.push(allResults[i]);
                ordersUsed += 1;
                remainingBudget -= this.totalCost(allResults[i])
            }
            i += 1;
        }

        iskUsed = currentRoster.reduce((accum, currentItem) => accum + this.totalCost(currentItem), 0);
        let expectedProfit = currentRoster.reduce((accum, currentItem) => accum + currentItem.score, 0);
        this.suggestedDeals = currentRoster;
        console.log('ISK used = ' + iskUsed);
        console.log('Expected profit = ' + expectedProfit + ' (' + (expectedProfit / iskUsed * 100) + '%).');
        return this.suggestedDeals;
    }

    totalCost(item) {
        return item.priceFloor * (1 + ip.charData.buyFeeAndTax) * item.amountToBuy;
    }

    getTypeNames() {
        this.consoleAndStatus('Getting remaining typeNames...');
        return new Promise((resolve, reject) => {
            let p = Promise.resolve();
            for (let typeId in itemData) {
                if (!typeNames[typeId]) {
                    p = p.then(() => this.getTypeName(typeId))
                        .then(name => {
                            typeNames[typeId] = name;
                            this.checkForExpired(typeId);
                            fakeLocalStorage.setItem('typeNames', JSON.stringify(typeNames));
                        });
                } else {
                    this.checkForExpired(typeId);
                }
            }
            resolve(p);
        }).then((p) => {
            return p;
        });
    }

    checkForExpired(typeId) {
        if (typeNames[typeId].toLowerCase().includes('expired')) {
            delete itemData[typeId];
        } else {
            itemData[typeId].typeName = typeNames[typeId];
        }
    }

    getTypeName(typeId) {
        let options = OPTS;
        return this.wrapperForFetch(ip.esiApis.universe, 'getUniverseTypesTypeId', typeId, options)
            .then((response: any) => {
                typeNames[typeId] = response.data.name;
                this.status('Retrieved name of ' + typeNames[typeId] + '\n(item ' + typeId + ' of ' + maxId + ').');
                return typeNames[typeId];
            });
    }

}
