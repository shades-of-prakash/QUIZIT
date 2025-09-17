function parseCodeBlock(block: string) {
	const match = block.match(/```(\w+)[^\n]*\n([\s\S]*?)```/);

	if (match) {
		const lang = match[1] as
			| "c"
			| "tsx"
			| "typescript"
			| "javascript"
			| "python"
			| "java";
		const code = match[2]?.trim();
		const question = block.slice(0, match.index).trim();
		console.log({ code, question, lang });
		return { question, lang, code };
	}

	return { question: block.trim(), lang: "plaintext" as const, code: "" };
}
const block = `What is the purpose of the outer loop in the given C program?
\`\`\`Python
// C program to demonstrate the
// area and perimeter of rectangle
// using function
#include <stdio.h>

int area(int a, int b)
{
    int A;
    A = a * b;
    return A;
}
int perimeter(int a, int b)
{
    int P;
    P = 2 * (a + b);
    return P;
}

int main()
{

    int l = 10, b = 10;
    printf("Area of rectangle is : %d", area(l, b));
    printf("\nPerimeter of rectangle is : %d",
           perimeter(l, b));
    return 0;
}
\`\`\`
`;
console.log(parseCodeBlock(block));
