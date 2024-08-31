// Function to extract the package name from the Java code
function extractPackageName(javaCode) {
  const regex = /package (\w+(?:\.\w+)*)/;
  const match = javaCode.match(regex);
  if (match) {
    return match[1];
  } else {
    return "";
  }
}

// Function to extract the class name from the Java code
function extractClassName(javaCode) {
  const regex = /public class (\w+)/;
  const match = javaCode.match(regex);
  if (match) {
    return match[1];
  } else {
    throw new Error("Could not extract class name from Java code");
  }
}

module.exports = { extractClassName, extractPackageName };
