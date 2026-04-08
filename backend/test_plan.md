# Backend Test Plan
## Release Scope
This is a continuous test plan, since the project is in active development. All automated tests will be ran on any commits, and manual tests will be ran before mearging to main.

This plan covers all testing of backend components, including:
- All JavaScript Code
- All database operations
- All Python code

## Test Objectives
General objectives:
- Identifying and reporting functionality defects
- Testing all features before they are committed to main
- 100% branch coverage

Granular objectives:
- Functions respond as they should in both pass and fail cases
- Functions that accept user input can handle / sanitise it

## Test Strategy
Automated testing will be performed via GitHub Actions on every commit, see [workflow](../.github/workflows/backend.yml). This will include:
- Unit testing
- Regression testing

Manual testing will be performed during development and before merging into main, and will involve:
- Exploratory testing
- Usability testing (in-house)

#### Tools
Javascript code will be tested using [Jest](https://jestjs.io/).

Python code will be tested using [SOMETHING]().

#### Measurements
We want all passing tests with 100% branch coverage.

## Requirements Testing
| Requirement | Priority | Description |
|------------|----------|------------|
| R0 - Account System | High | A system for storing, using, manipulating and deleting user information for a given account. |
| R1 - Authentication and Security System | High | A system for authenticating user logins, and maintaining security for user information stored on the site. |
| R2 - Hobby Recommender System | High | A system for providing hobby recommendations, appropriate to the provided user information. |
| R3 - Hobby Pointers and Tips | Medium | Provide pointers and tips on how the user can start a given hobby, provided by the Hobby Recommendation System. |
| R4 - Preference/Personality Quiz | Medium | Provide a quiz for the user to answer, to obtain initial information to be used by the Hobby Recommendation System. |
| R5 - Community Page | Medium | Provide a page where users of similar personalities and hobbies can interact. |
| R6 - Optional Unique Identifiers | Low | Allows users to use usernames instead of real names. |
| R7 - Access on Multiple Devices simultaneously | Low | Allows users to login onto multiple devices simultaneously. |
| R8 - Account Information Access Restrictions | Low | Allows users to toggle the access and visibility of non-sensitive information, for use in the Community Page. |
| R9 - Discovery Page | Low | Provide a page for related information, advice and users for the current hobby registered/followed on the account. |
| R10 - Chat Function | Low | Allows users that are connected to message each other. |
| R11 - Hobby Events and News Page | Low | Allows event organisers and hobby groups to communicate and advertise hobby-specific events, presented on the Community Page. |

Test plans (Non-complete since not all requirements have been designed):
| Requirement | Plan |
| --- | --- |
| R0  | Start server, connect via browser. Create account, attempt to use all types of invalid password / username, use valid username / password. Perform some state bearing action, i.e. submitting quiz. Reload the page to verify if state persists. Sign out and attempt to re-sign in using all types of invalid username / password, then use valid username / password. Delete account, fail security check, retry and pass security check. |
| R1 | Attempt to sign in to an account, use invalid password. Attempt to perform actions that the current session is not validated to perform, i.e. sending delete account requests for other accounts. |
| R2 | Submit quiz, recieve recommendations. User evaluation needed for recomendation validity. |
| R4 | Submit incomplete quiz, complete quiz, submit quiz. |
| R5 | |
| R6 | |
| R7 | |
| R8 | |
| R9 | |
| R10 | |
| R11 | |
| R12 | |