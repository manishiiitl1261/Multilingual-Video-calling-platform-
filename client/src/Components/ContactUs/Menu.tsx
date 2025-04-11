// Define interface for address and contact items
export interface AddressType {
  name: string;
  latitude: number;
  longitude: number;
  title: string;
}

export interface ContactType {
  name: string;
  link: string;
  title: string;
}

export const ADDRESS: AddressType[] = [
  {
    name: "Indian institute of information technology",
    latitude: 37.7749,
    longitude: -122.4194,
    title: "ADDRESS",
  },
];

export const CONTACT: ContactType[] = [
  { name: "Phone : 123-456-0789 ", link: "tel:123-456-0789", title: "Phone" },
  {
    name: "E-mail : example@example.com ",
    link: "mailto:example@example.com",
    title: "CONTACT",
  },
];
