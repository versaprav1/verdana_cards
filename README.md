# VerdantCards - Your AI-Powered Learning Partner

VerdantCards is an intelligent flashcard application designed to accelerate your learning process. It leverages the power of generative AI to automatically create study materials, offer personalized quizzes, and even generate video content to make learning faster, more effective, and more engaging.

## Features

- **AI-Powered Deck Creation**: Instantly generate flashcard decks from various sources:
  - **By Topic**: Simply provide a topic (e.g., "The Renaissance") and let the AI create a comprehensive deck.
  - **From PDF**: Upload a PDF of your lecture notes or textbook chapter, and the AI will extract key information to build your flashcards.
  - **From URL**: Provide a website link to an article or resource, and the AI will summarize it into a study deck.
- **Picture Decks**: For visual learners, generate flashcards that automatically include relevant images for each term.
- **Intelligent Study Sessions**: Uses a Spaced Repetition System (SRS) to show you cards at the perfect interval, maximizing long-term memory retention. You rate how well you knew a card, and the app schedules its next review accordingly.
- **Adaptive AI Quizzes**: Test your knowledge with multiple-choice quizzes that are generated on the fly. The AI can analyze your past quiz performance to focus on topics you find most challenging.
- **AI Study Buddy**: Engage in a conversation with a personal AI tutor for any of your decks. Ask questions, get simpler explanations, and deepen your understanding of the material.
- **AI Video Generation**: Create short, engaging video clips on any topic. You can even provide your existing decks as background context to guide the AI director, producing a video that is visually and thematically relevant to your studies.
- **Multi-Model Support**: You have the freedom to choose your preferred AI provider. The app supports:
  - Google AI (Gemini models)
  - OpenAI (GPT models)
  - Ollama (for running local models like Llama 3)
- **Manual Control**: In addition to AI features, you have full control to create, edit, and delete decks and individual cards manually.

## How to Use VerdantCards

1.  **Create a Deck**:
    - Click **"New Deck"** to create a deck manually, giving it a title and a language.
    - Click **"Generate"** to use the AI. Choose your source (Topic, PDF, or URL), select a language, and let the AI build the deck for you.

2.  **Study Your Cards**:
    - Open a deck from the homepage.
    - If you have cards due for review, a **"Study"** button will appear.
    - In the study session, view the card front, click to flip it, and then rate your confidence ("Again", "Hard", "Good", "Easy"). The app will handle the rest.

3.  **Take a Quiz**:
    - From a deck's page, click **"Start Quiz"** to have the AI generate a multiple-choice test based on your flashcards.

4.  **Chat with Your Buddy**:
    - Inside any deck, click **"AI Buddy"** to start a conversation. Ask it anything about the topics in your cards.

5.  **Generate a Video**:
    - From the homepage, click **"Video"** to navigate to the video generation page.
    - Provide a topic, optional instructions, and even select existing decks to give the AI background context for its creation.

6.  **Configure Your AI**:
    - Click the **Settings** icon in the header.
    - Here, you can select your AI provider (Google AI, OpenAI, Ollama) and enter your own API keys. The app securely stores these in your browser for you.

## Getting Started

### Prerequisites
- **Node.js** (v20 or later) and **npm**
- **Docker Desktop** (required only if you want to run Supabase locally)
- A **Supabase** project (cloud or local) and its API keys

### Installation
```bash
# Clone the repository (if you haven't already)
git clone <repo-url>
cd verdana_cards

# Install dependencies
npm install
```

### Configure Environment Variables
Create a `.env.local` file (it is ignored by git) with the following variables:
```env
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
# Optional: if using Supabase service role locally
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```
If you prefer to use the cloud Supabase instance that comes with the project, copy the values from the existing `.env` file.

### Running the Application
#### Development (with cloud Supabase)
```bash
npm run dev
```
Open http://localhost:9002 in your browser.

#### Development with Local Supabase
1. Start Supabase locally (Docker must be running):
```bash
npx supabase start
```
2. Once the services are up, the local URLs will be printed. Update `.env.local` accordingly, e.g.:
```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<local-anon-key>
```
3. Run the Next.js dev server:
```bash
npm run dev
```

### Building for Production
```bash
npm run build
npm start   # runs the optimized production build
```

### Testing the Backend
- The Supabase dashboard (local or cloud) shows the `decks`, `flashcards`, and `media_assets` tables.
- Use the UI to create decks, generate cards via AI, and study them.

---
Enjoy using **VerdantCards** to boost your learning!
