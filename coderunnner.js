import fs from "fs";
import os from "os";
import path from "path";
import { execSync } from "child_process";

function runCode(language, userCode, args = []) {
	const jobDir = path.join(os.tmpdir(), `job-${Date.now()}`);
	fs.mkdirSync(jobDir);

	let fileName, dockerImage, runCmd, boilerplate;

	// Convert args to code literals
	const argListPython = args.map((a) => JSON.stringify(a)).join(", ");
	const argListJS = args.map((a) => JSON.stringify(a)).join(", ");
	const argListJava = args.map((a) => `"${a}"`).join(", ");
	const argListCPP = args.join(", ");

	switch (language) {
		case "python":
			fileName = path.join(jobDir, "Main.py");
			boilerplate = `
def solution(${args.map((_, i) => "arg" + i).join(", ")}):
${userCode
	.split("\n")
	.map((l) => "    " + l)
	.join("\n")}

if __name__ == "__main__":
    print(solution(${argListPython}))
      `;
			fs.writeFileSync(fileName, boilerplate);
			dockerImage = "python:3.10";
			runCmd = `docker run --rm -i -v "${jobDir}:/usr/src/app" -w /usr/src/app ${dockerImage} python Main.py`;
			break;

		case "javascript":
			fileName = path.join(jobDir, "main.js");
			boilerplate = `
function solution(${args.map((_, i) => "arg" + i).join(", ")}) {
    ${userCode}
}

console.log(solution(${argListJS}));
      `;
			fs.writeFileSync(fileName, boilerplate);
			dockerImage = "node:18";
			runCmd = `docker run --rm -i -v "${jobDir}:/usr/src/app" -w /usr/src/app ${dockerImage} node main.js`;
			break;

		case "java":
			fileName = path.join(jobDir, "Main.java");
			boilerplate = `
public class Main {
    public static void main(String[] args) {
        System.out.println(solution(${argListJava}));
    }

    public static String solution(${args
			.map((a, i) => `String arg${i}`)
			.join(", ")}) {
        ${userCode}
    }
}
      `;
			fs.writeFileSync(fileName, boilerplate);
			dockerImage = "openjdk:17";
			runCmd = `docker run --rm -i -v "${jobDir}:/usr/src/app" -w /usr/src/app ${dockerImage} bash -c "javac Main.java && java Main"`;
			break;

		case "cpp":
			fileName = path.join(jobDir, "main.cpp");
			boilerplate = `
#include <bits/stdc++.h>
using namespace std;

${userCode}

int main() {
    cout << solution(${argListCPP}) << endl;
    return 0;
}
      `;
			fs.writeFileSync(fileName, boilerplate);
			dockerImage = "gcc:latest";
			runCmd = `docker run --rm -i -v "${jobDir}:/usr/src/app" -w /usr/src/app ${dockerImage} bash -c "g++ main.cpp -o main && ./main"`;
			break;

		case "c":
			fileName = path.join(jobDir, "main.c");
			boilerplate = `
#include <stdio.h>

${userCode}

int main() {
    printf("%d\\n", solution(${argListCPP}));
    return 0;
}
      `;
			fs.writeFileSync(fileName, boilerplate);
			dockerImage = "gcc:latest";
			runCmd = `docker run --rm -i -v "${jobDir}:/usr/src/app" -w /usr/src/app ${dockerImage} bash -c "gcc main.c -o main && ./main"`;
			break;

		default:
			throw new Error("Unsupported language");
	}

	try {
		const output = execSync(runCmd, { encoding: "utf-8" });
		return output.trim();
	} catch (err) {
		return err.stderr || err.message;
	}
}

// -------------------
// Example Usage
// -------------------

// Python
console.log(runCode("python", `return arg0 + arg1`, [2, 3])); // 5

// JavaScript
console.log(runCode("javascript", `return arg0 + arg1;`, [5, 7])); // 12

// Java
console.log(runCode("java", `return arg0 + arg1;`, ["Hello ", "World"])); // Hello World

// C++
console.log(
	runCode(
		"cpp",
		`int solution(int arg0,int arg1){ return arg0+arg1; }`,
		[10, 15]
	)
); // 25

// C
console.log(
	runCode("c", `int solution(int arg0,int arg1){ return arg0+arg1; }`, [7, 8])
); // 15
