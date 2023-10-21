import express from 'express';

export namespace Gen {
    export interface User extends Profile {
        username: string,
        email: string,
        password: string,
        expenses: Expense[],
        categories: Category[],
        Income: Income[],
    }
    export interface Expense {
        id: string,
        title: string,
        amount: number,
        expenseDate: Date,
        description: string,
        category?: string,
        user: User,
        picURL?: string,
        currency?: string
    }
    export interface Category {
        id: string,
        title: string,
        description: string,
        user: User,
    }
    export interface Income {
        id: string,
        title: string,
        amount: number,
        incomeDate: Date,
        description: string,
        user: User,
    }
    export interface Profile {
        id: string,
        firstName: string,
        lastName: string,
        phoneNumber: string,
        Currency: string,
        subscription: string,
    }

    export interface DecodedPayload {
        id: string,
        email: string,
        username: string,
    }

    export interface card {
        cardName: string,
        cardNumber: number,
        card_token: string,
        cardExp: Date,
        card_cvc: number,
        amount: number,
    }
}