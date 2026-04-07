import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
	createGroup,
	joinGroup,
	getMyGroups,
	discoverGroups
} from "../controllers/groupController.js";
import { createGroupSchema, joinGroupSchema } from "../validators/group.validators.js";

export const groupRouter = Router();

groupRouter.use(requireAuth);

groupRouter.post("/", validate(createGroupSchema), createGroup);
groupRouter.post("/join", validate(joinGroupSchema), joinGroup);
groupRouter.get("/my-groups", getMyGroups);
groupRouter.get("/discover", discoverGroups);
