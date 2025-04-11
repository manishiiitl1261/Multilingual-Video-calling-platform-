"use client";
import { useState } from "react";

const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    whatsappNumber: "",
    phoneNumber: "",
    subject: "",
    message: "",
  });

  const [countryCode, setCountryCode] = useState({
    whatsappNumber: "+91",
    phoneNumber: "+91",
  });

  const [errors, setErrors] = useState({});
  const [showPopup, setShowPopup] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCountryCodeChange = (e, field) => {
    setCountryCode({ ...countryCode, [field]: e.target.value });
  };

  const validatePhone = (phone) => /^\d{10}$/.test(phone);

  const validate = () => {
    let tempErrors = {};
    if (!formData.name) tempErrors.name = "Name is required";
    if (!formData.whatsappNumber) {
      tempErrors.whatsappNumber = "WhatsApp number is required";
    } else if (!validatePhone(formData.whatsappNumber)) {
      tempErrors.whatsappNumber =
        "Invalid WhatsApp number format. Enter 10 digits.";
    }
    if (formData.phoneNumber && !validatePhone(formData.phoneNumber)) {
      tempErrors.phoneNumber = "Invalid phone number format. Enter 10 digits.";
    }
    if (!formData.subject) tempErrors.subject = "Subject is required";
    if (!formData.message) tempErrors.message = "Message is required";
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      // Admin's phone number that will receive the message
      const adminNumber = "918279659726";

      // Create the message to be sent
      const message = `Hi, I would like to contact you regarding:
            
Name: ${formData.name}
Event: ${formData.subject}
Message: ${formData.message}
Phone: ${countryCode.phoneNumber} ${formData.phoneNumber || "Not Provided"}`;

      // Create WhatsApp URL with the admin's number as the recipient
      const whatsappURL = `https://wa.me/${adminNumber}?text=${encodeURIComponent(
        message
      )}`;

      // Open WhatsApp in a new tab
      window.open(whatsappURL, "_blank");

      setShowPopup(true);
      setFormData({
        name: "",
        whatsappNumber: "",
        phoneNumber: "",
        subject: "",
        message: "",
      });
      setErrors({});
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4  rounded-lg shadow-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={formData.name}
          onChange={handleChange}
          className={`w-full p-2 border ${errors.name ? "border-red-500" : "border-gray-300"
            } rounded text-white placeholder:text-blue-50`}
          required
        />
        {errors.name && (
          <div className="text-red-500 text-sm">{errors.name}</div>
        )}

        {/* WhatsApp Number */}
        <div className="flex space-x-2">
          <select
            value={countryCode.whatsappNumber}
            onChange={(e) => handleCountryCodeChange(e, "whatsappNumber")}
            className="border border-gray-300 rounded p-2 text-white placeholder:text-blue-50"
          >
            <option value="+91" className=" bg-gray-800">+91 (IND)</option>
            <option value="+1" className=" bg-gray-800">+1 (USA)</option>
          </select>
          <input
            required
            type="text"
            name="whatsappNumber"
            placeholder="WhatsApp Number"
            value={formData.whatsappNumber}
            onChange={handleChange}
            className={`w-full p-2 border ${errors.whatsappNumber ? "border-red-500" : "border-gray-300 text-white placeholder:text-blue-50"
              } rounded`}
          />
        </div>
        {errors.whatsappNumber && (
          <div className="text-red-500 text-sm">{errors.whatsappNumber}</div>
        )}

        {/* Phone Number (Optional) */}
        <div className="flex space-x-2">
          <select
            value={countryCode.phoneNumber}
            onChange={(e) => handleCountryCodeChange(e, "phoneNumber")}
            className="border border-gray-300 rounded p-2 text-white placeholder:text-blue-50"
          >
            <option value="+91" className=" bg-gray-800">+91 (IND)</option>
            <option value="+1" className=" bg-gray-800">+1 (USA)</option>
          </select>
          <input
            type="text"
            name="phoneNumber"
            placeholder="Phone Number (Optional)"
            value={formData.phoneNumber}
            onChange={handleChange}
            className={`w-full p-2 border ${errors.phoneNumber ? "border-red-500" : "border-gray-300 text-white placeholder:text-blue-50"
              } rounded`}
          />
        </div>
        {errors.phoneNumber && (
          <div className="text-red-500 text-sm">{errors.phoneNumber}</div>
        )}

        {/* Subject
        <input
          type="text"
          name="subject"
          placeholder="Event"
          value={formData.subject}
          onChange={handleChange}
          className={`w-full p-2 border ${errors.subject ? "border-red-500" : "border-gray-300"
            } rounded`}
          required
        />
        {errors.subject && (
          <div className="text-red-500 text-sm">{errors.subject}</div>
        )} */}

        {/* Message */}
        <textarea
          name="message"
          placeholder="Description"
          value={formData.message}
          onChange={handleChange}
          className={`w-full p-2 border ${errors.message ? "border-red-500" : "border-gray-300"
            } rounded text-white placeholder:text-blue-50`}
          required
        ></textarea>
        {errors.message && (
          <div className="text-red-500 text-sm">{errors.message}</div>
        )}

        <button
          type="submit"
          className="bg-purple-500 text-white py-2 px-4 rounded hover:bg-purple-600 w-full"
        >
          Open in WhatsApp
        </button>
      </form>

      {showPopup && (
        <div className="fixed top-2 right-2 bg-green-500 text-white p-2 rounded">
          🎉 Opening WhatsApp!
        </div>
      )}
    </div>
  );
};

export default ContactForm;
