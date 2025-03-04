import React from "react";
import { FaLocationDot } from "react-icons/fa6";
import { FaSquarePhone } from "react-icons/fa6";
import { IoIosMail } from "react-icons/io";

// Define interface for link items
interface LinkItem {
  name: string;
  title?: string;
  link?: string;
  latitude?: number;
  longitude?: number;
}

// Define interface for component props
interface ItemProps {
  Links: LinkItem[];
  title: string;
}

const Item: React.FC<ItemProps> = ({ Links, title }) => {
  return (
    <ul className="align-middle">
      <div className="flex items-center mb-2">
        <h1 className="mb-1 font-semibold text-white">{title}</h1>
      </div>
      {/* Render Each Link */}
      {Links.map((l) => {
        let href = "";
        if (l.latitude && l.longitude) {
          href = `https://www.google.com/maps?q=${l.latitude},${l.longitude}`;
        } else if (l.link?.startsWith("mailto:")) {
          href = l.link;
        } else if (l.link?.startsWith("tel:")) {
          href = l.link;
        } else {
          href = l.link || "#"; // Fallback if no link provided
        }
        return (
          <li key={l.name} className="flex items-center mb-2">
            {title === "ADDRESS" ? (
              <FaLocationDot className="mr-2 text-cyan-600" />
            ) : l.title === "Phone" ? (
              <FaSquarePhone className="mr-2 text-cyan-600" />
            ) : (
              <IoIosMail className="mr-2 text-cyan-600" />
            )}
            <a
              className="text-white hover:text-teal-400 duration-300 text-sm cursor-pointer leading-6"
              href={href}
              target={href.startsWith("http") ? "_blank" : "_self"}
              rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
            >
              {l.name}
            </a>
          </li>
        );
      })}
    </ul>
  );
};

export default Item;
