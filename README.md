# TeachAssist

TeachAssist is an AI-powered teaching assistant platform designed to streamline and enhance the teaching experience for educators. It provides tools for Quiz Generation, Quick Revision Material Generation, Powerpoint Generation, Stress Management Analysis, resource management, scheduling, and more.

## Features

- AI-powered quiz generation
- Resource library management
- Interactive calendar for scheduling
- Dashboard for quick overview
- Customizable user settings
- Authentication and user management

## Technologies Used

- React
- TypeScript
- Vite
- Tailwind CSS
- Supabase (for backend and authentication)
- OpenAI API (for AI-powered features)
- React Query
- React Router
- Lucide React (for icons)
- date-fns (for date manipulation)

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v14.0.0 or later)
- npm (v6.0.0 or later)


## Installation

1. Clone the repository:

   ```sh
   git clone https://github.com/yourusername/TeachAssist.git
   cd TeachAssist
   ```

2. Install dependencies:

   ```sh
   npm install
   ```

3. Set up environment variables
   
   Create a .env file in the root directory and add the following variables:
   
   ```sh
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_OPENAI_API_KEY=your_openai_api_key
   ```
  
5. Start the development server:
   
   ```sh
   npm run dev
   ```

## Usage

- Dashboard: View a summary of tasks, upcoming schedules, and resource recommendations.
- Quiz Generation: Generate AI-powered quizzes based on input topics.
- Resource Library: Manage and organize teaching materials.
- Calendar: Schedule lessons, meetings, and important events.
- User Settings: Customize preferences and manage authentication.
 
## License

This project is licensed under the MIT License. [MIT](https://choosealicense.com/licenses/mit/)

