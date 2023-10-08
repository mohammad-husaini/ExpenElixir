import express from 'express';
import dataSource from "../db/dataSource.js";
import { Users } from "../db/entities/Users.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {Gen} from '../@types/generic.js';

const insertUser = async (payload: Gen.User) => {
    return await dataSource.transaction(async trans => {
        const newUser = Users.create({
            firstName: payload.firstName,
            lastName: payload.lastName,
            email: payload.email,
            username: payload.username,
            password: payload.password,
            phoneNumber: payload.phoneNumber,
        });
        return await trans.save(newUser);
    });
};

const login = async (email: string, password: string) => {
    try {
        const info = await Users.findOne({
            where: {email: email}
        });
        if(info)
        {
            const passMatch = await bcrypt.compare(password, info.password || '');
            if(passMatch)
            {
                const token = jwt.sign({
                    email: info.email,
                    username: info.username,
                    id: info.id,
                },
                process.env.SECRET_KEY || '',
                {
                    expiresIn: '15m'
                })
                return {username: info.username  ,email: email,token};
            }
            else {
                throw("invalid password.")
            }
        }
        else {
            throw("invalid email.");
        }

    } catch(err) {
        throw(`An error occured while trying to log you in. error: ${err}`);
    }
}

const calculateTotalIncome = async (req: express.Request) => {
    try {
        const token = req.cookies["token"];
        const decode = jwt.decode(token,{json: true});
        const user = await Users.findOne({
            where:{email:decode?.email}
        })

        return user?.incomes.reduce((acc, income) => acc + income.amount, 0);
    } 
    catch(err) {
        throw(`Unexpected Error ${err}`);
    }
}


export {
    insertUser,
    login,
    calculateTotalIncome,
}