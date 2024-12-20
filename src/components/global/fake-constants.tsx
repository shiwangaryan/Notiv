import { v4 } from "uuid";

export const mockCollaborators = [
  {
    id: v4(),
    fullName: "John Doe",
    avatarUrl: "https://randomuser.me/api/portraits/men/1.jpg",
    billingAddress: { street: "123 Main St", city: "New York", zip: "10001" },
    email: "johndoe@example.com",
    updatedAt: new Date().toISOString(),
    paymentMethod: { type: "Credit Card", lastFourDigits: "1234" },
  },
  {
    id: v4(),
    fullName: "Jane Smith",
    avatarUrl: "https://randomuser.me/api/portraits/women/2.jpg",
    billingAddress: { street: "456 Elm St", city: "Los Angeles", zip: "90001" },
    email: "janesmith@example.com",
    updatedAt: new Date().toISOString(),
    paymentMethod: { type: "PayPal", email: "jane.paypal@example.com" },
  },
  {
    id: v4(),
    fullName: "Alice Johnson",
    avatarUrl: "https://randomuser.me/api/portraits/women/3.jpg",
    billingAddress: { street: "789 Oak St", city: "Chicago", zip: "60601" },
    email: "alicej@example.com",
    updatedAt: new Date().toISOString(),
    paymentMethod: { type: "Debit Card", lastFourDigits: "5678" },
  },
  {
    id: v4(),
    fullName: "Bob Brown",
    avatarUrl: "https://randomuser.me/api/portraits/men/4.jpg",
    billingAddress: { street: "101 Maple Ave", city: "Houston", zip: "77001" },
    email: "bobb@example.com",
    updatedAt: new Date().toISOString(),
    paymentMethod: { type: "Bank Transfer", account: "987654321" },
  },
  {
    id: v4(),
    fullName: "Emma Wilson",
    avatarUrl: "https://randomuser.me/api/portraits/women/5.jpg",
    billingAddress: { street: "234 Pine Ln", city: "Phoenix", zip: "85001" },
    email: "emmawilson@example.com",
    updatedAt: new Date().toISOString(),
    paymentMethod: { type: "Cash App", username: "emma_cashapp" },
  },
  {
    id: v4(),
    fullName: "Liam Martinez",
    avatarUrl: "https://randomuser.me/api/portraits/men/6.jpg",
    billingAddress: { street: "345 Cedar Rd", city: "Philadelphia", zip: "19101" },
    email: "liamm@example.com",
    updatedAt: new Date().toISOString(),
    paymentMethod: { type: "Apple Pay", device: "iPhone 12 Pro" },
  },
  {
    id: v4(),
    fullName: "Sophia Garcia",
    avatarUrl: "https://randomuser.me/api/portraits/women/7.jpg",
    billingAddress: { street: "456 Birch Dr", city: "San Antonio", zip: "78201" },
    email: "sophiag@example.com",
    updatedAt: new Date().toISOString(),
    paymentMethod: { type: "Google Pay", phoneNumber: "+15551234567" },
  },
  {
    id: v4(),
    fullName: "Noah Davis",
    avatarUrl: "https://randomuser.me/api/portraits/men/8.jpg",
    billingAddress: { street: "567 Spruce Ct", city: "San Diego", zip: "92101" },
    email: "noahd@example.com",
    updatedAt: new Date().toISOString(),
    paymentMethod: { type: "Venmo", username: "noah_venmo" },
  },
  {
    id: v4(),
    fullName: "Ava Moore",
    avatarUrl: "https://randomuser.me/api/portraits/women/9.jpg",
    billingAddress: { street: "678 Walnut St", city: "Dallas", zip: "75201" },
    email: "avamoore@example.com",
    updatedAt: new Date().toISOString(),
    paymentMethod: { type: "Crypto", wallet: "0xabc123456def789" },
  },
  {
    id: v4(),
    fullName: "James White",
    avatarUrl: "https://randomuser.me/api/portraits/men/10.jpg",
    billingAddress: { street: "789 Poplar Blvd", city: "Austin", zip: "73301" },
    email: "jamesw@example.com",
    updatedAt: new Date().toISOString(),
    paymentMethod: { type: "Check", checkNumber: "123456" },
  },
];