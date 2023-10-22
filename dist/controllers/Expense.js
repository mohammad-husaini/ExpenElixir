import dataSource from "../db/dataSource.js";
import { Expense } from "../db/entities/Expense.js";
import { Users } from '../db/entities/Users.js';
import { Category } from '../db/entities/Category.js';
import { decodeToken } from './Income.js';
import { CustomError } from '../CustomError.js';
import { currencyConverterFromOtherToUSD, currencyConverterFromUSDtoOther } from '../utils/currencyConverter.js';
const insertExpense = async (payload, req, picFile) => {
    try {
        const decode = decodeToken(req);
        return dataSource.manager.transaction(async (trans) => {
            const newExpense = Expense.create({
                title: payload.title,
                amount: await currencyConverterFromOtherToUSD(Number(payload.amount), payload.currencyType || "USD"),
                expenseDate: payload.expenseDate,
                description: payload.description,
                picURL: picFile?.location,
            });
            await trans.save(newExpense);
            const user = await Users.findOne({
                where: { id: decode?.id },
                relations: ["expenses"],
            });
            if (!user) {
                throw new CustomError(`User not found.`, 404);
            }
            const category = await Category.findOne({
                where: { id: payload.category },
                relations: ["expenses"],
            });
            if (!category) {
                throw new CustomError(`Category not found.`, 404);
            }
            user.expenses.push(newExpense);
            category.expenses.push(newExpense);
            await trans.save(user);
            await trans.save(category);
        });
    }
    catch (err) {
        if (err instanceof CustomError)
            throw err;
        throw new CustomError(`Internal Server Error`, 500);
    }
};
const deleteAllExpenses = async (req) => {
    const decode = decodeToken(req);
    return dataSource.manager.transaction(async (trans) => {
        const user = await Users.findOneOrFail({
            where: { id: decode?.id },
            relations: ["expenses"],
        });
        await Expense.delete({ users: user.id });
    });
};
const deleteExpense = async (id, req) => {
    try {
        const expense = await Expense.findOne({ where: { id } });
        if (!expense)
            throw new CustomError(`Expense with id: ${id} was not found!`, 404);
        await Expense.remove(expense);
        return expense;
    }
    catch (err) {
        if (err instanceof CustomError)
            throw err;
        throw new CustomError(`Internal Server Error`, 500);
    }
};
const totalExpenses = async (req) => {
    const decode = decodeToken(req);
    const user = await Users.findOne({
        where: { id: decode?.id }
    });
    const expenseList = user?.expenses;
    const total = expenseList ? expenseList.reduce((acc, expense) => acc + expense.amount, 0) : 0;
    return total;
};
const getExpenses = async (req, res) => {
    try {
        const expense = await Users.findOne({
            where: { id: res.locals.user.id },
            relations: ['expenses'],
        });
        if (!expense)
            throw new CustomError('User not found', 404);
        const expenseOnProfileCurrency = await Promise.all(expense.expenses.map(async (expense) => {
            const amount = await currencyConverterFromUSDtoOther(expense.amount, res.locals.user.profile.Currency);
            return { ...expense, amount };
        }));
        return expenseOnProfileCurrency;
    }
    catch (err) {
        if (err instanceof CustomError) {
            throw new CustomError(err.message, err.statusCode);
        }
        throw new CustomError(`Internal Server Error`, 500);
    }
};
const getFilteredExpenses = async (req, res) => {
    try {
        const userId = req.cookies['userId'];
        const search = req.query.search?.toString().toLowerCase() || '';
        const minAmount = Number(req.query.minAmount) || 0;
        const maxAmount = Number(req.query.maxAmount) || Infinity;
        const expense = await Users.findOne({
            where: { id: userId },
            relations: ['expenses'],
        });
        if (!expense)
            throw new CustomError('User not found', 404);
        const filteredExpenses = expense.expenses.filter(expense => {
            return expense.amount >= minAmount && expense.amount <= maxAmount &&
                expense.title.toLowerCase().includes(search);
        });
        const expenseOnProfileCurrency = await Promise.all(filteredExpenses.map(async (expense) => {
            const amount = await currencyConverterFromUSDtoOther(expense.amount, res.locals.user.profile.Currency);
            return { ...expense, amount };
        }));
        return expenseOnProfileCurrency;
    }
    catch (err) {
        throw err;
    }
};
export { insertExpense, deleteAllExpenses, deleteExpense, totalExpenses, getExpenses, getFilteredExpenses, };
//# sourceMappingURL=Expense.js.map