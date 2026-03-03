import { AppError } from "../utils/errors.js";

export function validate(schema) {
  return (req, _res, next) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const msg = parsed.error.issues.map(i => i.message).join(", ");
      return next(new AppError(msg, 400));
    }
    req.body = parsed.data;
    next();
  };
}