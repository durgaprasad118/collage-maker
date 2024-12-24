import React, { useState } from "react";
import './InputSection.css';

const InputSection = ({ onClose }) => {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log("Form Data Submitted:", formData);
      onClose?.();
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  return (
    <div className="input-section">
      {/* Cancel Button */}
      <button onClick={onClose} className="close-button">
        &times;
      </button>

      <form onSubmit={handleSubmit} className="form-container">
        <h2 className="form-title">Enter Wedding Details</h2>

        <div className="form-grid">
          {/* Bride Details */}
          <div className="form-group">
            <label htmlFor="brideName" className="form-label">Bride's Name</label>
            <input
              type="text"
              id="brideName"
              name="brideName"
              value={formData.brideName}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="bridePhoto" className="form-label">Bride's Photo</label>
            <input
              type="file"
              id="bridePhoto"
              name="bridePhoto"
              onChange={handleFileChange}
              accept="image/*"
              className="form-input"
              required
            />
          </div>

          {/* Groom Details */}
          <div className="form-group">
            <label htmlFor="groomName" className="form-label">Groom's Name</label>
            <input
              type="text"
              id="groomName"
              name="groomName"
              value={formData.groomName}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="groomPhoto" className="form-label">Groom's Photo</label>
            <input
              type="file"
              id="groomPhoto"
              name="groomPhoto"
              onChange={handleFileChange}
              accept="image/*"
              className="form-input"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="venue" className="form-label">Venue</label>
          <input
            type="text"
            id="venue"
            name="venue"
            value={formData.venue}
            onChange={handleChange}
            className="form-input"
            required
          />
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="date" className="form-label">Date</label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="time" className="form-label">Time</label>
            <input
              type="time"
              id="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>
        </div>

        {/* Save Button */}
        <button type="submit" className="save-button">
          Save
        </button>
      </form>
    </div>
  );
};

export default InputSection;
