const express = require("express");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const { extractClassName, extractPackageName } = require("./utils/helpers.js");
const { TIME_LIMIT_MS } = require("./utils/contants.js");

const app = express();
const port = 3000;

app.use(express.json());

const javaCodeDir = "java-code";
const outputDir = "output";

app.get("/", (req, res) => {
  let code = `public class HelloWorld {
    public static void main(String[] args) {
      int sum = 0;
      for(int i = 0; i < 100; i++)
        sum += i;
      System.out.println(sum);
    }
}`;

  code = code
    .split("\n")
    .map((line) => line.trim())
    .join("");

  let jsonCode = JSON.stringify(code);
  if (jsonCode.startsWith('"') && jsonCode.endsWith('"'))
    jsonCode = jsonCode.slice(1, -1);

  res.json(jsonCode);
});

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

  // const compileTimeout = setTimeout(() => {
  //   compilerProcess.kill();
  //   res.status(500).send({ error: "Compilation Time Limit Exceeded" });
  // }, TIME_LIMIT_MS);

  compilerProcess.stdout.on("data", (data) => {
    console.log(`stdout: ${data}`);
  });

  compilerProcess.stderr.on("data", (data) => {
    console.error(`stderr: ${data}`);
    res.status(500).send({ error: data.toString() });
  });

  compilerProcess.on("close", (code) => {
    // clearTimeout(compileTimeout);

    if (code === 0) {
      // Compilation successful
      const fullClassName = packageName
        ? `${packageName}.${className}`
        : className;

      // Execute the compiled Java program
      const javaProcess = spawn("java", ["-cp", outputDir, fullClassName]);

      // const execTimeout = setTimeout(() => {
      //   javaProcess.kill();
      //   res.status(500).send({ error: "Execution Time Limit Exceeded" });
      // }, TIME_LIMIT_MS);

      javaProcess.stdout.on("data", (data) => {
        // clearTimeout(execTimeout);
        res.send({ output: data.toString() });
      });

      javaProcess.stderr.on("data", (data) => {
        console.error(`stderr: ${data}`);
        // clearTimeout(execTimeout);
        res.status(500).send({ error: data.toString() });
      });
    } else {
      // Compilation failed
      res.status(500).send({ error: "Compilation error" });
      // clearTimeout(execTimeout);
    }

    // Clean up the temporary Java file
    fs.unlinkSync(javaFile);
  });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
