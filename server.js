const express = require("express");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const app = express();
const port = 3008;

app.use(express.json());

const javaCodeDir = "java-code";
const outputDir = "output";

app.post("/compile", (req, res) => {
  const javaCode = req.body.code;

  // Validate and sanitize the Java code
  if (!javaCode || typeof javaCode !== "string") {
    res.status(400).send({ error: "Invalid Java code" });
    return;
  }

  // Ensure the directories exist
  if (!fs.existsSync(javaCodeDir)) {
    fs.mkdirSync(javaCodeDir);
  }
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  // Extract the package name and class name from the Java code
  const packageName = extractPackageName(javaCode);
  const className = extractClassName(javaCode);

  // Create a temporary file for the Java code
  const javaFile = path.join(javaCodeDir, `${className}.java`);
  fs.writeFileSync(javaFile, javaCode);

  // Compile the Java code
  const compilerProcess = spawn("javac", ["-d", outputDir, javaFile]);

  compilerProcess.stdout.on("data", (data) => {
    console.log(`stdout: ${data}`);
  });

  compilerProcess.stderr.on("data", (data) => {
    console.error(`stderr: ${data}`);
    res.status(500).send({ error: data.toString() });
  });

  compilerProcess.on("close", (code) => {
    if (code === 0) {
      // Compilation successful
      const fullClassName = packageName
        ? `${packageName}.${className}`
        : className;

      // Execute the compiled Java program
      const javaProcess = spawn("java", ["-cp", outputDir, fullClassName]);

      javaProcess.stdout.on("data", (data) => {
        res.send({ output: data.toString() });
      });

      javaProcess.stderr.on("data", (data) => {
        console.error(`stderr: ${data}`);
        res.status(500).send({ error: data.toString() });
      });
    } else {
      // Compilation failed
      res.status(500).send({ error: "Compilation error" });
    }

    // Clean up the temporary Java file
    fs.unlinkSync(javaFile);
  });
});

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

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
