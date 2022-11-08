function checkType(toCheck: number | string | Date) {
  if (typeof toCheck === "number") {
    return "number";
  }

  if (typeof toCheck === "string") {
    return "string";
  }

  if (typeof toCheck.getMonth === "function") {
    return "date";
  }
}

export { checkType };
