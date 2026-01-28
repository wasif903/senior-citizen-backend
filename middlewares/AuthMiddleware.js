import jwt from "jsonwebtoken";
import AdminModel from "../models/AdminSchema.js";
import UserModel from "../models/UserSchema.js";
import SubscriptionModel from "../models/SubscriptionSchema.js";

const AuthMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Access token missing" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        req.user = decoded;

        console.log(req.user);

        if (req.user.role === "User") {
            const findUser = await UserModel.findById(req.user.id);
            if (!findUser) {
                return res.status(404).json({ message: "Invalid User" })
            }
            const findSubscription = await SubscriptionModel.findOne({
                userId: req.user.id,
                status: "active"
            })
            if (!findSubscription) {
                return res.status(400).json({ message: "no active subscription" })
            }
        }

        next();
    } catch (err) {
        res.status(403).json({ message: "Invalid or expired token" });
    }
};


export default AuthMiddleware;