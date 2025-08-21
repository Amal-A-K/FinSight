import { Transaction } from "@/types/transaction";
interface RecentTransactionsProps {
  transactions: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <div className="space-y-2">
      {transactions.map((transaction) => (
        <div key={transaction.id} className="flex justify-between items-center p-2 border-b">
          <div>
            <p className="font-medium">{transaction.description}</p>
            <p className="text-sm text-muted-foreground">
              {new Date(transaction.date).toLocaleDateString()}
              {transaction.category && ` • ${transaction.category.name}`}
            </p>
          </div>
          <p className="font-medium">
            {new Intl.NumberFormat('en-IN', {
              style: 'currency',
              currency: 'INR'
            }).format(transaction.amount)}
          </p>
        </div>
      ))}
    </div>
  );
}