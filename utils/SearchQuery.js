import { normalizeString } from "./NormalizeString.js";
import mongoose from "mongoose";

const escapeRegex = string => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const buildMatchCondition = (key, value) => {
  // Convert "true"/"false" to Boolean
  if (value === "true") return { [key]: true };
  if (value === "false") return { [key]: false };

  // String
  if (typeof value === "string" && value.trim()) {
    const safeValue = escapeRegex(value.trim());
    return { [key]: { $regex: safeValue, $options: "i" } };
  }

  // Number
  if (typeof value === "number") {
    return { [key]: value };
  }

  // Date
  if (value instanceof Date) {
    return { [key]: value };
  }

  // ObjectId
  if (value instanceof mongoose.Types.ObjectId) {
    return { [key]: value };
  }

  // Arrays
  if (Array.isArray(value)) {
    return { [key]: { $in: value } };
  }

  // Objects (operators or elemMatch)
  if (typeof value === "object" && value !== null) {
    const hasOperator = Object.keys(value).some(k => k.startsWith("$"));
    if (hasOperator) {
      const normalized = {};
      for (const [op, val] of Object.entries(value)) {
        let v = val;
        if (typeof v === "string") {
          v = v.replace(" ", "+");
        }
        const parsed = new Date(v);
        normalized[op] = isNaN(parsed.getTime()) ? v : parsed;
      }

      return { [key]: normalized };
    }

    return { [key]: { $elemMatch: value } };
  }

  return null;
};

const SearchQuery = (search = {}) => {
  const matchConditions = [];
  for (const [key, value] of Object.entries(search)) {
    const condition = buildMatchCondition(key, value);
    if (condition) {
      matchConditions.push(condition);
    }
  }
  return matchConditions.length > 0
    ? { $match: { $and: matchConditions } }
    : null;
};

export default SearchQuery;
