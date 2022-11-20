import express from "express";
const router = express.Router();
import { authUsers, authGeneral } from "../middleware/auth";
import { SignupUser, Login, updateUser, getUserDetails, LoginWithOtp, changePassword } from "../controllers/user";

router.post('/signup', SignupUser);

router.post('/login', Login);

router.put('/update', authGeneral, updateUser);

router.post('/loginWithOtp', authGeneral, LoginWithOtp);

router.get('/userDetails', authGeneral, getUserDetails);

router.put('/changePassword', authGeneral, changePassword);


export default router;