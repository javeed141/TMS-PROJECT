import React, { useState } from 'react';
import Clock from 'react-clock';
// CRITICAL: This CSS file contains the styling for the needles and their rotation!
// NOTE: I'm adding custom styling here for contrast, feel free to remove/change it.

function DynamicClockSelector() {
  // 1. Initialize state with a standard JavaScript Date object.
  //    The Date object is the best way to control the Clock component's needle positions.
  const initialTime = new Date();
  initialTime.setHours(10, 30, 0, 0); // Start at 10:30
  
  const [selectedDate, setSelectedDate] = useState(initialTime);

  // Helper to format the Date object for simple display
  const formatDisplayTime = (date) => {
    if (!date) return "N/A";
    // Format for display: HH:MM AM/PM (e.g., 10:30 AM)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{ padding: '20px', border: '2px solid #333', borderRadius: '10px', maxWidth: '400px', margin: '20px auto', textAlign: 'center' }}>
      
      <h2>Set Time: Drag Clock Needles </h2>
      <p>The hands will now move dynamically as you drag them to select the time.</p>
      
      <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
        <Clock
          value={selectedDate}         // **INPUT:** Controls the initial and current needle position
          onChange={setSelectedDate}   // **OUTPUT:** Updates the state whenever a needle is dragged
          size={250}                   // Set the size for better interaction
          // Use 'hourHandLength' and 'minuteHandLength' for more control if needed
        />
      </div>

      <hr />
      
      {/* Display Component: Shows the dynamically selected time */}
      <h3>Selected Time:</h3>
      <div style={{ backgroundColor: '#f0f0f0', padding: '10px', borderRadius: '4px' }}>
        <h2 style={{ margin: 0, color: '#0056b3' }}>
          <strong>{formatDisplayTime(selectedDate)}</strong>
        </h2>
      </div>
      
    </div>
  );
}

export default DynamicClockSelector;