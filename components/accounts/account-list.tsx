import AccountCard from "./account-card";

const accounts = [
  {
    id: 1,
    name: "HDFC Savings",
    type: "Savings Account",
    balance: 85000,
    accountNumber: "•••• 4521",
  },
  {
    id: 2,
    name: "SBI Account",
    type: "Savings Account",
    balance: 30000,
    accountNumber: "•••• 7812",
  },
  {
    id: 3,
    name: "Cash",
    type: "Cash Account",
    balance: 10000,
    accountNumber: "Cash",
  },
];

export default function AccountList() {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {accounts.map((account) => (
        <AccountCard
          key={account.id}
          name={account.name}
          type={account.type}
          balance={account.balance}
          accountNumber={account.accountNumber}
        />
      ))}
    </div>
  );
}