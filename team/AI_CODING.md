## Lucy Deng

### Tool Used

* ChatGPT (GPT-4)

### What I Did

I used ChatGPT to assist in generating unit tests for our syllabus parsing logic. Specifically, I prompted the model to help create Jest test cases for functions that extract assignment names and due dates from raw syllabus text.

I first provided a simplified version of our parsing function and asked the model to generate:

* Basic correctness tests
* Edge case tests (missing dates, malformed input, empty strings)
* Negative test cases (text without assignment keywords)

After reviewing the generated tests, I refined them to better match our actual implementation and adjusted input/output expectations to align with our real data structure.

### Outcome

* Implemented 3 working Jest unit tests in our codebase
* Improved coverage for edge cases (e.g., undefined input, unexpected formatting)
* Identified one small bug in our parsing logic while testing

Using AI accelerated the brainstorming process for test scenarios and helped me think more systematically about edge conditions. It reduced manual trial-and-error debugging time.

### Reflection
ChatGPT was very useful for generating an initial structure for unit tests and suggesting edge cases I might not have considered immediately. It helped speed up the process of writing test scaffolding and improved my awareness of corner cases.

However, the AI-generated tests were not immediately correct. I needed to sometimes manually verify expected outputs and remove or rewrite assumptions that did not match our implementation. AI sometimes made assumptions about return types or function behavior that were slightly incorrect. Therefore, careful human review and local testing were necessary before committing the code.

Fair Use & Code Quality Considerations:
I ensured that the final test code was adapted to our own implementation and understood every test case before including it.
Going forward, I believe AI tools can significantly improve productivity for generating boilerplate tests and exploring edge cases. However, they should be used as a drafting assistant rather than a replacement for understanding the underlying logic.