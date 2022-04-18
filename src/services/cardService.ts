import * as faker from "@faker-js/faker";
import * as employeeRepository from "../repositories/employeeRepository.js";
import * as cardRepository from "../repositories/cardRepository.js";
import * as paymentRepository from "../repositories/paymentRepository.js";
import * as rechargeRepository from "../repositories/rechargeRepository.js";
import * as businessRepository from "../repositories/businessRepository.js";
import { TransactionTypes } from "../repositories/cardRepository.js";
import dayjs from "dayjs";
import bcrypt from "bcrypt";
import "dotenv/config";

/*GET FUNCTIONS*/
async function getEmployee(
    employeeId: number
) {
    const employee = employeeRepository.findById(employeeId);

    return employee;
}

async function getCard(
    id: number
) {
    const card = await cardRepository.findById(id)
    if (!card) {
        throw { error_type: "not_found_error", message: "Card not found" }
    }
    return card;
}

export async function getBalance(
    id: number
) {
    await getCard(id)
    const payments = await getPayments(id)
    const recharges = await getRecharges(id)
    const totalRecharges = getAmountRecharges(recharges)
    const totalPayments = getAmountPayments(payments)
    const balance = totalRecharges - totalPayments
    return {
        balance,
        payments,
        recharges,
    }
}

async function getBusiness(
    id: number
) {
    const business = await businessRepository.findById(id);

    if (!business) {
        throw { error_type: "not_found", message: "Card not found" }
    }

    return business;
}

async function getRecharges(
    id: number
) {
    const cardInfos = await rechargeRepository.findByCardId(id);
    const formattedTimestamp = cardInfos.map((info: any) => ({
        ...info,
        timestamp: dayjs(info.timestamp).format("DD/MM/YYYY")
    }))

    return formattedTimestamp;
}

function getAmountPayments(arr: any) {
    return arr.reduce((total: number, item: any) => item.amount + total, 0);
}

function getAmountRecharges(arr: any) {
    return arr.reduce((total: number, item: any) => item.amount + total, 0);
}

async function getPayments(
    id: number
) {
    const cardInfos = await paymentRepository.findByCardId(id);
    const formattedTimestamp = cardInfos.map((info: any) => ({
        ...info,
        timestamp: dayjs(info.timestamp).format("DD/MM/YYYY")
    }))

    return formattedTimestamp;
}

/*GET FUNCTIONS END*/

export async function createCard(
    apiKey: string,
    employeeId: number,
    type: TransactionTypes
) {
    const employee = await getEmployee(employeeId);

    if (!employee) {
        throw { error_type: "not_found_error", message: "Employee not found" }
    }

    const validateCardType = await verifyIfCardTypeExist(employeeId, type)

    if (validateCardType) {
        throw { type: "conflict", message: "Card type already in use" }
    }

    const number: string = generateCardNumber();
    const cardholderName: string = nameFormatter(employee.fullName);
    const expirationDate: string = dateFormatter();
    const securityCode: string = generateCVC();

    return await cardRepository.insert({
        employeeId,
        number,
        cardholderName,
        securityCode,
        expirationDate,
        isVirtual: false,
        originalCardId: null,
        isBlocked: true,
        type,
    })
}

async function verifyIfCardTypeExist(
    employeeId: number,
    type: TransactionTypes,
) {
    const card = cardRepository.findByTypeAndEmployeeId(type, employeeId);

    return card;
}

export async function activateCard(
    id: number,
    securityCode: string,
    password: string
) {
    const card = await getCard(id);
    const hashedPassword: string = encryptPassword(password);

    verifyExpireDate(card.expirationDate);
    verifyPasswordExist(card.password);
    verifySecurityCode(card.securityCode, securityCode);
    validPassword(password);

    return await cardRepository.update(id, { ...card, password: hashedPassword, isBlocked: false });
}

function verifyExpireDate(
    expirationDate: string
) {
    const formatedExpirationDate = `${expirationDate.split("/")[0]}/01/${expirationDate.split("/")[1]}`

    if (dayjs(formatedExpirationDate).isBefore(dayjs())) {
        throw { error_type: "bad_request", message: "Card is expired" }
    }

    return;
}

function verifyPasswordExist(
    password: string
) {
    if (password !== null) {
        throw { error_type: "bad_request", message: "Card already activated" };
    }
}

function verifyPassword(
    password: string,
    passwordUser: string
) {
    if (bcrypt.compareSync(passwordUser, password)) {
        return;
    }

    throw { error_type: "auth_error", message: "password error" };
}

export async function recharge(
    cardId: number,
    amount: number,
) {
    const card = await getCard(cardId);

    verifyExpireDate(card.expirationDate);

    await rechargeRepository.insert({ cardId, amount });
    return;
}

function verifySecurityCode(
    securityCode: string,
    securityCodeUser: string,
) {
    if (bcrypt.compareSync(securityCodeUser, securityCode)) {
        return;
    }

    throw { error_type: "auth_error", message: "CVV error" };
}

function validPassword(
    password: string

) {
    const regex = /[0-9]{4}/;

    if (password.match(regex) === null) {
        throw { error_type: "bad_request", message: "Password require 4 numbers" }
    }

    return;
}

function encryptPassword(password: string) {
    return bcrypt.hashSync(password, 10);
}

async function validTransaction(
    business: any,
    card: any,
    amount: number,
) {
    const payments = await getPayments(card.id);
    const recharges = await getRecharges(card.id);
    const totalRecharges = getAmountRecharges(recharges);
    const totalPayments = getAmountPayments(payments);
    const balance = totalRecharges - totalPayments;

    if (balance < amount) {
        throw { error_type: "bad_request", message: "Insufficient balance" }
    }

    if (business.type !== card.type) {
        throw { error_type: "bad_request", message: "Business type and Card type do not match" }
    }

    return;
}

export async function payment(
    cardId: number,
    password: string,
    businessId: number,
    amount: number,
) {
    const card = await getCard(cardId);
    const business = await getBusiness(businessId);

    verifyExpireDate(card.expirationDate);

    verifyPassword(card.password, password);

    await validTransaction(business, card, amount);
    await paymentRepository.insert({ cardId, businessId, amount });

    return;
}

function generateCVC() {
    const CVV = faker.faker.finance.creditCardCVV();
    console.log(CVV);

    return bcrypt.hashSync(CVV, 10);
}

function generateCardNumber() {
    return faker.faker.finance.creditCardNumber('mastercard');
}

function nameFormatter(name: string) {
    const newNameArr = name.split(' ');

    let newNamehash = {};

    for (let i = 0; i < newNameArr.length; i++) {
        if (newNameArr[i].length < 3) {
            continue;
        }
        if (i !== 0 || i !== newNameArr.length - 1) {
            newNamehash[newNameArr[i]] = newNameArr[i][0].toUpperCase();
        }
        if (i === 0) {
            newNamehash[newNameArr[i]] = newNameArr[i].toUpperCase();
        }
        if (i === newNameArr.length - 1) {
            newNamehash[newNameArr[i]] = newNameArr[i].toUpperCase();
        }
    }

    name = Object.values(newNamehash).join(" ");

    return name;
}

function dateFormatter() {
    return dayjs().add(5, "years").format("MM/YY");
}