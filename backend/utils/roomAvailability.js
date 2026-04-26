import Booking from '../models/Booking.js';
import Hotel from '../models/Hotel.js';

/**
 * Check if a room type is available for the given date range
 * Considers:
 * - Total number of rooms of that type available
 * - Number of confirmed bookings for those dates
 * - Room capacity vs guest count
 * 
 * @param {string} hotelName - Name of the hotel
 * @param {string} roomType - Type of room to book
 * @param {Date} checkInDate - Check-in date
 * @param {Date} checkOutDate - Check-out date
 * @param {number} guestCount - Number of guests
 * @returns {Promise<{available: boolean, availableRooms: number, totalRooms: number, message: string}>}
 */
export const checkRoomAvailability = async (hotelName, roomType, checkInDate, checkOutDate, guestCount) => {
  try {
    // Try to find hotel in database first
    let hotel = await Hotel.findOne({ name: hotelName });
    
    // If hotel not in database, use default room configuration for static hotels
    const defaultRoomTypes = {
      "Standard Room": { capacity: "2 guests", available: 5 },
      "Deluxe Room": { capacity: "3 guests", available: 5 },
      "Suite": { capacity: "4 guests", available: 3 },
    };

    let roomTypeData;
    
    if (hotel) {
      // Hotel exists in DB, use its room data
      roomTypeData = hotel.roomTypes?.find(rt => rt.type === roomType);
      if (!roomTypeData) {
        return {
          available: false,
          availableRooms: 0,
          totalRooms: 0,
          message: `Room type "${roomType}" not found for this hotel`,
        };
      }
    } else {
      // Hotel not in DB (static data), use default room types
      if (!defaultRoomTypes[roomType]) {
        return {
          available: false,
          availableRooms: 0,
          totalRooms: 0,
          message: `Room type "${roomType}" not supported`,
        };
      }
      roomTypeData = defaultRoomTypes[roomType];
    }

    // Check room capacity against guest count
    // Extract capacity number from string like "2 guests", "3 guests"
    const capacityMatch = roomTypeData.capacity?.match(/\d+/);
    const roomCapacity = capacityMatch ? parseInt(capacityMatch[0]) : 2;

    if (guestCount > roomCapacity) {
      return {
        available: false,
        availableRooms: 0,
        totalRooms: roomTypeData.available || 5,
        message: `This room type accommodates maximum ${roomCapacity} guests. You selected ${guestCount} guests.`,
      };
    }

    // Count confirmed bookings for this room type on overlapping dates
    const bookedRooms = await Booking.countDocuments({
      hotelName,
      roomType,
      status: 'confirmed',
      checkIn: { $lt: checkOutDate },
      checkOut: { $gt: checkInDate },
    });

    const totalRooms = roomTypeData.available || 5;
    const availableRooms = Math.max(0, totalRooms - bookedRooms);

    if (availableRooms > 0) {
      return {
        available: true,
        availableRooms,
        totalRooms,
        message: `${availableRooms} room(s) available for these dates`,
      };
    }

    return {
      available: false,
      availableRooms: 0,
      totalRooms,
      message: `All ${totalRooms} rooms of this type are booked for the selected dates`,
    };
  } catch (error) {
    console.error('Error checking room availability:', error);
    return {
      available: false,
      availableRooms: 0,
      totalRooms: 0,
      message: 'Error checking availability: ' + error.message,
    };
  }
};

/**
 * Get detailed availability information for a hotel and date range
 * Shows availability for each room type
 */
export const getHotelAvailability = async (hotelName, checkInDate, checkOutDate, guestCount) => {
  try {
    // Default room types for static hotels
    const defaultRoomTypes = [
      { type: "Standard Room", capacity: "2 guests", price: 2500 },
      { type: "Deluxe Room", capacity: "3 guests", price: 3500 },
      { type: "Suite", capacity: "4 guests", price: 5000 },
    ];

    // Try to find hotel in database
    let hotel = await Hotel.findOne({ name: hotelName });
    const roomTypesToCheck = hotel ? (hotel.roomTypes || []) : defaultRoomTypes;

    const availabilityInfo = [];

    for (const roomType of roomTypesToCheck) {
      const availability = await checkRoomAvailability(
        hotelName,
        roomType.type,
        checkInDate,
        checkOutDate,
        guestCount
      );

      availabilityInfo.push({
        roomType: roomType.type,
        capacity: roomType.capacity,
        price: roomType.price,
        available: availability.available,
        availableRooms: availability.availableRooms,
        totalRooms: availability.totalRooms,
        reason: availability.message,
      });
    }

    const hasAvailableRooms = availabilityInfo.some(info => info.available);

    return {
      available: hasAvailableRooms,
      roomTypes: availabilityInfo,
      message: hasAvailableRooms ? 'Some rooms available' : 'No rooms available for selected dates',
    };
  } catch (error) {
    console.error('Error getting hotel availability:', error);
    return {
      available: false,
      roomTypes: [],
      message: 'Error getting availability: ' + error.message,
    };
  }
};
