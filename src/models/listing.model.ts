export interface Listing {
  id: number;
  title: string;
  description: string;
  location: string;
  pricePerNight: number;
  guests: number;
  type: "apartment" | "house" | "villa" | "cabin";
  amenities: string[];
  host: string;
  rating?: number;
}

export const listings: Listing[] = [
  {
    id: 1,
    title: "Cozy Apartment in Kigali",
    description: "A nice place to stay in the heart of Kigali.",
    location: "Kigali, Rwanda",
    pricePerNight: 50,
    guests: 2,
    type: "apartment",
    amenities: ["WiFi", "Kitchen", "AC"],
    host: "Alice Uwase",
    rating: 4.8,
  },
  {
    id: 2,
    title: "Lakeside Villa in Gisenyi",
    description: "Relax by Lake Kivu in this beautiful villa.",
    location: "Gisenyi, Rwanda",
    pricePerNight: 150,
    guests: 6,
    type: "villa",
    amenities: ["Pool", "WiFi", "BBQ", "Parking"],
    host: "Claire Ingabire",
    rating: 4.9,
  },
  {
    id: 3,
    title: "Mountain Cabin in Musanze",
    description: "Perfect for nature lovers near Volcanoes National Park.",
    location: "Musanze, Rwanda",
    pricePerNight: 80,
    guests: 4,
    type: "cabin",
    amenities: ["Fireplace", "WiFi", "Hiking Trails"],
    host: "Alice Uwase",
  },
];