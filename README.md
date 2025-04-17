# Clean Code Quiz Platform

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## About the Clean Code Quiz

The Clean Code Quiz is an interactive, team-based quiz platform designed to test and improve your programming knowledge and code quality skills. Sessions are hosted live, with teams joining to answer a series of questions in real time. The platform supports a variety of question types, automatic and manual marking, and a live leaderboard.

### How the Quiz Works

- **Sessions**: An admin creates and hosts a quiz session. Players join a session using a session code.
- **Teams**: Players form teams and submit answers as a group.
- **Questions**: Each session consists of a series of questions, presented one at a time. Each question has a time limit.
- **Marking**: Some questions are marked automatically (e.g., multiple choice), while others require manual review by an admin (e.g., code explanations).
- **Leaderboard**: Scores are updated live, and a leaderboard is shown at the end.

---

## Question Types

The platform supports several question types:

### 1. Multiple Choice (MCQ)

- **Description**: Choose the correct answer from a list of options.
- **Marking**: Automatically marked.
- **Fields**: Title, options, correct option, description, image (optional).

### 2. Edit Code

- **Description**: Edit a provided code snippet to meet the requirements.
- **Marking**: Manually marked by an admin using a star rating system.
- **Fields**: Title, initial code, instructions, scoring criteria.

### 3. Concise Code

- **Description**: Refactor or rewrite code to be as concise as possible.
- **Marking**: Manually marked by an admin. Bonus points are awarded for the shortest correct solutions.
- **Fields**: Title, initial code, instructions.

### 4. Explain This Code

- **Description**: Explain what a given code snippet does, or clarify its behavior.
- **Marking**: Manually marked by an admin using a single 0-5 star rating for explanation quality.
- **Fields**: Title, code to explain, instructions, scoring criteria.

### 5. Question & Answer (QA)

- **Description**: Provide a short text answer to a question.
- **Marking**: Automatically marked using regex-based matching (case-insensitive, ignores extra whitespace). Admins can also manually verify answers.
- **Fields**: Title, correct answer (reference), description.

---

## Marking and Scoring

- **Automatic Marking**: MCQ and QA questions are marked automatically. QA uses flexible regex matching to accept minor variations in answers.
- **Manual Marking**: Edit Code, Concise Code, and Explain This Code questions are marked by admins using a star rating system or a single checkbox (for QA manual verification).
- **Bonus Points**: Concise Code questions can award bonus points for the shortest correct submissions.
- **Leaderboard**: Team scores are calculated and displayed on a live leaderboard at the end of the session.

---

## Setting Up Locally

To run the project locally:

1. **Clone the repository**

   ```bash
   git clone <repo-url>
   cd clean-code-pq
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Configure Firebase**

   - Create a Firebase project and Firestore database.
   - Set up authentication (Google sign-in recommended for admins).
   - Copy your Firebase config into `/src/lib/firebase.ts`.
   - Set up Firestore security rules as per `/src/lib/firebase/firebase.rules`.

4. **Run the development server**

   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   # or
   bun dev
   ```

5. **Open the app**

   - Visit [http://localhost:3000](http://localhost:3000) in your browser.

6. **Admin Access**
   - Update the admin email in the Firestore rules to match your Firebase authentication setup.
   - Log in as an admin (see Firestore rules for admin email).
   - Create and manage sessions, questions, and marking from the `/admin` dashboard.

---

## Useful Links

- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)

---

Enjoy running your own Clean Code Quiz!
