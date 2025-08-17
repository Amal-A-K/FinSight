# FinSight - Personal Finance Tracker

FinSight is a modern, user-friendly personal finance tracking application built with Next.js 13, featuring a beautiful violet theme and intuitive interface for managing your transactions.

![FinSight Dashboard](public/dashboard-preview.png)

## Features

- 📊 Interactive dashboard with monthly expense visualization
- 💸 Easy transaction management (Add, Edit, Delete)
- 💠 Modern glass-morphism UI design
- 🎨 Consistent violet theme throughout
- 🌗 Dark mode support
- ₹ Indian Rupee (INR) currency formatting
- 🚀 Real-time updates with optimistic UI
- 📱 Responsive design for all devices

## Tech Stack

- **Framework**: [Next.js 13](https://nextjs.org/) with App Router
- **Database**: [Prisma](https://www.prisma.io/) with SQLite
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Components**: 
  - [Shadcn/ui](https://ui.shadcn.com/) for base components
  - [Recharts](https://recharts.org/) for data visualization
  - [Headless UI](https://headlessui.com/) for accessible modals
- **Notifications**: [React-Toastify](https://fkhadra.github.io/react-toastify/)

## Getting Started

### Prerequisites

- Node.js 16.8 or later
- npm or yarn or pnpm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Amal-A-K/FinSight.git
   cd finsight
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. Set up the database:
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

4. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Project Structure

```
finsight/
├── src/
│   ├── app/                 # Next.js 13 app directory
│   │   ├── api/            # API routes
│   │   ├── page.tsx        # Dashboard page
│   │   └── ...            
│   ├── components/         # React components
│   │   └── ui/            # Reusable UI components
│   ├── lib/               # Utility functions
│   └── types/             # TypeScript types
├── prisma/                # Database schema and migrations
└── public/               # Static assets
```

## Key Features in Detail

### Transaction Management
- Add new transactions with amount, description, and date
- Edit existing transactions with real-time updates
- Delete transactions with confirmation modal
- Beautiful glass-morphism modals for all operations

### Dashboard Visualization
- Monthly transaction summaries
- Interactive bar chart
- Formatted currency display
- Responsive design for all screen sizes

### User Interface
- Consistent violet theme throughout
- Smooth animations and transitions
- Accessible components
- Toast notifications for all actions
- Dark mode support

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
