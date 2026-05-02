import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import restaurantsRouter from "./restaurants";
import staffRouter from "./staff";
import tablesRouter from "./tables";
import reservationsRouter from "./reservations";
import guestsRouter from "./guests";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/restaurants", restaurantsRouter);
router.use("/staff", staffRouter);
router.use("/tables", tablesRouter);
router.use("/reservations", reservationsRouter);
router.use("/guests", guestsRouter);
router.use("/dashboard", dashboardRouter);

export default router;
