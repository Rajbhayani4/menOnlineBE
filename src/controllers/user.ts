import { Request, Response } from "express";
import { sendResponse } from '../functions/sendResponse';
import models from '../models/index';
import bcrypt from "bcryptjs";
import { geneTokens } from "../functions/JwtToken";
import fs from "fs";
import { fileUpload } from "../functions/fileUpload"


export const SignupUser = async (req: any, res: Response) => {

    const { userName, email, mobile } = req?.body;

    try {
        if (Object.keys(req?.body).length > 0 && req?.body?.mobile.toString().length == 10) {

            await models?.User.findOne({ $and: [{ userName }, { email }, { mobile }] }).then(async (resp: any) => {
                if (resp) sendResponse(res, 200, { message: "User is exist" });
                else {
                    req?.body?.avatar && (req.body.avatar = await fileUpload(req?.body?.avatar));

                    await models?.User.create(req?.body).then(async (result: any) => {
                        const token = await geneTokens({ _id: result?._id.toString() });
                        const otp = Math.floor(1000 + Math.random() * 9000);

                        await models?.Otps.create({ userId: result?._id, mobile, otp, messageFor: "User sign up code" })
                        delete result?._doc?.password;
                        delete result?._doc?.isDeleted;
                        delete result?._doc?.isAdmin;
                        sendResponse(res, 201, { data: result, token });
                    }).catch((error: any) => {
                        sendResponse(res, 401, { message: error?.message });
                    })
                }
            }).catch((error: any) => {
                sendResponse(res, 401, { message: error?.message });
            })

        } else {
            sendResponse(res, 400, { message: "Enter a required fields" });
        }
    } catch (error: any) {
        sendResponse(res, 400, { message: error?.message });
    }
}

export const Login = async (req: any, res: Response) => {
    try {
        // const { userName, email, mobile, password } = req?.body;
        if (Object.keys(req?.body).length > 0) {

            const password: string = req?.body?.password;
            delete req?.body?.password;

            await models?.User.findOne({ ...req.body, isDeleted: false }).then(async (result: any) => {
                if (result) {
                    const isValid = await bcrypt?.compare(password, result?.password);
                    if (isValid) {

                        const token = await geneTokens({ _id: result?._id.toString() });
                        delete result?._doc?.password;
                        delete result?._doc?.isDeleted;
                        delete result?._doc?.isAdmin;

                        sendResponse(res, 200, { data: result, token });
                    } else {
                        sendResponse(res, 400, { message: "Password is incorrect" });
                    }
                }
                else sendResponse(res, 401, { message: "User is not found" });

            }).catch((error: any) => {
                sendResponse(res, 400, { message: error?.message });
            })

        } else {
            sendResponse(res, 400, { message: "Enter a required fields" });
        }
    } catch (error) {
        sendResponse(res, 400, { message: "Enter a required fields" });

    }
}

export const LoginWithOtp = async (req: any, res: Response) => {
    try {
        if (Object.keys(req?.body).length > 0) {

            const { mobile, otp } = req?.body;
            // 
            await models?.Otps.findOne({ mobile, otp, isDeleted: false }).populate({ path: "userId" }).then(async (resultRes: any) => {

                if (!resultRes) {
                    sendResponse(res, 400, { message: "Entre a valid otp" });
                } else {
                    // await models?.Otps.findByIdAndUpdate({ _id: result?._id }, { isDeleted: true })
                    const token = await geneTokens({ _id: resultRes?.userId?._id.toString() });
                    let userData = resultRes?._doc?.userId;
                    delete userData?.password;
                    delete userData?.isDeleted;
                    delete userData?.isAdmin;
                    console.log('🚀 ~ file: user.ts ~ line 106 ~ awaitmodels?.Otps.findOne ~ userData', userData);
                    sendResponse(res, 200, { data: userData, token });

                }
            }).catch((error: any) => {
                sendResponse(res, 400, { message: error?.message });
            })

        } else {
            sendResponse(res, 400, { message: "Enter a required fields" });
        }
    } catch (error: any) {
        sendResponse(res, 400, { message: error?.message });
    }
}

export const updateUser = async (req: any, res: Response) => {
    try {
        if (Object.keys(req?.body).length > 0) {

            const { _id, avatar } = req?.me;

            let oldAvatar: any;
            if (req?.body?.avatar) {
                oldAvatar = avatar;
                req.body.avatar = await fileUpload(req?.avatar);
            }
            req?.body?.password && (req.body.password = await bcrypt.hash(req?.body?.password, 10));
            await models?.User.findByIdAndUpdate(_id, req?.body, { new: true }).then((result: any) => {
                if (oldAvatar) {
                    fs.unlinkSync(`Assets/${oldAvatar}`)
                }
                delete result?._doc?.password;
                delete result?._doc?.isDeleted;
                delete result?._doc?.isAdmin;
                sendResponse(res, 200, { data: result });
            }).catch((error: any) => {
                sendResponse(res, 400, { message: error?.message });
            })

        }
        else {
            sendResponse(res, 400, { message: "Enter a required fields" });
        }
    } catch (error: any) {
        sendResponse(res, 400, { message: error?.message });
    }
}

export const getAllUsers = async (req: any, res: Response) => {
    try {
        if (Object.keys(req?.body).length > 0) {

            const { page, limit, list } = req?.body;

            await models?.User.find(list).sort({ _id: -1 }).limit(limit * 1)
                .skip((page - 1) * limit).then((result: any) => {
                    sendResponse(res, 200, { data: result });
                }).catch((error: any) => {
                    sendResponse(res, 400, { message: error?.message });
                })

        }
        else {
            sendResponse(res, 400, { message: "Enter a required fields" });
        }
    } catch (error: any) {
        sendResponse(res, 400, { message: error?.message });
    }
}

export const getUserDetails = async (req: any, res: Response) => {
    try {

        delete req?.me?.password;
        delete req?.me?.isAdmin;
        delete req?.me?.isDeleted;

        sendResponse(res, 200, { data: req?.me });
    } catch (error: any) {
        sendResponse(res, 400, { message: error?.message });
    }
}

export const changePassword = async (req: any, res: Response) => {
    try {
        if (Object.keys(req?.body).length > 0) {

            const { oldPassword, newPassword } = req?.body;

            const isMatch = await req?.me.validatePassword(oldPassword);

            if (!isMatch) sendResponse(res, 401, { message: "old password does not match" });
            else if (newPassword === oldPassword) sendResponse(res, 401, { message: "old password and new password can't be same" });
            else {
                req.me.password = newPassword;
                await req?.me.save().then(() => {
                    sendResponse(res, 400, { data: true });
                });
            }

        } else {
            sendResponse(res, 400, { message: "Enter a required fields" });
        }
    } catch (error: any) {
        sendResponse(res, 400, { message: error?.message });
    }
}


