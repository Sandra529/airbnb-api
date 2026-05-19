export interface User {
  id: number;
  name: string;
  email: string;
  username: string;
  phone: string;
  role: "host" | "guest";
  avatar?: string;
  bio?: string;
}

export const users: User[] = [
  {
    id: 1,
    name: "Alice Uwase",
    email: "alice@gmail.com",
    username: "alice_uwase",
    phone: "0781234567",
    role: "host",
    avatar: "https://i.pravatar.cc/150?img=1",
    bio: "I love hosting travelers in Kigali.",
  },
  {
    id: 2,
    name: "Bob Mugisha",
    email: "bob@gmail.com",
    username: "bob_m",
    phone: "0789876543",
    role: "guest",
  },
  {
    id: 3,
    name: "Claire Ingabire",
    email: "claire@gmail.com",
    username: "claire_i",
    phone: "0722334455",
    role: "host",
    bio: "Superhost with 5 years experience.",
  },
];