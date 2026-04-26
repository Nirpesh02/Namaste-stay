import express from 'express';
import Hotel from '../models/Hotel.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET /api/hotels - List hotels (public, with pagination + search + filter)
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      district,
      province,
      minPrice,
      maxPrice,
      minRating,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      owner,
    } = req.query;

    const filter = {};
    // If not searching by a specific owner, only show active hotels
    // If owner is provided, they might want to see inactive ones too, but for now we'll stick to basic filter
    if (owner) {
      filter.owner = owner;
    } else {
      filter.isActive = true;
    }

    if (search) {
      filter.$text = { $search: search };
    }

    if (district) {
      filter.district = { $regex: new RegExp(district, 'i') };
    }

    if (province) {
      filter.province = { $regex: new RegExp(province, 'i') };
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (minRating) {
      filter.rating = { $gte: Number(minRating) };
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const sortOptions = {};
    const validSortFields = ['createdAt', 'price', 'rating', 'name'];
    const field = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    sortOptions[field] = sortOrder === 'asc' ? 1 : -1;

    const [hotels, totalCount] = await Promise.all([
      Hotel.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .populate('owner', 'name email'),
      Hotel.countDocuments(filter),
    ]);

    res.json({
      success: true,
      hotels,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalCount / limitNum),
        totalItems: totalCount,
        itemsPerPage: limitNum,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching hotels', error: error.message });
  }
});

// GET /api/hotels/:id - Get single hotel (public)
router.get('/:id', async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id).populate('owner', 'name email');

    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    res.json({ success: true, hotel });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching hotel', error: error.message });
  }
});

// POST /api/hotels - Create hotel (admin)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      description,
      district,
      province,
      address,
      price,
      images,
      coverImage,
      amenities,
      roomTypes,
      totalRooms,
      availableRooms,
      featured,
    } = req.body;

    if (!name || !district || !province || price == null) {
      return res.status(400).json({ message: 'Name, district, province, and price are required' });
    }

    const hotel = new Hotel({
      name,
      description: description || '',
      district,
      province,
      address: address || '',
      price: Number(price),
      images: images || [],
      coverImage: coverImage || undefined,
      amenities: amenities || [],
      roomTypes: roomTypes || [
        { type: 'Standard Room', size: '250 sq ft', price: Number(price), capacity: '2 guests', available: 5 },
        { type: 'Deluxe Room', size: '350 sq ft', price: Math.round(Number(price) * 1.4), capacity: '3 guests', available: 3 },
        { type: 'Suite', size: '500 sq ft', price: Math.round(Number(price) * 2), capacity: '4 guests', available: 2 },
      ],
      totalRooms: totalRooms || 10,
      availableRooms: availableRooms || 8,
      owner: req.user._id,
      featured: featured || false,
    });

    await hotel.save();

    res.status(201).json({
      success: true,
      message: 'Hotel created successfully',
      hotel,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating hotel', error: error.message });
  }
});

// PUT /api/hotels/:id - Update hotel (admin)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);

    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    // Non-admin can only edit their own hotels
    const role = req.user.role || req.user.accountType;
    if (role !== 'admin' && String(hotel.owner) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to edit this hotel' });
    }

    const allowedFields = [
      'name', 'description', 'district', 'province', 'address',
      'price', 'images', 'coverImage', 'amenities', 'roomTypes',
      'totalRooms', 'availableRooms', 'isActive', 'featured',
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        hotel[field] = req.body[field];
      }
    }

    await hotel.save();

    res.json({
      success: true,
      message: 'Hotel updated successfully',
      hotel,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating hotel', error: error.message });
  }
});

// DELETE /api/hotels/:id - Delete hotel (admin)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);

    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    // Non-admin can only delete their own hotels
    const role = req.user.role || req.user.accountType;
    if (role !== 'admin' && String(hotel.owner) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to delete this hotel' });
    }

    await Hotel.deleteOne({ _id: hotel._id });

    res.json({
      success: true,
      message: 'Hotel deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting hotel', error: error.message });
  }
});

export default router;
