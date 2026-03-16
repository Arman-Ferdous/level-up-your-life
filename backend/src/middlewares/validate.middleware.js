import { AppError } from "../utils/errors.js";

export function validate(schema) {
  return (req, _res, next) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const msg = parsed.error.issues
        .map((i) => {
          const field = i.path.length > 0 ? i.path.join(".") : "Unknown field";
          return `${field}: ${i.message}`;
        })
        .join("; ");
      return next(new AppError(msg, 400));
    }
    req.body = parsed.data;
    next();
  };
}