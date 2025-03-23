# Secure Chat App

A secure, encrypted messaging application similar to Discord, built with Electron, React, and Supabase.

## Features

- End-to-end encryption for messages
- User authentication
- Real-time messaging
- Channel-based conversations
- Discord-like UI with animations

## Setup

### Prerequisites

- Node.js 16+
- pnpm (recommended) or npm

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   pnpm install
   ```

### Supabase Setup

1. Create a Supabase account at [supabase.com](https://supabase.com)
2. Create a new project
3. Get your Supabase URL and anon key from the project settings
4. Create the necessary tables by running the SQL in `supabase-tables.sql` using the Supabase SQL editor
5. Configure environment variables:
   ```
   cp .env.example .env
   ```
6. Fill in your Supabase credentials in the `.env` file:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### Development

Start the development server:

```
pnpm electron:dev
```

### Building

Build for production:

```
pnpm electron:build
```

## Security Features

- End-to-end encryption using CryptoJS
- Secure authentication with Supabase
- PostgreSQL database with Row Level Security policies
- Encrypted local storage of user keys

## License

ISC 