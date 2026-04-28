# **Core Development & TDD Guidelines: TI4 Dashboard**

To ensure the TI4 "Hall of Records" remains stable as your group plays more games and the app scales, we will adhere to Test-Driven Development (TDD) and modern React engineering standards.

## **1\. The TDD Methodology: Red-Green-Refactor**

TDD is not about writing tests *after* you build a feature to prove it works. It is about writing the test *before* the feature exists, letting the test dictate what code you need to write.

For this project, you will follow the **Red-Green-Refactor** loop:

1. **RED (Write a failing test):** Define what a tiny piece of your app should do. Run the test. It will fail because the code doesn't exist yet.  
2. **GREEN (Write minimal code):** Write the absolute minimum amount of code required to make the test pass. Don't worry about making it pretty yet.  
3. **REFACTOR (Clean it up):** Now that the test passes, clean up the code, optimize it, and add type safety. The test guarantees you haven't broken the logic.

### **TDD Example: The Action Parser**

Imagine you are building the utility function to extract Victory Points from the actionLog.

* **Step 1 (Red):** You write a test saying: "When given a SCORE\_OBJECTIVE event from Naaz-Rokha Alliance, the function should return { faction: 'Naaz-Rokha Alliance', points: 1 }." It fails.  
* **Step 2 (Green):** You write a basic Javascript function that looks at the actionLog array, finds the string "Naaz-Rokha", and spits out the object. It passes.  
* **Step 3 (Refactor):** You realize objectives can be 1 or 2 points. You update the function to cross-reference the objective name with a dictionary of 1VP/2VP objectives, and clean up the loops. The test still passes.

## **2\. Testing Best Practices for Data Applications**

When applying TDD to a data-heavy application like this, follow these principles:

* **The "Arrange-Act-Assert" (AAA) Pattern:** Structure every test cleanly.  
  * *Arrange:* Set up mock TI4 JSON data (e.g., a tiny fake array of just 3 events).  
  * *Act:* Run your parsing function on that mock data.  
  * *Assert:* Check if the output matches your expectations.  
* **Test Behavior, Not Implementation:** When testing UI components (using tools like React Testing Library), don't test *how* a component is coded. Test what the user sees. Instead of testing if div class="vp-chart" exists, test if screen displays text "10 VP".  
* **Isolate Logic from UI:** Never put your raw JSON parsing loops directly inside a React component. Create separate, pure JavaScript/TypeScript files (e.g., gameParser.ts). It is 100x easier to unit-test a plain math/array function than it is to test a React component rendering a chart.  
* **Embrace Negative Testing:** Don't just test the "happy path" where the JSON is perfect. What happens if a player forgot to enter an expansion in the setup? Write a test that feeds your app a broken JSON file and ensure it returns a graceful error message, not a crashed white screen.

## **3\. Modern React Coding Best Practices (2026 Standards)**

As you build out the front end, adhere to these modern web development standards:

### **A. TypeScript is Mandatory**

Do not use vanilla JavaScript. Use TypeScript. Defining strict "Types" or "Interfaces" for your data right away is a game-changer.

* *Example:* Define a GameEvent interface that enforces every log entry must have a timestampMillis (number) and an action (string). TypeScript will yell at you while typing if you try to access data that doesn't exist, preventing countless runtime errors.

### **B. React Compiler Readiness & Pure Functions**

Modern React relies heavily on its background compiler to automatically optimize performance and prevent unnecessary re-renders.

* The compiler requires your components to be **pure**. This means a component should always return the exact same UI if given the exact same data.  
* Do not mutate outside variables from inside a render function.  
* Use stable hooks: Keep your useState and useEffect logic simple and predictable.

### **C. Feature-Based Folder Structure**

Do not group files by their type (e.g., putting all components in one folder and all styles in another). Group them by **Feature**.

* /features/upload (Contains the upload button, dropzone UI, and validation tests)  
* /features/meta-dashboard (Contains aggregate charts, faction stat logic)  
* /features/game-replay (Contains the timeline scrubber, map renderer)

### **D. Custom Hooks for Reusability**

If you find yourself writing the same data-fetching or parsing logic in multiple places, extract it into a custom hook.

* *Example:* Create a useGameStats(jsonFile) hook. Any component in your app can call this hook, pass it the JSON, and instantly receive the cleanly formatted VP tracks, planet control arrays, and tech timelines without needing to know how the parsing engine actually works.

### **E. CSS-in-JS or Utility Classes (Tailwind)**

Avoid massive, detached CSS files that cause global styling conflicts. Since this project is highly componentized, use a utility-first framework like Tailwind CSS. It allows you to style your space-themed UI directly inline, keeping the styling tightly scoped to the components you are testing.