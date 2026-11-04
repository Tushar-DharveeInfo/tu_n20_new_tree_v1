
//This function compare the string and return true if matched
const FnProcessStringToCompare = (strOne: string, strTwo: string) => {
  if (!strOne || !strTwo) {
    return false
  } else if (strOne.trim()?.toLowerCase() === strTwo.trim()?.toLowerCase()) {
    return true
  } else {
    return false
  }
}

export { FnProcessStringToCompare }