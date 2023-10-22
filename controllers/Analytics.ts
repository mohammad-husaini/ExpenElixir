import express from 'express';
import {Expense} from '../db/entities/Expense.js';
import {ChatGPTAPI} from 'chatgpt';

const getExpensesByCategory = async (res: express.Response): Promise<{category: string, amount: number}[]>=> {
    console.log(res.locals.user.expenses);
    const expensesByCategory: { [key: string]: number } = {};
    const result: {category: string, amount: number}[] = [];
    res.locals.user.expenses.forEach((expense: Expense)=> {
        if (expense.category) {
            if (expensesByCategory[expense.category.title]) {
                expensesByCategory[expense.category.title] += expense.amount;
            } else {
                expensesByCategory[expense.category.title] = expense.amount;
            }
        }
    });
    for(const [category,amount] of Object.entries(expensesByCategory)) {
        result.push({category,amount});
    }
    return result;
}

const isValidDate = (date: string): boolean => {
    return !isNaN(Date.parse(date));
}

const sortQueryByAmount = (result:{category: string, amount: number}[]): { category: string, amount: number }[]=> {
    return result.sort((a, b) => b.amount - a.amount);
}

const makeGraphicalData = (data: {category: string, amount: number}[]) => { // simple function for making the impossible graphical presentation of the data in a backend app ;O
    const maxValue = Math.max(...data.map(d => d.amount)); // just doin' some scales
    const unitValue = maxValue / 50;

    let graphicalData = 'Expense by Categroy:\n';

    data.forEach(iterator => {
        const barLength = Math.floor(iterator.amount/ unitValue);
        const bar = '='.repeat(barLength);
        graphicalData += `${iterator.category.padEnd(20, ' ')} | ${bar} ${iterator.amount}\n`;
    });
    return graphicalData;
}

const getAdvice = async (graph : string): Promise<string> => {
    const api = new ChatGPTAPI({apiKey: process.env.CHATGPTAPI_SECRET_KEY || ''});

    const res = await api.sendMessage(`I will give you a graph showing 3 things, first off it's a very simple ascii graph showing your expenses by category, secondly it shows your income by category and lastly it shows your total expenses and income. I want you to give me 2 thngs. first off. answer these questions respectively: first question is: did I spend too much money? second: what do you adivse me to do? and then give me a graph showing your expenses by category. Here is the graph ${graph}`)
    return res.text.toString();
}

export {
    getExpensesByCategory,
    isValidDate,
    sortQueryByAmount,
    makeGraphicalData,
    getAdvice,
}