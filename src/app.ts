import "dotenv/config"
import express, { NextFunction, Request, Response } from "express";
import userRoutes from "./routes/users";
import morgan from "morgan";
import createHttpError, {isHttpError} from "http-errors";
import session from "express-session";
import env from"./util/validateEnv";
import MongoStore from "connect-mongo";
import cors from "cors";

const app = express();

app.use(morgan("dev"));

app.use(express.json());

app.use(cors({
    origin: ['http://localhost:5173', 'https://gold-crowfunding-blockchain.netlify.app'], // or your frontend URL
    credentials: true, // This is important for cookies/sessions
}));

app.use(session({
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 60 * 60 * 1000, // 1 hour
        sameSite: 'none', // Important for cross-site requests
        secure: true, // Ensures cookies are only sent over HTTPS
    },
    rolling: true,
    store: MongoStore.create({
        mongoUrl: env.MONGO_CONNECTION_STRING,
    }),
}));

app.use("/api/users", userRoutes);

app.use((req, res, next) => {
    next(createHttpError(404, "Endpoint not found"));
});

app.use((error: unknown, req: Request, res: Response, next: NextFunction) => {
    console.error(error);
    let errorMessage = "An unknown error occurred";
    let statusCode = 500;
    if(isHttpError(error)) {
        statusCode = error.status;
        errorMessage = error.message;
    }
    res.status(statusCode).json({message: errorMessage});
})

export default app;
