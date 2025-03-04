import React from "react";

import { CheckCircle } from "lucide-react";
import { Card, CardContent } from "../ui/card";

const services = [
  {
    title: "Multilingual Meeting Support",
    description:
      "Break language barriers effortlessly. Our platform enables smooth communication between users speaking different languages.",
  },
  {
    title: "Real-time Translation and Transcriptions",
    description:
      "Experience seamless conversations with live translation and instant transcriptions, ensuring clarity and accuracy in every meeting.",
  },
  {
    title: "Automatic Meeting Minutes Generation",
    description:
      "Save time with AI-generated meeting minutes. Our system automatically compiles key discussion points, action items, and summaries for easy reference.",
  },
  {
    title: "Support for up to 100 Concurrent Users",
    description:
      "Host large meetings without performance concerns. Our system supports up to 100 participants simultaneously, maintaining efficiency and reliability.",
  },
  {
    title: "High-Quality Video Streaming",
    description:
      "Enjoy crystal-clear video and audio, ensuring that meetings are engaging and professional.",
  },
];

export default function Services() {
  return (
    <div className="min-h-screen px-6 py-12 text-center bg-gray-100">
      <h1 className="mb-6 text-4xl font-bold text-gray-800">
        Multilingual Meeting Services
      </h1>
      <p className="mb-10 text-lg text-gray-600">
        Seamlessly connect with people worldwide with real-time translations,
        transcriptions, and automated meeting summaries.
      </p>
      <div className="grid max-w-6xl gap-6 mx-auto md:grid-cols-2 lg:grid-cols-3">
        {services.map((service, index) => (
          <Card key={index} className="p-6 bg-white shadow-md rounded-2xl">
            <CardContent>
              <div className="flex items-center mb-4 space-x-3">
                <CheckCircle className="w-6 h-6 text-green-500" />
                <h2 className="text-xl font-semibold text-gray-800">
                  {service.title}
                </h2>
              </div>
              <p className="text-gray-600">{service.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
