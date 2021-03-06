/*
* Copyright 2018 PoC-Consortium
*/

import { Injectable } from "@angular/core";
import { Headers, RequestOptions, Response, URLSearchParams } from "@angular/http";
import { HttpClient, HttpHeaders, HttpParams, HttpResponse, HttpEvent } from "@angular/common/http";
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import 'rxjs/add/operator/timeout'

import { Currency, HttpError, constants, SuggestedFees, Settings, Transaction } from "../model";
import { NoConnectionError } from "../model/error";
import { StoreService } from "./store.service";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";

/*
* MarketService class
*
* The MarketService is responsible for getting currency information. (right now, only from coinmarketcap.com)
*/
@Injectable()
export class MarketService {
    public currency: BehaviorSubject<any> = new BehaviorSubject(undefined);
    private nodeUrl: string;
    private marketUrl: string;

    constructor(
        private storeService: StoreService,
        private http: HttpClient
    ) {
        this.updateCurrency().catch(error => {}); 

        this.storeService.settings.subscribe((settings: Settings) => {
            this.nodeUrl = settings.node;
            this.marketUrl = settings.marketUrl;
        });
    }

    public setCurrency(currency: Currency) {
        this.currency.next(currency);
    }

    /*
    * Get Currency Data from coinmarketcap
    * TODO Provide interface, for easy swap of currency data provider
    */
    public updateCurrency(): Promise<Currency> {
        return new Promise((resolve, reject) => {
            let params: HttpParams = new HttpParams();
            let requestOptions = this.getRequestOptions();
            let currency: string;
            if (this.storeService.settings.value.currency != undefined) {
                currency = this.storeService.settings.value.currency;
                params.set("convert", currency);
                requestOptions.params = params;
            }
            return this.http.get(this.marketUrl, requestOptions)
                .timeout(constants.connectionTimeout)
                .toPromise<any>() // todo
                .then(response => {
                    let r = response || [];
                    if (r.length > 0) {
                        // set currency for currency object
                        r[0]["currency"] = currency;
                        let c = new Currency(r[0]);
                        this.setCurrency(c);
                        resolve(c);
                    } 
                })
                .catch(error => {
                    reject(new NoConnectionError("Could not reach market for currency updates. Check your internet connection!"))
                });
        });
    }

    public getSuggestedFees(): Observable<HttpEvent<SuggestedFees>> {
        let params: HttpParams = new HttpParams()
            .set("requestType", "suggestFee");

        let requestOptions = this.getRequestOptions();
        requestOptions.params = params;
        return this.http.get<SuggestedFees>(this.nodeUrl, requestOptions)
            .timeout(constants.connectionTimeout);
    }

    /*
    * Format a coin amount number to 8 decimals and return string with BURST addition
    */
    public formatBurstcoin(coins: number): string {
        if (isNaN(coins)) {
            return "0 BURST";
        } else {
            if (coins % 1 === 0) {
                // whole number
                return coins.toString() + " BURST";
            } else {
                return coins.toFixed(8) + " BURST";
            }
        }
    }

    /*
    * Convert fiat amount to burst amunt
    */
    public convertFiatCurrencyToBurstcoin(amount: number): number {
        return amount / this.currency.value.priceCur;
    }

    /*
    * Format number to 8 decimals string and BTC addition
    */
    public getPriceBTC(coins: number, decimals: number = 8): string {
        if (this.currency.value != undefined) {
            return (coins * this.currency.value.priceBTC).toFixed(decimals) + " BTC";
        } else {
            return "...";
        }
    }

    /*
    * Format fiat amount to Burst amount string with BURST addition
    */
    public getPriceBurstcoin(amount: number): string {
        if (isNaN(amount)) {
            return "0 BURST";
        } else {
            let coins = amount / this.currency.value.priceCur;
            if (coins % 1 === 0) {
                // whole number
                return coins.toString() + " BURST";
            } else {
                return coins.toFixed(8) + " BURST";
            }
        }
    }

    /*
    * Get current price of Burst in BTC
    */
    public getCurrentBurstPriceBTC(): string {
        return this.currency.value ? this.currency.value.priceBTC : ''; 
    }

    public getBurst24hChange(): string {
        return this.currency.value ? this.currency.value.percentChange24h : '';
    }

    /*
    * Format number to 8 decimals string and fiat addition
    */
    public getPriceFiatCurrency(coins: number, decimals: number = 2): string {
        if (this.currency.value != undefined) {
            return (coins * this.currency.value.priceCur).toFixed(decimals) + " " + this.getCurrencySymbol();
        } else {
            return "...";
        }
    }

    /*
    * Get current fiat currency symbol
    */
    public getCurrencySymbol(): string {
        if (this.currency.value != undefined) {
            let currency = constants.currencies.find(c => c.code === this.currency.value.currency);
            if (currency != undefined) {
                return currency.symbol;
            } else {
                this.currency.value.currency.toUpperCase();
            }
        } else {
            return "...";
        }
    }

    /*
    * Helper Method to generate Request options
    */
    public getRequestOptions(): any {
        let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
        let options = { headers: headers };
        return options;
    }

    /*
    * Helper Method to handle HTTP errors
    */
    private handleError(error: Response | any) {
        return Promise.reject(new HttpError(error.json()));
    }

}
