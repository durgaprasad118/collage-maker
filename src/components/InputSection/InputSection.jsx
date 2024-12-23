import React, { useState } from "react";
import './InputSection.css';


const InputSection = () => {
  const [formData, setFormData] = useState({
    brideName: "",
    groomName: "",
    bridePhoto: null,
    groomPhoto: null,
    venue: "",
    date: "",
    time: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const { name } = e.target;
    const file = e.target.files[0];
    setFormData({ ...formData, [name]: file });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form Data Submitted: ", formData);
  };

  return (
    <div className="input-section">
      <form onSubmit={handleSubmit}>
        <h2>Event Details</h2>
        {/* Bride Details */}
        <div>
          <label htmlFor="brideName">Bride's Name:</label>
          <input
            type="text"
            id="brideName"
            name="brideName"
            value={formData.brideName}
            onChange={handleChange}
            placeholder="Enter Bride's Name"
            required
          />
        </div>
        <div>
          <label htmlFor="bridePhoto">Bride's Photo:</label>
          <input
            type="file"
            id="bridePhoto"
            name="bridePhoto"
            accept="image/*"
            onChange={handleFileChange}
            required
          />
        </div>

        {/* Groom Details */}
        <div>
          <label htmlFor="groomName">Groom's Name:</label>
          <input
            type="text"
            id="groomName"
            name="groomName"
            value={formData.groomName}
            onChange={handleChange}
            placeholder="Enter Groom's Name"
            required
          />
        </div>
        <div>
          <label htmlFor="groomPhoto">Groom's Photo:</label>
          <input
            type="file"
            id="groomPhoto"
            name="groomPhoto"
            accept="image/*"
            onChange={handleFileChange}
            required
          />
        </div>

        {/* Event Details */}
        <div>
          <label htmlFor="venue">Venue:</label>
          <input
            type="text"
            id="venue"
            name="venue"
            value={formData.venue}
            onChange={handleChange}
            placeholder="Enter Venue"
            required
          />
        </div>
        <div>
          <label htmlFor="date">Date:</label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label htmlFor="time">Time:</label>
          <input
            type="time"
            id="time"
            name="time"
            value={formData.time}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

export default InputSection;
