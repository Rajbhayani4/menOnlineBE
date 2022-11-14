import express, { Request, Response } from "express";
import morgan from 'morgan';
import * as dotenv from 'dotenv';
import { connectDB } from "./Database";
dotenv.config()
import model from "./models/index"
import UserRouter from "./routes/user"

const app = express();
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(morgan('dev'));

app.use('/user', UserRouter);

connectDB().then(() => {
    console.log("Database connected successfully")
}).catch((error: any) => {
    console.log("Database Error index:--", error.message);
})


app.listen(process.env.PORT, () => {
    console.log(`Example app listening on port ${process.env.PORT}`)
})

